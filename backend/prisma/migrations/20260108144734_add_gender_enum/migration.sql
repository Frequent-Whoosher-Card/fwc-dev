-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('L', 'P');

-- AlterTable: Update gender column to use enum
-- First, convert any existing values that are not 'L' or 'P' to NULL
UPDATE "members" 
SET "gender" = NULL 
WHERE "gender" IS NOT NULL 
  AND "gender" NOT IN ('L', 'P');

-- Alter column to use enum type
ALTER TABLE "members" 
  ALTER COLUMN "gender" TYPE "Gender" 
  USING CASE 
    WHEN "gender" = 'L' THEN 'L'::"Gender"
    WHEN "gender" = 'P' THEN 'P'::"Gender"
    ELSE NULL
  END;
