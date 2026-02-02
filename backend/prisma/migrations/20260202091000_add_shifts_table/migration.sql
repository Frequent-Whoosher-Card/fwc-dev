-- Create shifts table
CREATE TABLE "shifts" (
  "shift_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" UUID,
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_by" UUID,
  "deleted_at" TIMESTAMP,
  "deleted_by" UUID,
  CONSTRAINT "shifts_pkey" PRIMARY KEY ("shift_id")
);

-- FK to users
ALTER TABLE "shifts"
  ADD CONSTRAINT "shifts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("user_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

