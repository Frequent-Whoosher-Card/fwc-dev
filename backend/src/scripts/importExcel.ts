import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import db from '../config/db';
import { hashPassword } from '../utils/password';

const excelFilePath = join(process.cwd(), '50 data.xlsx'); // Changed to 50 data.xlsx
// Import from multiple sheets
const SHEET_NAMES = [
  'FWC-KAI',     // Sheet pertama: FWC-KAI
  'Gold Jaban',
  'Silver Jaban', // Note: Capital 'J' in Jaban (different from old file)
  'Gold Jaka',
  'Silver Jaka',
  'Gold KaBan',
  'Silver Kaban',
];
const LIMIT = 800; // Limit to 200 records total (across all sheets)

interface ExcelRow {
  NO?: number;
  'Customer Name'?: string;
  'NIPP KAI'?: string | number; // Only exists in FWC-KAI sheet
  'Identity Number'?: string;
  'Nationality'?: string;
  'Email'?: string;
  'Phone'?: string | number;
  'Card Category'?: string;
  'Card Type'?: string;
  'Quota Ticket'?: number;
  'Total Quota'?: number;
  'Serial Number'?: string | number;
  'NO Reference EDC'?: string | number;
  'FW Price'?: string;
  'Purchase Date'?: string;
  'Masa Berlaku'?: number;
  'Expired Date'?: string;
  'Status Card'?: string;
  'Shift Date'?: string;
  'Operator Name'?: string;
  'Station'?: string;
  'Status'?: string;
  'Notes'?: string;
}

// Helper function to parse date from DD-MM-YYYY format
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  
  // Handle DD-MM-YYYY format
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  return null;
}

