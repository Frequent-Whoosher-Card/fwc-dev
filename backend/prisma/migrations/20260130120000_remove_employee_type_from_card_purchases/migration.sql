-- DropForeignKey
ALTER TABLE "card_purchases" DROP CONSTRAINT IF EXISTS "card_purchases_employee_type_id_fkey";

-- AlterTable
ALTER TABLE "card_purchases" DROP COLUMN IF EXISTS "employee_type_id";
