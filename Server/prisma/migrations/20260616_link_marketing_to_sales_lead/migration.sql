-- Phase 1: Marketing → Sales handoff.
-- Adds a nullable, unique link from SalesLead back to the originating
-- MarketingLead. Fully additive: existing SalesLead rows get NULL and are
-- unaffected. The @unique enforces at most one SalesLead per MarketingLead
-- (no double-promote). Idempotent.
BEGIN;

ALTER TABLE "SalesLead" ADD COLUMN IF NOT EXISTS "marketingLeadId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "SalesLead_marketingLeadId_key"
  ON "SalesLead"("marketingLeadId");

DO $$ BEGIN
  ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_marketingLeadId_fkey"
    FOREIGN KEY ("marketingLeadId") REFERENCES "MarketingLead"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMIT;
