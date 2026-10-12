-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "colorId" INTEGER,
ADD COLUMN     "colorNameSnapshot" TEXT;

-- AlterTable
ALTER TABLE "ProductColor" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "retiredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "OrderItem_colorId_idx" ON "OrderItem"("colorId");

-- CreateIndex
CREATE INDEX "ProductColor_productId_isActive_idx" ON "ProductColor"("productId", "isActive");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "ProductColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
