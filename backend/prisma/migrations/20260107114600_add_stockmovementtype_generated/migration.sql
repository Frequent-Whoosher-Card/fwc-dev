DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'StockMovementType'
      AND e.enumlabel = 'GENERATED'
  ) THEN
    ALTER TYPE "public"."StockMovementType" ADD VALUE 'GENERATED';
  END IF;
END $$;
