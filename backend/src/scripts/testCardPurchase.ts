import db from '../config/db';

/**
 * Test script for CardPurchase functionality
 * 
 * Tests:
 * 1. Create purchase transaction
 * 2. Get purchases list
 * 3. Get purchase detail
 * 4. Test Sales API integration
 * 5. Test Metrics API integration
 * 6. Test filter by stationId
 */

async function testCardPurchase() {
  console.log('🧪 Starting CardPurchase Tests...\n');

  try {
    // 1. Get test data (card with status IN_STATION, user with station, member)
    console.log('📋 Step 1: Getting test data...');
    
    const availableCard = await db.card.findFirst({
      where: {
        status: 'IN_STATION',
        deletedAt: null,
      },
      include: {
        cardProduct: {
          select: {
            id: true,
            price: true,
            totalQuota: true,
            masaBerlaku: true,
          },
        },
      },
    });

    if (!availableCard) {
      console.log('❌ No card with status IN_STATION found. Please create one first.');
      return;
    }

    console.log(`   ✅ Found card: ${availableCard.serialNumber}`);

    const userWithStation = await db.user.findFirst({
      where: {
        stationId: { not: null },
        deletedAt: null,
        isActive: true,
      },
      include: {
        station: {
          select: {
            id: true,
            stationCode: true,
            stationName: true,
          },
        },
      },
    });

    if (!userWithStation || !userWithStation.stationId) {
      console.log('❌ No user with station found. Please create one first.');
      return;
    }

    console.log(`   ✅ Found user: ${userWithStation.fullName} (${userWithStation.username})`);
    console.log(`   ✅ Station: ${userWithStation.station?.stationName}`);

    const member = await db.member.findFirst({
      where: {
        deletedAt: null,
      },
    });

    if (!member) {
      console.log('⚠️  No member found. Will create purchase without member.');
    } else {
      console.log(`   ✅ Found member: ${member.name}`);
    }

    // 2. Test Create Purchase
    console.log('\n📋 Step 2: Testing Create Purchase...');
    
    const price = Number(availableCard.cardProduct.price);
    console.log(`   Creating purchase for card ${availableCard.serialNumber} with price ${price}...`);

    const purchase = await db.$transaction(async (tx) => {
      // Generate transaction number
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
      const transactionNumber = `PUR-${dateStr}-${Date.now().toString().slice(-6)}`;

      // Create purchase
      const purchase = await tx.cardPurchase.create({
        data: {
          cardId: availableCard.id,
          memberId: member?.id || null,
          operatorId: userWithStation.id,
          stationId: userWithStation.stationId!,
          transactionNumber: transactionNumber,
          purchaseDate: new Date(),
          price: price,
          notes: 'Test purchase from script',
          createdBy: userWithStation.id,
          updatedBy: userWithStation.id,
        },
      });

      // Update card
      const masaBerlaku = availableCard.cardProduct.masaBerlaku;
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() + masaBerlaku);

      await tx.card.update({
        where: { id: availableCard.id },
        data: {
          status: 'SOLD_ACTIVE',
          purchaseDate: new Date(),
          memberId: member?.id || null,
          expiredDate: expiredDate,
          quotaTicket: availableCard.cardProduct.totalQuota,
          updatedBy: userWithStation.id,
        },
      });

      // Update inventory
      const inventory = await tx.cardInventory.findFirst({
        where: {
          categoryId: availableCard.cardProductId,
          typeId: availableCard.cardProductId,
          stationId: userWithStation.stationId!,
        },
      });

      if (inventory) {
        await tx.cardInventory.update({
          where: { id: inventory.id },
          data: {
            cardBelumTerjual: { decrement: 1 },
            cardAktif: { increment: 1 },
            updatedBy: userWithStation.id,
          },
        });
      }

      return purchase;
    });

    console.log(`   ✅ Purchase created: ${purchase.transactionNumber}`);
    console.log(`   ✅ Purchase ID: ${purchase.id}`);

    // 3. Test Get Purchase Detail
    console.log('\n📋 Step 3: Testing Get Purchase Detail...');
    
    const purchaseDetail = await db.cardPurchase.findUnique({
      where: { id: purchase.id },
      include: {
        card: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            identityNumber: true,
          },
        },
        operator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        station: {
          select: {
            id: true,
            stationCode: true,
            stationName: true,
          },
        },
      },
    });

    if (purchaseDetail) {
      console.log(`   ✅ Purchase detail retrieved`);
      console.log(`      - Transaction: ${purchaseDetail.transactionNumber}`);
      console.log(`      - Card: ${purchaseDetail.card.serialNumber}`);
      console.log(`      - Operator: ${purchaseDetail.operator.fullName}`);
      console.log(`      - Station: ${purchaseDetail.station.stationName}`);
      console.log(`      - Price: ${purchaseDetail.price}`);
    } else {
      console.log('   ❌ Failed to retrieve purchase detail');
    }

    // 4. Test Get Purchases List
    console.log('\n📋 Step 4: Testing Get Purchases List...');
    
    const purchases = await db.cardPurchase.findMany({
      where: {
        deletedAt: null,
      },
      take: 5,
      orderBy: {
        purchaseDate: 'desc',
      },
      include: {
        card: {
          select: {
            serialNumber: true,
          },
        },
        station: {
          select: {
            stationName: true,
          },
        },
      },
    });

    console.log(`   ✅ Found ${purchases.length} purchases`);
    purchases.forEach((p, idx) => {
      console.log(`      ${idx + 1}. ${p.transactionNumber} - ${p.card.serialNumber} - ${p.station.stationName}`);
    });

    // 5. Test Sales API Integration (using SalesService)
    console.log('\n📋 Step 5: Testing Sales API Integration...');
    
    const { SalesService } = await import('../modules/sales/service');
    
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    console.log(`   Testing getDailySales from ${startDate} to ${endDate}...`);
    const dailySales = await SalesService.getDailySales({
      startDate,
      endDate,
    });

    console.log(`   ✅ Daily sales retrieved: ${dailySales.length} records`);

    // Test with stationId filter
    if (userWithStation.stationId) {
      console.log(`   Testing getDailySales with stationId filter...`);
      const dailySalesFiltered = await SalesService.getDailySales({
        startDate,
        endDate,
        stationId: userWithStation.stationId,
      });
      console.log(`   ✅ Filtered daily sales: ${dailySalesFiltered.length} records`);
    }

    // 6. Test Metrics API Integration
    console.log('\n📋 Step 6: Testing Metrics API Integration...');
    
    const { MetricsService } = await import('../modules/metrics/service');
    
    console.log(`   Testing getCardIssued...`);
    const cardIssued = await MetricsService.getCardIssued(startDate, endDate);
    console.log(`   ✅ Card issued: ${cardIssued}`);

    console.log(`   Testing getCardIssuedRevenue...`);
    const revenue = await MetricsService.getCardIssuedRevenue(startDate, endDate);
    console.log(`   ✅ Revenue: ${revenue.toLocaleString('id-ID')}`);

    console.log(`   Testing getQuotaTicketIssued...`);
    const quotaIssued = await MetricsService.getQuotaTicketIssued(startDate, endDate);
    console.log(`   ✅ Quota ticket issued: ${quotaIssued}`);

    // 7. Test Filter by StationId
    console.log('\n📋 Step 7: Testing Filter by StationId...');
    
    if (userWithStation.stationId) {
      const purchasesByStation = await db.cardPurchase.findMany({
        where: {
          stationId: userWithStation.stationId,
          deletedAt: null,
        },
        include: {
          station: {
            select: {
              stationName: true,
            },
          },
        },
      });

      console.log(`   ✅ Found ${purchasesByStation.length} purchases for station ${userWithStation.station?.stationName}`);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Purchase created: ${purchase.transactionNumber}`);
    console.log(`   - Card updated: ${availableCard.serialNumber} -> SOLD_ACTIVE`);
    console.log(`   - Daily sales records: ${dailySales.length}`);
    console.log(`   - Card issued: ${cardIssued}`);
    console.log(`   - Revenue: ${revenue.toLocaleString('id-ID')}`);

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
testCardPurchase();

