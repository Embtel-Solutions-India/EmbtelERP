import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash("Password@123", 12);

const organizationName = "Embtel ERP";

async function main() {
  // ─── Clean existing data ──────────────────────────────────────────────────
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
  await prisma.perspectiveSession.deleteMany();
  await prisma.employeeHierarchy.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.team.deleteMany();
  await prisma.vertical.deleteMany();
  await prisma.department.deleteMany();
  await prisma.business.deleteMany();
  await prisma.organization.deleteMany();

  // ─── Create Organization ──────────────────────────────────────────────────
  const organization = await prisma.organization.create({
    data: {
      name: organizationName,
      slug: "embtel-erp",
    },
  });

  // ─── Create Roles ─────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.create({ data: { name: "Intern", level: 0 } }),
    prisma.role.create({ data: { name: "Executive", level: 1 } }),
    prisma.role.create({ data: { name: "Manager", level: 2 } }),
    prisma.role.create({ data: { name: "Head", level: 3 } }),
    prisma.role.create({ data: { name: "Business Owner", level: 4 } }),
    prisma.role.create({ data: { name: "Super Admin", level: 5 } }),
  ]);

  // ─── Create Permissions ───────────────────────────────────────────────────
  const permissions = await Promise.all([
    prisma.permission.create({ data: { code: "employee.read" } }),
    prisma.permission.create({ data: { code: "employee.write" } }),
    prisma.permission.create({ data: { code: "task.read" } }),
    prisma.permission.create({ data: { code: "task.write" } }),
    prisma.permission.create({ data: { code: "audit.read" } }),
    prisma.permission.create({ data: { code: "marketing.read" } }),
    prisma.permission.create({ data: { code: "marketing.write" } }),
    prisma.permission.create({ data: { code: "marketing.dashboard" } }),
    prisma.permission.create({ data: { code: "dashboard.business_owner" } }),
    prisma.permission.create({ data: { code: "dashboard.head" } }),
    prisma.permission.create({ data: { code: "dashboard.vertical" } }),
    prisma.permission.create({ data: { code: "dashboard.team_manager" } }),
    prisma.permission.create({ data: { code: "dashboard.employee" } }),
  ]);

  // Assign permissions to roles
  await prisma.rolePermission.createMany({
    data: [
      // Business Owner (level 4)
      { roleId: roles[4].id, permissionId: permissions[0].id },
      { roleId: roles[4].id, permissionId: permissions[1].id },
      { roleId: roles[4].id, permissionId: permissions[5].id },
      { roleId: roles[4].id, permissionId: permissions[7].id },
      { roleId: roles[4].id, permissionId: permissions[8].id },
      // Super Admin (level 5)
      { roleId: roles[5].id, permissionId: permissions[4].id },
      { roleId: roles[5].id, permissionId: permissions[5].id },
      { roleId: roles[5].id, permissionId: permissions[6].id },
      { roleId: roles[5].id, permissionId: permissions[7].id },
      // Intern (level 0)
      { roleId: roles[0].id, permissionId: permissions[5].id },
      { roleId: roles[0].id, permissionId: permissions[12].id },
      // Executive (level 1)
      { roleId: roles[1].id, permissionId: permissions[5].id },
      { roleId: roles[1].id, permissionId: permissions[6].id },
      { roleId: roles[1].id, permissionId: permissions[7].id },
      { roleId: roles[1].id, permissionId: permissions[12].id },
      // Manager (level 2)
      { roleId: roles[2].id, permissionId: permissions[5].id },
      { roleId: roles[2].id, permissionId: permissions[6].id },
      { roleId: roles[2].id, permissionId: permissions[7].id },
      { roleId: roles[2].id, permissionId: permissions[11].id },
      // Head (level 3)
      { roleId: roles[3].id, permissionId: permissions[5].id },
      { roleId: roles[3].id, permissionId: permissions[7].id },
      { roleId: roles[3].id, permissionId: permissions[9].id },
    ],
  });

  // ─── Create Business ──────────────────────────────────────────────────────
  const business = await prisma.business.create({
    data: {
      organizationId: organization.id,
      name: "Immigration Business",
      code: "immigration",
    },
  });

  // ─── Create Vertical ──────────────────────────────────────────────────────
  const vertical = await prisma.vertical.create({
    data: {
      businessId: business.id,
      name: "Immigration Operations",
      code: "imm-ops",
    },
  });

  // ─── Create Teams ─────────────────────────────────────────────────────────
  const salesTeam = await prisma.team.create({
    data: {
      businessId: business.id,
      verticalId: vertical.id,
      name: "Sales Team",
      code: "imm-sales",
    },
  });

  const marketingTeam = await prisma.team.create({
    data: {
      businessId: business.id,
      verticalId: vertical.id,
      name: "Marketing Team",
      code: "imm-marketing",
    },
  });

  const documentationTeam = await prisma.team.create({
    data: {
      businessId: business.id,
      verticalId: vertical.id,
      name: "Documentation Team",
      code: "imm-docs",
    },
  });

  // ─── Create Employees (Hierarchy) ─────────────────────────────────────────
  // Level 5: Super Admin
  const superAdmin = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      roleId: roles[5].id,
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@demo.com",
      passwordHash,
      designation: "Super Admin",
      level: 5,
    },
  });

  // Level 4: Business Owner
  const businessOwner = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      roleId: roles[4].id,
      reportsToId: superAdmin.id,
      firstName: "Business",
      lastName: "Owner",
      email: "owner@demo.com",
      passwordHash,
      designation: "Business Owner",
      level: 4,
    },
  });

  // Level 3: Head of Immigration
  const headImmigration = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      roleId: roles[3].id,
      reportsToId: businessOwner.id,
      firstName: "Immigration",
      lastName: "Head",
      email: "immigration.head@demo.com",
      passwordHash,
      designation: "Head of Immigration",
      level: 3,
    },
  });

  // Level 2: Vertical Manager
  const verticalManager = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      verticalId: vertical.id,
      roleId: roles[2].id,
      reportsToId: headImmigration.id,
      firstName: "Immigration",
      lastName: "Vertical",
      email: "immigration.vertical@demo.com",
      passwordHash,
      designation: "Vertical Manager",
      level: 2,
    },
  });

  // Level 2: Sales Head
  const salesHead = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      teamId: salesTeam.id,
      verticalId: vertical.id,
      roleId: roles[2].id,
      reportsToId: verticalManager.id,
      firstName: "Sales",
      lastName: "Head",
      email: "sales.head@demo.com",
      passwordHash,
      designation: "Sales Head",
      level: 2,
    },
  });

  // Level 2: Marketing Manager
  const marketingManager = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      teamId: marketingTeam.id,
      verticalId: vertical.id,
      roleId: roles[2].id,
      reportsToId: verticalManager.id,
      firstName: "Marketing",
      lastName: "Manager",
      email: "marketing.manager@demo.com",
      passwordHash,
      designation: "Marketing Manager",
      level: 2,
    },
  });

  // Level 2: Documentation Manager
  const documentationManager = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      teamId: documentationTeam.id,
      verticalId: vertical.id,
      roleId: roles[2].id,
      reportsToId: verticalManager.id,
      firstName: "Documentation",
      lastName: "Manager",
      email: "documentation.manager@demo.com",
      passwordHash,
      designation: "Documentation Manager",
      level: 2,
    },
  });

  // Level 1: Sales Executive
  const salesExecutive = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      teamId: salesTeam.id,
      verticalId: vertical.id,
      roleId: roles[1].id,
      reportsToId: salesHead.id,
      firstName: "Sales",
      lastName: "Exec",
      email: "sales.exec@demo.com",
      passwordHash,
      designation: "Sales Executive",
      level: 1,
    },
  });

  // Level 1: Marketing Executive
  const marketingExecutive = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      teamId: marketingTeam.id,
      verticalId: vertical.id,
      roleId: roles[1].id,
      reportsToId: marketingManager.id,
      firstName: "Marketing",
      lastName: "Exec",
      email: "marketing.exec@demo.com",
      passwordHash,
      designation: "Marketing Executive",
      level: 1,
    },
  });

  // Level 1: Documentation Executive
  const documentationExecutive = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      teamId: documentationTeam.id,
      verticalId: vertical.id,
      roleId: roles[1].id,
      reportsToId: documentationManager.id,
      firstName: "Documentation",
      lastName: "Exec",
      email: "documentation.exec@demo.com",
      passwordHash,
      designation: "Documentation Executive",
      level: 1,
    },
  });

  // Level 0: Sales Intern
  const salesIntern = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      teamId: salesTeam.id,
      verticalId: vertical.id,
      roleId: roles[0].id,
      reportsToId: salesExecutive.id,
      firstName: "Sales",
      lastName: "Intern",
      email: "sales.intern@demo.com",
      passwordHash,
      designation: "Sales Intern",
      level: 0,
    },
  });

  // Level 0: Marketing Intern
  const marketingIntern = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      teamId: marketingTeam.id,
      verticalId: vertical.id,
      roleId: roles[0].id,
      reportsToId: marketingExecutive.id,
      firstName: "Marketing",
      lastName: "Intern",
      email: "marketing.intern@demo.com",
      passwordHash,
      designation: "Marketing Intern",
      level: 0,
    },
  });

  // Level 0: Documentation Intern
  const documentationIntern = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: business.id,
      teamId: documentationTeam.id,
      verticalId: vertical.id,
      roleId: roles[0].id,
      reportsToId: documentationExecutive.id,
      firstName: "Documentation",
      lastName: "Intern",
      email: "documentation.intern@demo.com",
      passwordHash,
      designation: "Documentation Intern",
      level: 0,
    },
  });

  // ─── Build EmployeeHierarchy records ──────────────────────────────────────
  const allEmployees = [
    superAdmin,
    businessOwner,
    headImmigration,
    verticalManager,
    salesHead,
    marketingManager,
    documentationManager,
    salesExecutive,
    marketingExecutive,
    documentationExecutive,
    salesIntern,
    marketingIntern,
    documentationIntern,
  ];

  for (const employee of allEmployees) {
    if (!employee.reportsToId) continue;

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

      const manager: { id: string; reportsToId: string | null } | null =
        await prisma.employee.findUnique({
          where: { id: currentManagerId },
          select: { id: true, reportsToId: true },
        });
      currentManagerId = manager?.reportsToId ?? null;
      depth += 1;
    }
  }

  // ─── Tasks ────────────────────────────────────────────────────────────────
  const now = new Date();
  const past = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 86_400_000);
  const future = (daysAhead: number) =>
    new Date(now.getTime() + daysAhead * 86_400_000);

  await prisma.task.createMany({
    data: [
      // ── Sales Head ──
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesHead.id, createdById: salesHead.id, title: "Review Q1 sales pipeline", status: "completed", priority: "high", dueDate: past(10) },
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesHead.id, createdById: salesHead.id, title: "Update CRM lead statuses", status: "completed", priority: "medium", dueDate: past(5) },
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesHead.id, createdById: salesHead.id, title: "Prepare team performance report", status: "in_progress", priority: "high", dueDate: future(3) },
      // ── Sales Executive ──
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesExecutive.id, createdById: salesHead.id, title: "Follow up with 10 leads", status: "completed", priority: "high", dueDate: past(8) },
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesExecutive.id, createdById: salesHead.id, title: "Submit daily sales log", status: "completed", priority: "low", dueDate: past(3) },
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesExecutive.id, createdById: salesHead.id, title: "Schedule client demo calls", status: "completed", priority: "medium", dueDate: past(1) },
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesExecutive.id, createdById: salesHead.id, title: "Research competitor pricing", status: "in_progress", priority: "medium", dueDate: future(5) },
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesExecutive.id, createdById: salesHead.id, title: "Update proposal templates", status: "pending", priority: "low", dueDate: past(2) },
      // ── Sales Intern ──
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesIntern.id, createdById: salesExecutive.id, title: "Compile lead contact list", status: "completed", priority: "medium", dueDate: past(6) },
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesIntern.id, createdById: salesExecutive.id, title: "Data entry in CRM", status: "in_progress", priority: "low", dueDate: future(2) },
      { businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, assigneeId: salesIntern.id, createdById: salesExecutive.id, title: "Shadow executive on calls", status: "pending", priority: "low", dueDate: past(1) },
      // ── Marketing Manager ──
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingManager.id, createdById: marketingManager.id, title: "Plan Q2 campaign calendar", status: "completed", priority: "high", dueDate: past(7) },
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingManager.id, createdById: marketingManager.id, title: "Review social media analytics", status: "completed", priority: "medium", dueDate: past(4) },
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingManager.id, createdById: marketingManager.id, title: "Approve campaign creatives", status: "in_progress", priority: "high", dueDate: future(2) },
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingManager.id, createdById: marketingManager.id, title: "Submit budget utilization report", status: "pending", priority: "medium", dueDate: past(1) },
      // ── Marketing Executive ──
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingExecutive.id, createdById: marketingManager.id, title: "Create Instagram content batch", status: "completed", priority: "medium", dueDate: past(9) },
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingExecutive.id, createdById: marketingManager.id, title: "Run email outreach campaign", status: "completed", priority: "high", dueDate: past(5) },
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingExecutive.id, createdById: marketingManager.id, title: "Analyse campaign CTR", status: "in_progress", priority: "medium", dueDate: future(4) },
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingExecutive.id, createdById: marketingManager.id, title: "Write blog post draft", status: "pending", priority: "low", dueDate: past(3) },
      // ── Marketing Intern ──
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingIntern.id, createdById: marketingExecutive.id, title: "Schedule social media posts", status: "completed", priority: "low", dueDate: past(4) },
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingIntern.id, createdById: marketingExecutive.id, title: "Collect competitor social stats", status: "in_progress", priority: "low", dueDate: future(3) },
      { businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, assigneeId: marketingIntern.id, createdById: marketingExecutive.id, title: "Resize banner assets", status: "pending", priority: "low", dueDate: past(2) },
      // ── Documentation Manager ──
      { businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, assigneeId: documentationManager.id, createdById: documentationManager.id, title: "Review visa process documents", status: "completed", priority: "high", dueDate: past(8) },
      { businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, assigneeId: documentationManager.id, createdById: documentationManager.id, title: "Update SOP templates", status: "completed", priority: "medium", dueDate: past(5) },
      { businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, assigneeId: documentationManager.id, createdById: documentationManager.id, title: "Audit submitted client files", status: "in_progress", priority: "high", dueDate: future(1) },
      // ── Documentation Executive ──
      { businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, assigneeId: documentationExecutive.id, createdById: documentationManager.id, title: "Prepare client file packages", status: "completed", priority: "high", dueDate: past(6) },
      { businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, assigneeId: documentationExecutive.id, createdById: documentationManager.id, title: "Index archive folders", status: "completed", priority: "medium", dueDate: past(3) },
      { businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, assigneeId: documentationExecutive.id, createdById: documentationManager.id, title: "Cross-check application forms", status: "completed", priority: "high", dueDate: past(1) },
      { businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, assigneeId: documentationExecutive.id, createdById: documentationManager.id, title: "Courier pending documents", status: "pending", priority: "medium", dueDate: past(2) },
      // ── Documentation Intern ──
      { businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, assigneeId: documentationIntern.id, createdById: documentationExecutive.id, title: "Scan and upload client IDs", status: "completed", priority: "low", dueDate: past(5) },
      { businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, assigneeId: documentationIntern.id, createdById: documentationExecutive.id, title: "Sort physical file cabinet", status: "in_progress", priority: "low", dueDate: future(2) },
    ],
  });

  // ─── Marketing KPIs ───────────────────────────────────────────────────────
  const p1Start = new Date("2025-01-01");
  const p1End = new Date("2025-01-31");
  const p2Start = new Date("2025-02-01");
  const p2End = new Date("2025-02-28");

  await prisma.marketingKPI.createMany({
    data: [
      // ── Sales Team ──
      { organizationId: organization.id, businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, metricType: "LEADS_GENERATED", name: "New Leads Jan", value: 24, target: 30, periodStart: p1Start, periodEnd: p1End },
      { organizationId: organization.id, businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, metricType: "CAMPAIGN_SUCCESS", name: "Conversions Jan", value: 18, target: 20, periodStart: p1Start, periodEnd: p1End },
      { organizationId: organization.id, businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, metricType: "LEADS_GENERATED", name: "New Leads Feb", value: 29, target: 30, periodStart: p2Start, periodEnd: p2End },
      { organizationId: organization.id, businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, metricType: "CAMPAIGN_SUCCESS", name: "Conversions Feb", value: 22, target: 20, periodStart: p2Start, periodEnd: p2End },
      // ── Marketing Team ──
      { organizationId: organization.id, businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, metricType: "LEADS_GENERATED", name: "Marketing Leads Jan", value: 31, target: 30, periodStart: p1Start, periodEnd: p1End },
      { organizationId: organization.id, businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, metricType: "BUDGET_UTILIZATION", name: "Budget Used Jan", value: 85000, target: 100000, periodStart: p1Start, periodEnd: p1End },
      { organizationId: organization.id, businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, metricType: "LEADS_GENERATED", name: "Marketing Leads Feb", value: 27, target: 35, periodStart: p2Start, periodEnd: p2End },
      { organizationId: organization.id, businessId: business.id, teamId: marketingTeam.id, verticalId: vertical.id, metricType: "BUDGET_UTILIZATION", name: "Budget Used Feb", value: 92000, target: 100000, periodStart: p2Start, periodEnd: p2End },
      // ── Documentation Team ──
      { organizationId: organization.id, businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, metricType: "CAMPAIGN_SUCCESS", name: "Files Processed Jan", value: 48, target: 50, periodStart: p1Start, periodEnd: p1End },
      { organizationId: organization.id, businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, metricType: "BUDGET_UTILIZATION", name: "Ops Budget Jan", value: 32000, target: 40000, periodStart: p1Start, periodEnd: p1End },
      { organizationId: organization.id, businessId: business.id, teamId: documentationTeam.id, verticalId: vertical.id, metricType: "CAMPAIGN_SUCCESS", name: "Files Processed Feb", value: 54, target: 50, periodStart: p2Start, periodEnd: p2End },
      // ── Individual KPIs (Sales Executive) ──
      { organizationId: organization.id, businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, employeeId: salesExecutive.id, metricType: "LEADS_GENERATED", name: "Exec Leads Jan", value: 12, target: 15, periodStart: p1Start, periodEnd: p1End },
      { organizationId: organization.id, businessId: business.id, teamId: salesTeam.id, verticalId: vertical.id, employeeId: salesExecutive.id, metricType: "LEADS_GENERATED", name: "Exec Leads Feb", value: 14, target: 15, periodStart: p2Start, periodEnd: p2End },
      // ── Business-level rollup ──
      { organizationId: organization.id, businessId: business.id, metricType: "LEADS_GENERATED", name: "Business Leads Q1", value: 55, target: 60, periodStart: p1Start, periodEnd: p1End },
      { organizationId: organization.id, businessId: business.id, metricType: "BUDGET_UTILIZATION", name: "Business Budget Q1", value: 202000, target: 240000, periodStart: p1Start, periodEnd: p1End },
    ],
  });

  console.log("Seed complete with new hierarchy structure");
  console.log(`Created: ${allEmployees.length} employees`);
  console.log("Hierarchy:");
  console.log("  Super Admin (Level 5)");
  console.log("    └── Business Owner (Level 4)");
  console.log("        └── Head of Immigration (Level 3)");
  console.log("            └── Vertical Manager (Level 2)");
  console.log("                ├── Sales Head (Level 2)");
  console.log("                │   └── Sales Executive (Level 1)");
  console.log("                │       └── Sales Intern (Level 0)");
  console.log("                ├── Marketing Manager (Level 2)");
  console.log("                │   └── Marketing Executive (Level 1)");
  console.log("                │       └── Marketing Intern (Level 0)");
  console.log("                └── Documentation Manager (Level 2)");
  console.log("                    └── Documentation Executive (Level 1)");
  console.log("                        └── Documentation Intern (Level 0)");
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
