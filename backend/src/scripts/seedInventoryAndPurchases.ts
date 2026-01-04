import db from '../config/db';
import { StockInService } from '../modules/stock/in/service';
import { StockOutService } from '../modules/stock/out/service';
import { PurchaseService } from '../modules/purchases/service';

/**
 * Seeder untuk Inventory dan Purchases
 * 
 * Script ini akan:
 * 1. Membuat Stock IN (produksi kartu) untuk beberapa produk
 * 2. Membuat Stock OUT (distribusi) ke stasiun
 * 3. Validasi Stock OUT (semua kartu diterima, tidak ada yang hilang/rusak)
 * 4. Membuat beberapa Purchase (pembelian kartu)
 * 5. Membuat beberapa Member jika belum ada
 * 
 * Data yang akan dibuat:
 * - Stock IN: 
 *   * Gold JaBan: 20 kartu
 *   * Silver JaKa: 15 kartu
 *   * Gold KaBan: 10 kartu
 * 
 * - Stock OUT:
 *   * Gold JaBan ke Halim: 10 kartu
 *   * Silver JaKa ke Success: 8 kartu
 *   * Gold KaBan ke Tegalluar: 5 kartu
 * 
 * - Purchases:
 *   * Halim: 5 pembelian Gold JaBan
 *   * Success: 3 pembelian Silver JaKa
 *   * Tegalluar: 2 pembelian Gold KaBan
 * 
 * Run dengan: 
 *   cd backend
 *   bun run src/scripts/seedInventoryAndPurchases.ts
 * 
 * Note: Pastikan user "rama" ada di database dan memiliki akses superadmin
 */

interface SeedConfig {
  stockInBatches: Array<{
    categoryCode: string;
    typeCode: string;
    startSerial: string;
    endSerial: string;
    note?: string;
  }>;
  stockOutBatches: Array<{
    categoryCode: string;
    typeCode: string;
    stationCode: string;
    startSerial: string;
    endSerial: string;
    note?: string;
  }>;
  purchases: Array<{
    categoryCode: string;
    typeCode: string;
    stationCode: string;
    memberName?: string;
    memberIdentityNumber?: string;
    count: number; // Jumlah kartu yang akan dibeli
  }>;
}

// Konfigurasi seeder
const seedConfig: SeedConfig = {
  stockInBatches: [
    // Gold - JaBan: 20 kartu
    {
      categoryCode: 'gold',
      typeCode: 'jaban',
      startSerial: '1',
      endSerial: '20',
      note: 'Batch produksi Gold JaBan untuk testing'
    },
    // Silver - JaKa: 15 kartu
    {
      categoryCode: 'silver',
      typeCode: 'jaka',
      startSerial: '1',
      endSerial: '15',
      note: 'Batch produksi Silver JaKa untuk testing'
    },
    // Gold - KaBan: 10 kartu
    {
      categoryCode: 'gold',
      typeCode: 'kaban',
      startSerial: '1',
      endSerial: '10',
      note: 'Batch produksi Gold KaBan untuk testing'
    },
  ],
  stockOutBatches: [
    // Distribusi Gold JaBan ke Halim: 10 kartu
    {
      categoryCode: 'gold',
      typeCode: 'jaban',
      stationCode: 'HALIM',
      startSerial: '1',
      endSerial: '10',
      note: 'Distribusi ke Stasiun Halim'
    },
    // Distribusi Silver JaKa ke Success: 8 kartu
    {
      categoryCode: 'silver',
      typeCode: 'jaka',
      stationCode: 'SUCCESS',
      startSerial: '1',
      endSerial: '8',
      note: 'Distribusi ke Stasiun Success'
    },
    // Distribusi Gold KaBan ke Tegalluar: 5 kartu
    {
      categoryCode: 'gold',
      typeCode: 'kaban',
      stationCode: 'TEGALLUAR',
      startSerial: '1',
      endSerial: '5',
      note: 'Distribusi ke Stasiun Tegalluar'
    },
  ],
  purchases: [
    // Pembelian di Halim: 5 kartu Gold JaBan
    {
      categoryCode: 'gold',
      typeCode: 'jaban',
      stationCode: 'HALIM',
      memberName: 'John Doe',
      memberIdentityNumber: '1234567890123456',
      count: 5
    },
    // Pembelian di Success: 3 kartu Silver JaKa
    {
      categoryCode: 'silver',
      typeCode: 'jaka',
      stationCode: 'SUCCESS',
      memberName: 'Jane Smith',
      memberIdentityNumber: '2345678901234567',
      count: 3
    },
    // Pembelian di Tegalluar: 2 kartu Gold KaBan
    {
      categoryCode: 'gold',
      typeCode: 'kaban',
      stationCode: 'TEGALLUAR',
      memberName: 'Bob Johnson',
      memberIdentityNumber: '3456789012345678',
      count: 2
    },
  ]
};

