-- CreateTable
CREATE TABLE "activity_logs" (
    "log_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "created_by" UUID,
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_by" UUID,
    "deleted_at" TIMESTAMP,
    "deleted_by" UUID
);

-- Add foreign key constraint
ALTER TABLE "activity_logs"
ADD CONSTRAINT "fk_activity_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE;