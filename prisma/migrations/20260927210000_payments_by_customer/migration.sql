-- Add customer ownership to payments first as nullable.
ALTER TABLE "Payment"
ADD COLUMN "customerId" INTEGER;

-- Backfill every existing payment using its order's customer.
UPDATE "Payment" AS p
SET "customerId" = o."customerId"
FROM "Order" AS o
WHERE p."orderId" = o."id";

-- Abort migration if any payment could not be linked to a customer.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Payment"
    WHERE "customerId" IS NULL
  ) THEN
    RAISE EXCEPTION
      'Unable to migrate one or more payments to a customer.';
  END IF;
END $$;

-- Customer is now required for every payment.
ALTER TABLE "Payment"
ALTER COLUMN "customerId" SET NOT NULL;

-- Replace old order relationship behavior.
ALTER TABLE "Payment"
DROP CONSTRAINT IF EXISTS "Payment_orderId_fkey";

-- orderId is now optional for legacy/history purposes.
ALTER TABLE "Payment"
ALTER COLUMN "orderId" DROP NOT NULL;

-- New customer relationship.
ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_customerId_fkey"
FOREIGN KEY ("customerId")
REFERENCES "Customer"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Old order link remains optional.
ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_orderId_fkey"
FOREIGN KEY ("orderId")
REFERENCES "Order"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "Payment_customerId_idx"
ON "Payment"("customerId");

CREATE INDEX "Payment_orderId_idx"
ON "Payment"("orderId");