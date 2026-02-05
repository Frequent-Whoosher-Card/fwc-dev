-- AlterTable
ALTER TABLE "members" ADD COLUMN     "product_type_id" UUID;

-- AlterTable
ALTER TABLE "product_types" ADD COLUMN     "prefix" TEXT;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "shift_name" TEXT,
ADD COLUMN     "station_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("product_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

