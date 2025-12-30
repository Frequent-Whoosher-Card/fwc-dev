-- Add new audit columns
ALTER TABLE "card_stock_movements" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "card_stock_movements" ADD COLUMN "updated_by" UUID;
ALTER TABLE "card_stock_movements" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "card_stock_movements" ADD COLUMN "deleted_by" UUID;

