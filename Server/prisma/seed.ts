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

  // ─── Seed Tasks ──────────────────────────────────────────────────────────────
  const taskStatuses = ["pending", "in_progress", "completed", "cancelled"];
  const taskPriorities = ["low", "medium", "high", "urgent"];
  const taskTitles = [
    "Review client application documents",
    "Prepare visa submission package",
    "Conduct credential evaluation",
    "Update employee records",
    "Process payroll for current month",
    "Schedule team meeting",
    "Prepare monthly report",
    "Follow up with client",
    "Complete training module",
    "Update project documentation",
    "Review code changes",
    "Test new feature deployment",
    "Prepare marketing materials",
    "Analyze sales data",
    "Create onboarding plan",
  ];

  const allTaskableEmployees = [...managers, ...executives, ...interns];
  const tasksCreated: string[] = [];
  for (let i = 0; i < 60; i += 1) {
    const assignee = allTaskableEmployees[i % allTaskableEmployees.length];
    const status = taskStatuses[i % taskStatuses.length];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (i % 30) - 10); // Some overdue, some future

    const task = await prisma.task.create({
      data: {
        businessId: assignee.businessId,
        departmentId: assignee.departmentId,
        teamId: assignee.teamId,
        assigneeId: assignee.id,
        createdById: assignee.reportsToId ?? owner.id,
        title: taskTitles[i % taskTitles.length],
        description: `Task #${i + 1} for ${assignee.firstName} ${assignee.lastName}`,
        status,
        priority: taskPriorities[i % taskPriorities.length],
        dueDate,
      },
    });
    tasksCreated.push(task.id);
  }

  // ─── Seed Marketing Campaigns ────────────────────────────────────────────────
  const campaignChannels = [
    "email",
    "social_media",
    "linkedin",
    "google_ads",
    "referral",
  ];
  const campaignStatuses = [
    "DRAFT",
    "ACTIVE",
    "PAUSED",
    "COMPLETED",
    "CANCELLED",
  ];

  for (let i = 0; i < 12; i += 1) {
    const business = businesses[i % businesses.length];
    const team = businessTeams.get(business.id)?.[i % 4];
    const head = heads[i % heads.length];

    const campaign = await prisma.marketingCampaign.create({
      data: {
        organizationId: organization.id,
        businessId: business.id,
        teamId: team?.id ?? null,
        createdById: head.id,
        assignedToId: head.id,
        name: `Campaign ${i + 1} - ${business.name}`,
        description: `Marketing campaign for ${business.name}`,
        channel: campaignChannels[i % campaignChannels.length],
        status: campaignStatuses[i % campaignStatuses.length] as any,
        startDate: new Date(2025, i % 12, 1),
        endDate: new Date(2025, (i % 12) + 1, 1),
        budget: Math.round(50000 + Math.random() * 200000),
        budgetSpent: Math.round(30000 + Math.random() * 150000),
        targetLeads: 50 + Math.round(Math.random() * 200),
        actualLeads: 30 + Math.round(Math.random() * 180),
      },
    });

    // ─── Seed Marketing KPIs for each campaign ────────────────────────────────
    const kpiTypes = [
      "LEADS_GENERATED",
      "CAMPAIGN_SUCCESS",
      "TASK_COMPLETION",
      "PRODUCTIVITY",
      "BUDGET_UTILIZATION",
    ];
    for (let k = 0; k < kpiTypes.length; k += 1) {
      const target = 50 + Math.round(Math.random() * 200);
      const value = Math.round(target * (0.3 + Math.random() * 0.8));
      await prisma.marketingKPI.create({
        data: {
          organizationId: organization.id,
          businessId: business.id,
          teamId: team?.id ?? null,
          employeeId: head.id,
          campaignId: campaign.id,
          metricType: kpiTypes[k] as any,
          name: `${kpiTypes[k].replace(/_/g, " ").toLowerCase()}`,
          value,
          target,
          periodStart: new Date(2025, i % 12, 1),
          periodEnd: new Date(2025, (i % 12) + 1, 1),
        },
      });
    }

    // ─── Seed Marketing Leads ────────────────────────────────────────────────
    const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];
    for (let l = 0; l < 5; l += 1) {
      await prisma.marketingLead.create({
        data: {
          organizationId: organization.id,
          businessId: business.id,
          teamId: team?.id ?? null,
          campaignId: campaign.id,
          createdById: head.id,
          assignedToId: head.id,
          name: `Lead ${i * 5 + l + 1} - ${business.name}`,
          email: `lead${i * 5 + l + 1}@example.com`,
          source: campaignChannels[l % campaignChannels.length],
          status: leadStatuses[l % leadStatuses.length] as any,
          estimatedValue: Math.round(10000 + Math.random() * 100000),
        },
      });
    }

    // ─── Seed Marketing Tasks ────────────────────────────────────────────────
    const marketingTaskStatuses = [
      "TODO",
      "IN_PROGRESS",
      "BLOCKED",
      "COMPLETED",
      "CANCELLED",
    ];
    for (let t = 0; t < 3; t += 1) {
      await prisma.marketingTask.create({
        data: {
          organizationId: organization.id,
          businessId: business.id,
          teamId: team?.id ?? null,
          campaignId: campaign.id,
          assignedToId: head.id,
          createdById: head.id,
          title: `Marketing Task ${t + 1} for Campaign ${i + 1}`,
          description: `Task for campaign ${campaign.name}`,
          status: marketingTaskStatuses[
            t % marketingTaskStatuses.length
          ] as any,
          priority: ["low", "medium", "high"][t % 3],
          dueDate: new Date(2025, (i % 12) + 1, 15),
        },
      });
    }
  }

  // ─── Seed Activities ────────────────────────────────────────────────────────
  for (let i = 0; i < 30; i += 1) {
    const actor = allTaskableEmployees[i % allTaskableEmployees.length];
    await prisma.activity.create({
      data: {
        businessId: actor.businessId,
        actorId: actor.id,
        targetType: "TASK",
        targetId: tasksCreated[i % tasksCreated.length] ?? null,
        action: "CREATE",
        metadata: { description: `Activity #${i + 1}` },
      },
    });
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
