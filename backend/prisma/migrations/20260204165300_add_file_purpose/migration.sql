-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FilePurpose" ADD VALUE 'STOCK_OUT_NOTA';
ALTER TYPE "FilePurpose" ADD VALUE 'STOCK_OUT_BAST';

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "bulk_discount" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "card_categories" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "card_products" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "card_types" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "card_usage_logs" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "city" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "employee_types" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "inbox" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "low_stock_alerts" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updated_by" UUID;

-- AlterTable
ALTER TABLE "passenger_info" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "payment_method" ALTER COLUMN "payment_method_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_types" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "stations" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notes" TEXT;

