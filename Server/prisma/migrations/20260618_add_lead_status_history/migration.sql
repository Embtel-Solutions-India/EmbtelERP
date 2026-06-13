-- Phase 3: LeadStatusHistory — never-overwritten lifecycle trail for SalesLead.
-- Fully additive. Backfills one row per existing lead capturing its current
-- status so every lead has a baseline in its timeline. Idempotent.
BEGIN;

CREATE TABLE IF NOT EXISTS "LeadStatusHistory" (
  "id"          TEXT NOT NULL,
  "leadId"      TEXT NOT NULL,
  "fromStatus"  "SalesLeadStatus",
  "toStatus"    "SalesLeadStatus" NOT NULL,
  "changedById" TEXT,
  "note"        TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadStatusHistory_leadId_idx"    ON "LeadStatusHistory"("leadId");
CREATE INDEX IF NOT EXISTS "LeadStatusHistory_createdAt_idx" ON "LeadStatusHistory"("createdAt");

DO $$ BEGIN
  ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_changedById_fkey"
    FOREIGN KEY ("changedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Backfill: one row per existing lead capturing its current status (real data,
-- dated to the lead's creation). Guarded so re-runs are no-ops.
INSERT INTO "LeadStatusHistory"
  ("id", "leadId", "fromStatus", "toStatus", "changedById", "note", "createdAt")
SELECT gen_random_uuid()::text, sl."id", NULL, sl."status", sl."createdById",
       'Backfilled current status', sl."createdAt"
FROM "SalesLead" sl
WHERE NOT EXISTS (
  SELECT 1 FROM "LeadStatusHistory" h WHERE h."leadId" = sl."id"
);

COMMIT;
