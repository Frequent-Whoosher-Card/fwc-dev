-- 1) Create enum FilePurpose (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'FilePurpose'
  ) THEN
    CREATE TYPE "public"."FilePurpose" AS ENUM ('GENERAL', 'LAST_REDEEM', 'BARCODE_IMAGE');
  END IF;
END $$;

-- 2) Create table file_object (jika belum ada)
CREATE TABLE IF NOT EXISTS "public"."file_object" (
  "file_id" UUID NOT NULL,
  "original_name" TEXT NOT NULL,
  "stored_name" TEXT,
  "relative_path" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" INTEGER,
  "checksum_sha256" TEXT,
  "purpose" "public"."FilePurpose" NOT NULL DEFAULT 'GENERAL',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by" UUID,
  "deleted_at" TIMESTAMP(3),
  "deleted_by" UUID,
  CONSTRAINT "file_object_pkey" PRIMARY KEY ("file_id")
);

-- 3) Add column file_object_id to card_redeem & cards (UUID)
ALTER TABLE "public"."card_redeem"
  ADD COLUMN IF NOT EXISTS "file_object_id" UUID;

ALTER TABLE "public"."cards"
  ADD COLUMN IF NOT EXISTS "file_object_id" UUID;

-- 4) Add FK (hindari error jika constraint sudah ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'card_redeem_file_object_id_fkey'
  ) THEN
    ALTER TABLE "public"."card_redeem"
      ADD CONSTRAINT "card_redeem_file_object_id_fkey"
      FOREIGN KEY ("file_object_id")
      REFERENCES "public"."file_object"("file_id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cards_file_object_id_fkey'
  ) THEN
    ALTER TABLE "public"."cards"
      ADD CONSTRAINT "cards_file_object_id_fkey"
      FOREIGN KEY ("file_object_id")
      REFERENCES "public"."file_object"("file_id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
