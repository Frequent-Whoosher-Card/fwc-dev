ALTER TABLE "public"."card_stock_movements"
ADD COLUMN IF NOT EXISTS "damaged_serial_numbers" TEXT[] NOT NULL DEFAULT '{}';