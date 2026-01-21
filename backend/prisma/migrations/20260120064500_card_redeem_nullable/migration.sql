-- AlterTable
ALTER TABLE "card_redeem" ALTER COLUMN "prev_quota" DROP NOT NULL,
ALTER COLUMN "quota_used" DROP NOT NULL,
ALTER COLUMN "remain_quota" DROP NOT NULL;
