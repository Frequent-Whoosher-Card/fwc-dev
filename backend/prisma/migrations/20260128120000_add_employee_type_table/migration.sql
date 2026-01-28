-- CreateTable
CREATE TABLE "employee_types" (
    "employee_type_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "employee_types_pkey" PRIMARY KEY ("employee_type_id")
);

-- AlterTable
ALTER TABLE "members" ADD COLUMN "employee_type_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "employee_types_code_key" ON "employee_types"("code");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_employee_type_id_fkey" FOREIGN KEY ("employee_type_id") REFERENCES "employee_types"("employee_type_id") ON DELETE SET NULL ON UPDATE CASCADE;
