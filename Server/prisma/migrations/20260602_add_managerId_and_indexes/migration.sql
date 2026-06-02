-- Add managerId column and supporting index/constraint
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "managerId" text;
ALTER TABLE "Employee" ADD CONSTRAINT IF NOT EXISTS "fk_employee_manager" FOREIGN KEY("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "idx_employee_managerId" ON "Employee" ("managerId");

-- Ensure reportsToId index exists (no-op if already present)
CREATE INDEX IF NOT EXISTS "idx_employee_reportsToId" ON "Employee" ("reportsToId");

-- Ensure level index exists
CREATE INDEX IF NOT EXISTS "idx_employee_level" ON "Employee" ("level");
