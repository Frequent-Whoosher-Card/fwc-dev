# Migration Test Guide - Remove Duplicate Fields from Cards

## Overview
This guide explains how to test the migration that removes duplicate fields (`category_id`, `type_id`, `total_quota`, `masa_berlaku`, `fw_price`) from the `cards` table.

## Migration Details
- **Migration File**: `prisma/migrations/20251227163011_remove_duplicate_fields_from_cards/migration.sql`
- **Changes**: 
  - Drops foreign key constraints for `category_id` and `type_id`
  - Drops duplicate columns: `category_id`, `type_id`, `total_quota`, `masa_berlaku`, `fw_price`
  - These fields are now accessed via `card_product` relation

## Pre-Migration Checklist

1. **Backup Database** (IMPORTANT!)
   ```bash
   # Create a backup before running migration
   pg_dump -h localhost -U your_user -d your_database > backup_before_migration.sql
   ```

2. **Verify Schema Changes**
   - ✅ Card model no longer has: `categoryId`, `typeId`, `totalQuota`, `masaBerlaku`, `fwPrice`
   - ✅ Card model still has: `cardProductId` (FK to CardProduct)
   - ✅ CardProduct model has all the removed fields

3. **Verify Code Changes**
   - ✅ MetricsService uses `card.cardProduct.totalQuota`
   - ✅ SalesService uses `card.cardProduct.category` and `card.cardProduct.type`
   - ✅ importExcel script only sets `cardProductId` (not duplicate fields)

## Running the Migration

### Option 1: Using Prisma Migrate (Recommended)
```bash
cd backend
npx prisma migrate deploy
```

### Option 2: Manual SQL Execution
```bash
# Connect to your database and run:
psql -h localhost -U your_user -d your_database -f prisma/migrations/20251227163011_remove_duplicate_fields_from_cards/migration.sql
```

## Testing the Migration

### 1. Run Test Script
```bash
cd backend
bun run src/scripts/testCardRelation.ts
```

This script will verify:
- ✅ Card → CardProduct relation works
- ✅ CardProduct → Category relation works
- ✅ CardProduct → Type relation works
- ✅ MetricsService-style queries work
- ✅ SalesService-style queries work
- ✅ No duplicate fields in Card model

### 2. Manual Verification

#### Test 1: Verify Relation Works
```typescript
const card = await db.card.findFirst({
  include: {
    cardProduct: {
      include: {
        category: true,
        type: true,
      },
    },
  },
});

console.log(card.cardProduct.totalQuota); // Should work
console.log(card.cardProduct.category.categoryCode); // Should work
console.log(card.cardProduct.type.typeCode); // Should work
```

#### Test 2: Verify No Duplicate Fields
```typescript
// This should NOT work (TypeScript error):
// const categoryId = card.categoryId; // ❌ Field doesn't exist

// This SHOULD work:
const categoryId = card.cardProduct.categoryId; // ✅ Via relation
```

#### Test 3: Test Metrics Endpoint
```bash
curl -X GET http://localhost:3001/metrics \
  -H "Cookie: session=your_session_cookie"
```

Expected response:
```json
{
  "success": true,
  "message": "Metrics retrieved successfully",
  "data": {
    "cardIssued": 175,
    "quotaTicketIssued": 1258,
    "redeem": 644,
    "expiredTicket": 614,
    "remainingActiveTickets": 0
  }
}
```

#### Test 4: Test Sales Endpoint
```bash
curl -X GET "http://localhost:3001/sales/daily-grouped?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Cookie: session=your_session_cookie"
```

Expected: Should return sales data grouped by category and type (via cardProduct relation).

## Post-Migration Verification

1. **Check Data Integrity**
   - All cards should have valid `card_product_id`
   - No orphaned cards (cards without cardProduct)
   - All metrics should calculate correctly

2. **Check Application**
   - ✅ Metrics endpoint works
   - ✅ Sales endpoint works
   - ✅ Card creation works (via importExcel)
   - ✅ No TypeScript errors

3. **Check Database**
   ```sql
   -- Verify columns are dropped
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'cards' 
   AND column_name IN ('category_id', 'type_id', 'total_quota', 'masa_berlaku', 'fw_price');
   -- Should return 0 rows

   -- Verify card_product_id exists
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'cards' 
   AND column_name = 'card_product_id';
   -- Should return 1 row
   ```

## Rollback Plan (If Needed)

If you need to rollback:

1. **Restore from Backup**
   ```bash
   psql -h localhost -U your_user -d your_database < backup_before_migration.sql
   ```

2. **Or Revert Migration Manually**
   ```sql
   -- Add columns back (with appropriate data types)
   ALTER TABLE "cards" ADD COLUMN "category_id" UUID;
   ALTER TABLE "cards" ADD COLUMN "type_id" UUID;
   ALTER TABLE "cards" ADD COLUMN "total_quota" INTEGER;
   ALTER TABLE "cards" ADD COLUMN "masa_berlaku" INTEGER;
   ALTER TABLE "cards" ADD COLUMN "fw_price" DECIMAL(15,2);

   -- Populate from card_product relation
   UPDATE "cards" c
   SET 
     category_id = cp.category_id,
     type_id = cp.type_id,
     total_quota = cp.total_quota,
     masa_berlaku = cp.masa_berlaku,
     fw_price = cp.price
   FROM "card_products" cp
   WHERE c.card_product_id = cp.card_product_id;

   -- Add foreign key constraints
   ALTER TABLE "cards" ADD CONSTRAINT "cards_category_id_fkey" 
     FOREIGN KEY ("category_id") REFERENCES "card_categories"("category_id");
   ALTER TABLE "cards" ADD CONSTRAINT "cards_type_id_fkey" 
     FOREIGN KEY ("type_id") REFERENCES "card_types"("type_id");
   ```

## Troubleshooting

### Issue: Migration fails with "column does not exist"
**Solution**: The columns may have already been dropped. Check if migration was already applied:
```sql
SELECT * FROM _prisma_migrations WHERE migration_name LIKE '%remove_duplicate_fields%';
```

### Issue: Relation not working after migration
**Solution**: 
1. Regenerate Prisma Client: `npx prisma generate`
2. Restart the application
3. Verify `card_product_id` is not null for all cards

### Issue: Metrics return 0 or incorrect values
**Solution**: 
1. Check if `cardProduct` relation is included in queries
2. Verify `card_product_id` is set for all cards
3. Check MetricsService queries use `card.cardProduct.totalQuota`

## Success Criteria

✅ Migration runs without errors  
✅ All cards have valid `card_product_id`  
✅ Metrics endpoint returns correct values  
✅ Sales endpoint returns correct data  
✅ No TypeScript/Prisma errors  
✅ Test script passes all checks  

