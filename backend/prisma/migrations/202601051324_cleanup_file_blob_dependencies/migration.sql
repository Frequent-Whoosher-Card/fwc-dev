-- 1) Drop FK yang masih mengarah ke file_blob
ALTER TABLE "public"."card_redeem"
  DROP CONSTRAINT IF EXISTS "card_redeem_file_blob_id_fkey";

-- 2) Drop kolom lama (kalau memang masih ada)
ALTER TABLE "public"."card_redeem"
  DROP COLUMN IF EXISTS "file_blob_id";

-- 3) Drop tabel file_blob setelah tidak ada dependency
DROP TABLE IF EXISTS "public"."file_blob";