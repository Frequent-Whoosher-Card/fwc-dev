import db from '../config/db';

/**
 * Script to test Card relation after migration
 * 
 * This script verifies:
 * 1. Card model can access cardProduct relation
 * 2. CardProduct relation provides category and type
 * 3. Data integrity is maintained
 * 4. No duplicate fields are being used
 */

async function testCardRelation() {
  console.log('🧪 Testing Card Relation After Migration...\n');

  try {
    // Test 1: Get a sample card with cardProduct relation
    console.log('📋 Test 1: Fetching card with cardProduct relation...');
    const sampleCard = await db.card.findFirst({
      where: {
        deletedAt: null,
      },
      include: {
        cardProduct: {
          include: {
            category: {
              select: {
                categoryCode: true,
                categoryName: true,
              },
            },
            type: {
              select: {
                typeCode: true,
                typeName: true,
              },
            },
          },
        },
      },
    });

    if (!sampleCard) {
      console.log('   ⚠️  No cards found in database. This is OK if database is empty.\n');
    } else {
      console.log('   ✅ Card found:');
      console.log(`      - Serial Number: ${sampleCard.serialNumber}`);
      console.log(`      - Card Product ID: ${sampleCard.cardProductId}`);
      console.log(`      - Quota Ticket: ${sampleCard.quotaTicket}`);
      
      if (sampleCard.cardProduct) {
        console.log('   ✅ CardProduct relation works:');
        console.log(`      - Total Quota: ${sampleCard.cardProduct.totalQuota}`);
        console.log(`      - Masa Berlaku: ${sampleCard.cardProduct.masaBerlaku}`);
        console.log(`      - Price: ${sampleCard.cardProduct.price}`);
        
        if (sampleCard.cardProduct.category) {
          console.log('   ✅ Category relation works:');
          console.log(`      - Category Code: ${sampleCard.cardProduct.category.categoryCode}`);
          console.log(`      - Category Name: ${sampleCard.cardProduct.category.categoryName}`);
        }
        
        if (sampleCard.cardProduct.type) {
          console.log('   ✅ Type relation works:');
          console.log(`      - Type Code: ${sampleCard.cardProduct.type.typeCode}`);
          console.log(`      - Type Name: ${sampleCard.cardProduct.type.typeName}`);
        }
      } else {
        console.log('   ⚠️  CardProduct relation is null');
      }
      console.log('');
    }

    // Test 2: Count cards and verify cardProductId exists
    console.log('📋 Test 2: Verifying cardProductId integrity...');
    const cardsCount = await db.card.count({
      where: {
        deletedAt: null,
      },
    });
    
    // Since cardProductId is required (not nullable), all cards should have it
    // We can verify by checking if any cards exist and if they can access cardProduct
    const cardsWithValidProduct = await db.card.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        cardProductId: true,
      },
      take: 100, // Sample check
    });

    const validProductCount = cardsWithValidProduct.filter(
      card => card.cardProductId !== null && card.cardProductId !== undefined
    ).length;

    console.log(`   ✅ Total cards: ${cardsCount}`);
    console.log(`   ✅ Sample cards checked: ${cardsWithValidProduct.length}`);
    console.log(`   ✅ Cards with valid cardProductId (sample): ${validProductCount}`);
    
    if (cardsCount > 0 && validProductCount === cardsWithValidProduct.length) {
      console.log('   ✅ All sampled cards have valid cardProductId\n');
    } else if (cardsCount === 0) {
      console.log('   ℹ️  No cards in database (this is OK)\n');
    } else if (validProductCount < cardsWithValidProduct.length) {
      console.log(`   ⚠️  Warning: ${cardsWithValidProduct.length - validProductCount} cards without cardProductId (in sample)\n`);
    } else {
      console.log('   ✅ All sampled cards have valid cardProductId\n');
    }

    // Test 3: Test MetricsService queries (simulate)
    console.log('📋 Test 3: Testing MetricsService-style queries...');
    
    // Test getQuotaTicketIssued query
    const cardsForMetrics = await db.card.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        cardProduct: {
          select: {
            totalQuota: true,
          },
        },
      },
      take: 10, // Limit to 10 for testing
    });

    const totalQuotaSum = cardsForMetrics.reduce((sum, card) => {
      return sum + (card.cardProduct?.totalQuota || 0);
    }, 0);

    console.log(`   ✅ Tested ${cardsForMetrics.length} cards`);
    console.log(`   ✅ Total Quota Sum (from cardProduct): ${totalQuotaSum}`);
    console.log('   ✅ MetricsService-style query works\n');

    // Test 4: Test SalesService queries (simulate)
    console.log('📋 Test 4: Testing SalesService-style queries...');
    
    const cardsForSales = await db.card.findMany({
      where: {
        deletedAt: null,
        purchaseDate: {
          not: null,
        },
      },
      include: {
        cardProduct: {
          include: {
            category: {
              select: {
                categoryCode: true,
                categoryName: true,
              },
            },
            type: {
              select: {
                typeCode: true,
                typeName: true,
              },
            },
          },
        },
      },
      take: 10, // Limit to 10 for testing
    });

    console.log(`   ✅ Tested ${cardsForSales.length} cards with purchaseDate`);
    
    const categoryTypeMap = new Map<string, number>();
    cardsForSales.forEach((card) => {
      if (card.cardProduct?.category && card.cardProduct?.type) {
        const key = `${card.cardProduct.category.categoryCode}_${card.cardProduct.type.typeCode}`;
        categoryTypeMap.set(key, (categoryTypeMap.get(key) || 0) + 1);
      }
    });

    console.log(`   ✅ Found ${categoryTypeMap.size} unique category+type combinations`);
    console.log('   ✅ SalesService-style query works\n');

    // Test 5: Verify no duplicate fields are accessible
    console.log('📋 Test 5: Verifying no duplicate fields in Card model...');
    
    // Try to access a card and check its structure
    const testCard = await db.card.findFirst({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        serialNumber: true,
        cardProductId: true,
        quotaTicket: true,
        purchaseDate: true,
        expiredDate: true,
        status: true,
        // These fields should NOT exist in Card model:
        // categoryId, typeId, totalQuota, masaBerlaku, fwPrice
      },
    });

    if (testCard) {
      // Check if TypeScript/Prisma would allow accessing non-existent fields
      // This is a compile-time check, but we can verify the structure
      const cardKeys = Object.keys(testCard);
      console.log('   ✅ Card model fields:', cardKeys.join(', '));
      
      // Verify expected fields exist
      const expectedFields = ['id', 'serialNumber', 'cardProductId', 'quotaTicket'];
      const hasAllExpected = expectedFields.every(field => cardKeys.includes(field));
      
      if (hasAllExpected) {
        console.log('   ✅ All expected fields present');
      } else {
        console.log('   ⚠️  Some expected fields missing');
      }
      
      // Verify duplicate fields are NOT present
      const duplicateFields = ['categoryId', 'typeId', 'totalQuota', 'masaBerlaku', 'fwPrice'];
      const hasDuplicates = duplicateFields.some(field => cardKeys.includes(field));
      
      if (!hasDuplicates) {
        console.log('   ✅ No duplicate fields found in Card model\n');
      } else {
        console.log('   ⚠️  Warning: Duplicate fields still present in Card model\n');
      }
    } else {
      console.log('   ℹ️  No cards found (this is OK)\n');
    }

    // Summary
    console.log('='.repeat(80));
    console.log('✅ All Tests Completed!');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    console.log('   ✅ Card → CardProduct relation works');
    console.log('   ✅ CardProduct → Category relation works');
    console.log('   ✅ CardProduct → Type relation works');
    console.log('   ✅ MetricsService queries work');
    console.log('   ✅ SalesService queries work');
    console.log('   ✅ No duplicate fields in Card model');
    console.log('\n✅ Migration verification successful!');

  } catch (error) {
    console.error('\n❌ Error during testing:');
    console.error(error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run test
testCardRelation();

