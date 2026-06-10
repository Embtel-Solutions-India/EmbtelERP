-- Additive migration: SalesLead table and SalesLeadStatus enum
BEGIN;

DO $$ BEGIN
  CREATE TYPE "SalesLeadStatus" AS ENUM (
    'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "SalesLead" (
  "id"             TEXT          PRIMARY KEY,
  "organizationId" TEXT          NOT NULL,
  "businessId"     TEXT          NOT NULL,
  "teamId"         TEXT,
  "verticalId"     TEXT,
  "createdById"    TEXT,
  "assignedToId"   TEXT,
  "name"           TEXT          NOT NULL,
  "company"        TEXT,
  "email"          TEXT,
  "phone"          TEXT,
  "source"         TEXT          NOT NULL,
  "status"         "SalesLeadStatus" NOT NULL DEFAULT 'NEW',
  "priority"       TEXT          NOT NULL DEFAULT 'warm',
  "estimatedValue" DECIMAL(14,2),
  "notes"          TEXT,
  "convertedAt"    TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SalesLead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT  ON UPDATE CASCADE,
  CONSTRAINT "SalesLead_businessId_fkey"     FOREIGN KEY ("businessId")     REFERENCES "Business"("id")     ON DELETE RESTRICT  ON UPDATE CASCADE,
  CONSTRAINT "SalesLead_teamId_fkey"         FOREIGN KEY ("teamId")         REFERENCES "Team"("id")         ON DELETE SET NULL  ON UPDATE CASCADE,
  CONSTRAINT "SalesLead_verticalId_fkey"     FOREIGN KEY ("verticalId")     REFERENCES "Vertical"("id")     ON DELETE SET NULL  ON UPDATE CASCADE,
  CONSTRAINT "SalesLead_createdById_fkey"    FOREIGN KEY ("createdById")    REFERENCES "Employee"("id")     ON DELETE SET NULL  ON UPDATE CASCADE,
  CONSTRAINT "SalesLead_assignedToId_fkey"   FOREIGN KEY ("assignedToId")   REFERENCES "Employee"("id")     ON DELETE SET NULL  ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SalesLead_organizationId_idx" ON "SalesLead"("organizationId");
CREATE INDEX IF NOT EXISTS "SalesLead_businessId_idx"     ON "SalesLead"("businessId");
CREATE INDEX IF NOT EXISTS "SalesLead_teamId_idx"         ON "SalesLead"("teamId");
CREATE INDEX IF NOT EXISTS "SalesLead_verticalId_idx"     ON "SalesLead"("verticalId");
CREATE INDEX IF NOT EXISTS "SalesLead_assignedToId_idx"   ON "SalesLead"("assignedToId");
CREATE INDEX IF NOT EXISTS "SalesLead_status_idx"         ON "SalesLead"("status");

COMMIT;
