-- AlterEnum
BEGIN;
CREATE TYPE "CardStatus_new" AS ENUM ('IN_OFFICE', 'IN_TRANSIT', 'IN_STATION', 'LOST', 'SOLD_ACTIVE', 'SOLD_INACTIVE');
ALTER TABLE "public"."cards" ALTER COLUMN "status_card" DROP DEFAULT;
ALTER TABLE "cards" ALTER COLUMN "status_card" TYPE "CardStatus_new" USING ("status_card"::text::"CardStatus_new");
ALTER TYPE "CardStatus" RENAME TO "CardStatus_old";
ALTER TYPE "CardStatus_new" RENAME TO "CardStatus";
DROP TYPE "public"."CardStatus_old";
ALTER TABLE "cards" ALTER COLUMN "status_card" SET DEFAULT 'IN_OFFICE';
COMMIT;

-- AlterTable
ALTER TABLE "card_stock_movements" ADD COLUMN     "lost_serial_numbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "received_serial_numbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sent_serial_numbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validatedBy" UUID;

-- AlterTable
ALTER TABLE "cards" ALTER COLUMN "status_card" SET DEFAULT 'IN_OFFICE';

