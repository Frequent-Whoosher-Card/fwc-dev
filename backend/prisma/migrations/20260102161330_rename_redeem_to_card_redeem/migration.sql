-- Rename table from redeem to card_redeem
ALTER TABLE "redeem" RENAME TO "card_redeem";

-- Rename index
ALTER INDEX "idx_redeem_transaction_number" RENAME TO "idx_card_redeem_transaction_number";

-- Rename foreign key constraints (if they exist)
DO $$
BEGIN
  -- Rename foreign key constraints
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'redeem_card_id_fkey') THEN
    ALTER TABLE "card_redeem" RENAME CONSTRAINT "redeem_card_id_fkey" TO "card_redeem_card_id_fkey";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'redeem_operator_id_fkey') THEN
    ALTER TABLE "card_redeem" RENAME CONSTRAINT "redeem_operator_id_fkey" TO "card_redeem_operator_id_fkey";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'redeem_station_id_fkey') THEN
    ALTER TABLE "card_redeem" RENAME CONSTRAINT "redeem_station_id_fkey" TO "card_redeem_station_id_fkey";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'redeem_file_blob_id_fkey') THEN
    ALTER TABLE "card_redeem" RENAME CONSTRAINT "redeem_file_blob_id_fkey" TO "card_redeem_file_blob_id_fkey";
  END IF;
  
  -- Rename unique constraint
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'redeem_transaction_number_key') THEN
    ALTER TABLE "card_redeem" RENAME CONSTRAINT "redeem_transaction_number_key" TO "card_redeem_transaction_number_key";
  END IF;
END $$;

