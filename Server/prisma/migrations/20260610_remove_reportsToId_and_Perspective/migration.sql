-- Step 1: ensure managerId is fully backfilled from reportsToId before we drop the column
UPDATE "Employee"
SET "managerId" = "reportsToId"
WHERE "managerId" IS NULL AND "reportsToId" IS NOT NULL;

-- Step 2: backfill EmployeeHierarchy for any rows that were missing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "EmployeeHierarchy" (id, "employeeId", "managerId", depth, "createdAt")
SELECT gen_random_uuid(), e.id, anc."managerId", anc.depth, now()
FROM "Employee" e
CROSS JOIN LATERAL (
  WITH RECURSIVE mgrs AS (
    SELECT e2.id, e2."reportsToId" AS "managerId", 1 AS depth
    FROM "Employee" e2
    WHERE e2.id = e.id AND e2."reportsToId" IS NOT NULL
    UNION ALL
    SELECT e3.id, e3."reportsToId" AS "managerId", mgrs.depth + 1
    FROM "Employee" e3
    JOIN mgrs ON e3.id = mgrs."managerId"
    WHERE e3."reportsToId" IS NOT NULL
  )
  SELECT * FROM mgrs
) AS anc
ON CONFLICT DO NOTHING;

-- Step 3: drop the legacy reportsToId index and column
DROP INDEX IF EXISTS "Employee_reportsToId_idx";

ALTER TABLE "Employee" DROP COLUMN IF EXISTS "reportsToId";

-- Step 4: drop the legacy Perspective table (superseded by PerspectiveSession)
DROP TABLE IF EXISTS "Perspective";