// Helper function to parse price from "Rp 2,000,000.00" format
function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 0;
  
  // Remove "Rp", spaces, and commas, then parse
  const cleaned = priceStr
    .replace(/Rp/gi, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper function to normalize status
// Maps Excel status values to new CardStatus enum
// Note: Based on migration, 'Aktif' maps to 'IN_STATION' and 'Non_Aktif' maps to 'SOLD_INACTIVE'
// But for Excel import (cards with purchase date), 'Aktif' should map to 'SOLD_ACTIVE'
function normalizeCardStatus(status: string | undefined): 'IN_OFFICE' | 'IN_TRANSIT' | 'IN_STATION' | 'LOST' | 'SOLD_ACTIVE' | 'SOLD_INACTIVE' {
  if (!status) return 'SOLD_ACTIVE'; // Default: if kartu sudah ada data (purchase date, dll), berarti sudah terjual dan aktif
  
  const statusStr = String(status).trim();
  const normalized = statusStr.toLowerCase();
  
  // Map Excel values to new CardStatus enum
  // For Excel import: cards with purchase date should be SOLD_ACTIVE (not IN_STATION)
  if (normalized === 'aktif') return 'SOLD_ACTIVE'; // Changed from IN_STATION to SOLD_ACTIVE for sold cards
  if (normalized === 'non aktif' || normalized === 'non_aktif' || normalized === 'nonaktif') return 'SOLD_INACTIVE';
  
  // Handle direct enum values (if Excel already has new enum values)
  if (statusStr === 'IN_OFFICE' || normalized === 'in_office' || normalized === 'in office') return 'IN_OFFICE';
  if (statusStr === 'IN_TRANSIT' || normalized === 'in_transit' || normalized === 'in transit') return 'IN_TRANSIT';
  if (statusStr === 'IN_STATION' || normalized === 'in_station' || normalized === 'in station') return 'SOLD_ACTIVE'; // Map IN_STATION to SOLD_ACTIVE for Excel import (sold cards)
  if (normalized === 'lost') return 'LOST';
  if (statusStr === 'SOLD_ACTIVE' || normalized === 'sold_active' || normalized === 'sold active') return 'SOLD_ACTIVE';
  if (statusStr === 'SOLD_INACTIVE' || normalized === 'sold_inactive' || normalized === 'sold inactive') return 'SOLD_INACTIVE';
  
  // Default: if status unclear but data exists (has purchase date), assume SOLD_ACTIVE
  return 'SOLD_ACTIVE';
}

// Helper function to normalize transaction status
function normalizeTransactionStatus(status: string | undefined): 'Success' | 'Failed' | 'Pending' {
  if (!status) return 'Success';
  const normalized = status.trim().toLowerCase();
  if (normalized === 'success') return 'Success';
  if (normalized === 'failed') return 'Failed';
  if (normalized === 'pending') return 'Pending';
  return 'Success'; // Default
}

// Find or create CardCategory
async function findOrCreateCardCategory(categoryName: string): Promise<string> {
  if (!categoryName) throw new Error('Category name is required');
  
  const normalized = categoryName.trim();
  const categoryCode = normalized.toUpperCase().replace(/\s+/g, '_');
  
  // Try to find existing category (with fallback)
  let category = await db.cardCategory.findFirst({
    where: {
      categoryCode: categoryCode,
      deletedAt: null,
    },
  });
  
  // If not found, try without deletedAt filter (in case of data inconsistency)
  if (!category) {
    category = await db.cardCategory.findFirst({
      where: {
        categoryCode: categoryCode,
      },
    });
  }
  
  if (!category) {
    try {
      category = await db.cardCategory.create({
        data: {
          id: randomUUID(),
          categoryCode: categoryCode,
          categoryName: normalized,
          description: `Auto-created from Excel import: ${normalized}`,
        } as any,
      });
      console.log(`✅ Created CardCategory: ${normalized} (${categoryCode})`);
    } catch (error: any) {
      // Handle unique constraint error (race condition)
      if (error?.code === 'P2002' || error?.message?.includes('Unique constraint')) {
        // Wait a bit for transaction to commit, then retry find
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry: find again in case it was created by another process
        category = await db.cardCategory.findFirst({
          where: {
            categoryCode: categoryCode,
            deletedAt: null,
          },
        });
        
        // If still not found, try without deletedAt filter (in case of soft delete issue)
        if (!category) {
          category = await db.cardCategory.findFirst({
            where: {
              categoryCode: categoryCode,
            },
          });
        }
        
        if (!category) {
          throw new Error(`Failed to create or find CardCategory: ${categoryCode}. Error: ${error.message}`);
        }
      } else {
        throw error;
      }
    }
  }
  
  return category.id;
}

// Find or create CardType
async function findOrCreateCardType(typeName: string): Promise<string> {
  if (!typeName) throw new Error('Type name is required');
  
  const normalized = typeName.trim();
  const typeCode = normalized.toUpperCase().replace(/\s+/g, '_');
  
  // Try to find existing type (with fallback)
  let cardType = await db.cardType.findFirst({
    where: {
      typeCode: typeCode,
      deletedAt: null,
    },
  });
  
  // If not found, try without deletedAt filter
  if (!cardType) {
    cardType = await db.cardType.findFirst({
      where: {
        typeCode: typeCode,
      },
    });
  }
  
  if (!cardType) {
    try {
      cardType = await db.cardType.create({
        data: {
          id: randomUUID(),
          typeCode: typeCode,
          typeName: normalized,
          routeDescription: `Auto-created from Excel import: ${normalized}`,
        } as any,
      });
      console.log(`✅ Created CardType: ${normalized} (${typeCode})`);
    } catch (error: any) {
      // Handle unique constraint error (race condition)
      if (error?.code === 'P2002' || error?.message?.includes('Unique constraint')) {
        // Wait a bit for transaction to commit, then retry find
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry: find again in case it was created by another process
        cardType = await db.cardType.findFirst({
          where: {
            typeCode: typeCode,
            deletedAt: null,
          },
        });
        
        // If still not found, try without deletedAt filter
        if (!cardType) {
          cardType = await db.cardType.findFirst({
            where: {
              typeCode: typeCode,
            },
          });
        }
        
        if (!cardType) {
          throw new Error(`Failed to create or find CardType: ${typeCode}. Error: ${error.message}`);
        }
      } else {
        throw error;
      }
    }
  }
  
  return cardType.id;
}

// Find or create Station
async function findOrCreateStation(stationName: string): Promise<string> {
  if (!stationName) throw new Error('Station name is required');
  
  const normalized = stationName.trim();
  const stationCode = normalized.toUpperCase().replace(/\s+/g, '_');
  
  // Try to find existing station (with fallback)
  let station = await db.station.findFirst({
    where: {
      stationCode: stationCode,
      deletedAt: null,
    },
  });
  
  // If not found, try without deletedAt filter
  if (!station) {
    station = await db.station.findFirst({
      where: {
        stationCode: stationCode,
      },
    });
  }
  
  if (!station) {
    try {
      station = await db.station.create({
        data: {
          id: randomUUID(),
          stationCode: stationCode,
          stationName: normalized,
          location: normalized,
        } as any,
      });
      console.log(`✅ Created Station: ${normalized} (${stationCode})`);
    } catch (error: any) {
      // Handle unique constraint error (race condition)
      if (error?.code === 'P2002' || error?.message?.includes('Unique constraint')) {
        // Wait a bit for transaction to commit, then retry find
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry: find again in case it was created by another process
        station = await db.station.findFirst({
          where: {
            stationCode: stationCode,
            deletedAt: null,
          },
        });
        
        // If still not found, try without deletedAt filter
        if (!station) {
          station = await db.station.findFirst({
            where: {
              stationCode: stationCode,
            },
          });
        }
        
        if (!station) {
          throw new Error(`Failed to create or find Station: ${stationCode}. Error: ${error.message}`);
        }
      } else {
        throw error;
      }
    }
  }
  
  return station.id;
}

// Find or create CardProduct
async function findOrCreateCardProduct(
  categoryId: string,
  typeId: string,
  totalQuota: number,
  masaBerlaku: number,
  price: number
): Promise<string> {
  // Ensure all numeric values are actually numbers
  const totalQuotaNum = typeof totalQuota === 'number' ? totalQuota : parseInt(String(totalQuota || 0), 10) || 0;
  const masaBerlakuNum = typeof masaBerlaku === 'number' ? masaBerlaku : parseInt(String(masaBerlaku || 0), 10) || 0;
  const priceNum = typeof price === 'number' ? price : parseFloat(String(price || 0)) || 0;
  
  // Try to find existing CardProduct
  let cardProduct = await db.cardProduct.findFirst({
    where: {
      categoryId: categoryId,
      typeId: typeId,
      deletedAt: null,
    },
  });
  
  if (!cardProduct) {
    try {
      // Create new CardProduct
      // Ensure all required fields are not null/undefined
      if (!categoryId || !typeId) {
        throw new Error(`Missing required fields: categoryId=${categoryId}, typeId=${typeId}`);
      }
      
      // Verify category and type exist in database (foreign key constraint)
      const categoryExists = await db.cardCategory.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists) {
        console.error(`❌ Category not found: ${categoryId}`);
        // Try to find by categoryCode as fallback
        const categoryByCode = await db.cardCategory.findFirst({
          where: { categoryCode: categoryId },
        });
        if (categoryByCode) {
          console.log(`⚠️  Found category by code, but ID mismatch. Expected: ${categoryId}, Found: ${categoryByCode.id}`);
        }
        throw new Error(`Category not found: ${categoryId}`);
      }
      
      const typeExists = await db.cardType.findUnique({
        where: { id: typeId },
      });
      if (!typeExists) {
        console.error(`❌ Type not found: ${typeId}`);
        // Try to find by typeCode as fallback
        const typeByCode = await db.cardType.findFirst({
          where: { typeCode: typeId },
        });
        if (typeByCode) {
          console.log(`⚠️  Found type by code, but ID mismatch. Expected: ${typeId}, Found: ${typeByCode.id}`);
        }
        throw new Error(`Type not found: ${typeId}`);
      }
      
      console.log(`✅ Verified foreign keys: categoryId=${categoryId}, typeId=${typeId}`);
      
      // Store category and type for serial_template generation
      const categoryCode = categoryExists.categoryCode || 'UNKNOWN';
      const typeCode = typeExists.typeCode || 'UNKNOWN';
      
      // Validate numeric values
      if (isNaN(totalQuotaNum) || totalQuotaNum < 0) {
        throw new Error(`Invalid totalQuota: ${totalQuotaNum}`);
      }
      if (isNaN(masaBerlakuNum) || masaBerlakuNum < 0) {
        throw new Error(`Invalid masaBerlaku: ${masaBerlakuNum}`);
      }
      if (isNaN(priceNum) || priceNum < 0) {
        throw new Error(`Invalid price: ${priceNum}`);
      }
      
      // Ensure all values are valid numbers (not null/undefined)
      const finalTotalQuota = totalQuotaNum > 0 ? totalQuotaNum : 1;
      const finalMasaBerlaku = masaBerlakuNum > 0 ? masaBerlakuNum : 1;
      const finalPrice = priceNum >= 0 ? priceNum : 0;
      
      const now = new Date();
      
      // Debug: log values before create
      console.log(`🔍 Creating CardProduct: categoryId=${categoryId}, typeId=${typeId}, totalQuota=${finalTotalQuota}, masaBerlaku=${finalMasaBerlaku}, price=${finalPrice}`);
      
      // Create data object with all required fields - use Prisma's field names
      const cardProductData = {
        id: randomUUID(),
        categoryId: String(categoryId),
        typeId: String(typeId),
        totalQuota: Number(finalTotalQuota),
        masaBerlaku: Number(finalMasaBerlaku),
        price: Number(finalPrice),
        isActive: Boolean(true),
        createdAt: now,
        updatedAt: now,
        // Explicitly set optional fields to null to avoid issues
        createdBy: null,
        updatedBy: null,
        deletedAt: null,
        deletedBy: null,
      };
      
      // Validate all fields are not null/undefined
      if (!cardProductData.id || !cardProductData.categoryId || !cardProductData.typeId) {
        throw new Error(`Invalid CardProduct data: ${JSON.stringify(cardProductData)}`);
      }
      
      if (isNaN(cardProductData.totalQuota) || isNaN(cardProductData.masaBerlaku) || isNaN(cardProductData.price)) {
        throw new Error(`Invalid numeric values: totalQuota=${cardProductData.totalQuota}, masaBerlaku=${cardProductData.masaBerlaku}, price=${cardProductData.price}`);
      }
      
      try {
        // Try using raw SQL first to get better error message from PostgreSQL
        try {
          // Generate serial_template based on category and type (already declared above)
          const serialTemplate = `${categoryCode}_${typeCode}`;
          
          await db.$executeRaw`
            INSERT INTO card_products (
              card_product_id,
              category_id,
              type_id,
              total_quota,
              masa_berlaku,
              price,
              is_active,
              created_at,
              updated_at,
              serial_template
            ) VALUES (
              ${cardProductData.id}::uuid,
              ${cardProductData.categoryId}::uuid,
              ${cardProductData.typeId}::uuid,
              ${cardProductData.totalQuota},
              ${cardProductData.masaBerlaku},
              ${cardProductData.price},
              ${cardProductData.isActive},
              ${cardProductData.createdAt},
              ${cardProductData.updatedAt},
              ${serialTemplate}
            )
          `;
          
          // Fetch the created product
          cardProduct = await db.cardProduct.findUnique({
            where: { id: cardProductData.id },
          });
          
          if (!cardProduct) {
            throw new Error('CardProduct was created but could not be retrieved');
          }
          
          console.log(`✅ Created CardProduct (via raw SQL): categoryId=${categoryId}, typeId=${typeId}`);
        } catch (rawError: any) {
          // If raw SQL fails, try Prisma create
          console.log(`⚠️  Raw SQL failed, trying Prisma create: ${rawError.message}`);
          const serialTemplate = `${categoryCode}_${typeCode}`;
          cardProduct = await db.cardProduct.create({
            data: {
              id: cardProductData.id,
              categoryId: cardProductData.categoryId,
              typeId: cardProductData.typeId,
              serialTemplate: serialTemplate,
              totalQuota: cardProductData.totalQuota,
              masaBerlaku: cardProductData.masaBerlaku,
              price: cardProductData.price,
              isActive: cardProductData.isActive,
              createdAt: cardProductData.createdAt,
              updatedAt: cardProductData.updatedAt,
            } as any,
          });
          console.log(`✅ Created CardProduct (via Prisma): categoryId=${categoryId}, typeId=${typeId}`);
        }
      } catch (createError: any) {
        // If unique constraint, try to find existing
        if (createError.code === 'P2002' || createError.message?.includes('Unique constraint') || createError.message?.includes('duplicate')) {
          // Already exists, try to find it
          await new Promise(resolve => setTimeout(resolve, 100));
          cardProduct = await db.cardProduct.findFirst({
            where: {
              categoryId: categoryId,
              typeId: typeId,
              deletedAt: null,
            },
          });
          if (!cardProduct) {
            cardProduct = await db.cardProduct.findFirst({
              where: {
                categoryId: categoryId,
                typeId: typeId,
              },
            });
          }
          if (cardProduct) {
            console.log(`✅ Found existing CardProduct: categoryId=${categoryId}, typeId=${typeId}`);
          } else {
            throw createError;
          }
        } else {
          // Log detailed error for debugging
          console.error(`❌ CardProduct create error:`, {
            error: createError.message,
            code: createError.code,
            meta: createError.meta,
            data: cardProductData,
            cause: createError.cause,
          });
          
          // Try to get more info from the cause
          if (createError.cause) {
            try {
              console.error(`❌ Cause details:`, JSON.stringify(createError.cause, Object.getOwnPropertyNames(createError.cause), 2));
            } catch {
              console.error(`❌ Cause (raw):`, createError.cause);
            }
          }
          
          throw createError;
        }
      }
    } catch (error: any) {
      // Handle unique constraint error (race condition)
      if (error?.code === 'P2002' || error?.message?.includes('Unique constraint')) {
        // Wait a bit for transaction to commit, then retry find
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry: find again in case it was created by another process
        cardProduct = await db.cardProduct.findFirst({
          where: {
            categoryId: categoryId,
            typeId: typeId,
            deletedAt: null,
          },
        });
        
        // If still not found, try without deletedAt filter
        if (!cardProduct) {
          cardProduct = await db.cardProduct.findFirst({
            where: {
              categoryId: categoryId,
              typeId: typeId,
            },
          });
        }
        
        if (!cardProduct) {
          throw new Error(`Failed to create or find CardProduct: categoryId=${categoryId}, typeId=${typeId}. Error: ${error.message}`);
        }
      } else {
        throw error;
      }
    }
  }
  
  return cardProduct.id;
}

