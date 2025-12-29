-- AlterTable
ALTER TABLE "public"."cards" ALTER COLUMN "member_id" DROP NOT NULL,
ALTER COLUMN "purchase_date" DROP NOT NULL,
ALTER COLUMN "expired_date" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "is_active" SET DEFAULT true;

