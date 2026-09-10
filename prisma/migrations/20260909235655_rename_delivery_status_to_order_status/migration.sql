/*
  Warnings:

  - You are about to drop the column `deliveryStatus` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "deliveryStatus",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "public"."DeliveryStatus";
