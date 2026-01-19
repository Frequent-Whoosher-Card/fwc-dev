-- CreateEnum
CREATE TYPE "SwapRequestStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "CardStatus_new" AS ENUM ('ON_REQUEST', 'IN_OFFICE', 'IN_TRANSIT', 'IN_STATION', 'LOST', 'DAMAGED', 'BLOCKED', 'DELETED', 'SOLD_ACTIVE', 'SOLD_INACTIVE');
ALTER TABLE "public"."cards" ALTER COLUMN "status_card" DROP DEFAULT;
ALTER TABLE "cards" ALTER COLUMN "status_card" TYPE "CardStatus_new" USING ("status_card"::text::"CardStatus_new");
ALTER TYPE "CardStatus" RENAME TO "CardStatus_old";
ALTER TYPE "CardStatus_new" RENAME TO "CardStatus";
DROP TYPE "public"."CardStatus_old";
ALTER TABLE "cards" ALTER COLUMN "status_card" SET DEFAULT 'IN_OFFICE';
COMMIT;

-- AlterEnum
ALTER TYPE "StockMovementType" ADD VALUE 'TRANSFER';

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "fk_activity_logs_user";

-- DropForeignKey
ALTER TABLE "card_usage_logs" DROP CONSTRAINT "card_usage_logs_redeem_id_fkey";

-- DropIndex
DROP INDEX "idx_usage_log_redeem";

-- AlterTable
ALTER TABLE "activity_logs" ALTER COLUMN "log_id" DROP DEFAULT,
ALTER COLUMN "action" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "card_redeem" ADD COLUMN     "prev_quota" INTEGER,
ADD COLUMN     "quota_used" INTEGER,
ADD COLUMN     "remain_quota" INTEGER;

-- AlterTable
ALTER TABLE "card_stock_movements" ADD COLUMN     "to_station_id" UUID;

-- AlterTable
ALTER TABLE "card_usage_logs" DROP COLUMN "redeem_id";

-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "previous_station_id" UUID;

-- CreateTable
CREATE TABLE "card_swap_requests" (
    "swap_request_id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "original_card_id" UUID NOT NULL,
    "replacement_card_id" UUID,
    "source_station_id" UUID NOT NULL,
    "target_station_id" UUID NOT NULL,
    "expected_product_id" UUID NOT NULL,
    "status" "SwapRequestStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "rejection_reason" TEXT,
    "requested_by" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "executed_by" UUID,
    "executed_at" TIMESTAMP(3),
    "rejected_by" UUID,
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userId" UUID,
    "stationId" UUID,
    "cardProductId" UUID,
    "cardId" UUID,

    CONSTRAINT "card_swap_requests_pkey" PRIMARY KEY ("swap_request_id")
);

-- CreateTable
CREATE TABLE "card_swap_history" (
    "history_id" UUID NOT NULL,
    "swap_request_id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "before_card_id" UUID NOT NULL,
    "before_station_id" UUID NOT NULL,
    "before_card_status" TEXT NOT NULL,
    "after_card_id" UUID NOT NULL,
    "after_station_id" UUID NOT NULL,
    "after_card_status" TEXT NOT NULL,
    "inventory_changes" JSONB NOT NULL,
    "executed_by" UUID NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_swap_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateIndex
CREATE INDEX "idx_swap_purchase" ON "card_swap_requests"("purchase_id");

-- CreateIndex
CREATE INDEX "idx_swap_status_target" ON "card_swap_requests"("status", "target_station_id");

-- CreateIndex
CREATE INDEX "idx_swap_source_status" ON "card_swap_requests"("source_station_id", "status");

-- CreateIndex
CREATE INDEX "idx_swap_history_request" ON "card_swap_history"("swap_request_id");

-- CreateIndex
CREATE INDEX "idx_swap_history_purchase" ON "card_swap_history"("purchase_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_products_serial_template_key" ON "card_products"("serial_template");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_previous_station_id_fkey" FOREIGN KEY ("previous_station_id") REFERENCES "stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_stock_movements" ADD CONSTRAINT "card_stock_movements_to_station_id_fkey" FOREIGN KEY ("to_station_id") REFERENCES "stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "card_purchases"("purchase_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_original_card_id_fkey" FOREIGN KEY ("original_card_id") REFERENCES "cards"("card_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_replacement_card_id_fkey" FOREIGN KEY ("replacement_card_id") REFERENCES "cards"("card_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_source_station_id_fkey" FOREIGN KEY ("source_station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_target_station_id_fkey" FOREIGN KEY ("target_station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_expected_product_id_fkey" FOREIGN KEY ("expected_product_id") REFERENCES "card_products"("card_product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_cardProductId_fkey" FOREIGN KEY ("cardProductId") REFERENCES "card_products"("card_product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("card_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_swap_history" ADD CONSTRAINT "card_swap_history_swap_request_id_fkey" FOREIGN KEY ("swap_request_id") REFERENCES "card_swap_requests"("swap_request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

