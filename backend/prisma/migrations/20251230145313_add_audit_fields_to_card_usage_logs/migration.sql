-- Update created_by column type to UUID if it's not already
ALTER TABLE "card_usage_logs" ALTER COLUMN "created_by" TYPE UUID USING "created_by"::UUID;

-- Add new audit columns
ALTER TABLE "card_usage_logs" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "card_usage_logs" ADD COLUMN "updated_by" UUID;
ALTER TABLE "card_usage_logs" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "card_usage_logs" ADD COLUMN "deleted_by" UUID;


