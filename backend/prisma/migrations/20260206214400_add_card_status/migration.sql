-- AlterEnum
ALTER TYPE "CardStatus" ADD VALUE 'SOLD_REDEEMED';

-- AlterTable
ALTER TABLE "menu_access" ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "updated_by" UUID;

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "updated_by" UUID;

-- AlterTable
ALTER TABLE "role_permissions" ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "updated_by" UUID;

