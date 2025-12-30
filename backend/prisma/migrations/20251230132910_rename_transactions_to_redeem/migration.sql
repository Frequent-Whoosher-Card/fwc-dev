-- Rename table from transactions to redeem
ALTER TABLE transactions RENAME TO redeem;

-- Rename column transaction_id to redeem_id
ALTER TABLE redeem RENAME COLUMN transaction_id TO redeem_id;
