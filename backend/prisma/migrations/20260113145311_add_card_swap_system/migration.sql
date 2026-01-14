-- Create SwapRequestStatus enum
CREATE TYPE "SwapRequestStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- Create card_swap_requests table
CREATE TABLE "card_swap_requests" (
    "swap_request_id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "original_card_id" UUID NOT NULL,
    "replacement_card_id" UUID,
    "source_station_id" UUID NOT NULL,
    "target_station_id" UUID NOT NULL,
    "expected_product_id" UUID NOT NULL,
    "status" "SwapRequestStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "rejection_reason" TEXT,
    "requested_by" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "executed_by" UUID,
    "executed_at" TIMESTAMP(3),
    "rejected_by" UUID,
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_swap_requests_pkey" PRIMARY KEY ("swap_request_id")
);

-- Create card_swap_history table
CREATE TABLE "card_swap_history" (
    "history_id" UUID NOT NULL,
    "swap_request_id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "before_card_id" UUID NOT NULL,
    "before_station_id" UUID NOT NULL,
    "before_card_status" TEXT NOT NULL,
    "after_card_id" UUID NOT NULL,
    "after_station_id" UUID NOT NULL,
    "after_card_status" TEXT NOT NULL,
    "inventory_changes" JSONB NOT NULL,
    "executed_by" UUID NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_swap_history_pkey" PRIMARY KEY ("history_id")
);

-- Create indexes for card_swap_requests
CREATE INDEX "idx_swap_purchase" ON "card_swap_requests"("purchase_id");
CREATE INDEX "idx_swap_status_target" ON "card_swap_requests"("status", "target_station_id");
CREATE INDEX "idx_swap_source_status" ON "card_swap_requests"("source_station_id", "status");

-- Create indexes for card_swap_history
CREATE INDEX "idx_swap_history_request" ON "card_swap_history"("swap_request_id");
CREATE INDEX "idx_swap_history_purchase" ON "card_swap_history"("purchase_id");

-- Add foreign key constraints for card_swap_requests
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "card_purchases"("purchase_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_original_card_id_fkey" FOREIGN KEY ("original_card_id") REFERENCES "cards"("card_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_replacement_card_id_fkey" FOREIGN KEY ("replacement_card_id") REFERENCES "cards"("card_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_source_station_id_fkey" FOREIGN KEY ("source_station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_target_station_id_fkey" FOREIGN KEY ("target_station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_expected_product_id_fkey" FOREIGN KEY ("expected_product_id") REFERENCES "card_products"("card_product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "card_swap_requests" ADD CONSTRAINT "card_swap_requests_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign key constraints for card_swap_history
ALTER TABLE "card_swap_history" ADD CONSTRAINT "card_swap_history_swap_request_id_fkey" FOREIGN KEY ("swap_request_id") REFERENCES "card_swap_requests"("swap_request_id") ON DELETE RESTRICT ON UPDATE CASCADE;
