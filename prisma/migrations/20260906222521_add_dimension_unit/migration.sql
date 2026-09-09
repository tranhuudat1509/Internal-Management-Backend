/*
  Warnings:

  - You are about to alter the column `length` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `width` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `height` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- CreateEnum
CREATE TYPE "DimensionUnit" AS ENUM ('MM', 'CM', 'M');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "dimensionUnit" "DimensionUnit" NOT NULL DEFAULT 'CM',
ALTER COLUMN "length" SET DATA TYPE INTEGER,
ALTER COLUMN "width" SET DATA TYPE INTEGER,
ALTER COLUMN "height" SET DATA TYPE INTEGER;
