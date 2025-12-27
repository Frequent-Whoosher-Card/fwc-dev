-- DropForeignKey
-- Drop foreign key constraints for category_id and type_id before dropping columns
ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "cards_category_id_fkey";
ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "cards_type_id_fkey";

-- AlterTable
-- Drop duplicate columns from cards table
-- These fields are now accessed via card_product relation
ALTER TABLE "cards" DROP COLUMN "category_id";
ALTER TABLE "cards" DROP COLUMN "type_id";
ALTER TABLE "cards" DROP COLUMN "total_quota";
ALTER TABLE "cards" DROP COLUMN "masa_berlaku";
ALTER TABLE "cards" DROP COLUMN "fw_price";

