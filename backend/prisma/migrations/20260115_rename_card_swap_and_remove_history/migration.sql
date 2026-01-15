-- 1. Drop card_swap_history
DROP TABLE IF EXISTS "card_swap_history";

-- 2. Rename table
ALTER TABLE "card_swap_requests" RENAME TO "card_swap";
