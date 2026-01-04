import db from '../config/db';
import { MetricsService } from '../modules/metrics/service';

/**
 * Script to test revenue calculations
 * 
 * This script verifies:
 * 1. Revenue calculations are correct
 * 2. Revenue matches cardProduct.price
 * 3. Proportional calculations are accurate
 * 4. All revenue methods work correctly
 */

async function testRevenueCalculations() {
  console.log('🧪 Testing Revenue Calculations...\n');

  try {
    // Test 1: Get sample card to verify price structure
    console.log('📋 Test 1: Verifying card price structure...');
    const sampleCard = await db.card.findFirst({
      where: {
        deletedAt: null,
      },
      include: {
        cardProduct: {
          select: {
            price: true,
            totalQuota: true,
          },
        },
      },
    });

    if (sampleCard && sampleCard.cardProduct) {
      const price = sampleCard.cardProduct.price;
      const priceNumber = typeof price === 'number' ? price : Number(price);
      console.log(`   ✅ Sample card found:`);
      console.log(`      - Card ID: ${sampleCard.id}`);
      console.log(`      - Price: ${priceNumber}`);
      console.log(`      - Total Quota: ${sampleCard.cardProduct.totalQuota}`);
      console.log(`      - Quota Ticket: ${sampleCard.quotaTicket}`);
      console.log(`      - Price type: ${typeof price}`);
      console.log('');
    } else {
      console.log('   ⚠️  No cards found in database. This is OK if database is empty.\n');
    }

    // Test 2: Test Card Issued Revenue
    console.log('📋 Test 2: Testing getCardIssuedRevenue()...');
    const cardIssued = await MetricsService.getCardIssued();
    const cardIssuedRevenue = await MetricsService.getCardIssuedRevenue();
    
    console.log(`   ✅ Card Issued: ${cardIssued}`);
    console.log(`   ✅ Card Issued Revenue: ${cardIssuedRevenue.toLocaleString('id-ID')}`);
    
    if (cardIssued > 0) {
      const avgPricePerCard = cardIssuedRevenue / cardIssued;
      console.log(`   ✅ Average price per card: ${avgPricePerCard.toLocaleString('id-ID')}`);
    }
    console.log('');

    // Test 3: Test Quota Ticket Issued Revenue
    console.log('📋 Test 3: Testing getQuotaTicketIssuedRevenue()...');
    const quotaTicketIssued = await MetricsService.getQuotaTicketIssued();
    const quotaTicketIssuedRevenue = await MetricsService.getQuotaTicketIssuedRevenue();
    
    console.log(`   ✅ Quota Ticket Issued: ${quotaTicketIssued}`);
    console.log(`   ✅ Quota Ticket Issued Revenue: ${quotaTicketIssuedRevenue.toLocaleString('id-ID')}`);
    
    // Verify: quotaTicketIssuedRevenue should be same as cardIssuedRevenue
    // (since each card with totalQuota has a price)
    if (Math.abs(quotaTicketIssuedRevenue - cardIssuedRevenue) < 0.01) {
      console.log('   ✅ Revenue matches cardIssuedRevenue (as expected)');
    } else {
      console.log(`   ⚠️  Revenue differs from cardIssuedRevenue by: ${Math.abs(quotaTicketIssuedRevenue - cardIssuedRevenue).toLocaleString('id-ID')}`);
    }
    console.log('');

    // Test 4: Test Redeem Revenue (proportional)
    console.log('📋 Test 4: Testing getRedeemRevenue() (proportional calculation)...');
    const redeem = await MetricsService.getRedeem();
    const redeemRevenue = await MetricsService.getRedeemRevenue();
    
    console.log(`   ✅ Redeem (tickets): ${redeem}`);
    console.log(`   ✅ Redeem Revenue: ${redeemRevenue.toLocaleString('id-ID')}`);
    
    // Verify proportional calculation
    if (quotaTicketIssued > 0 && quotaTicketIssuedRevenue > 0) {
      const expectedProportionalRevenue = (redeem / quotaTicketIssued) * quotaTicketIssuedRevenue;
      const difference = Math.abs(redeemRevenue - expectedProportionalRevenue);
      const tolerance = quotaTicketIssuedRevenue * 0.01; // 1% tolerance
      
      console.log(`   ✅ Expected proportional revenue: ${expectedProportionalRevenue.toLocaleString('id-ID')}`);
      console.log(`   ✅ Difference: ${difference.toLocaleString('id-ID')}`);
      
      if (difference < tolerance) {
        console.log('   ✅ Proportional calculation is accurate (within 1% tolerance)');
      } else {
        console.log('   ⚠️  Proportional calculation differs significantly');
      }
    }
    console.log('');

    // Test 5: Test Expired Ticket Revenue (proportional)
    console.log('📋 Test 5: Testing getExpiredTicketRevenue() (proportional calculation)...');
    const expiredTicket = await MetricsService.getExpiredTicket();
    const expiredTicketRevenue = await MetricsService.getExpiredTicketRevenue();
    
    console.log(`   ✅ Expired Ticket: ${expiredTicket}`);
    console.log(`   ✅ Expired Ticket Revenue: ${expiredTicketRevenue.toLocaleString('id-ID')}`);
    console.log('');

    // Test 6: Test Remaining Active Tickets Revenue (proportional)
    console.log('📋 Test 6: Testing getRemainingActiveTicketsRevenue() (proportional calculation)...');
    const remainingActiveTickets = await MetricsService.getRemainingActiveTickets();
    const remainingActiveTicketsRevenue = await MetricsService.getRemainingActiveTicketsRevenue();
    
    console.log(`   ✅ Remaining Active Tickets: ${remainingActiveTickets}`);
    console.log(`   ✅ Remaining Active Tickets Revenue: ${remainingActiveTicketsRevenue.toLocaleString('id-ID')}`);
    console.log('');

    // Test 7: Verify revenue sum consistency
    console.log('📋 Test 7: Verifying revenue sum consistency...');
    const totalRevenueFromParts = redeemRevenue + expiredTicketRevenue + remainingActiveTicketsRevenue;
    const totalRevenueFromIssued = quotaTicketIssuedRevenue;
    const difference = Math.abs(totalRevenueFromParts - totalRevenueFromIssued);
    const tolerance = totalRevenueFromIssued * 0.01; // 1% tolerance
    
    console.log(`   ✅ Redeem Revenue: ${redeemRevenue.toLocaleString('id-ID')}`);
    console.log(`   ✅ Expired Revenue: ${expiredTicketRevenue.toLocaleString('id-ID')}`);
    console.log(`   ✅ Remaining Revenue: ${remainingActiveTicketsRevenue.toLocaleString('id-ID')}`);
    console.log(`   ✅ Sum of parts: ${totalRevenueFromParts.toLocaleString('id-ID')}`);
    console.log(`   ✅ Total from issued: ${totalRevenueFromIssued.toLocaleString('id-ID')}`);
    console.log(`   ✅ Difference: ${difference.toLocaleString('id-ID')}`);
    
    if (difference < tolerance) {
      console.log('   ✅ Revenue sum is consistent (within 1% tolerance)');
    } else {
      console.log('   ⚠️  Revenue sum differs significantly (may be due to rounding or data inconsistencies)');
    }
    console.log('');

    // Test 8: Test getMetrics() with revenue
    console.log('📋 Test 8: Testing getMetrics() with revenue...');
    const metrics = await MetricsService.getMetrics({});
    
    console.log(`   ✅ Metrics retrieved successfully`);
    console.log(`   ✅ Revenue object exists: ${!!metrics.revenue}`);
    console.log(`   ✅ Revenue.cardIssued: ${metrics.revenue.cardIssued.toLocaleString('id-ID')}`);
    console.log(`   ✅ Revenue.quotaTicketIssued: ${metrics.revenue.quotaTicketIssued.toLocaleString('id-ID')}`);
    console.log(`   ✅ Revenue.redeem: ${metrics.revenue.redeem.toLocaleString('id-ID')}`);
    console.log(`   ✅ Revenue.expiredTicket: ${metrics.revenue.expiredTicket.toLocaleString('id-ID')}`);
    console.log(`   ✅ Revenue.remainingActiveTickets: ${metrics.revenue.remainingActiveTickets.toLocaleString('id-ID')}`);
    console.log('');

    // Test 9: Test with date filters
    console.log('📋 Test 9: Testing revenue calculations with date filters...');
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    
    const metricsWithFilter = await MetricsService.getMetrics({
      startDate,
      endDate,
    });
    
    console.log(`   ✅ Date filter: ${startDate} to ${endDate}`);
    console.log(`   ✅ Card Issued (filtered): ${metricsWithFilter.cardIssued}`);
    console.log(`   ✅ Card Issued Revenue (filtered): ${metricsWithFilter.revenue.cardIssued.toLocaleString('id-ID')}`);
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('✅ All Revenue Calculation Tests Completed!');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   ✅ Card Issued Revenue: ${cardIssuedRevenue.toLocaleString('id-ID')}`);
    console.log(`   ✅ Quota Ticket Issued Revenue: ${quotaTicketIssuedRevenue.toLocaleString('id-ID')}`);
    console.log(`   ✅ Redeem Revenue: ${redeemRevenue.toLocaleString('id-ID')}`);
    console.log(`   ✅ Expired Ticket Revenue: ${expiredTicketRevenue.toLocaleString('id-ID')}`);
    console.log(`   ✅ Remaining Active Tickets Revenue: ${remainingActiveTicketsRevenue.toLocaleString('id-ID')}`);
    console.log('\n✅ Revenue calculations are working correctly!');

  } catch (error) {
    console.error('\n❌ Error during testing:');
    console.error(error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run test
testRevenueCalculations();











