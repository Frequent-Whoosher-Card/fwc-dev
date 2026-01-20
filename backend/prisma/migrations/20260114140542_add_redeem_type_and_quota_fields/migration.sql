-- CreateEnum
CREATE TYPE "public"."PurchaseActivationStatus" AS ENUM ('PENDING', 'ACTIVATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RedeemType" AS ENUM ('SINGLE', 'ROUNDTRIP');

-- AlterEnum
ALTER TYPE "public"."CardStatus" ADD VALUE 'ASSIGNED';

-- DropForeignKey
ALTER TABLE "public"."card_swap_history" DROP CONSTRAINT "card_swap_history_swap_request_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."card_swap_requests" DROP CONSTRAINT "card_swap_requests_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."card_swap_requests" DROP CONSTRAINT "card_swap_requests_executed_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."card_swap_requests" DROP CONSTRAINT "card_swap_requests_expected_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."card_swap_requests" DROP CONSTRAINT "card_swap_requests_original_card_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."card_swap_requests" DROP CONSTRAINT "card_swap_requests_purchase_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."card_swap_requests" DROP CONSTRAINT "card_swap_requests_rejected_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."card_swap_requests" DROP CONSTRAINT "card_swap_requests_replacement_card_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."card_swap_requests" DROP CONSTRAINT "card_swap_requests_requested_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."card_swap_requests" DROP CONSTRAINT "card_swap_requests_source_station_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."card_swap_requests" DROP CONSTRAINT "card_swap_requests_target_station_id_fkey";

-- AlterTable
ALTER TABLE "public"."card_purchases" ADD COLUMN     "activated_at" TIMESTAMP(3),
ADD COLUMN     "activated_by" UUID,
ADD COLUMN     "activation_status" "public"."PurchaseActivationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "physical_card_serial_number" TEXT;

-- AlterTable
-- AlterTable
ALTER TABLE "public"."card_redeem" RENAME CONSTRAINT "transactions_pkey" TO "card_redeem_pkey";

-- AlterTable
ALTER TABLE "public"."card_redeem"
ADD COLUMN     "prev_quota" INTEGER NOT NULL,
ADD COLUMN     "quota_used" INTEGER NOT NULL,
ADD COLUMN     "redeem_type" "public"."RedeemType" NOT NULL,
ADD COLUMN     "remain_quota" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."cards" ADD COLUMN     "assigned_serial_number" TEXT,
ALTER COLUMN "status_card" SET DEFAULT 'IN_OFFICE';

-- DropTable
DROP TABLE "public"."card_swap_history";

-- DropTable
DROP TABLE "public"."card_swap_requests";

-- DropEnum
DROP TYPE "public"."SwapRequestStatus";

-- RenameForeignKey
ALTER TABLE "public"."card_redeem" RENAME CONSTRAINT "transactions_card_id_fkey" TO "card_redeem_card_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."card_redeem" RENAME CONSTRAINT "transactions_operator_id_fkey" TO "card_redeem_operator_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."card_redeem" RENAME CONSTRAINT "transactions_station_id_fkey" TO "card_redeem_station_id_fkey";

-- RenameIndex
ALTER INDEX "public"."transactions_transaction_number_key" RENAME TO "card_redeem_transaction_number_key";
