-- AlterTable
ALTER TABLE "bulk_discount" ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_active" BOOLEAN DEFAULT true,
ADD COLUMN     "role_access" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_by" UUID;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "city_id" UUID;

-- CreateTable
CREATE TABLE "product_types" (
    "product_type_id" UUID NOT NULL,
    "program_id" TEXT NOT NULL,
    "description" TEXT,
    "abbreviation" TEXT,
    "program_type" "ProgramType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("product_type_id")
);

-- CreateTable
CREATE TABLE "fcm_tokens" (
    "fcm_token_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "device_info" TEXT,
    "user_id" UUID,

    CONSTRAINT "fcm_tokens_pkey" PRIMARY KEY ("fcm_token_id")
);

-- CreateTable
CREATE TABLE "city" (
    "city_id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("city_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fcm_tokens_token_key" ON "fcm_tokens"("token");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("city_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fcm_tokens" ADD CONSTRAINT "fcm_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

