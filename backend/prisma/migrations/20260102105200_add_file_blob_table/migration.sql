-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "user_id" UUID;

-- AlterTable
ALTER TABLE "redeem" ADD COLUMN     "file_blob_id" UUID;

-- CreateTable
CREATE TABLE "file_blob" (
    "file_id" UUID NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum_sha256" TEXT,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "file_blob_pkey" PRIMARY KEY ("file_id")
);

-- CreateIndex
CREATE INDEX "idx_redeem_transaction_number" ON "redeem"("transaction_number");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redeem" ADD CONSTRAINT "redeem_file_blob_id_fkey" FOREIGN KEY ("file_blob_id") REFERENCES "file_blob"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;

