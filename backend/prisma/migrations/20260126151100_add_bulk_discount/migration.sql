-- AlterEnum
ALTER TYPE "FilePurpose" ADD VALUE 'GENERATION_DOCUMENT';

-- DropForeignKey
ALTER TABLE "card_products" DROP CONSTRAINT "card_products_product_detail_id_fkey";

-- AlterTable
ALTER TABLE "card_products" DROP COLUMN "product_detail_id",
ADD COLUMN     "is_discount" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "card_purchases" DROP COLUMN "activated_at",
DROP COLUMN "activated_by",
DROP COLUMN "activation_status",
DROP COLUMN "physical_card_serial_number",
DROP COLUMN "program_type",
ADD COLUMN     "bulk_discount_id" INTEGER;

-- AlterTable
ALTER TABLE "card_stock_movements" DROP COLUMN "batch_id",
DROP COLUMN "damaged_serial_numbers",
ADD COLUMN     "bast" TEXT,
ADD COLUMN     "file_object_id" UUID,
ADD COLUMN     "nota_dinas" TEXT;

-- DropTable
DROP TABLE "product_detail";

-- CreateTable
CREATE TABLE "bulk_discount" (
    "bulk_discount_id" SERIAL NOT NULL,
    "discount" DECIMAL(65,30),
    "min_quantity" INTEGER,
    "max_quantity" INTEGER,

    CONSTRAINT "bulk_discount_pkey" PRIMARY KEY ("bulk_discount_id")
);

-- AddForeignKey
ALTER TABLE "card_stock_movements" ADD CONSTRAINT "card_stock_movements_file_object_id_fkey" FOREIGN KEY ("file_object_id") REFERENCES "file_object"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_purchases" ADD CONSTRAINT "card_purchases_bulk_discount_id_fkey" FOREIGN KEY ("bulk_discount_id") REFERENCES "bulk_discount"("bulk_discount_id") ON DELETE SET NULL ON UPDATE CASCADE;