// Find or create User (Operator)
async function findOrCreateUser(operatorName: string): Promise<string> {
  if (!operatorName) throw new Error('Operator name is required');
  
  const normalized = operatorName.trim();
  let username = normalized.toLowerCase().replace(/\s+/g, '_');
  
  // Try to find by fullName first (more reliable)
  let user = await db.user.findFirst({
    where: {
      fullName: normalized,
      deletedAt: null,
    },
  });
  
  // If not found by fullName, try by username
  if (!user) {
    user = await db.user.findFirst({
      where: {
        username: username,
        deletedAt: null,
      },
    });
  }
  
  if (!user) {
    // Auto-create user if not found
    // Check if username already exists (different fullName)
    let uniqueUsername = username;
    let counter = 1;
    while (await db.user.findFirst({ where: { username: uniqueUsername, deletedAt: null } })) {
      uniqueUsername = `${username}_${counter}`;
      counter++;
    }
    
    const defaultRole = await db.role.findFirst({
      where: { roleCode: 'petugas', deletedAt: null },
    });
    
    if (!defaultRole) {
      // Try to find any role as fallback
      const anyRole = await db.role.findFirst({
        where: { deletedAt: null },
      });
      
      if (!anyRole) {
        throw new Error('No roles found in database. Please create roles first.');
      }
      
      // Create user with any available role
      const defaultPassword = await hashPassword('password123'); // Default password
      user = await db.user.create({
        data: {
          id: randomUUID(),
          username: uniqueUsername,
          fullName: normalized,
          passwordHash: defaultPassword,
          roleId: anyRole.id,
          isActive: true,
        } as any,
      });
      console.log(`✅ Created User/Operator: ${normalized} (username: ${uniqueUsername}, password: password123)`);
    } else {
      // Create user with petugas role
      const defaultPassword = await hashPassword('password123'); // Default password
      user = await db.user.create({
        data: {
          id: randomUUID(),
          username: uniqueUsername,
          fullName: normalized,
          passwordHash: defaultPassword,
          roleId: defaultRole.id,
          isActive: true,
        } as any,
      });
      console.log(`✅ Created User/Operator: ${normalized} (username: ${uniqueUsername}, password: password123)`);
    }
  }
  
  return user.id;
}

