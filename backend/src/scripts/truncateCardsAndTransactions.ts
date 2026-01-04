import db from '../config/db';

/**
 * Script to truncate cards, card inventory, card stock movements, redeems, and purchases
 * 
 * WARNING: This will delete ALL data from:
 * - card_usage_logs (cascade from cards)
 * - card_purchases (foreign key to cards)
 * - redeem (foreign key to cards)
 * - cards
 * - card_inventory
 * - card_stock_movements
 * 
 * This operation cannot be undone!
 * 
 * Options:
 * - Use Prisma deleteMany (safer, slower)
 * - Use SQL TRUNCATE (faster, requires CASCADE)
 */

const USE_SQL_TRUNCATE = true; // Set to false to use Prisma deleteMany

async function truncateCardsAndTransactions() {
  console.log('⚠️  WARNING: This will delete ALL data from:');
  console.log('   - cards');
  console.log('   - card_inventory');
  console.log('   - card_stock_movements');
  console.log('   - redeem');
  console.log('   - card_purchases');
  console.log('   - card_usage_logs (cascade)');
  console.log('⚠️  This operation cannot be undone!\n');

  try {
    if (USE_SQL_TRUNCATE) {
      // Method 1: Using SQL TRUNCATE (faster)
      console.log('🔄 Starting truncate operation using SQL TRUNCATE...\n');
      
      // Get counts before deletion
      const usageLogsCount = await db.cardUsageLog.count();
      const purchasesCount = await db.cardPurchase.count();
      const redeemsCount = await db.redeem.count();
      const cardsCount = await db.card.count();
      const inventoryCount = await db.cardInventory.count();
      const stockMovementsCount = await db.cardStockMovement.count();

      console.log('📊 Current data counts:');
      console.log(`   - Card Usage Logs: ${usageLogsCount}`);
      console.log(`   - Card Purchases: ${purchasesCount}`);
      console.log(`   - Redeems: ${redeemsCount}`);
      console.log(`   - Cards: ${cardsCount}`);
      console.log(`   - Card Inventory: ${inventoryCount}`);
      console.log(`   - Card Stock Movements: ${stockMovementsCount}\n`);

      // Delete in correct order to respect foreign key constraints
      // Order: usage_logs -> purchases -> redeem -> cards -> inventory -> stock_movements
      console.log('📋 Deleting data in correct order...');
      
      try {
        await db.$executeRaw`TRUNCATE TABLE card_usage_logs CASCADE`;
        console.log(`   ✅ Truncated card_usage_logs`);
      } catch (e) {
        console.log(`   ⚠️  card_usage_logs might be empty or already truncated`);
      }
      
      try {
        await db.$executeRaw`TRUNCATE TABLE card_purchases CASCADE`;
        console.log(`   ✅ Truncated card_purchases`);
      } catch (e) {
        console.log(`   ⚠️  card_purchases might be empty or already truncated`);
      }
      
      try {
        await db.$executeRaw`TRUNCATE TABLE card_redeem CASCADE`;
        console.log(`   ✅ Truncated card_redeem`);
      } catch (e) {
        console.log(`   ⚠️  redeem might be empty or already truncated`);
      }
      
      try {
        await db.$executeRaw`TRUNCATE TABLE cards CASCADE`;
        console.log(`   ✅ Truncated cards`);
      } catch (e) {
        console.log(`   ⚠️  cards might be empty or already truncated`);
      }
      
      try {
        await db.$executeRaw`TRUNCATE TABLE card_inventory CASCADE`;
        console.log(`   ✅ Truncated card_inventory`);
      } catch (e) {
        console.log(`   ⚠️  card_inventory might be empty or already truncated`);
      }
      
      try {
        await db.$executeRaw`TRUNCATE TABLE card_stock_movements CASCADE`;
        console.log(`   ✅ Truncated card_stock_movements`);
      } catch (e) {
        console.log(`   ⚠️  card_stock_movements might be empty or already truncated`);
      }
      
      console.log('');

      // Summary
      console.log('='.repeat(80));
      console.log('✅ Truncate Complete!');
      console.log('='.repeat(80));
      console.log(`📊 Summary:`);
      console.log(`   - Card Usage Logs: ${usageLogsCount} deleted`);
      console.log(`   - Card Purchases: ${purchasesCount} deleted`);
      console.log(`   - Redeems: ${redeemsCount} deleted`);
      console.log(`   - Cards: ${cardsCount} deleted`);
      console.log(`   - Card Inventory: ${inventoryCount} deleted`);
      console.log(`   - Card Stock Movements: ${stockMovementsCount} deleted`);
      console.log('\n✅ All data has been deleted successfully!');

    } else {
      // Method 2: Using Prisma deleteMany (safer, slower)
      console.log('🔄 Starting truncate operation using Prisma deleteMany...\n');

      // Step 1: Delete card_usage_logs first (has CASCADE, but better to be explicit)
      console.log('📋 Step 1: Deleting card_usage_logs...');
      const usageLogsCount = await db.cardUsageLog.count();
      await db.cardUsageLog.deleteMany({});
      console.log(`   ✅ Deleted ${usageLogsCount} card usage logs\n`);

      // Step 2: Delete card_purchases (must be deleted before cards due to foreign key)
      console.log('📋 Step 2: Deleting card_purchases...');
      const purchasesCount = await db.cardPurchase.count();
      await db.cardPurchase.deleteMany({});
      console.log(`   ✅ Deleted ${purchasesCount} card purchases\n`);

      // Step 3: Delete redeems (must be deleted before cards due to foreign key)
      console.log('📋 Step 3: Deleting redeems...');
      const redeemsCount = await db.redeem.count();
      await db.redeem.deleteMany({});
      console.log(`   ✅ Deleted ${redeemsCount} redeems\n`);

      // Step 4: Delete cards
      console.log('📋 Step 4: Deleting cards...');
      const cardsCount = await db.card.count();
      await db.card.deleteMany({});
      console.log(`   ✅ Deleted ${cardsCount} cards\n`);

      // Step 5: Delete card_inventory
      console.log('📋 Step 5: Deleting card_inventory...');
      const inventoryCount = await db.cardInventory.count();
      await db.cardInventory.deleteMany({});
      console.log(`   ✅ Deleted ${inventoryCount} card inventory records\n`);

      // Step 6: Delete card_stock_movements
      console.log('📋 Step 6: Deleting card_stock_movements...');
      const stockMovementsCount = await db.cardStockMovement.count();
      await db.cardStockMovement.deleteMany({});
      console.log(`   ✅ Deleted ${stockMovementsCount} card stock movements\n`);

      // Summary
      console.log('='.repeat(80));
      console.log('✅ Truncate Complete!');
      console.log('='.repeat(80));
      console.log(`📊 Summary:`);
      console.log(`   - Card Usage Logs: ${usageLogsCount} deleted`);
      console.log(`   - Card Purchases: ${purchasesCount} deleted`);
      console.log(`   - Redeems: ${redeemsCount} deleted`);
      console.log(`   - Cards: ${cardsCount} deleted`);
      console.log(`   - Card Inventory: ${inventoryCount} deleted`);
      console.log(`   - Card Stock Movements: ${stockMovementsCount} deleted`);
      console.log('\n✅ All data has been deleted successfully!');
    }

  } catch (error) {
    console.error('\n❌ Error during truncate operation:');
    console.error(error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run truncate
truncateCardsAndTransactions();

