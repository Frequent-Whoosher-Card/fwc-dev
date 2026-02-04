-- CreateTable
CREATE TABLE "payment_method" (
    "payment_method_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("payment_method_id")
);

-- AlterTable
ALTER TABLE "members" ADD COLUMN "payment_method_id" UUID;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_method"("payment_method_id") ON DELETE SET NULL ON UPDATE CASCADE;
