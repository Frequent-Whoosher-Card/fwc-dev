-- AlterTable
ALTER TABLE "card_stock_movements" ADD COLUMN     "receiver" UUID,
ADD COLUMN     "sender" UUID,
ADD COLUMN     "vcr_settle" TEXT,
ADD COLUMN     "vendor_name" TEXT;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "program_type" "ProgramType";

-- AlterTable
ALTER TABLE "payment_method" ALTER COLUMN "updated_at" DROP DEFAULT;

