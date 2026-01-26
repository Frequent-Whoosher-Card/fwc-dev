-- AlterTable
ALTER TABLE "card_stock_movements" ADD COLUMN     "batch_id" TEXT,
ADD COLUMN     "damaged_serial_numbers" TEXT[] DEFAULT ARRAY[]::TEXT[];