// Find or create Member
async function findOrCreateMember(row: ExcelRow): Promise<string | null> {
  const identityNumber = row['Identity Number']?.toString().trim();
  const customerName = row['Customer Name']?.trim();
  
  if (!identityNumber || !customerName) {
    return null; // Skip if required fields are missing
  }
  
  // Try to find existing member
  let member = await db.member.findFirst({
    where: {
      identityNumber: identityNumber,
      deletedAt: null,
    },
  });
  
  if (!member) {
    try {
      // Create new member
      member = await db.member.create({
        data: {
          id: randomUUID(),
          name: customerName,
          identityNumber: identityNumber,
          nationality: row['Nationality']?.trim() || 'INDONESIA',
          email: row['Email']?.toString().trim() || null,
          phone: row['Phone']?.toString().trim() || null,
        } as any,
      });
      console.log(`✅ Created Member: ${customerName} (${identityNumber})`);
    } catch (error: any) {
      // Handle unique constraint error (race condition)
      if (error?.code === 'P2002' || error?.message?.includes('Unique constraint')) {
        // Wait a bit for transaction to commit, then retry find
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry: find again in case it was created by another process
        member = await db.member.findFirst({
          where: {
            identityNumber: identityNumber,
            deletedAt: null,
          },
        });
        
        // If still not found, try without deletedAt filter
        if (!member) {
          member = await db.member.findFirst({
            where: {
              identityNumber: identityNumber,
            },
          });
        }
        
        if (!member) {
          throw new Error(`Failed to create or find Member: ${identityNumber}. Error: ${error.message}`);
        }
      } else {
        throw error;
      }
    }
  }
  
  return member.id;
}

