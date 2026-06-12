-- Sync schema drift introduced by a merged branch:
--  * Task: extra sales-oriented columns + optional link to SalesLead.
--  * LeadImmigrationProfile: 1:1 immigration detail table for SalesLead.
-- All additive / idempotent.
BEGIN;

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "taskType" TEXT,
  ADD COLUMN IF NOT EXISTS "dueTime" TEXT,
  ADD COLUMN IF NOT EXISTS "taskResult" TEXT,
  ADD COLUMN IF NOT EXISTS "nextFollowUpDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "outcomeNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "leadId" TEXT;

CREATE INDEX IF NOT EXISTS "Task_leadId_idx" ON "Task"("leadId");

DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "LeadImmigrationProfile" (
  "id"                        TEXT NOT NULL,
  "leadId"                    TEXT NOT NULL,
  "whatsapp"                  TEXT,
  "countryOfResidence"        TEXT,
  "nationality"               TEXT,
  "visaCategory"              TEXT,
  "interestedVisa"            TEXT,
  "currentStatus"             TEXT,
  "education"                 TEXT,
  "workExperience"            INTEGER,
  "familyImmigrationRequired" BOOLEAN,
  "budgetMin"                 DECIMAL(14,2),
  "budgetMax"                 DECIMAL(14,2),
  "urgencyLevel"              TEXT,
  "interestedLevel"           TEXT,
  "consultationRequired"      BOOLEAN,
  "consultationDate"          TIMESTAMP(3),
  "leadScore"                 INTEGER,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadImmigrationProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LeadImmigrationProfile_leadId_key" ON "LeadImmigrationProfile"("leadId");

DO $$ BEGIN
  ALTER TABLE "LeadImmigrationProfile" ADD CONSTRAINT "LeadImmigrationProfile_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMIT;
