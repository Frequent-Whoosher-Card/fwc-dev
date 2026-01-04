import db from '../config/db';
import { PurchaseService } from '../modules/purchases/service';

/**
 * Test script for CardPurchase validation and edge cases
 * 
 * Tests:
 * 1. Cannot purchase card that is not IN_STATION
 * 2. Cannot purchase same card twice
 * 3. Purchase updates card status correctly
 * 4. Purchase updates inventory correctly
 */

async function testCardPurchaseValidation() {
  console.log('🧪 Starting CardPurchase Validation Tests...\n');

  try {
    // Get test data
    console.log('📋 Step 1: Getting test data...');
    
    const userWithStation = await db.user.findFirst({
      where: {
        stationId: { not: null },
        deletedAt: null,
        isActive: true,
      },
      include: {
        station: true,
      },
    });

    if (!userWithStation || !userWithStation.stationId) {
      console.log('❌ No user with station found. Please create one first.');
      return;
    }

    console.log(`   ✅ Found user: ${userWithStation.fullName}`);
    console.log(`   ✅ Station: ${userWithStation.station?.stationName}\n`);

    // Test 1: Try to purchase card that is not IN_STATION
    console.log('📋 Test 1: Cannot purchase card that is not IN_STATION...');
    
    const soldCard = await db.card.findFirst({
      where: {
        status: { in: ['SOLD_ACTIVE', 'SOLD_INACTIVE'] },
        deletedAt: null,
      },
      include: {
        cardProduct: {
          select: {
            price: true,
          },
        },
      },
    });

    if (soldCard) {
      try {
        await PurchaseService.createPurchase(
          {
            cardId: soldCard.id,
            price: Number(soldCard.cardProduct.price),
          },
          userWithStation.id,
          userWithStation.stationId,
          userWithStation.id
        );
        console.log('   ❌ Should have failed but succeeded!');
      } catch (error: any) {
        if (error.message?.includes('IN_STATION')) {
          console.log('   ✅ Correctly rejected purchase of non-IN_STATION card');
        } else {
          console.log(`   ⚠️  Error: ${error.message}`);
        }
      }
    } else {
      console.log('   ⚠️  No sold card found to test');
    }

    // Test 2: Try to purchase same card twice
    console.log('\n📋 Test 2: Cannot purchase same card twice...');
    
    const cardWithPurchase = await db.card.findFirst({
      where: {
        purchases: {
          some: {
            deletedAt: null,
          },
        },
        deletedAt: null,
      },
      include: {
        cardProduct: {
          select: {
            price: true,
          },
        },
      },
    });

    if (cardWithPurchase) {
      try {
        await PurchaseService.createPurchase(
          {
            cardId: cardWithPurchase.id,
            price: Number(cardWithPurchase.cardProduct.price),
          },
          userWithStation.id,
          userWithStation.stationId,
          userWithStation.id
        );
        console.log('   ❌ Should have failed but succeeded!');
      } catch (error: any) {
        if (error.message?.includes('sudah pernah dibeli')) {
          console.log('   ✅ Correctly rejected duplicate purchase');
        } else {
          console.log(`   ⚠️  Error: ${error.message}`);
        }
      }
    } else {
      console.log('   ⚠️  No card with existing purchase found to test');
    }

    // Test 3: Verify purchase updates card status
    console.log('\n📋 Test 3: Verify purchase updates card status...');
    
    const inStationCard = await db.card.findFirst({
      where: {
        status: 'IN_STATION',
        deletedAt: null,
      },
      include: {
        cardProduct: {
          select: {
            price: true,
            totalQuota: true,
            masaBerlaku: true,
          },
        },
      },
    });

    if (inStationCard) {
      const beforeStatus = inStationCard.status;
      const beforePurchaseDate = inStationCard.purchaseDate;
      
      console.log(`   Card before: status=${beforeStatus}, purchaseDate=${beforePurchaseDate}`);

      try {
        const purchase = await PurchaseService.createPurchase(
          {
            cardId: inStationCard.id,
            price: Number(inStationCard.cardProduct.price),
          },
          userWithStation.id,
          userWithStation.stationId!,
          userWithStation.id
        );

        const cardAfter = await db.card.findUnique({
          where: { id: inStationCard.id },
        });

        if (cardAfter) {
          console.log(`   Card after: status=${cardAfter.status}, purchaseDate=${cardAfter.purchaseDate}`);
          
          if (cardAfter.status === 'SOLD_ACTIVE' && cardAfter.purchaseDate) {
            console.log('   ✅ Card status correctly updated to SOLD_ACTIVE');
            console.log('   ✅ Card purchaseDate correctly set');
          } else {
            console.log('   ❌ Card status or purchaseDate not updated correctly');
          }
        }
      } catch (error: any) {
        console.log(`   ⚠️  Error creating purchase: ${error.message}`);
      }
    } else {
      console.log('   ⚠️  No IN_STATION card found to test');
    }

    // Test 4: Verify purchase updates inventory
    console.log('\n📋 Test 4: Verify purchase updates inventory...');
    
    const cardForInventoryTest = await db.card.findFirst({
      where: {
        status: 'IN_STATION',
        deletedAt: null,
      },
      include: {
        cardProduct: {
          select: {
            id: true,
            categoryId: true,
            typeId: true,
            price: true,
          },
        },
      },
    });

    if (cardForInventoryTest && userWithStation.stationId) {
      const inventoryBefore = await db.cardInventory.findFirst({
        where: {
          categoryId: cardForInventoryTest.cardProduct.categoryId,
          typeId: cardForInventoryTest.cardProduct.typeId,
          stationId: userWithStation.stationId,
        },
      });

      if (inventoryBefore) {
        console.log(`   Inventory before: belumTerjual=${inventoryBefore.cardBelumTerjual}, aktif=${inventoryBefore.cardAktif}`);

        try {
          await PurchaseService.createPurchase(
            {
              cardId: cardForInventoryTest.id,
              price: Number(cardForInventoryTest.cardProduct.price),
            },
            userWithStation.id,
            userWithStation.stationId,
            userWithStation.id
          );

          const inventoryAfter = await db.cardInventory.findFirst({
            where: {
              categoryId: cardForInventoryTest.cardProduct.categoryId,
              typeId: cardForInventoryTest.cardProduct.typeId,
              stationId: userWithStation.stationId,
            },
          });

          if (inventoryAfter) {
            console.log(`   Inventory after: belumTerjual=${inventoryAfter.cardBelumTerjual}, aktif=${inventoryAfter.cardAktif}`);
            
            if (
              inventoryAfter.cardBelumTerjual === inventoryBefore.cardBelumTerjual - 1 &&
              inventoryAfter.cardAktif === inventoryBefore.cardAktif + 1
            ) {
              console.log('   ✅ Inventory correctly updated');
            } else {
              console.log('   ❌ Inventory not updated correctly');
            }
          }
        } catch (error: any) {
          console.log(`   ⚠️  Error creating purchase: ${error.message}`);
        }
      } else {
        console.log('   ⚠️  No inventory found for this card/station combination');
      }
    } else {
      console.log('   ⚠️  No IN_STATION card or user station found to test');
    }

    console.log('\n✅ Validation tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testCardPurchaseValidation();

