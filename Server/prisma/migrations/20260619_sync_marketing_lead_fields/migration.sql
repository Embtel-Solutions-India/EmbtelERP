-- Phase 6: sync MarketingLead capture fields with SalesLead so a promoted lead
-- carries its qualification data into Sales. Fully additive — every new column
-- is nullable (leadScore defaults to 0). Reuses existing enum types. Idempotent.
BEGIN;

ALTER TABLE "MarketingLead"
  ADD COLUMN IF NOT EXISTS "company"                   TEXT,
  ADD COLUMN IF NOT EXISTS "whatsappNumber"            TEXT,
  ADD COLUMN IF NOT EXISTS "countryOfResidence"        TEXT,
  ADD COLUMN IF NOT EXISTS "nationality"               TEXT,
  ADD COLUMN IF NOT EXISTS "visaCategory"              "VisaCategory",
  ADD COLUMN IF NOT EXISTS "priorityLevel"             "PriorityLevel",
  ADD COLUMN IF NOT EXISTS "interestedVisa"            "VisaCategory",
  ADD COLUMN IF NOT EXISTS "currentStatus"             "LeadCurrentStatus",
  ADD COLUMN IF NOT EXISTS "education"                 TEXT,
  ADD COLUMN IF NOT EXISTS "workExperienceYears"       INTEGER,
  ADD COLUMN IF NOT EXISTS "familyImmigrationRequired" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "budgetAvailable"           DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "urgencyLevel"              "PriorityLevel",
  ADD COLUMN IF NOT EXISTS "leadScore"                 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "priority"                  TEXT,
  ADD COLUMN IF NOT EXISTS "expectedInvestment"        DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "consultationRequired"      BOOLEAN,
  ADD COLUMN IF NOT EXISTS "consultationDate"          TIMESTAMP(3);

COMMIT;
