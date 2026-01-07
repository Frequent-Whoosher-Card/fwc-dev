-- Remove old columns
ALTER TABLE "card_inventory" DROP COLUMN IF EXISTS "last_updated";
ALTER TABLE "card_inventory" DROP COLUMN IF EXISTS "updated_by";

-- Add new audit columns
ALTER TABLE "card_inventory" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "card_inventory" ADD COLUMN "created_by" UUID;
ALTER TABLE "card_inventory" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "card_inventory" ADD COLUMN "updated_by" UUID;
ALTER TABLE "card_inventory" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "card_inventory" ADD COLUMN "deleted_by" UUID;


