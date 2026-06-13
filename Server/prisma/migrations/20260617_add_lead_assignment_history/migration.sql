-- Phase 2: LeadAssignmentHistory — never-overwritten ownership chain for SalesLead.
-- Fully additive. Backfills one real CREATED row per existing sales lead so every
-- lead has a baseline owner in its timeline. Idempotent.
BEGIN;

DO $$ BEGIN
  CREATE TYPE "LeadAssignmentReason" AS ENUM ('CREATED', 'PROMOTED_FROM_MARKETING', 'REASSIGNED', 'TRANSFERRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "LeadAssignmentHistory" (
  "id"             TEXT NOT NULL,
  "leadId"         TEXT NOT NULL,
  "fromEmployeeId" TEXT,
  "toEmployeeId"   TEXT,
  "changedById"    TEXT,
  "reason"         "LeadAssignmentReason" NOT NULL,
  "note"           TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadAssignmentHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadAssignmentHistory_leadId_idx"    ON "LeadAssignmentHistory"("leadId");
CREATE INDEX IF NOT EXISTS "LeadAssignmentHistory_createdAt_idx" ON "LeadAssignmentHistory"("createdAt");

DO $$ BEGIN
  ALTER TABLE "LeadAssignmentHistory" ADD CONSTRAINT "LeadAssignmentHistory_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "LeadAssignmentHistory" ADD CONSTRAINT "LeadAssignmentHistory_changedById_fkey"
    FOREIGN KEY ("changedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Backfill: one CREATED row per existing sales lead (real data: current owner +
-- original creator, dated to the lead's creation). Guarded so re-runs are no-ops.
INSERT INTO "LeadAssignmentHistory"
  ("id", "leadId", "fromEmployeeId", "toEmployeeId", "changedById", "reason", "note", "createdAt")
SELECT gen_random_uuid()::text, sl."id", NULL, sl."assignedToId", sl."createdById",
       'CREATED'::"LeadAssignmentReason", 'Backfilled initial owner', sl."createdAt"
FROM "SalesLead" sl
WHERE NOT EXISTS (
  SELECT 1 FROM "LeadAssignmentHistory" h WHERE h."leadId" = sl."id"
);

COMMIT;
