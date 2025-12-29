/*
  Warnings:

  - Added the required column `serial_template` to the `card_products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "card_products" ADD COLUMN     "serial_template" TEXT NOT NULL;
