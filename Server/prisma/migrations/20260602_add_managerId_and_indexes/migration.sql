-- Add managerId column and supporting index/constraint
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "managerId" text;

-- ADD CONSTRAINT IF NOT EXISTS is not valid Postgres syntax; wrap in a DO block instead.
DO $$ BEGIN
  ALTER TABLE "Employee" ADD CONSTRAINT "fk_employee_manager"
    FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "idx_employee_managerId"   ON "Employee" ("managerId");

-- Ensure reportsToId index exists (no-op if already present)
CREATE INDEX IF NOT EXISTS "idx_employee_reportsToId" ON "Employee" ("reportsToId");

-- Ensure level index exists
CREATE INDEX IF NOT EXISTS "idx_employee_level" ON "Employee" ("level");
