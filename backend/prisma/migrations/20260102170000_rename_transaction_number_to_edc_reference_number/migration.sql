-- Rename column from transaction_number to edc_reference_number
ALTER TABLE "card_purchases" RENAME COLUMN "transaction_number" TO "edc_reference_number";

-- Rename unique constraint
DO $$
BEGIN
  -- Rename unique constraint
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_purchases_transaction_number_key') THEN
    ALTER TABLE "card_purchases" RENAME CONSTRAINT "card_purchases_transaction_number_key" TO "card_purchases_edc_reference_number_key";
  END IF;
END $$;

