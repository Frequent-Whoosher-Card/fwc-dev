-- AlterTable
ALTER TABLE "card_purchases" ADD COLUMN "employee_type_id" UUID;

-- AddForeignKey
ALTER TABLE "card_purchases" ADD CONSTRAINT "card_purchases_employee_type_id_fkey" FOREIGN KEY ("employee_type_id") REFERENCES "employee_types"("employee_type_id") ON DELETE SET NULL ON UPDATE CASCADE;
