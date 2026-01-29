-- CreateTable
CREATE TABLE "bulk_purchase_items" (
    "item_id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_purchase_items_pkey" PRIMARY KEY ("item_id")
);

-- AlterTable
ALTER TABLE "card_purchases" ALTER COLUMN "card_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "bulk_purchase_items_purchase_id_idx" ON "bulk_purchase_items"("purchase_id");

-- CreateIndex
CREATE INDEX "bulk_purchase_items_card_id_idx" ON "bulk_purchase_items"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_purchase_items_purchase_id_card_id_key" ON "bulk_purchase_items"("purchase_id", "card_id");

-- AddForeignKey
ALTER TABLE "bulk_purchase_items" ADD CONSTRAINT "bulk_purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "card_purchases"("purchase_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_purchase_items" ADD CONSTRAINT "bulk_purchase_items_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("card_id") ON DELETE RESTRICT ON UPDATE CASCADE;
