-- AlterEnum
ALTER TYPE "CardStatus" ADD VALUE 'ON_REQUEST';

-- AlterTable
ALTER TABLE "card_redeem" RENAME CONSTRAINT "redeem_pkey" TO "card_redeem_pkey";

-- CreateIndex
CREATE INDEX "cards_card_product_id_serial_number_idx" ON "cards"("card_product_id", "serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "file_object_relative_path_key" ON "file_object"("relative_path");

-- RenameIndex
ALTER INDEX "card_purchases_transaction_number_key" RENAME TO "card_purchases_edc_reference_number_key";

-- RenameIndex
ALTER INDEX "idx_card_redeem_transaction_number" RENAME TO "idx_redeem_transaction_number";

-- RenameIndex
ALTER INDEX "redeem_transaction_number_key" RENAME TO "card_redeem_transaction_number_key";

