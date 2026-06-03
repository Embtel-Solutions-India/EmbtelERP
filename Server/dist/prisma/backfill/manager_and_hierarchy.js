import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    console.log("Ensuring pgcrypto extension...");
    await prisma.$executeRaw `CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
    console.log("Backfilling managerId from reportsToId...");
    await prisma.$executeRaw `
    UPDATE "Employee" SET "managerId" = "reportsToId" WHERE "managerId" IS NULL AND "reportsToId" IS NOT NULL;
  `;
    console.log("Populating EmployeeHierarchy (transitive closure) ...");
    const employees = await prisma.employee.findMany({ select: { id: true } });
    for (const { id } of employees) {
        const insertSql = `
      INSERT INTO "EmployeeHierarchy" (id, "employeeId", "managerId", depth, "createdAt")
      SELECT gen_random_uuid(), $1, mgrs."managerId", mgrs.depth, now()
      FROM (
        WITH RECURSIVE mgrs AS (
          SELECT id, "reportsToId" AS "managerId", 1 AS depth FROM "Employee" WHERE id = $1 AND "reportsToId" IS NOT NULL
          UNION ALL
          SELECT e.id, e."reportsToId" AS "managerId", mgrs.depth + 1 FROM "Employee" e
          JOIN mgrs ON e.id = mgrs."managerId" WHERE e."reportsToId" IS NOT NULL
        )
        SELECT * FROM mgrs
      ) AS mgrs
      ON CONFLICT DO NOTHING;
    `;
        await prisma.$executeRawUnsafe(insertSql, id);
    }
    console.log("EmployeeHierarchy backfill complete");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
