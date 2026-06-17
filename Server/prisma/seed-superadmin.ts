import "dotenv/config"; // load DATABASE_URL from .env when run via tsx
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Minimal bootstrap seed for a blank database: the RBAC config (roles +
 * permissions) the app needs to authorize anyone, one host business to satisfy
 * Employee.businessId, and a single Super Admin account. No demo employees,
 * tasks, leads, or sprints — those are created through the app.
 *
 * Idempotent: every write is an upsert / skipDuplicates, so re-running is safe
 * and it never deletes existing data.
 */
async function main() {
  const ADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? "superadmin@demo.com";
  const ADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? "Password@123";
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  console.log("Bootstrapping organization...");
  const organization = await prisma.organization.upsert({
    where: { slug: "embtel-erp" },
    update: {},
    create: { name: "Embtel ERP", slug: "embtel-erp" },
  });

  console.log("Bootstrapping system roles...");
  const roleDefs = [
    { name: "Intern", level: 0 },
    { name: "Executive", level: 1 },
    { name: "Manager", level: 2 },
    { name: "Head", level: 3 },
    { name: "Business Owner", level: 4 },
    { name: "Super Admin", level: 5 },
  ];
  const roles = await Promise.all(
    roleDefs.map((r) =>
      prisma.role.upsert({
        where: { level: r.level },
        update: { name: r.name },
        create: { name: r.name, level: r.level },
      }),
    ),
  );
  const roleByLevel = (lvl: number) => roles.find((r) => r.level === lvl)!;

  console.log("Bootstrapping permissions...");
  const permissionDefs = [
    { code: "workforce:read:org", description: "Read employees across all businesses (HR only)" },
    { code: "employees:write", description: "Create, update, and deactivate employee records" },
    { code: "audit:read", description: "Access audit logs and global analytics" },
    { code: "roles:write", description: "Manage org config: businesses, verticals, teams, user roles" },
    { code: "dashboard:org", description: "View organisation-level dashboard and full hierarchy tree" },
  ];
  const permissions = await Promise.all(
    permissionDefs.map((p) =>
      prisma.permission.upsert({
        where: { code: p.code },
        update: { description: p.description },
        create: p,
      }),
    ),
  );
  const permByCode = (code: string) => permissions.find((p) => p.code === code)!;

  console.log("Mapping roles to permissions...");
  // Canonical RBAC matrix (mirrors prisma/seed.ts).
  const grants: Array<[number, string]> = [
    [2, "workforce:read:org"],
    [3, "workforce:read:org"],
    [3, "employees:write"],
    [4, "employees:write"],
    [4, "dashboard:org"],
    [5, "employees:write"],
    [5, "dashboard:org"],
    [5, "audit:read"],
    [5, "roles:write"],
  ];
  await prisma.rolePermission.createMany({
    data: grants.map(([level, code]) => ({
      roleId: roleByLevel(level).id,
      permissionId: permByCode(code).id,
    })),
    skipDuplicates: true,
  });

  console.log("Bootstrapping host business...");
  const business = await prisma.business.upsert({
    where: { code: "embtel" },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Embtel",
      code: "embtel",
    },
  });

  console.log("Creating Super Admin...");
  const superAdmin = await prisma.employee.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      organizationId: organization.id,
      businessId: business.id,
      roleId: roleByLevel(5).id,
      firstName: "Super",
      lastName: "Admin",
      email: ADMIN_EMAIL,
      passwordHash,
      designation: "Super Admin",
      level: 5,
    },
  });

  console.log(
    `\nDone. Super Admin ready:\n  email:    ${superAdmin.email}\n  password: ${ADMIN_PASSWORD}\n  org:      ${organization.name}\n  business: ${business.name}\n\nChange this password after first login.`,
  );
}

main()
  .catch((error) => {
    console.error("Bootstrap seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
