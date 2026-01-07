DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'CardStatus'
      AND n.nspname = 'public'
      AND e.enumlabel = 'DAMAGED'
  ) THEN
    ALTER TYPE "public"."CardStatus" ADD VALUE 'DAMAGED';
  END IF;
END $$;
