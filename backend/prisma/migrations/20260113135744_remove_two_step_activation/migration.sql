-- Remove two-step activation system completely
-- This migration removes all activation-related fields and enums

-- Step 1: Drop activation columns from card_purchases table
ALTER TABLE "card_purchases" DROP COLUMN IF EXISTS "activation_status";
ALTER TABLE "card_purchases" DROP COLUMN IF EXISTS "activated_at";
ALTER TABLE "card_purchases" DROP COLUMN IF EXISTS "activated_by";
ALTER TABLE "card_purchases" DROP COLUMN IF EXISTS "physical_card_serial_number";

-- Step 2: Drop PurchaseActivationStatus enum
DROP TYPE IF EXISTS "PurchaseActivationStatus";

-- Step 3: Remove assignedSerialNumber from cards table
ALTER TABLE "cards" DROP COLUMN IF EXISTS "assigned_serial_number";

-- Step 4: Remove ASSIGNED status from CardStatus enum
-- Note: This requires recreating the enum without ASSIGNED value
-- First, create a temporary enum without ASSIGNED
CREATE TYPE "CardStatus_new" AS ENUM (
  'ON_REQUEST',
  'IN_OFFICE',
  'IN_TRANSIT',
  'IN_STATION',
  'LOST',
  'DAMAGED',
  'SOLD_ACTIVE',
  'SOLD_INACTIVE'
);

-- Update any existing cards with ASSIGNED status to IN_STATION
UPDATE "cards" SET "status_card" = 'IN_STATION'::"CardStatus" WHERE "status_card" = 'ASSIGNED'::"CardStatus";

-- Drop the default before altering column type
ALTER TABLE "cards" ALTER COLUMN "status_card" DROP DEFAULT;

-- Alter column to use new enum type
ALTER TABLE "cards" ALTER COLUMN "status_card" TYPE "CardStatus_new" USING "status_card"::text::"CardStatus_new";

-- Drop old enum and rename new one
DROP TYPE "CardStatus";
ALTER TYPE "CardStatus_new" RENAME TO "CardStatus";

-- Restore default with new enum type
ALTER TABLE "cards" ALTER COLUMN "status_card" SET DEFAULT 'IN_STATION'::"CardStatus";
