import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const excelFilePath = join(process.cwd(), '50 data.xlsx');

/**
 * Script to add "Total Quota" and "Quota Ticket" columns to Excel file
 * 
 * Total Quota is determined by Card Type:
 * - KAI: 4
 * - Gold: 10
 * - Silver: 6
 * 
 * Quota Ticket is random between 0 and Total Quota
 */

/**
 * Mapping Card Type to Total Quota
 */
const CARD_TYPE_QUOTA_MAP: Record<string, number> = {
  'KAI': 4,
  'FWC-KAI': 4,
  'Gold': 10,
  'Gold Jaban': 10,
  'Gold Jaka': 10,
  'Gold KaBan': 10,
  'Gold Kaban': 10,
  'Silver': 6,
  'Silver Jaban': 6,
  'Silver Jaka': 6,
  'Silver KaBan': 6,
  'Silver Kaban': 6,
};

/**
 * Default quota if card type not found in map
 */
const DEFAULT_QUOTA = 10;

/**
 * Get total quota based on card type and sheet name
 */
function getTotalQuotaByCardType(cardType: string | null | undefined, sheetName?: string): number {
  if (!cardType) {
    return DEFAULT_QUOTA;
  }

  const normalizedType = String(cardType).trim();
  const lowerType = normalizedType.toLowerCase();
  
  // Try exact match first
  if (CARD_TYPE_QUOTA_MAP[normalizedType]) {
    return CARD_TYPE_QUOTA_MAP[normalizedType];
  }

  // Try case-insensitive match
  for (const [key, value] of Object.entries(CARD_TYPE_QUOTA_MAP)) {
    if (key.toLowerCase() === lowerType) {
      return value;
    }
  }

  // Try to infer from sheet name if card type is just the variant (e.g., "JaBan", "JaKa", "KaBan")
  if (sheetName) {
    const lowerSheetName = sheetName.toLowerCase();
    
    // Check if sheet name contains KAI
    if (lowerSheetName.includes('kai') || lowerSheetName.includes('fwc-kai')) {
      return 4;
    }
    
    // Check if sheet name contains Gold
    if (lowerSheetName.includes('gold')) {
      return 10;
    }
    
    // Check if sheet name contains Silver
    if (lowerSheetName.includes('silver')) {
      return 6;
    }
  }

  // Try partial match in card type itself
  // Check for KAI first
  if (lowerType.includes('kai')) {
    return 4;
  }
  // Check for Gold
  if (lowerType.includes('gold')) {
    return 10;
  }
  // Check for Silver
  if (lowerType.includes('silver')) {
    return 6;
  }

  // If no match found, use default (shouldn't log warning if we can infer from sheet)
  return DEFAULT_QUOTA;
}

/**
 * Generate random quota ticket value (between 0 and totalQuota)
 */
function generateRandomQuotaTicket(totalQuota: number): number {
  // Random between 0 and totalQuota (inclusive)
  return Math.floor(Math.random() * (totalQuota + 1));
}

