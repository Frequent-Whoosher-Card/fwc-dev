-- Create passenger_info table
CREATE TABLE "passenger_info" (
  "passenger_info_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nama_passanger" VARCHAR(255) NOT NULL,
  "nik" VARCHAR(100) NOT NULL,
  "card_redeem_id" UUID NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" UUID,
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_by" UUID,
  "deleted_at" TIMESTAMP,
  "deleted_by" UUID,
  CONSTRAINT "passenger_info_pkey" PRIMARY KEY ("passenger_info_id")
);

-- Add foreign key to card_redeem (Redeem)
ALTER TABLE "passenger_info"
  ADD CONSTRAINT "passenger_info_card_redeem_id_fkey"
  FOREIGN KEY ("card_redeem_id") REFERENCES "card_redeem"("redeem_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

