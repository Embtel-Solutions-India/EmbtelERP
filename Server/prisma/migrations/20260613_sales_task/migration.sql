-- Sales-only task table (isolated from the shared Task model used by other depts).
BEGIN;

DO $$ BEGIN
  CREATE TYPE "SalesTaskType" AS ENUM (
    'CALL','WHATSAPP_FOLLOWUP','EMAIL_FOLLOWUP','CONSULTATION_MEETING',
    'DOCUMENT_COLLECTION','PAYMENT_FOLLOWUP','VISA_ELIGIBILITY_DISCUSSION',
    'LEAD_NURTURING','CLIENT_MEETING','INTERNAL_DISCUSSION'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SalesTaskResult" AS ENUM (
    'CONNECTED','NO_RESPONSE','INTERESTED','NOT_INTERESTED','CALL_BACK_LATER',
    'CONSULTATION_BOOKED','DOCUMENTS_RECEIVED','PAYMENT_RECEIVED','CONVERTED','LOST_LEAD'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SalesTaskStatus" AS ENUM ('TODO','IN_PROGRESS','COMPLETED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "SalesTask" (
  "id"               TEXT NOT NULL,
  "taskCode"         TEXT NOT NULL,
  "organizationId"   TEXT NOT NULL,
  "businessId"       TEXT NOT NULL,
  "teamId"           TEXT,
  "verticalId"       TEXT,
  "leadId"           TEXT,
  "assigneeId"       TEXT,
  "createdById"      TEXT,
  "title"            TEXT NOT NULL,
  "taskType"         "SalesTaskType" NOT NULL,
  "description"      TEXT,
  "status"           "SalesTaskStatus" NOT NULL DEFAULT 'TODO',
  "priority"         "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
  "dueDate"          TIMESTAMP(3),
  "result"           "SalesTaskResult",
  "nextFollowUpDate" TIMESTAMP(3),
  "notes"            TEXT,
  "completedAt"      TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SalesTask_taskCode_key" ON "SalesTask"("taskCode");
CREATE INDEX IF NOT EXISTS "SalesTask_organizationId_idx" ON "SalesTask"("organizationId");
CREATE INDEX IF NOT EXISTS "SalesTask_businessId_idx" ON "SalesTask"("businessId");
CREATE INDEX IF NOT EXISTS "SalesTask_teamId_idx" ON "SalesTask"("teamId");
CREATE INDEX IF NOT EXISTS "SalesTask_verticalId_idx" ON "SalesTask"("verticalId");
CREATE INDEX IF NOT EXISTS "SalesTask_leadId_idx" ON "SalesTask"("leadId");
CREATE INDEX IF NOT EXISTS "SalesTask_assigneeId_idx" ON "SalesTask"("assigneeId");
CREATE INDEX IF NOT EXISTS "SalesTask_status_idx" ON "SalesTask"("status");
CREATE INDEX IF NOT EXISTS "SalesTask_dueDate_idx" ON "SalesTask"("dueDate");
CREATE INDEX IF NOT EXISTS "SalesTask_nextFollowUpDate_idx" ON "SalesTask"("nextFollowUpDate");

DO $$ BEGIN
  ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_verticalId_fkey"
    FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMIT;
