-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('Aktif', 'Non_Aktif');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Success', 'Failed', 'Pending');

-- CreateTable
CREATE TABLE "roles" (
    "role_id" UUID NOT NULL,
    "role_code" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "nip" TEXT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "card_categories" (
    "category_id" UUID NOT NULL,
    "category_code" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "card_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "card_types" (
    "type_id" UUID NOT NULL,
    "type_code" TEXT NOT NULL,
    "type_name" TEXT NOT NULL,
    "route_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "card_types_pkey" PRIMARY KEY ("type_id")
);

-- CreateTable
CREATE TABLE "stations" (
    "station_id" UUID NOT NULL,
    "station_code" TEXT NOT NULL,
    "station_name" TEXT NOT NULL,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("station_id")
);

-- CreateTable
CREATE TABLE "card_products" (
    "card_product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "type_id" UUID NOT NULL,
    "total_quota" INTEGER NOT NULL,
    "masa_berlaku" INTEGER NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "card_products_pkey" PRIMARY KEY ("card_product_id")
);

-- CreateTable
CREATE TABLE "cards" (
    "card_id" UUID NOT NULL,
    "serial_number" TEXT NOT NULL,
    "member_id" UUID NOT NULL,
    "card_product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "type_id" UUID NOT NULL,
    "quota_ticket" INTEGER NOT NULL DEFAULT 0,
    "total_quota" INTEGER NOT NULL,
    "fw_price" DECIMAL(65,30) NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "masa_berlaku" INTEGER NOT NULL,
    "expired_date" TIMESTAMP(3) NOT NULL,
    "status_card" "CardStatus" NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("card_id")
);

-- CreateTable
CREATE TABLE "card_inventory" (
    "inventory_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "type_id" UUID NOT NULL,
    "station_id" UUID,
    "card_beredar" INTEGER NOT NULL DEFAULT 0,
    "card_terjual_aktif" INTEGER NOT NULL DEFAULT 0,
    "card_terjual_nonaktif" INTEGER NOT NULL DEFAULT 0,
    "card_belum_terjual" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "card_inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "members" (
    "member_id" UUID NOT NULL,
    "member_name" TEXT NOT NULL,
    "identity_number" TEXT NOT NULL,
    "nationality" TEXT NOT NULL DEFAULT 'INDONESIA',
    "email" TEXT,
    "phone" TEXT,
    "nipp_kai" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "members_pkey" PRIMARY KEY ("member_id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "transaction_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "transaction_number" TEXT NOT NULL,
    "operator_id" UUID NOT NULL,
    "station_id" UUID NOT NULL,
    "shift_date" TIMESTAMP(3) NOT NULL,
    "transaction_status" "TransactionStatus" NOT NULL DEFAULT 'Success',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "card_usage_logs" (
    "log_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "quota_used" INTEGER NOT NULL DEFAULT 0,
    "remaining_quota" INTEGER NOT NULL,
    "usage_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "card_usage_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_code_key" ON "roles"("role_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_nip_key" ON "users"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "card_categories_category_code_key" ON "card_categories"("category_code");

-- CreateIndex
CREATE UNIQUE INDEX "card_types_type_code_key" ON "card_types"("type_code");

-- CreateIndex
CREATE UNIQUE INDEX "stations_station_code_key" ON "stations"("station_code");

-- CreateIndex
CREATE INDEX "index_category_type" ON "card_products"("category_id", "type_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_products_category_id_type_id_key" ON "card_products"("category_id", "type_id");

-- CreateIndex
CREATE UNIQUE INDEX "cards_serial_number_key" ON "cards"("serial_number");

-- CreateIndex
CREATE INDEX "index_category_type_station" ON "card_inventory"("category_id", "type_id", "station_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_inventory_category_id_type_id_station_id_key" ON "card_inventory"("category_id", "type_id", "station_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_identity_number_key" ON "members"("identity_number");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_number_key" ON "transactions"("transaction_number");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_products" ADD CONSTRAINT "card_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "card_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_products" ADD CONSTRAINT "card_products_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "card_types"("type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "card_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "card_types"("type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_card_product_id_fkey" FOREIGN KEY ("card_product_id") REFERENCES "card_products"("card_product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_inventory" ADD CONSTRAINT "card_inventory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "card_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_inventory" ADD CONSTRAINT "card_inventory_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "card_types"("type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_inventory" ADD CONSTRAINT "card_inventory_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("card_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_usage_logs" ADD CONSTRAINT "card_usage_logs_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("card_id") ON DELETE CASCADE ON UPDATE CASCADE;
