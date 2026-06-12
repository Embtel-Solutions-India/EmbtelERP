-- Additive migration: SalesLead.paymentStatus column and SalesLeadPaymentStatus enum
BEGIN;

DO $$ BEGIN
  CREATE TYPE "SalesLeadPaymentStatus" AS ENUM (
    'NOT_STARTED', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "SalesLead"
  ADD COLUMN IF NOT EXISTS "paymentStatus" "SalesLeadPaymentStatus" NOT NULL DEFAULT 'NOT_STARTED';

CREATE INDEX IF NOT EXISTS "SalesLead_paymentStatus_idx" ON "SalesLead"("paymentStatus");

COMMIT;
