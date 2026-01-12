-- AlterTable Card: Add assignedSerialNumber field
ALTER TABLE "cards" ADD COLUMN "assigned_serial_number" TEXT;

-- AlterEnum CardStatus: Add ASSIGNED status
ALTER TYPE "CardStatus" ADD VALUE 'ASSIGNED';

-- CreateEnum PurchaseActivationStatus
CREATE TYPE "PurchaseActivationStatus" AS ENUM ('PENDING', 'ACTIVATED', 'CANCELLED');

-- AlterTable CardPurchase: Add two-step activation fields
ALTER TABLE "card_purchases" ADD COLUMN "activation_status" "PurchaseActivationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "card_purchases" ADD COLUMN "activated_at" TIMESTAMP(3);
ALTER TABLE "card_purchases" ADD COLUMN "activated_by" UUID;
ALTER TABLE "card_purchases" ADD COLUMN "physical_card_serial_number" TEXT;
