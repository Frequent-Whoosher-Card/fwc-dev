-- AlterEnum
ALTER TYPE "CardStatus" ADD VALUE 'ON_TRANSFER';

-- DropIndex
DROP INDEX "card_categories_category_code_key";

-- DropIndex
DROP INDEX "card_types_type_code_key";

-- AlterTable
ALTER TABLE "card_stock_movements" ALTER COLUMN "lost_serial_numbers" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "received_serial_numbers" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "sent_serial_numbers" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "damaged_serial_numbers" SET DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "card_categories_category_code_program_type_key" ON "card_categories"("category_code", "program_type");

-- CreateIndex
CREATE UNIQUE INDEX "card_types_type_code_program_type_key" ON "card_types"("type_code", "program_type");

