ALTER TABLE "public"."card_stock_movement"
ADD COLUMN IF NOT EXISTS "damaged_serial_numbers" TEXT[] NOT NULL DEFAULT "{}";