-- AlterTable
ALTER TABLE "cards" ADD COLUMN "station_id" UUID;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;
