-- AlterTable
ALTER TABLE "inbox" ADD COLUMN     "read_by_user_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "target_roles" TEXT[] DEFAULT ARRAY[]::TEXT[];

