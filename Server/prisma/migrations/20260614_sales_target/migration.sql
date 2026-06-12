-- Sales Target Management System: targets + assignment/achievement history.
BEGIN;

DO $$ BEGIN
  CREATE TYPE "SalesTargetCategory" AS ENUM ('LEAD','ACTIVITY','CONVERSION','REVENUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SalesTargetMetric" AS ENUM (
    'LEADS_CREATED','LEADS_CONTACTED','QUALIFIED_LEADS','CALLS_COMPLETED',
    'WHATSAPP_FOLLOWUPS','EMAIL_FOLLOWUPS','CONSULTATIONS_SCHEDULED',
    'CONVERTED_CLIENTS','CLOSED_LEADS','REVENUE_GENERATED','PAYMENTS_COLLECTED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SalesTargetStatus" AS ENUM ('ACTIVE','COMPLETED','OVERDUE','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SalesTargetHistoryAction" AS ENUM (
    'CREATED','ASSIGNED','REASSIGNED','UPDATED','VALUE_CHANGED','STATUS_CHANGED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "SalesTarget" (
  "id"             TEXT NOT NULL,
  "targetCode"     TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "businessId"     TEXT NOT NULL,
  "verticalId"     TEXT,
  "teamId"         TEXT,
  "parentTargetId" TEXT,
  "name"           TEXT NOT NULL,
  "category"       "SalesTargetCategory" NOT NULL,
  "metric"         "SalesTargetMetric" NOT NULL,
  "targetValue"    DECIMAL(14,2) NOT NULL,
  "startDate"      TIMESTAMP(3) NOT NULL,
  "endDate"        TIMESTAMP(3) NOT NULL,
  "description"    TEXT,
  "status"         "SalesTargetStatus" NOT NULL DEFAULT 'ACTIVE',
  "assignedById"   TEXT,
  "assignedToId"   TEXT NOT NULL,
  "createdById"    TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesTarget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SalesTarget_targetCode_key" ON "SalesTarget"("targetCode");
CREATE INDEX IF NOT EXISTS "SalesTarget_organizationId_idx" ON "SalesTarget"("organizationId");
CREATE INDEX IF NOT EXISTS "SalesTarget_businessId_idx" ON "SalesTarget"("businessId");
CREATE INDEX IF NOT EXISTS "SalesTarget_assignedToId_idx" ON "SalesTarget"("assignedToId");
CREATE INDEX IF NOT EXISTS "SalesTarget_assignedById_idx" ON "SalesTarget"("assignedById");
CREATE INDEX IF NOT EXISTS "SalesTarget_parentTargetId_idx" ON "SalesTarget"("parentTargetId");
CREATE INDEX IF NOT EXISTS "SalesTarget_status_idx" ON "SalesTarget"("status");
CREATE INDEX IF NOT EXISTS "SalesTarget_startDate_endDate_idx" ON "SalesTarget"("startDate","endDate");

CREATE TABLE IF NOT EXISTS "SalesTargetHistory" (
  "id"            TEXT NOT NULL,
  "targetId"      TEXT NOT NULL,
  "action"        "SalesTargetHistoryAction" NOT NULL,
  "actorId"       TEXT,
  "assignedToId"  TEXT,
  "previousValue" DECIMAL(14,2),
  "newValue"      DECIMAL(14,2),
  "note"          TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SalesTargetHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SalesTargetHistory_targetId_idx" ON "SalesTargetHistory"("targetId");
CREATE INDEX IF NOT EXISTS "SalesTargetHistory_createdAt_idx" ON "SalesTargetHistory"("createdAt");

DO $$ BEGIN
  ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_verticalId_fkey"
    FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_parentTargetId_fkey"
    FOREIGN KEY ("parentTargetId") REFERENCES "SalesTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_assignedById_fkey"
    FOREIGN KEY ("assignedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "SalesTargetHistory" ADD CONSTRAINT "SalesTargetHistory_targetId_fkey"
    FOREIGN KEY ("targetId") REFERENCES "SalesTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SalesTargetHistory" ADD CONSTRAINT "SalesTargetHistory_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMIT;
