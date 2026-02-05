-- Add subtotal and discount_amount columns to card_purchases table
ALTER TABLE "card_purchases"
ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(65,30),
ADD COLUMN IF NOT EXISTS "discount_amount" DECIMAL(65,30);
