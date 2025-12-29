-- AlterTable
ALTER TABLE "card_inventory" ADD COLUMN     "card_office" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "station_id" UUID;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;
