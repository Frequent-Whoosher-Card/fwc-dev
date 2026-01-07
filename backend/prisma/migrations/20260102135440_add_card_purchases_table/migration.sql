-- CreateTable
CREATE TABLE "card_purchases" (
    "purchase_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "member_id" UUID,
    "operator_id" UUID NOT NULL,
    "station_id" UUID NOT NULL,
    "transaction_number" TEXT NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "card_purchases_pkey" PRIMARY KEY ("purchase_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_purchases_transaction_number_key" ON "card_purchases"("transaction_number");

-- CreateIndex
CREATE INDEX "card_purchases_purchase_date_idx" ON "card_purchases"("purchase_date");

-- CreateIndex
CREATE INDEX "card_purchases_station_id_purchase_date_idx" ON "card_purchases"("station_id", "purchase_date");

-- CreateIndex
CREATE INDEX "card_purchases_operator_id_purchase_date_idx" ON "card_purchases"("operator_id", "purchase_date");

-- AddForeignKey
ALTER TABLE "card_purchases" ADD CONSTRAINT "card_purchases_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("card_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_purchases" ADD CONSTRAINT "card_purchases_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_purchases" ADD CONSTRAINT "card_purchases_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_purchases" ADD CONSTRAINT "card_purchases_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