// Process rows from a single sheet
async function processSheetRows(
  rows: ExcelRow[],
  sheetName: string,
  sheetIndex: number,
  totalSheets: number,
  globalSuccessCount: { count: number },
  globalErrorCount: { count: number },
  globalErrors: Array<{ sheet: string; row: number; error: string }>
): Promise<number> {
  let sheetSuccessCount = 0;
  let sheetErrorCount = 0;
  let sheetProcessedCount = 0;
  
  // Calculate how many rows we can still process from this sheet
  const remainingLimit = LIMIT - globalSuccessCount.count;
  if (remainingLimit <= 0) {
    console.log(`\n⚠️  Limit reached, skipping sheet "${sheetName}"`);
    return 0;
  }
  
  const rowsToProcess = rows.slice(0, remainingLimit);
  console.log(`\n📊 Processing sheet "${sheetName}" (${sheetIndex + 1}/${totalSheets})`);
  console.log(`   Available rows: ${rows.length}, Will process: ${Math.min(rowsToProcess.length, remainingLimit)}`);
  
  for (let i = 0; i < rowsToProcess.length; i++) {
    // SAFEGUARD: Stop if we've already processed LIMIT records globally
    if (globalSuccessCount.count >= LIMIT) {
      console.log(`\n⚠️  Reached global limit of ${LIMIT} successful imports. Stopping...`);
      break;
    }
    
    const row = rowsToProcess[i];
    const rowNumber = i + 1;
    sheetProcessedCount++;
    const globalRowNumber = globalSuccessCount.count + globalErrorCount.count + 1;

    try {
      console.log(`\n[Sheet: ${sheetName}] [${rowNumber}/${rowsToProcess.length}] Processing row... (Global Success: ${globalSuccessCount.count}/${LIMIT})`);

      // 1. Find or create CardCategory
      const categoryId = await findOrCreateCardCategory(row['Card Category'] || '');

      // 2. Find or create CardType
      const typeId = await findOrCreateCardType(row['Card Type'] || '');

      // 3. Find or create Station
      const stationId = await findOrCreateStation(row['Station'] || 'Halim');

      // 4. Find or create Member
      const memberId = await findOrCreateMember(row);
      if (!memberId) {
        throw new Error('Failed to create/find member');
      }

      // 5. Find or create User (Operator)
      let operatorId: string;
      try {
        operatorId = await findOrCreateUser(row['Operator Name'] || '');
      } catch (error) {
        // If user not found, skip this row or use a default operator
        console.log(`⚠️  Warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }

      // 6. Parse dates
      const purchaseDate = parseDate(row['Purchase Date']);
      const expiredDate = parseDate(row['Expired Date']);
      const shiftDate = parseDate(row['Shift Date']);

      // 7. Parse price
      const fwPrice = parsePrice(row['FW Price']);

      // 8. Get serial number
      const serialNumberRaw = row['Serial Number'];
      
      if (!serialNumberRaw || serialNumberRaw === null || serialNumberRaw === undefined || serialNumberRaw === '') {
        // Debug: Log available keys if Serial Number not found (only for first error to avoid spam)
        if (sheetErrorCount === 0) {
          const availableKeys = Object.keys(row as Record<string, any>);
          console.log(`   ⚠️  [Row ${rowNumber}] Serial Number not found. Available keys: ${availableKeys.join(', ')}`);
        }
        throw new Error(`Serial number is required but not found in row ${rowNumber}`);
      }
      
      // Handle serial number - convert to string and clean
      let serialNumber: string;
      if (typeof serialNumberRaw === 'number') {
        // Handle scientific notation (e.g., 5.33506E+11 -> 533506000000)
        const numStr = serialNumberRaw.toString();
        if (numStr.includes('e') || numStr.includes('E')) {
          // Convert scientific notation to full number
          serialNumber = serialNumberRaw.toFixed(0);
        } else {
          serialNumber = numStr;
        }
      } else {
        serialNumber = String(serialNumberRaw).trim();
      }
      
      // Handle scientific notation in string format (e.g., "5.12012E+11")
      if (serialNumber.includes('e') || serialNumber.includes('E')) {
        const num = parseFloat(serialNumber);
        if (!isNaN(num)) {
          serialNumber = num.toFixed(0);
        }
      }
      
      // Validate serial number is not empty
      if (!serialNumber || serialNumber === '' || serialNumber === 'null' || serialNumber === 'undefined') {
        throw new Error(`Serial number is empty after processing (original: ${serialNumberRaw})`);
      }

      // 9. Check if card already exists
      const existingCard = await db.card.findFirst({
        where: {
          serialNumber: serialNumber,
          deletedAt: null,
        },
      });

      if (existingCard) {
        console.log(`⚠️  Card with serial number ${serialNumber} already exists, skipping...`);
        continue;
      }

      // 10. Get quota from Excel (NOT generating random - using values from Excel)
      const quotaTicket = typeof row['Quota Ticket'] === 'number' 
        ? row['Quota Ticket'] 
        : parseInt(String(row['Quota Ticket'] || 0), 10) || 0;
      
      // Get Total Quota from Excel (NOT generating - using values from Excel)
      const totalQuotaFromExcel = typeof row['Total Quota'] === 'number' 
        ? row['Total Quota'] 
        : parseInt(String(row['Total Quota'] || 0), 10) || 0;
      
      // Use Total Quota from Excel if available, otherwise use quotaTicket as fallback
      const totalQuota = totalQuotaFromExcel > 0 ? totalQuotaFromExcel : quotaTicket;

      // 11. Get status
      const statusFromExcel = row['Status Card'];
      const cardStatus = normalizeCardStatus(statusFromExcel);
      
      // Debug: Log status mapping for troubleshooting
      if (statusFromExcel && String(statusFromExcel).trim().toLowerCase() === 'in_station') {
        console.log(`   ⚠️  Warning: Found literal "IN_STATION" in Excel, mapping to SOLD_ACTIVE`);
      }

      // 12. Find or create CardProduct (ensure masaBerlaku is a number)
      const masaBerlaku = typeof row['Masa Berlaku'] === 'number'
        ? row['Masa Berlaku']
        : parseInt(String(row['Masa Berlaku'] || 0), 10) || 0;
      
      // Validate required fields before creating CardProduct
      if (!categoryId || !typeId) {
        throw new Error(`Missing required fields for CardProduct: categoryId=${categoryId}, typeId=${typeId}`);
      }
      
      const cardProductId = await findOrCreateCardProduct(
        categoryId,
        typeId,
        totalQuota,
        masaBerlaku,
        fwPrice // Already a number from parsePrice
      );

      // 13. Create Card (ensure all numeric values are numbers)
      // Note: categoryId, typeId, totalQuota, masaBerlaku, fwPrice are now accessed via cardProduct relation
      const card = await db.card.create({
        data: {
          id: randomUUID(),
          serialNumber: serialNumber,
          memberId: memberId,
          cardProductId: cardProductId,
          quotaTicket: typeof quotaTicket === 'number' ? quotaTicket : parseInt(String(quotaTicket || 0), 10) || 0,
          purchaseDate: purchaseDate || new Date(),
          expiredDate: expiredDate || new Date(),
          status: cardStatus,
        } as any,
      });

      console.log(`✅ Created Card: ${serialNumber}`);

      // 14. Create Transaction (if shiftDate exists)
      if (shiftDate) {
        const transactionStatus = normalizeTransactionStatus(row['Status']);
        
        // Generate transaction number
        const transactionNumber = `TXN-${Date.now()}-${serialNumber}`;

        await db.redeem.create({
          data: {
            id: randomUUID(),
            cardId: card.id,
            transactionNumber: transactionNumber,
            operatorId: operatorId,
            stationId: stationId,
            shiftDate: shiftDate,
            status: transactionStatus,
            notes: row['Notes']?.toString().trim() || null,
          } as any,
        });

        console.log(`✅ Created Redeem: ${transactionNumber}`);
      }

      sheetSuccessCount++;
      globalSuccessCount.count++;

    } catch (error) {
      sheetErrorCount++;
      globalErrorCount.count++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      globalErrors.push({ sheet: sheetName, row: rowNumber, error: errorMessage });
      console.error(`❌ Error processing row ${rowNumber} in sheet "${sheetName}": ${errorMessage}`);
    }
  }
  
  console.log(`\n📊 Sheet "${sheetName}" summary: ${sheetSuccessCount} success, ${sheetErrorCount} errors`);
  return sheetSuccessCount;
}

// Main import function
async function importExcel() {
  console.log('📊 Starting Excel import from multiple sheets...\n');
  console.log(`File: ${excelFilePath}`);
  console.log(`Sheets to import: ${SHEET_NAMES.join(', ')}`);
  console.log(`Limit: ${LIMIT} records total (across all sheets)\n`);

  try {
    // Read Excel file
    const fileBuffer = readFileSync(excelFilePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Verify all sheets exist
    const missingSheets = SHEET_NAMES.filter(name => !workbook.SheetNames.includes(name));
    if (missingSheets.length > 0) {
      throw new Error(`Sheets not found: ${missingSheets.join(', ')}`);
    }

    let globalSuccessCount = { count: 0 };
    let globalErrorCount = { count: 0 };
    const globalErrors: Array<{ sheet: string; row: number; error: string }> = [];
    const sheetStats: Array<{ sheet: string; success: number; errors: number; total: number }> = [];

    // Process each sheet
    for (let sheetIndex = 0; sheetIndex < SHEET_NAMES.length; sheetIndex++) {
      const sheetName = SHEET_NAMES[sheetIndex];
      
      // Check if we've reached the limit
      if (globalSuccessCount.count >= LIMIT) {
        console.log(`\n⚠️  Reached global limit of ${LIMIT} successful imports. Stopping...`);
        break;
      }

      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
        defval: null,
        raw: false,
      });

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📑 Sheet ${sheetIndex + 1}/${SHEET_NAMES.length}: "${sheetName}"`);
      console.log(`📋 Total rows: ${data.length}`);
      
      // Debug: Show available columns for first row
      if (data.length > 0) {
        const firstRow = data[0];
        const columns = Object.keys(firstRow);
        console.log(`📋 Available columns (${columns.length}): ${columns.join(', ')}`);
        
        // Check if Serial Number column exists
        if (!columns.includes('Serial Number')) {
          console.log(`   ⚠️  WARNING: "Serial Number" column not found in sheet "${sheetName}"`);
          console.log(`   ⚠️  This will cause import to fail. Please check Excel file structure.`);
        }
      }
      
      // Filter out header rows and empty rows
      const validRows = data.filter((row, index) => {
        // Skip rows without essential data
        const hasSerialNumber = row['Serial Number'] !== null && row['Serial Number'] !== undefined && row['Serial Number'] !== '';
        const hasCustomerName = row['Customer Name'] && String(row['Customer Name']).trim() !== '';
        const hasIdentityNumber = row['Identity Number'] && String(row['Identity Number']).trim() !== '';
        const hasCardCategory = row['Card Category'] && String(row['Card Category']).trim() !== '';
        const hasCardType = row['Card Type'] && String(row['Card Type']).trim() !== '';
        
        // Log first invalid row for debugging
        if (index === 0 && !hasSerialNumber) {
          const rowKeys = Object.keys(row as Record<string, any>);
          console.log(`   ⚠️  First row missing Serial Number. Available keys: ${rowKeys.join(', ')}`);
          console.log(`   ⚠️  Row data sample:`, rowKeys.slice(0, 10).map(key => `${key}: ${(row as Record<string, any>)[key]}`).join(', '));
        }
        
        return hasSerialNumber && hasCustomerName && hasIdentityNumber && hasCardCategory && hasCardType;
      });

      console.log(`✅ Valid rows found: ${validRows.length}`);
      
      if (validRows.length === 0) {
        console.log(`⚠️  No valid rows in sheet "${sheetName}", skipping...`);
        sheetStats.push({ sheet: sheetName, success: 0, errors: 0, total: 0 });
        continue;
      }

      // Process rows from this sheet
      const successCount = await processSheetRows(
        validRows,
        sheetName,
        sheetIndex,
        SHEET_NAMES.length,
        globalSuccessCount,
        globalErrorCount,
        globalErrors
      );
      
      sheetStats.push({
        sheet: sheetName,
        success: successCount,
        errors: globalErrorCount.count - (sheetStats.reduce((sum, s) => sum + s.errors, 0)),
        total: validRows.length,
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary');
    console.log('='.repeat(60));
    console.log(`✅ Total Success: ${globalSuccessCount.count} records (MAX: ${LIMIT})`);
    console.log(`❌ Total Errors: ${globalErrorCount.count} records`);
    console.log(`🔒 Limit enforced: ${LIMIT} records maximum`);
    
    console.log(`\n📊 Per Sheet Summary:`);
    sheetStats.forEach((stat, idx) => {
      console.log(`   ${idx + 1}. ${stat.sheet}: ${stat.success} success, ${stat.errors} errors (${stat.total} total rows)`);
    });

    if (globalErrors.length > 0) {
      console.log('\n❌ Errors details:');
      globalErrors.slice(0, 20).forEach(({ sheet, row, error }) => {
        console.log(`   [${sheet}] Row ${row}: ${error}`);
      });
      if (globalErrors.length > 20) {
        console.log(`   ... and ${globalErrors.length - 20} more errors`);
      }
    }

    console.log('\n✅ Import completed!');

  } catch (error) {
    console.error('❌ Fatal error during import:');
    console.error(error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run import
importExcel()
  .catch(console.error)
  .finally(() => process.exit());

