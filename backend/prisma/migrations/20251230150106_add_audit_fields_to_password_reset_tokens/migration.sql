-- Add new audit columns
ALTER TABLE "password_reset_tokens" ADD COLUMN "created_by" UUID;
ALTER TABLE "password_reset_tokens" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "password_reset_tokens" ADD COLUMN "updated_by" UUID;
ALTER TABLE "password_reset_tokens" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "password_reset_tokens" ADD COLUMN "deleted_by" UUID;

