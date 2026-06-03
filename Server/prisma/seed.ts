import bcrypt from "bcryptjs";
import { PrismaClient, PerspectiveType } from "@prisma/client";

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash("Password@123", 12);

const organizationName = "Embtel ERP";
const businessDefinitions = [
  { name: "Immigration Business", code: "immigration" },
  { name: "Credential Evaluation", code: "credential-evaluation" },
  { name: "HR Department", code: "hr" },
  { name: "IT Services & Inhouse Team", code: "it-services" },
];

const departments = [
  "Sales",
  "Marketing",
  "Documentation",
  "Recruitment",
  "Development",
  "Operations",
  "Finance",
  "Support",
];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.marketingKPI.deleteMany();
  await prisma.marketingActivity.deleteMany();
  await prisma.marketingLead.deleteMany();
  await prisma.marketingTask.deleteMany();
  await prisma.marketingCampaign.deleteMany();
  await prisma.task.deleteMany();
  await prisma.document.deleteMany();
  await prisma.perspective.deleteMany();
  await prisma.employeeHierarchy.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.team.deleteMany();
  await prisma.department.deleteMany();
  await prisma.business.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: {
      name: organizationName,
      slug: "embtel-erp",
    },
  });

  const roles = await Promise.all([
    prisma.role.create({ data: { name: "Intern", level: 0 } }),
    prisma.role.create({ data: { name: "Executive", level: 1 } }),
    prisma.role.create({ data: { name: "Manager", level: 2 } }),
    prisma.role.create({ data: { name: "Head", level: 3 } }),
    prisma.role.create({ data: { name: "Business Owner", level: 4 } }),
    prisma.role.create({ data: { name: "Super Admin", level: 5 } }),
  ]);

  const permissions = await Promise.all([
    prisma.permission.create({ data: { code: "employee.read" } }),
    prisma.permission.create({ data: { code: "employee.write" } }),
    prisma.permission.create({ data: { code: "task.read" } }),
    prisma.permission.create({ data: { code: "task.write" } }),
    prisma.permission.create({ data: { code: "audit.read" } }),
    prisma.permission.create({ data: { code: "marketing.read" } }),
    prisma.permission.create({ data: { code: "marketing.write" } }),
    prisma.permission.create({ data: { code: "marketing.dashboard" } }),
  ]);

  await prisma.rolePermission.createMany({
    data: [
      { roleId: roles[4].id, permissionId: permissions[0].id },
      { roleId: roles[4].id, permissionId: permissions[1].id },
      { roleId: roles[5].id, permissionId: permissions[4].id },
      { roleId: roles[0].id, permissionId: permissions[5].id },
      { roleId: roles[1].id, permissionId: permissions[5].id },
      { roleId: roles[1].id, permissionId: permissions[6].id },
      { roleId: roles[1].id, permissionId: permissions[7].id },
      { roleId: roles[2].id, permissionId: permissions[5].id },
      { roleId: roles[2].id, permissionId: permissions[6].id },
      { roleId: roles[2].id, permissionId: permissions[7].id },
      { roleId: roles[3].id, permissionId: permissions[5].id },
      { roleId: roles[3].id, permissionId: permissions[7].id },
      { roleId: roles[4].id, permissionId: permissions[5].id },
      { roleId: roles[4].id, permissionId: permissions[7].id },
      { roleId: roles[5].id, permissionId: permissions[5].id },
      { roleId: roles[5].id, permissionId: permissions[6].id },
      { roleId: roles[5].id, permissionId: permissions[7].id },
    ],
  });

  const businesses = await Promise.all(
    businessDefinitions.map((business) =>
      prisma.business.create({
        data: {
          organizationId: organization.id,
          name: business.name,
          code: business.code,
        },
      }),
    ),
  );

  const businessDepartments = new Map<string, string[]>();
  const businessTeams = new Map<
    string,
    { id: string; departmentId: string | null }[]
  >();

  for (const business of businesses) {
    const createdDepartments: string[] = [];
    for (const departmentName of departments) {
      const department = await prisma.department.create({
        data: {
          businessId: business.id,
          name: departmentName,
          code: departmentName.toLowerCase().replaceAll(" ", "-"),
        },
      });
      createdDepartments.push(department.id);
    }
    businessDepartments.set(business.id, createdDepartments);

    const teamRows: { id: string; departmentId: string | null }[] = [];
    for (const departmentId of createdDepartments.slice(0, 4)) {
      const team = await prisma.team.create({
        data: {
          businessId: business.id,
          departmentId,
          name: `Team ${teamRows.length + 1}`,
          code: `team-${teamRows.length + 1}`,
        },
      });
      teamRows.push({ id: team.id, departmentId });
    }
    businessTeams.set(business.id, teamRows);
  }

  const owner = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: businesses[0].id,
      departmentId: null,
      teamId: null,
      roleId: roles[4].id,
      firstName: "Amina",
      lastName: "Khan",
      email: "owner@embtelerp.com",
      passwordHash,
      designation: "Business Owner",
    },
  });

  const heads: (typeof owner)[] = [];
  for (let index = 0; index < businesses.length; index += 1) {
    const head = await prisma.employee.create({
      data: {
        organizationId: organization.id,
        businessId: businesses[index].id,
        departmentId:
          businessDepartments.get(businesses[index].id)?.[0] ?? null,
        teamId: businessTeams.get(businesses[index].id)?.[0]?.id ?? null,
        roleId: roles[3].id,
        reportsToId: owner.id,
        firstName: `Head${index + 1}`,
        lastName: "Lead",
        email: `head${index + 1}@embtelerp.com`,
        passwordHash,
        designation: `Department Head ${index + 1}`,
      },
    });
    heads.push(head);
  }

  const managers: (typeof owner)[] = [];
  for (let index = 0; index < 8; index += 1) {
    const parent = heads[index % heads.length];
    const businessId = parent.businessId;
    const manager = await prisma.employee.create({
      data: {
        organizationId: organization.id,
        businessId,
        departmentId: businessDepartments.get(businessId)?.[index % 4] ?? null,
        teamId: businessTeams.get(businessId)?.[index % 4]?.id ?? null,
        roleId: roles[2].id,
        reportsToId: parent.id,
        firstName: `Manager${index + 1}`,
        lastName: "Team",
        email: `manager${index + 1}@embtelerp.com`,
        passwordHash,
        designation: `Manager ${index + 1}`,
      },
    });
    managers.push(manager);
  }

  const executives: (typeof owner)[] = [];
  for (let index = 0; index < 25; index += 1) {
    const parent = managers[index % managers.length];
    const businessId = parent.businessId;
    const executive = await prisma.employee.create({
      data: {
        organizationId: organization.id,
        businessId,
        departmentId: parent.departmentId,
        teamId: parent.teamId,
        roleId: roles[1].id,
        reportsToId: parent.id,
        firstName: `Executive${index + 1}`,
        lastName: "Staff",
        email: `executive${index + 1}@embtelerp.com`,
        passwordHash,
        designation: `Executive ${index + 1}`,
      },
    });
    executives.push(executive);
  }

  const interns: (typeof owner)[] = [];
  for (let index = 0; index < 50; index += 1) {
    const parent = executives[index % executives.length];
    const intern = await prisma.employee.create({
      data: {
        organizationId: organization.id,
        businessId: parent.businessId,
        departmentId: parent.departmentId,
        teamId: parent.teamId,
        roleId: roles[0].id,
        reportsToId: parent.id,
        firstName: `Intern${index + 1}`,
        lastName: "Trainee",
        email: `intern${index + 1}@embtelerp.com`,
        passwordHash,
        designation: `Intern ${index + 1}`,
      },
    });
    interns.push(intern);
  }

  const allEmployees = [
    owner,
    ...heads,
    ...managers,
    ...executives,
    ...interns,
  ];
  for (const employee of allEmployees) {
    if (!employee.reportsToId) {
      continue;
    }

    let depth = 1;
    let currentManagerId: string | null = employee.reportsToId;
    while (currentManagerId !== null) {
      await prisma.employeeHierarchy.create({
        data: {
          employeeId: employee.id,
          managerId: currentManagerId,
          depth,
        },
      });

      const manager: Awaited<ReturnType<typeof prisma.employee.findUnique>> =
        await prisma.employee.findUnique({ where: { id: currentManagerId } });
      currentManagerId = manager?.reportsToId ?? null;
      depth += 1;
    }
  }

  await prisma.perspective.create({
    data: {
      userId: owner.id,
      currentPerspectiveId: owner.id,
      perspectiveType: PerspectiveType.SELF,
    },
  });

  console.log("Seed complete");
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
