CREATE TABLE "inbox" (
    "inbox_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_to" UUID,
    "sent_by" UUID,
    "station_id" UUID,
    "type" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "inbox_pkey" PRIMARY KEY ("inbox_id")
);

-- CreateIndex
CREATE INDEX "idx_inbox_sent_to_read_created" ON "inbox"("sent_to", "is_read", "created_at");

-- AddForeignKey
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_sent_to_fkey" FOREIGN KEY ("sent_to") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;