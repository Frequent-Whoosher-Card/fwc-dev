-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "StockMovementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "card_stock_movements" (
    "movement_id" UUID NOT NULL,
    "movement_at" TIMESTAMP(3) NOT NULL,
    "movement_type" "StockMovementType" NOT NULL,
    "status" "StockMovementStatus" NOT NULL DEFAULT 'APPROVED',
    "category_id" UUID NOT NULL,
    "type_id" UUID NOT NULL,
    "station_id" UUID,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "card_stock_movements_pkey" PRIMARY KEY ("movement_id")
);

-- CreateIndex
CREATE INDEX "card_stock_movements_movement_type_status_movement_at_idx" ON "card_stock_movements"("movement_type", "status", "movement_at");

-- AddForeignKey
ALTER TABLE "card_stock_movements" ADD CONSTRAINT "card_stock_movements_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "card_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_stock_movements" ADD CONSTRAINT "card_stock_movements_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "card_types"("type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_stock_movements" ADD CONSTRAINT "card_stock_movements_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;