async function seedInventoryAndPurchases() {
  console.log('🌱 Starting seeder for Inventory and Purchases...\n');

  try {
    // 1. Get user (superadmin) untuk createdBy
    const user = await db.user.findFirst({
      where: {
        username: 'rama',
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error('User "rama" not found. Please ensure user exists.');
    }

    console.log(`✅ Found user: ${user.fullName} (${user.username})\n`);

    // 2. Get all categories, types, products, and stations
    const categories = await db.cardCategory.findMany({
      where: { deletedAt: null },
    });
    const types = await db.cardType.findMany({
      where: { deletedAt: null },
    });
    const products = await db.cardProduct.findMany({
      where: { deletedAt: null, isActive: true },
      include: {
        category: {
          select: {
            id: true,
            categoryCode: true,
            categoryName: true,
          },
        },
        type: {
          select: {
            id: true,
            typeCode: true,
            typeName: true,
          },
        },
      },
    });
    const stations = await db.station.findMany({
      where: { deletedAt: null },
    });

    console.log(`📊 Data found:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Types: ${types.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Stations: ${stations.length}\n`);

    // Helper functions
    const getCategory = (code: string) => {
      const cat = categories.find(
        (c) => c.categoryCode.toLowerCase() === code.toLowerCase()
      );
      if (!cat) throw new Error(`Category "${code}" not found`);
      return cat;
    };

    const getType = (code: string) => {
      const typ = types.find(
        (t) => t.typeCode.toLowerCase() === code.toLowerCase()
      );
      if (!typ) throw new Error(`Type "${code}" not found`);
      return typ;
    };

    const getProduct = (categoryCode: string, typeCode: string) => {
      const cat = getCategory(categoryCode);
      const typ = getType(typeCode);
      
      // First try: Match by categoryId and typeId
      let availableProducts = products.filter(
        (p) => p.categoryId === cat.id && p.typeId === typ.id
      );
      
      // If no match, try matching by categoryCode and typeCode (case-insensitive)
      if (availableProducts.length === 0) {
        availableProducts = products.filter((p) => {
          const pCatCode = p.category?.categoryCode?.toLowerCase() || '';
          const pTypeCode = p.type?.typeCode?.toLowerCase() || '';
          return (
            pCatCode === categoryCode.toLowerCase() &&
            pTypeCode === typeCode.toLowerCase()
          );
        });
      }
      
      if (availableProducts.length === 0) {
        // List all products for debugging
        const allProductsInfo = products.map(
          (p) =>
            `${p.category?.categoryCode || 'N/A'}-${p.type?.typeCode || 'N/A'} (catId: ${p.categoryId}, typeId: ${p.typeId}, id: ${p.id}, active: ${p.isActive}, deleted: ${p.deletedAt ? 'yes' : 'no'})`
        );
        throw new Error(
          `Product for category "${categoryCode}" (id: ${cat.id}, code: ${cat.categoryCode}) and type "${typeCode}" (id: ${typ.id}, code: ${typ.typeCode}) not found.\n` +
            `Available products: ${allProductsInfo.join(', ')}`
        );
      }
      
      const prod = availableProducts.find(
        (p) => p.isActive && !p.deletedAt
      );
      
      if (!prod) {
        throw new Error(
          `Product for category "${categoryCode}" and type "${typeCode}" exists but is not active or is deleted`
        );
      }
      
      return prod;
    };

    const getStation = (code: string) => {
      const stn = stations.find(
        (s) => s.stationCode.toUpperCase() === code.toUpperCase()
      );
      if (!stn) throw new Error(`Station "${code}" not found`);
      return stn;
    };

    // Helper function to get next available serial number
    const getNextAvailableSerial = async (
      productId: string,
      serialTemplate: string,
      yearSuffix: string
    ): Promise<number> => {
      // Get last card for this product
      const lastCard = await db.card.findFirst({
        where: {
          cardProductId: productId,
          serialNumber: {
            startsWith: `${serialTemplate}${yearSuffix}`,
          },
        },
        orderBy: { serialNumber: 'desc' },
        select: { serialNumber: true },
      });

      if (!lastCard) {
        return 1; // Start from 1 if no cards exist
      }

      // Extract suffix from last serial (last 5 digits)
      const lastSerial = lastCard.serialNumber;
      const suffix = lastSerial.slice(-5);
      const lastNum = parseInt(suffix, 10);

      if (isNaN(lastNum)) {
        return 1; // If can't parse, start from 1
      }

      return lastNum + 1; // Start from next number
    };

    // 3. Create Stock IN batches
    console.log('📦 Step 1: Creating Stock IN batches...\n');
    const stockInResults: Array<{
      movementId: string;
      quantity: number;
      categoryCode: string;
      typeCode: string;
      startSerialNumber: string;
      endSerialNumber: string;
    }> = [];

    for (const batch of seedConfig.stockInBatches) {
      try {
        // Get product first to ensure it exists and get correct categoryId/typeId
        const product = getProduct(batch.categoryCode, batch.typeCode);
        
        // Use categoryId and typeId from product (more reliable)
        const categoryId = product.categoryId;
        const typeId = product.typeId;

        const movementAt = new Date();
        movementAt.setDate(movementAt.getDate() - 7); // 7 hari yang lalu
        const yearSuffix = movementAt.getFullYear().toString().slice(-2);

        // Get next available serial number
        const nextSerial = await getNextAvailableSerial(
          product.id,
          product.serialTemplate,
          yearSuffix
        );

        const startSerialNum = parseInt(batch.startSerial, 10);
        const endSerialNum = parseInt(batch.endSerial, 10);
        const quantity = endSerialNum - startSerialNum + 1;

        // Use next available serial instead of fixed startSerial
        const actualStartSerial = String(nextSerial);
        const actualEndSerial = String(nextSerial + quantity - 1);

        console.log(
          `   Creating Stock IN: ${batch.categoryCode} ${batch.typeCode} (${actualStartSerial}-${actualEndSerial})...`
        );

        const result = await StockInService.createStockIn(
          movementAt,
          categoryId, // Use from product
          typeId, // Use from product
          actualStartSerial,
          actualEndSerial,
          user.id,
          batch.note
        );

        stockInResults.push({
          movementId: result.movementId,
          quantity: result.quantity,
          categoryCode: batch.categoryCode,
          typeCode: batch.typeCode,
          startSerialNumber: result.startSerialNumber,
          endSerialNumber: result.endSerialNumber,
        });

        console.log(
          `   ✅ Created ${result.quantity} cards (${result.startSerialNumber} - ${result.endSerialNumber})\n`
        );
      } catch (error) {
        console.error(
          `   ❌ Error creating Stock IN for ${batch.categoryCode} ${batch.typeCode}:`,
          error instanceof Error ? error.message : error
        );
        throw error;
      }
    }

    console.log(
      `✅ Stock IN complete: ${stockInResults.length} batches created\n`
    );

    // Helper function to extract suffix from serial number
    const extractSuffix = (serialNumber: string, template: string, yearSuffix: string): number => {
      const prefix = `${template}${yearSuffix}`;
      if (!serialNumber.startsWith(prefix)) {
        throw new Error(`Serial number ${serialNumber} doesn't match template ${prefix}`);
      }
      const suffix = serialNumber.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (isNaN(num)) {
        throw new Error(`Cannot parse suffix from serial number ${serialNumber}`);
      }
      return num;
    };

    // 4. Create Stock OUT batches
    console.log('🚚 Step 2: Creating Stock OUT batches...\n');
    const stockOutResults: Array<{
      movementId: string;
      quantity: number;
      stationId: string;
    }> = [];

    for (const batch of seedConfig.stockOutBatches) {
      try {
        // Get product first to ensure it exists and get correct categoryId/typeId
        const product = getProduct(batch.categoryCode, batch.typeCode);
        const station = getStation(batch.stationCode);
        
        // Use categoryId and typeId from product (more reliable)
        const categoryId = product.categoryId;
        const typeId = product.typeId;

        // Find corresponding Stock IN result
        const stockInResult = stockInResults.find(
          (r) => r.categoryCode === batch.categoryCode && r.typeCode === batch.typeCode
        );

        if (!stockInResult) {
          throw new Error(
            `No Stock IN found for ${batch.categoryCode} ${batch.typeCode}. Please create Stock IN first.`
          );
        }

        const movementAt = new Date();
        movementAt.setDate(movementAt.getDate() - 5); // 5 hari yang lalu
        const yearSuffix = movementAt.getFullYear().toString().slice(-2);

        // Extract suffix from serial numbers
        const startSuffix = extractSuffix(
          stockInResult.startSerialNumber,
          product.serialTemplate,
          yearSuffix
        );
        const endSuffix = extractSuffix(
          stockInResult.endSerialNumber,
          product.serialTemplate,
          yearSuffix
        );

        // Calculate how many cards to distribute
        const requestedStart = parseInt(batch.startSerial, 10);
        const requestedEnd = parseInt(batch.endSerial, 10);
        const requestedCount = requestedEnd - requestedStart + 1;

        // Use relative position from Stock IN
        const actualStartSuffix = startSuffix + (requestedStart - 1);
        const actualEndSuffix = actualStartSuffix + requestedCount - 1;

        // Make sure we don't exceed available cards
        if (actualEndSuffix > endSuffix) {
          throw new Error(
            `Requested ${requestedCount} cards but only ${endSuffix - startSuffix + 1} available`
          );
        }

        console.log(
          `   Creating Stock OUT: ${batch.categoryCode} ${batch.typeCode} to ${batch.stationCode} (suffix ${actualStartSuffix}-${actualEndSuffix})...`
        );

        const result = await StockOutService.stockOutDistribution(
          movementAt,
          categoryId, // Use from product
          typeId, // Use from product
          station.id,
          String(actualStartSuffix),
          String(actualEndSuffix),
          user.id,
          batch.note
        );

        stockOutResults.push({
          movementId: result.movementId,
          quantity: result.sentCount,
          stationId: station.id,
        });

        console.log(
          `   ✅ Created Stock OUT: ${result.sentCount} cards, status: ${result.status}\n`
        );
      } catch (error) {
        console.error(
          `   ❌ Error creating Stock OUT for ${batch.categoryCode} ${batch.typeCode}:`,
          error instanceof Error ? error.message : error
        );
        throw error;
      }
    }

    console.log(
      `✅ Stock OUT complete: ${stockOutResults.length} batches created\n`
    );

    // 5. Validate Stock OUT (set semua sebagai received)
    console.log('✅ Step 3: Validating Stock OUT batches...\n');

    for (const stockOut of stockOutResults) {
      try {
        // Get movement detail untuk mendapatkan sentSerialNumbers
        const movement = await db.cardStockMovement.findUnique({
          where: { id: stockOut.movementId },
        });

        if (!movement || movement.status !== 'PENDING') {
          console.log(
            `   ⚠️  Skipping validation for movement ${stockOut.movementId} (status: ${movement?.status || 'NOT_FOUND'})\n`
          );
          continue;
        }

        const sentSerials = (movement as any).sentSerialNumbers || [];

        console.log(
          `   Validating Stock OUT ${stockOut.movementId} (${sentSerials.length} cards)...`
        );

        // Set user stationId untuk validasi
        const station = await db.station.findUnique({
          where: { id: stockOut.stationId },
        });

        if (!station) {
          throw new Error(`Station ${stockOut.stationId} not found`);
        }

        // Simpan original stationId user
        const originalStationId = user.stationId;

        // Update user stationId temporarily (untuk validasi - required by validateStockOutReceipe)
        await db.user.update({
          where: { id: user.id },
          data: { stationId: stockOut.stationId },
        });

        try {
          const validateResult = await StockOutService.validateStockOutReceipe(
            stockOut.movementId,
            sentSerials, // All received
            [], // No lost
            [], // No damaged
            user.id,
            stockOut.stationId,
            'Validasi otomatis dari seeder'
          );

          console.log(
            `   ✅ Validated: ${validateResult.receivedCount} received, ${validateResult.lostCount} lost, ${validateResult.damagedCount} damaged\n`
          );
        } finally {
          // Reset user stationId ke original (always execute)
          await db.user.update({
            where: { id: user.id },
            data: { stationId: originalStationId },
          });
        }
      } catch (error) {
        console.error(
          `   ❌ Error validating Stock OUT ${stockOut.movementId}:`,
          error instanceof Error ? error.message : error
        );
        // Continue dengan batch berikutnya
      }
    }

    console.log(`✅ Stock OUT validation complete\n`);

    // 6. Create Members and Purchases
    console.log('💰 Step 4: Creating Members and Purchases...\n');

    // Build a map of stock out results by category+type for easy lookup
    const stockOutMap = new Map<string, typeof stockOutResults[0]>();
    for (const stockOut of stockOutResults) {
      const movement = await db.cardStockMovement.findUnique({
        where: { id: stockOut.movementId },
        include: {
          category: true,
          cardType: true,
        },
      });
      if (movement && movement.status === 'APPROVED') {
        const key = `${movement.category.categoryCode}-${movement.cardType.typeCode}`;
        stockOutMap.set(key.toLowerCase(), stockOut);
      }
    }

    for (const purchaseConfig of seedConfig.purchases) {
      try {
        const category = getCategory(purchaseConfig.categoryCode);
        const type = getType(purchaseConfig.typeCode);
        const station = getStation(purchaseConfig.stationCode);
        
        // Find corresponding stock out movement
        const stockOutKey = `${purchaseConfig.categoryCode}-${purchaseConfig.typeCode}`;
        const stockOut = stockOutMap.get(stockOutKey.toLowerCase());
        
        if (!stockOut) {
          console.log(
            `   ⚠️  Warning: No approved stock out found for ${purchaseConfig.categoryCode} ${purchaseConfig.typeCode} at ${purchaseConfig.stationCode}, skipping purchases`
          );
          continue;
        }
        
        // Get received serial numbers from stock out movement
        const movement = await db.cardStockMovement.findUnique({
          where: { id: stockOut.movementId },
        });
        
        if (!movement || movement.status !== 'APPROVED') {
          console.log(
            `   ⚠️  Warning: Stock out movement ${stockOut.movementId} is not APPROVED, skipping purchases`
          );
          continue;
        }
        
        const receivedSerials = (movement as any).receivedSerialNumbers || [];

        // Find or create member
        let member = null;
        if (purchaseConfig.memberIdentityNumber) {
          member = await db.member.findFirst({
            where: {
              identityNumber: purchaseConfig.memberIdentityNumber,
              deletedAt: null,
            },
          });

          if (!member && purchaseConfig.memberName) {
            console.log(
              `   Creating member: ${purchaseConfig.memberName}...`
            );
            member = await db.member.create({
              data: {
                name: purchaseConfig.memberName,
                identityNumber: purchaseConfig.memberIdentityNumber,
                nationality: 'INDONESIA',
                createdBy: user.id,
                updatedBy: user.id,
              },
            });
            console.log(`   ✅ Member created: ${member.name}\n`);
          }
        }

        // Get available cards by serial numbers from stock out (more reliable)
        // Take only the number of cards requested
        const serialsToUse = receivedSerials.slice(0, purchaseConfig.count);
        
        const availableCards = await db.card.findMany({
          where: {
            serialNumber: {
              in: serialsToUse,
            },
            status: 'IN_STATION',
            deletedAt: null,
          },
          include: {
            cardProduct: {
              include: {
                category: true,
                type: true,
              },
            },
            purchases: {
              where: {
                deletedAt: null,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // Filter cards that don't have any purchases
        const cardsWithoutPurchases = availableCards.filter(
          (card) => card.purchases.length === 0
        );

        if (cardsWithoutPurchases.length < purchaseConfig.count) {
          console.log(
            `   ⚠️  Warning: Only ${cardsWithoutPurchases.length} cards available for ${purchaseConfig.categoryCode} ${purchaseConfig.typeCode} at ${purchaseConfig.stationCode}, requested ${purchaseConfig.count}`
          );
        }

        // Simpan original stationId user
        const originalStationId = user.stationId;

        // Update user stationId untuk purchase (required by PurchaseService)
        await db.user.update({
          where: { id: user.id },
          data: { stationId: station.id },
        });

        // Create purchases
        let purchaseCount = 0;
        for (const card of cardsWithoutPurchases) {
          try {
            const purchaseDate = new Date();
            purchaseDate.setDate(purchaseDate.getDate() - 3); // 3 hari yang lalu
            purchaseDate.setHours(10, 0, 0, 0); // Set waktu ke 10:00

            const purchase = await PurchaseService.createPurchase(
              {
                cardId: card.id,
                memberId: member?.id || null,
                price: Number(card.cardProduct.price),
                notes: `Purchase from seeder - ${purchaseConfig.categoryCode} ${purchaseConfig.typeCode}`,
              },
              user.id, // operatorId
              station.id, // stationId
              user.id // userId
            );

            purchaseCount++;
            console.log(
              `   ✅ Purchase created: ${purchase.transactionNumber} for card ${card.serialNumber}`
            );
          } catch (error) {
            console.error(
              `   ❌ Error creating purchase for card ${card.serialNumber}:`,
              error instanceof Error ? error.message : error
            );
          }
        }

        // Reset user stationId ke original
        await db.user.update({
          where: { id: user.id },
          data: { stationId: originalStationId },
        });

        console.log(
          `   ✅ Created ${availableCards.length} purchases for ${purchaseConfig.categoryCode} ${purchaseConfig.typeCode} at ${purchaseConfig.stationCode}\n`
        );
      } catch (error) {
        console.error(
          `   ❌ Error processing purchase config:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log(`✅ Purchases complete\n`);

    // 7. Summary
    const finalInventory = await db.cardInventory.aggregate({
      _sum: {
        cardOffice: true,
        cardBeredar: true,
        cardBelumTerjual: true,
        cardAktif: true,
      },
    });

    const finalPurchases = await db.cardPurchase.count({
      where: { deletedAt: null },
    });

    const finalStockMovements = await db.cardStockMovement.count();

    console.log('='.repeat(80));
    console.log('✅ Seeder Complete!');
    console.log('='.repeat(80));
    console.log('📊 Final Summary:');
    console.log(
      `   - Stock IN batches: ${stockInResults.length} (${stockInResults.reduce((sum, r) => sum + r.quantity, 0)} cards)`
    );
    console.log(
      `   - Stock OUT batches: ${stockOutResults.length} (${stockOutResults.reduce((sum, r) => sum + r.quantity, 0)} cards)`
    );
    console.log(`   - Total Purchases: ${finalPurchases}`);
    console.log(`   - Total Stock Movements: ${finalStockMovements}`);
    console.log('\n📦 Inventory Summary:');
    console.log(
      `   - Office Stock: ${finalInventory._sum.cardOffice || 0}`
    );
    console.log(
      `   - Total Beredar: ${finalInventory._sum.cardBeredar || 0}`
    );
    console.log(
      `   - Belum Terjual: ${finalInventory._sum.cardBelumTerjual || 0}`
    );
    console.log(`   - Aktif (Terjual): ${finalInventory._sum.cardAktif || 0}`);
    console.log('\n✅ All data seeded successfully!');
  } catch (error) {
    console.error('\n❌ Error during seeding:');
    console.error(error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run seeder
seedInventoryAndPurchases();

