-- CreateTable
CREATE TABLE "low_stock_alerts" (
    "low_stock_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "type_id" UUID NOT NULL,
    "station_id" UUID,
    "current_stock" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL,
    "last_alert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "low_stock_alerts_pkey" PRIMARY KEY ("low_stock_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "low_stock_alerts_category_id_type_id_station_id_key" ON "low_stock_alerts"("category_id", "type_id", "station_id");

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "card_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "card_types"("type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

