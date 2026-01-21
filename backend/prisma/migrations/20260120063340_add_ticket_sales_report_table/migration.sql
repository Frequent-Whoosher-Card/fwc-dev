-- CreateTable
CREATE TABLE "ticket_sales_report" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seq_no" BIGINT,
    "passenger_name" VARCHAR(255),
    "nik_passport_no" VARCHAR(255),
    "nationality" VARCHAR(255),
    "order_no" VARCHAR(255),
    "ticket_no" BIGINT,
    "ticketing_station" VARCHAR(255),
    "business_area" TEXT,
    "office_no" VARCHAR(255),
    "window_no" BIGINT,
    "shift_no" VARCHAR(255),
    "operator_name" VARCHAR(255),
    "ticketing_time" BIGINT,
    "departure_date" VARCHAR(255),
    "train_no" VARCHAR(255),
    "origin" VARCHAR(255),
    "cars_number" BIGINT,
    "seat_number" VARCHAR(255),
    "origin_code" VARCHAR(255),
    "purchase_date" VARCHAR(255),
    "purchase_time" VARCHAR(255),
    "departure_time" VARCHAR(255),
    "destination" VARCHAR(255),
    "destination_code" VARCHAR(255),
    "arrival_date" VARCHAR(255),
    "arrival_time" VARCHAR(255),
    "seat_class" VARCHAR(255),
    "ticket_type" VARCHAR(255),
    "original_ticket_price" BIGINT,
    "discount_type" VARCHAR(255),
    "discount_rate" VARCHAR(255),
    "before_tax_price" BIGINT,
    "tax_rate" VARCHAR(255),
    "after_tax_price" BIGINT,
    "ticketing_channel" VARCHAR(255),
    "payment_method" VARCHAR(255),
    "trade_no" TEXT,
    "plattrade_no" TEXT,
    "payment_gateway" VARCHAR(255),
    "b2b_partner" VARCHAR(255),
    "imported_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_sales_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ticket_no" ON "ticket_sales_report"("ticket_no");

-- CreateIndex
CREATE INDEX "idx_order_no" ON "ticket_sales_report"("order_no");

-- CreateIndex
CREATE INDEX "idx_purchase_date" ON "ticket_sales_report"("purchase_date");

-- CreateIndex
CREATE INDEX "idx_ticketing_station" ON "ticket_sales_report"("ticketing_station");
