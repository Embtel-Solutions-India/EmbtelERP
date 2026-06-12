-- Sales Lead rebuild: richer immigration lead model.
-- * Replace SalesLeadStatus workflow (remap existing rows).
-- * Replace SalesLeadPaymentStatus values (remap existing rows).
-- * Add immigration / qualification / payment columns.
-- * Add auto-generated unique leadCode (backfilled for existing rows).
-- Only the SalesLead table uses these two enums, so the swap is self-contained.
BEGIN;

-- 1) New supporting enums -----------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "VisaCategory" AS ENUM (
    'H1B','L1A','L1B','O1','TN','E3','EB1','EB2_NIW','FAMILY_GREEN_CARD',
    'MARRIAGE_BASED','BUSINESS_VISA','VISITOR_VISA','PERMANENT_RESIDENCY'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PriorityLevel" AS ENUM ('LOW','MEDIUM','HIGH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "LeadCurrentStatus" AS ENUM ('STUDENT','WORKER','BUSINESS_OWNER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) Replace SalesLeadStatus enum + remap existing data -----------------------
ALTER TABLE "SalesLead" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "SalesLead" ALTER COLUMN "status" TYPE TEXT USING "status"::text;

UPDATE "SalesLead" SET "status" = CASE "status"
  WHEN 'PROPOSAL'    THEN 'CONSULTATION_SCHEDULED'
  WHEN 'NEGOTIATION' THEN 'DOCUMENTS_REQUESTED'
  WHEN 'WON'         THEN 'CONVERTED'
  ELSE "status"
END;

DROP TYPE "SalesLeadStatus";
CREATE TYPE "SalesLeadStatus" AS ENUM (
  'NEW','CONTACTED','CONSULTATION_SCHEDULED','DOCUMENTS_REQUESTED',
  'QUALIFIED','CONVERTED','TRANSFERRED','LOST'
);
ALTER TABLE "SalesLead" ALTER COLUMN "status" TYPE "SalesLeadStatus" USING "status"::"SalesLeadStatus";
ALTER TABLE "SalesLead" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- 3) Replace SalesLeadPaymentStatus enum + remap existing data ----------------
ALTER TABLE "SalesLead" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "SalesLead" ALTER COLUMN "paymentStatus" TYPE TEXT USING "paymentStatus"::text;

UPDATE "SalesLead" SET "paymentStatus" = CASE "paymentStatus"
  WHEN 'NOT_STARTED'    THEN 'INITIATED'
  WHEN 'PENDING'        THEN 'IN_PROGRESS'
  WHEN 'PARTIALLY_PAID' THEN 'PARTIALLY_DONE'
  WHEN 'PAID'           THEN 'DONE'
  WHEN 'REFUNDED'       THEN 'INITIATED'
  ELSE 'INITIATED'
END;

DROP TYPE "SalesLeadPaymentStatus";
CREATE TYPE "SalesLeadPaymentStatus" AS ENUM ('INITIATED','IN_PROGRESS','DONE','PARTIALLY_DONE');
ALTER TABLE "SalesLead" ALTER COLUMN "paymentStatus" TYPE "SalesLeadPaymentStatus" USING "paymentStatus"::"SalesLeadPaymentStatus";
ALTER TABLE "SalesLead" ALTER COLUMN "paymentStatus" SET DEFAULT 'INITIATED';

-- 4) New columns --------------------------------------------------------------
ALTER TABLE "SalesLead"
  ADD COLUMN IF NOT EXISTS "leadCode" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "countryOfResidence" TEXT,
  ADD COLUMN IF NOT EXISTS "nationality" TEXT,
  ADD COLUMN IF NOT EXISTS "visaCategory" "VisaCategory",
  ADD COLUMN IF NOT EXISTS "priorityLevel" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS "interestedVisa" "VisaCategory",
  ADD COLUMN IF NOT EXISTS "currentStatus" "LeadCurrentStatus",
  ADD COLUMN IF NOT EXISTS "education" TEXT,
  ADD COLUMN IF NOT EXISTS "workExperienceYears" INTEGER,
  ADD COLUMN IF NOT EXISTS "familyImmigrationRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "budgetAvailable" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "urgencyLevel" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS "leadScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "expectedInvestment" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "consultationRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "consultationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentAmount" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "transferredAt" TIMESTAMP(3);

-- 5) Backfill leadCode for existing rows, then enforce NOT NULL + UNIQUE -------
WITH numbered AS (
  SELECT "id", row_number() OVER (ORDER BY "createdAt", "id") AS rn
  FROM "SalesLead"
  WHERE "leadCode" IS NULL
)
UPDATE "SalesLead" sl
SET "leadCode" = 'LD-' || lpad(numbered.rn::text, 6, '0')
FROM numbered
WHERE sl."id" = numbered."id";

ALTER TABLE "SalesLead" ALTER COLUMN "leadCode" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "SalesLead_leadCode_key" ON "SalesLead"("leadCode");

-- 6) New indexes --------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "SalesLead_priorityLevel_idx" ON "SalesLead"("priorityLevel");
CREATE INDEX IF NOT EXISTS "SalesLead_leadScore_idx" ON "SalesLead"("leadScore");
CREATE INDEX IF NOT EXISTS "SalesLead_createdAt_idx" ON "SalesLead"("createdAt");

COMMIT;
