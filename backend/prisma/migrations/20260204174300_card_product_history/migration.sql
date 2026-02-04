-- CreateTable
CREATE TABLE "card_product_history" (
    "id" UUID NOT NULL,
    "card_product_id" UUID NOT NULL,
    "previous_limit" INTEGER NOT NULL,
    "new_limit" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" UUID,
    "notes" TEXT,

    CONSTRAINT "card_product_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "card_product_history" ADD CONSTRAINT "card_product_history_card_product_id_fkey" FOREIGN KEY ("card_product_id") REFERENCES "card_products"("card_product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

