-- AlterEnum
ALTER TYPE "CardStatus" ADD VALUE 'LOST_BY_PASSANGER';

-- DropForeignKey
ALTER TABLE "card_purchases" DROP CONSTRAINT "card_purchases_card_id_fkey";

-- DropForeignKey
ALTER TABLE "passenger_info" DROP CONSTRAINT "passenger_info_card_redeem_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_user_id_fkey";

-- AlterTable
ALTER TABLE "card_stock_movements" ADD COLUMN     "bast_file_id" UUID,
ADD COLUMN     "nota_dinas_file_id" UUID;

-- AlterTable
ALTER TABLE "passenger_info" ALTER COLUMN "passenger_info_id" DROP DEFAULT,
ALTER COLUMN "nama_passanger" SET DATA TYPE TEXT,
ALTER COLUMN "nik" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "shifts" ALTER COLUMN "shift_id" DROP DEFAULT,
ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_stock_movements" ADD CONSTRAINT "card_stock_movements_nota_dinas_file_id_fkey" FOREIGN KEY ("nota_dinas_file_id") REFERENCES "file_object"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_stock_movements" ADD CONSTRAINT "card_stock_movements_bast_file_id_fkey" FOREIGN KEY ("bast_file_id") REFERENCES "file_object"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_purchases" ADD CONSTRAINT "card_purchases_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("card_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_info" ADD CONSTRAINT "passenger_info_card_redeem_id_fkey" FOREIGN KEY ("card_redeem_id") REFERENCES "card_redeem"("redeem_id") ON DELETE RESTRICT ON UPDATE CASCADE;

