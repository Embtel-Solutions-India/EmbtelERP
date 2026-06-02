import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting employee fields backfill...");

  const employees = await prisma.employee.findMany({
    include: { role: true, business: true },
  });
  console.log(`Found ${employees.length} employees`);

  for (const e of employees) {
    const updates: any = {};
    if (!e.fullName || e.fullName.trim() === "") {
      updates.fullName = `${e.firstName} ${e.lastName}`.trim();
    }
    if (
      (e.level === null || e.level === undefined) &&
      e.role &&
      typeof e.role.level === "number"
    ) {
      updates.level = e.role.level;
    }
    if (!e.employeeCode) {
      // generate a semi-stable unique code: EMP-{businessCode}-{last6id}
      const businessCode =
        e.business && (e.business.code || e.business.name)
          ? (e.business.code ?? e.business.name)
          : "GEN";
      const idSuffix = e.id.replace(/-/g, "").slice(-6).toUpperCase();
      updates.employeeCode = `EMP-${businessCode
        .toString()
        .replace(/[^A-Z0-9]/gi, "")
        .slice(0, 6)}-${idSuffix}`;
    }

    if (Object.keys(updates).length > 0) {
      try {
        await prisma.employee.update({ where: { id: e.id }, data: updates });
        console.log(`Updated ${e.id}:`, updates);
      } catch (err) {
        console.error(`Failed to update ${e.id}:`, err);
      }
    }
  }

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
