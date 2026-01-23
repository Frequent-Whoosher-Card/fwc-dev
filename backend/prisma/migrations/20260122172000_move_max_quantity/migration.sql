-- AlterTable
ALTER TABLE "card_categories" DROP COLUMN "max_quantity";

-- AlterTable
ALTER TABLE "card_products" ADD COLUMN "max_quantity" INTEGER;

