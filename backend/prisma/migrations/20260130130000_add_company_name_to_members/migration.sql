-- Add company_name column to members table
ALTER TABLE "members"
ADD COLUMN IF NOT EXISTS "company_name" VARCHAR(255);

