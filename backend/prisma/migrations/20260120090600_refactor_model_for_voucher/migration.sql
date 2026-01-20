-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('FWC', 'VOUCHER');

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_user_id_fkey";

-- DropIndex
DROP INDEX "idx_redeem_transaction_number";

-- DropIndex
DROP INDEX "card_stock_movements_movement_type_status_movement_at_idx";

-- DropIndex
DROP INDEX "idx_usage_log_redeem";

-- DropIndex
DROP INDEX "cards_card_product_id_serial_number_idx";

-- DropIndex
DROP INDEX "idx_reconciliation_batches_created";

-- DropIndex
DROP INDEX "idx_reconciliation_batches_status";

-- DropIndex
DROP INDEX "idx_temp_fwc_batch";

-- DropIndex
DROP INDEX "idx_temp_fwc_matched";

-- DropIndex
DROP INDEX "idx_temp_fwc_nik_date";

-- DropIndex
DROP INDEX "idx_temp_fwc_serial";

-- AlterTable
ALTER TABLE "activity_logs" ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT,
ALTER COLUMN "deleted_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "card_categories" ADD COLUMN     "max_quantity" INTEGER,
ADD COLUMN     "program_type" "ProgramType",
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "card_inventory" ALTER COLUMN "card_beredar" DROP DEFAULT,
ALTER COLUMN "card_terjual_aktif" DROP DEFAULT,
ALTER COLUMN "card_terjual_nonaktif" DROP DEFAULT,
ALTER COLUMN "card_belum_terjual" DROP DEFAULT,
ALTER COLUMN "card_office" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "card_products" ADD COLUMN     "product_detail_id" INTEGER,
ADD COLUMN     "program_type" "ProgramType",
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "is_active" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "card_purchases" ADD COLUMN     "program_type" "ProgramType",
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT,
ALTER COLUMN "deleted_by" SET DATA TYPE TEXT,
ALTER COLUMN "activated_by" SET DATA TYPE TEXT,
ALTER COLUMN "activation_status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "card_redeem" ADD COLUMN     "programType" "ProgramType";

-- AlterTable
ALTER TABLE "card_stock_movements" ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "lost_serial_numbers" DROP DEFAULT,
ALTER COLUMN "received_serial_numbers" DROP DEFAULT,
ALTER COLUMN "sent_serial_numbers" DROP DEFAULT,
ALTER COLUMN "validatedBy" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT,
ALTER COLUMN "deleted_by" SET DATA TYPE TEXT,
ALTER COLUMN "damaged_serial_numbers" DROP DEFAULT;

-- AlterTable
ALTER TABLE "card_swap_history" ALTER COLUMN "executed_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "card_swap_requests" ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "requested_at" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "card_types" ADD COLUMN     "class_price" DECIMAL(65,30),
ADD COLUMN     "program_type" "ProgramType",
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "card_usage_logs" ALTER COLUMN "quota_used" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT,
ALTER COLUMN "deleted_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "assigned_serial_number",
ADD COLUMN     "assignedSerialNumber" TEXT,
ADD COLUMN     "program_type" "ProgramType",
ALTER COLUMN "quota_ticket" DROP DEFAULT,
ALTER COLUMN "status_card" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "file_object" ALTER COLUMN "purpose" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "company_name" TEXT,
ALTER COLUMN "nationality" DROP NOT NULL,
ALTER COLUMN "nationality" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "used" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT,
ALTER COLUMN "deleted_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "is_active" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stations" ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "is_active" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "product_detail" (
    "product_detail_id" SERIAL NOT NULL,
    "discount" DECIMAL(65,30),
    "itemQuantity" INTEGER,

    CONSTRAINT "product_detail_pkey" PRIMARY KEY ("product_detail_id")
);

-- CreateTable
CREATE TABLE "menu_access" (
    "menu_access_id" UUID NOT NULL,
    "code_submenu" TEXT NOT NULL,
    "code_menu" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "menu_access_pkey" PRIMARY KEY ("menu_access_id")
);

-- CreateTable
CREATE TABLE "permission" (
    "permission_id" UUID NOT NULL,
    "menu_access_id" UUID NOT NULL,
    "code_module" TEXT NOT NULL,
    "role" TEXT[],

    CONSTRAINT "permission_pkey" PRIMARY KEY ("permission_id")
);

-- AddForeignKey
ALTER TABLE "card_products" ADD CONSTRAINT "card_products_product_detail_id_fkey" FOREIGN KEY ("product_detail_id") REFERENCES "product_detail"("product_detail_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "permission_menu_access_id_fkey" FOREIGN KEY ("menu_access_id") REFERENCES "menu_access"("menu_access_id") ON DELETE RESTRICT ON UPDATE CASCADE;

