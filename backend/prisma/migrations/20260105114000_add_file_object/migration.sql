-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('GENERAL', 'LAST_REDEEM', 'BARCODE_IMAGE');

-- AlterEnum
ALTER TYPE "CardStatus" ADD VALUE 'ON_REQUEST';

-- DropForeignKey
ALTER TABLE "card_redeem" DROP CONSTRAINT "card_redeem_file_blob_id_fkey";

-- DropIndex
DROP INDEX "card_purchases_transaction_number_key";

-- AlterTable
ALTER TABLE "card_purchases" DROP COLUMN "edc_reference_number",
ADD COLUMN     "transaction_number" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "card_redeem" RENAME CONSTRAINT "redeem_pkey" TO "card_redeem_pkey",
DROP COLUMN "file_blob_id",
ADD COLUMN     "file_object_id" UUID;

-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "file_object_id" TEXT;

-- AlterTable
ALTER TABLE "members" DROP COLUMN "notes";

-- DropTable
DROP TABLE "file_blob";

-- CreateTable
CREATE TABLE "file_object" (
    "file_id" UUID NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT,
    "relative_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "checksum_sha256" TEXT,
    "purpose" "FilePurpose" NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "file_object_pkey" PRIMARY KEY ("file_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_object_relative_path_key" ON "file_object"("relative_path");

-- CreateIndex
CREATE UNIQUE INDEX "card_purchases_transaction_number_key" ON "card_purchases"("transaction_number");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_file_object_id_fkey" FOREIGN KEY ("file_object_id") REFERENCES "file_object"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_redeem" ADD CONSTRAINT "card_redeem_file_object_id_fkey" FOREIGN KEY ("file_object_id") REFERENCES "file_object"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_card_redeem_transaction_number" RENAME TO "idx_redeem_transaction_number";

-- RenameIndex
ALTER INDEX "redeem_transaction_number_key" RENAME TO "card_redeem_transaction_number_key";

