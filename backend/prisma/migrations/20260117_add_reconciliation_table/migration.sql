-- Migration: Add Reconciliation Tables
-- Purpose: Create tables for FWC Excel reconciliation feature
-- Safe: Only adds new tables, no data loss risk

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'MATCHING', 'COMPLETED', 'FAILED');

-- CreateTable: ReconciliationBatch (parent)
CREATE TABLE "reconciliation_batches" (
    "batch_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_name" VARCHAR(255) NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "matched_rows" INTEGER NOT NULL DEFAULT 0,
    "unmatched_rows" INTEGER NOT NULL DEFAULT 0,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "csv_path" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "matched_at" TIMESTAMP(3),
    "matched_by" UUID,

    CONSTRAINT "reconciliation_batches_pkey" PRIMARY KEY ("batch_id")
);

-- CreateTable: TempFwcReconciliation (child)
CREATE TABLE "temp_fwc_reconciliation" (
    "record_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_id" UUID NOT NULL,
    "serial_number" VARCHAR(50),
    "nik_clean" VARCHAR(50) NOT NULL,
    "ticketing_date" DATE NOT NULL,
    "is_matched" BOOLEAN NOT NULL DEFAULT false,
    "matched_card_id" UUID,
    "matched_redeem_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temp_fwc_reconciliation_pkey" PRIMARY KEY ("record_id")
);

-- CreateIndex: ReconciliationBatch
CREATE INDEX "idx_reconciliation_batches_status" ON "reconciliation_batches"("status");
CREATE INDEX "idx_reconciliation_batches_created" ON "reconciliation_batches"("created_at");

-- CreateIndex: TempFwcReconciliation
CREATE INDEX "idx_temp_fwc_batch" ON "temp_fwc_reconciliation"("batch_id");
CREATE INDEX "idx_temp_fwc_serial" ON "temp_fwc_reconciliation"("serial_number");
CREATE INDEX "idx_temp_fwc_nik_date" ON "temp_fwc_reconciliation"("nik_clean", "ticketing_date");
CREATE INDEX "idx_temp_fwc_matched" ON "temp_fwc_reconciliation"("is_matched");

-- AddForeignKey
ALTER TABLE "temp_fwc_reconciliation" 
    ADD CONSTRAINT "temp_fwc_reconciliation_batch_id_fkey" 
    FOREIGN KEY ("batch_id") 
    REFERENCES "reconciliation_batches"("batch_id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
