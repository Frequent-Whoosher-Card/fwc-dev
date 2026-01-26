-- AlterTable
ALTER TABLE "activity_logs" ALTER COLUMN "log_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "card_categories" ALTER COLUMN "category_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "card_inventory" ALTER COLUMN "inventory_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "card_products" ALTER COLUMN "card_product_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "is_active" SET DEFAULT true,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "card_purchases" ALTER COLUMN "purchase_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "activation_status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "card_redeem" ALTER COLUMN "redeem_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "card_stock_movements" ALTER COLUMN "movement_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "movement_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "card_swap_history" ALTER COLUMN "history_id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "card_swap_requests" ALTER COLUMN "swap_request_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL',
ALTER COLUMN "requested_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "card_types" ALTER COLUMN "type_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "card_usage_logs" ALTER COLUMN "log_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "usage_date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "cards" ALTER COLUMN "card_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "file_object" ALTER COLUMN "file_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "inbox" ALTER COLUMN "inbox_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "members" ALTER COLUMN "member_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "menu_access" ALTER COLUMN "menu_access_id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "token_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "used" SET DEFAULT false,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "permission" ALTER COLUMN "permission_id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "role_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "is_active" SET DEFAULT true,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "stations" ALTER COLUMN "station_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "user_id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "is_active" SET DEFAULT true,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