async function addRandomQuotaTicket() {
  console.log('🔄 Adding Total Quota and Quota Ticket to Excel file...\n');
  console.log(`File: ${excelFilePath}`);
  console.log(`Card Type Quota Mapping:`);
  console.log(`   - KAI: 4`);
  console.log(`   - Gold: 10`);
  console.log(`   - Silver: 6\n`);

  try {
    // Read Excel file
    const fileBuffer = readFileSync(excelFilePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    console.log(`📑 Total Sheets: ${workbook.SheetNames.length}\n`);

    let totalRowsUpdated = 0;

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`📋 Processing sheet: "${sheetName}"`);

      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON to work with data
      const data = XLSX.utils.sheet_to_json(worksheet, {
        defval: null,
        raw: false,
        header: 1, // Use array format to preserve row structure
      });

      if (data.length === 0) {
        console.log(`   ⚠️  Sheet is empty, skipping...\n`);
        continue;
      }

      // Find header row first
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(5, data.length); i++) {
        const row = data[i] as any[];
        if (Array.isArray(row) && row.length > 0) {
          // Check if this looks like a header row (has text values)
          const textCells = row.filter(cell => cell && typeof cell === 'string');
          if (textCells.length > 3) {
            headerRowIndex = i;
            break;
          }
        }
      }

      const headerRow = data[headerRowIndex] as any[];

      // Find "Card Type" column (required)
      let cardTypeColumnIndex = -1;
      if (Array.isArray(headerRow)) {
        cardTypeColumnIndex = headerRow.findIndex(
          (cell: any) => 
            cell && 
            String(cell).toLowerCase().includes('card') && 
            String(cell).toLowerCase().includes('type')
        );
      }

      if (cardTypeColumnIndex === -1) {
        console.log(`   ⚠️  "Card Type" column not found, skipping sheet...\n`);
        continue;
      }

      console.log(`   ✅ Found "Card Type" column at column ${cardTypeColumnIndex + 1}`);

      // Find "Total Quota" column if it exists
      let totalQuotaColumnIndex = -1;
      if (Array.isArray(headerRow)) {
        totalQuotaColumnIndex = headerRow.findIndex(
          (cell: any) => 
            cell && 
            String(cell).toLowerCase().includes('total') && 
            String(cell).toLowerCase().includes('quota')
        );
      }

      // Find "Quota Ticket" column if it exists
      let quotaTicketColumnIndex = -1;
      if (Array.isArray(headerRow)) {
        quotaTicketColumnIndex = headerRow.findIndex(
          (cell: any) => 
            cell && 
            String(cell).toLowerCase().includes('quota') && 
            String(cell).toLowerCase().includes('ticket')
        );
      }

      // Add "Total Quota" column if it doesn't exist (after Card Type)
      if (totalQuotaColumnIndex === -1) {
        totalQuotaColumnIndex = cardTypeColumnIndex + 1;
        if (!Array.isArray(data[headerRowIndex])) {
          data[headerRowIndex] = [];
        }
        const headerRowArray = data[headerRowIndex] as any[];
        // Shift existing columns if needed
        headerRowArray.splice(totalQuotaColumnIndex, 0, 'Total Quota');
        console.log(`   ✅ Added "Total Quota" column at column ${totalQuotaColumnIndex + 1}`);
        
        // Adjust quotaTicketColumnIndex if it was after this position
        if (quotaTicketColumnIndex >= totalQuotaColumnIndex) {
          quotaTicketColumnIndex++;
        }
      } else {
        console.log(`   ✅ Found existing "Total Quota" column at column ${totalQuotaColumnIndex + 1}`);
      }

      // Add "Quota Ticket" column if it doesn't exist (after Total Quota)
      if (quotaTicketColumnIndex === -1) {
        quotaTicketColumnIndex = totalQuotaColumnIndex + 1;
        if (!Array.isArray(data[headerRowIndex])) {
          data[headerRowIndex] = [];
        }
        const headerRowArray = data[headerRowIndex] as any[];
        headerRowArray.splice(quotaTicketColumnIndex, 0, 'Quota Ticket');
        console.log(`   ✅ Added "Quota Ticket" column at column ${quotaTicketColumnIndex + 1}`);
      } else {
        console.log(`   ✅ Found existing "Quota Ticket" column at column ${quotaTicketColumnIndex + 1}`);
      }

      // Add quota values to all data rows based on card type
      let rowsUpdated = 0;
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i] as any[];
        if (Array.isArray(row)) {
          // Only add quota if row has some data (not empty row)
          const hasData = row.some(cell => cell !== null && cell !== undefined && cell !== '');
          if (hasData) {
            // Ensure row has enough columns
            while (row.length <= Math.max(quotaTicketColumnIndex, totalQuotaColumnIndex)) {
              row.push(null);
            }

            // Get card type from row
            const cardType = row[cardTypeColumnIndex];
            const totalQuota = getTotalQuotaByCardType(cardType, sheetName);
            const quotaTicket = generateRandomQuotaTicket(totalQuota);

            // Set Total Quota
            row[totalQuotaColumnIndex] = totalQuota;
            
            // Set Quota Ticket
            row[quotaTicketColumnIndex] = quotaTicket;
            
            rowsUpdated++;
          }
        }
      }

      console.log(`   ✅ Updated ${rowsUpdated} rows with Total Quota and Quota Ticket values\n`);
      totalRowsUpdated += rowsUpdated;

      // Convert back to worksheet
      const newWorksheet = XLSX.utils.aoa_to_sheet(data as any[][]);
      workbook.Sheets[sheetName] = newWorksheet;
    }

    // Write back to file
    console.log('💾 Writing updated data to file...');
    const newFileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    writeFileSync(excelFilePath, newFileBuffer);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ Complete!');
    console.log('='.repeat(80));
    console.log(`📊 Summary:`);
    console.log(`   - Total sheets processed: ${workbook.SheetNames.length}`);
    console.log(`   - Total rows updated: ${totalRowsUpdated}`);
    console.log(`   - Card Type Mapping:`);
    console.log(`     * KAI: 4 quota`);
    console.log(`     * Gold: 10 quota`);
    console.log(`     * Silver: 6 quota`);
    console.log(`   - File saved: ${excelFilePath}`);
    console.log('\n✅ Total Quota and Quota Ticket values have been added successfully!');

  } catch (error) {
    console.error('\n❌ Error processing Excel file:');
    console.error(error);
    throw error;
  }
}

// Run script
addRandomQuotaTicket();

