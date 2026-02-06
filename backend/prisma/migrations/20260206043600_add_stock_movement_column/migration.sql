-- AlterEnum
ALTER TYPE "FilePurpose" ADD VALUE 'STOCK_IN_VOUCHER_SETTLE';

-- AlterTable
ALTER TABLE "card_stock_movements" ADD COLUMN     "costs" TEXT,
ADD COLUMN     "vcr_settle_file_id" UUID;

-- AddForeignKey
ALTER TABLE "card_stock_movements" ADD CONSTRAINT "card_stock_movements_vcr_settle_file_id_fkey" FOREIGN KEY ("vcr_settle_file_id") REFERENCES "file_object"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;

