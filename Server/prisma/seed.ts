import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password@123", 12);
  const organizationName = "Embtel ERP";

  console.log("Cleaning database...");
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

  console.log("Seeding Organization & Roles...");
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

  console.log("Seeding Businesses & Verticals & Teams...");
  // 1. Immigration Business
  const bImmigration = await prisma.business.create({
    data: { organizationId: organization.id, name: "Immigration Business", code: "immigration" },
  });
  const vImmigration = await prisma.vertical.create({
    data: { businessId: bImmigration.id, name: "Immigration Operations", code: "imm-ops" },
  });
  const tImmSales = await prisma.team.create({
    data: { businessId: bImmigration.id, verticalId: vImmigration.id, name: "Sales Team", code: "imm-sales" },
  });
  const tImmMarketing = await prisma.team.create({
    data: { businessId: bImmigration.id, verticalId: vImmigration.id, name: "Marketing Team", code: "imm-marketing" },
  });
  const tImmDocs = await prisma.team.create({
    data: { businessId: bImmigration.id, verticalId: vImmigration.id, name: "Documentation Team", code: "imm-docs" },
  });

  // 2. Credential Evaluation Business
  const bEvaluation = await prisma.business.create({
    data: { organizationId: organization.id, name: "Credential Evaluation Business", code: "evaluation" },
  });
  const vEvaluation = await prisma.vertical.create({
    data: { businessId: bEvaluation.id, name: "Evaluation Operations", code: "eval-ops" },
  });
  const tEvalSales = await prisma.team.create({
    data: { businessId: bEvaluation.id, verticalId: vEvaluation.id, name: "Sales Team", code: "eval-sales" },
  });
  const tEvalMarketing = await prisma.team.create({
    data: { businessId: bEvaluation.id, verticalId: vEvaluation.id, name: "Marketing Team", code: "eval-marketing" },
  });
  const tEvalDocs = await prisma.team.create({
    data: { businessId: bEvaluation.id, verticalId: vEvaluation.id, name: "Documentation Team", code: "eval-docs" },
  });

  // 3. HR Department
  const bHR = await prisma.business.create({
    data: { organizationId: organization.id, name: "HR Department", code: "hr-dept" },
  });
  const vHR = await prisma.vertical.create({
    data: { businessId: bHR.id, name: "HR Operations", code: "hr-ops" },
  });
  const tHR = await prisma.team.create({
    data: { businessId: bHR.id, verticalId: vHR.id, name: "HR Team", code: "hr-team" },
  });

  // 4. IT Services
  const bIT = await prisma.business.create({
    data: { organizationId: organization.id, name: "IT Services", code: "it-services" },
  });
  const vIT = await prisma.vertical.create({
    data: { businessId: bIT.id, name: "IT Operations", code: "it-ops" },
  });
  const tIT = await prisma.team.create({
    data: { businessId: bIT.id, verticalId: vIT.id, name: "IT Development Team", code: "it-team" },
  });

  console.log("Seeding Employee reporting structure...");

  // Top level
  const superAdmin = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, roleId: roles[5].id, firstName: "Super", lastName: "Admin", email: "superadmin@demo.com", passwordHash, designation: "Super Admin", level: 5 },
  });

  const businessOwner = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, roleId: roles[4].id, reportsToId: superAdmin.id, firstName: "Business", lastName: "Owner", email: "owner@demo.com", passwordHash, designation: "Business Owner", level: 4 },
  });

  // ─── IMMIGRATION EMPLOYEES ───
  const headImmigration = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, roleId: roles[3].id, reportsToId: businessOwner.id, firstName: "Immigration", lastName: "Head", email: "immigration.head@demo.com", passwordHash, designation: "Head of Immigration", level: 3 },
  });
  const verticalImmigration = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, verticalId: vImmigration.id, roleId: roles[2].id, reportsToId: headImmigration.id, firstName: "Immigration", lastName: "Vertical", email: "immigration.vertical@demo.com", passwordHash, designation: "Vertical Manager", level: 2 },
  });
  const salesHeadImm = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, teamId: tImmSales.id, verticalId: vImmigration.id, roleId: roles[2].id, reportsToId: verticalImmigration.id, firstName: "Sales", lastName: "Head", email: "sales.head@demo.com", passwordHash, designation: "Sales Head", level: 2 },
  });
  const salesExecImm = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, teamId: tImmSales.id, verticalId: vImmigration.id, roleId: roles[1].id, reportsToId: salesHeadImm.id, firstName: "Sales", lastName: "Exec", email: "sales.exec@demo.com", passwordHash, designation: "Sales Executive", level: 1 },
  });
  const salesInternImm = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, teamId: tImmSales.id, verticalId: vImmigration.id, roleId: roles[0].id, reportsToId: salesExecImm.id, firstName: "Sales", lastName: "Intern", email: "sales.intern@demo.com", passwordHash, designation: "Sales Intern", level: 0 },
  });

  const marketingManagerImm = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, teamId: tImmMarketing.id, verticalId: vImmigration.id, roleId: roles[2].id, reportsToId: verticalImmigration.id, firstName: "Marketing", lastName: "Manager", email: "marketing.manager@demo.com", passwordHash, designation: "Marketing Manager", level: 2 },
  });
  const marketingExecImm = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, teamId: tImmMarketing.id, verticalId: vImmigration.id, roleId: roles[1].id, reportsToId: marketingManagerImm.id, firstName: "Marketing", lastName: "Exec", email: "marketing.exec@demo.com", passwordHash, designation: "Marketing Executive", level: 1 },
  });
  const marketingInternImm = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, teamId: tImmMarketing.id, verticalId: vImmigration.id, roleId: roles[0].id, reportsToId: marketingExecImm.id, firstName: "Marketing", lastName: "Intern", email: "marketing.intern@demo.com", passwordHash, designation: "Marketing Intern", level: 0 },
  });

  const docManagerImm = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, teamId: tImmDocs.id, verticalId: vImmigration.id, roleId: roles[2].id, reportsToId: verticalImmigration.id, firstName: "Documentation", lastName: "Manager", email: "documentation.manager@demo.com", passwordHash, designation: "Documentation Manager", level: 2 },
  });
  const docExecImm = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, teamId: tImmDocs.id, verticalId: vImmigration.id, roleId: roles[1].id, reportsToId: docManagerImm.id, firstName: "Documentation", lastName: "Exec", email: "documentation.exec@demo.com", passwordHash, designation: "Documentation Executive", level: 1 },
  });
  const docInternImm = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bImmigration.id, teamId: tImmDocs.id, verticalId: vImmigration.id, roleId: roles[0].id, reportsToId: docExecImm.id, firstName: "Documentation", lastName: "Intern", email: "documentation.intern@demo.com", passwordHash, designation: "Documentation Intern", level: 0 },
  });

  // ─── CREDENTIAL EVALUATION EMPLOYEES ───
  const headEvaluation = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, roleId: roles[3].id, reportsToId: businessOwner.id, firstName: "Evaluation", lastName: "Head", email: "evaluation.head@demo.com", passwordHash, designation: "Head of Evaluation", level: 3 },
  });
  const verticalEvaluation = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, verticalId: vEvaluation.id, roleId: roles[2].id, reportsToId: headEvaluation.id, firstName: "Evaluation", lastName: "Vertical", email: "evaluation.vertical@demo.com", passwordHash, designation: "Vertical Manager", level: 2 },
  });
  const salesHeadEval = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, teamId: tEvalSales.id, verticalId: vEvaluation.id, roleId: roles[2].id, reportsToId: verticalEvaluation.id, firstName: "Eval Sales", lastName: "Head", email: "evaluation.sales.head@demo.com", passwordHash, designation: "Sales Head", level: 2 },
  });
  const salesExecEval = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, teamId: tEvalSales.id, verticalId: vEvaluation.id, roleId: roles[1].id, reportsToId: salesHeadEval.id, firstName: "Eval Sales", lastName: "Exec", email: "evaluation.sales.exec@demo.com", passwordHash, designation: "Sales Executive", level: 1 },
  });
  const salesInternEval = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, teamId: tEvalSales.id, verticalId: vEvaluation.id, roleId: roles[0].id, reportsToId: salesExecEval.id, firstName: "Eval Sales", lastName: "Intern", email: "evaluation.sales.intern@demo.com", passwordHash, designation: "Sales Intern", level: 0 },
  });

  const marketingManagerEval = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, teamId: tEvalMarketing.id, verticalId: vEvaluation.id, roleId: roles[2].id, reportsToId: verticalEvaluation.id, firstName: "Eval Marketing", lastName: "Manager", email: "evaluation.marketing.manager@demo.com", passwordHash, designation: "Marketing Manager", level: 2 },
  });
  const marketingExecEval = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, teamId: tEvalMarketing.id, verticalId: vEvaluation.id, roleId: roles[1].id, reportsToId: marketingManagerEval.id, firstName: "Eval Marketing", lastName: "Exec", email: "evaluation.marketing.exec@demo.com", passwordHash, designation: "Marketing Executive", level: 1 },
  });
  const marketingInternEval = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, teamId: tEvalMarketing.id, verticalId: vEvaluation.id, roleId: roles[0].id, reportsToId: marketingExecEval.id, firstName: "Eval Marketing", lastName: "Intern", email: "evaluation.marketing.intern@demo.com", passwordHash, designation: "Marketing Intern", level: 0 },
  });

  const docManagerEval = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, teamId: tEvalDocs.id, verticalId: vEvaluation.id, roleId: roles[2].id, reportsToId: verticalEvaluation.id, firstName: "Eval Doc", lastName: "Manager", email: "evaluation.documentation.manager@demo.com", passwordHash, designation: "Documentation Manager", level: 2 },
  });
  const docExecEval = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, teamId: tEvalDocs.id, verticalId: vEvaluation.id, roleId: roles[1].id, reportsToId: docManagerEval.id, firstName: "Eval Doc", lastName: "Exec", email: "evaluation.documentation.exec@demo.com", passwordHash, designation: "Documentation Executive", level: 1 },
  });
  const docInternEval = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, teamId: tEvalDocs.id, verticalId: vEvaluation.id, roleId: roles[0].id, reportsToId: docExecEval.id, firstName: "Eval Doc", lastName: "Intern", email: "evaluation.documentation.intern@demo.com", passwordHash, designation: "Documentation Intern", level: 0 },
  });
  const professorEval = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bEvaluation.id, roleId: roles[1].id, reportsToId: headEvaluation.id, firstName: "Eval", lastName: "Professor", email: "professor@demo.com", passwordHash, designation: "Professor", level: 1 },
  });

  // ─── HR EMPLOYEES ───
  const hrManager = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bHR.id, roleId: roles[3].id, reportsToId: businessOwner.id, firstName: "HR", lastName: "Manager", email: "hr.manager@demo.com", passwordHash, designation: "HR Manager", level: 3 },
  });
  const hrExec = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bHR.id, teamId: tHR.id, verticalId: vHR.id, roleId: roles[1].id, reportsToId: hrManager.id, firstName: "HR", lastName: "Exec", email: "hr.exec@demo.com", passwordHash, designation: "HR Executive", level: 1 },
  });
  const recruitmentExec = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bHR.id, teamId: tHR.id, verticalId: vHR.id, roleId: roles[1].id, reportsToId: hrManager.id, firstName: "Recruitment", lastName: "Exec", email: "recruitment.exec@demo.com", passwordHash, designation: "Recruitment Executive", level: 1 },
  });
  const hrIntern = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bHR.id, teamId: tHR.id, verticalId: vHR.id, roleId: roles[0].id, reportsToId: hrExec.id, firstName: "HR", lastName: "Intern", email: "hr.intern@demo.com", passwordHash, designation: "HR Intern", level: 0 },
  });

  // ─── IT EMPLOYEES ───
  const itHead = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bIT.id, roleId: roles[3].id, reportsToId: businessOwner.id, firstName: "IT", lastName: "Head", email: "it.head@demo.com", passwordHash, designation: "IT Head", level: 3 },
  });
  const devLead = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bIT.id, teamId: tIT.id, verticalId: vIT.id, roleId: roles[2].id, reportsToId: itHead.id, firstName: "Development", lastName: "Lead", email: "dev.lead@demo.com", passwordHash, designation: "Development Team Lead", level: 2 },
  });
  const developer = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bIT.id, teamId: tIT.id, verticalId: vIT.id, roleId: roles[1].id, reportsToId: devLead.id, firstName: "IT", lastName: "Developer", email: "developer@demo.com", passwordHash, designation: "Developer", level: 1 },
  });
  const marketingLeadIT = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bIT.id, teamId: tIT.id, verticalId: vIT.id, roleId: roles[2].id, reportsToId: itHead.id, firstName: "IT Marketing", lastName: "Lead", email: "it.marketing.lead@demo.com", passwordHash, designation: "Marketing Team Lead", level: 2 },
  });
  const salesLeadIT = await prisma.employee.create({
    data: { organizationId: organization.id, businessId: bIT.id, teamId: tIT.id, verticalId: vIT.id, roleId: roles[2].id, reportsToId: itHead.id, firstName: "IT Sales", lastName: "Lead", email: "it.sales.lead@demo.com", passwordHash, designation: "Sales Team Lead", level: 2 },
  });

  const allEmployees = [
    superAdmin, businessOwner,
    headImmigration, verticalImmigration, salesHeadImm, salesExecImm, salesInternImm,
    marketingManagerImm, marketingExecImm, marketingInternImm,
    docManagerImm, docExecImm, docInternImm,
    headEvaluation, verticalEvaluation, salesHeadEval, salesExecEval, salesInternEval,
    marketingManagerEval, marketingExecEval, marketingInternEval,
    docManagerEval, docExecEval, docInternEval, professorEval,
    hrManager, hrExec, recruitmentExec, hrIntern,
    itHead, devLead, developer, marketingLeadIT, salesLeadIT
  ];

  console.log("Generating employee hierarchy linkages...");
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

  console.log("Generating base tasks...");
  const tasksData = allEmployees.map(emp => ({
    businessId: emp.businessId,
    teamId: emp.teamId,
    verticalId: emp.verticalId,
    assigneeId: emp.id,
    createdById: superAdmin.id,
    title: `Optimize ${emp.designation || 'Role'} operations`,
    description: `Standard tasks for operational efficiency in the ${emp.designation} scope.`,
    status: "todo",
    priority: "medium",
    dueDate: new Date(Date.now() + 5 * 86400000),
  }));
  await prisma.task.createMany({ data: tasksData });

  console.log("Generating base KPIs...");
  const pStart = new Date("2025-06-01");
  const pEnd = new Date("2025-06-30");
  const kpisData = allEmployees.map(emp => ({
    organizationId: organization.id,
    businessId: emp.businessId,
    teamId: emp.teamId,
    verticalId: emp.verticalId,
    employeeId: emp.id,
    metricType: "TASK_COMPLETION" as const,
    name: "Standard Task Completion KPI",
    value: 85,
    target: 90,
    periodStart: pStart,
    periodEnd: pEnd,
  }));
  await prisma.marketingKPI.createMany({ data: kpisData });

  console.log(`Seeding complete. Seeded ${allEmployees.length} employees successfully.`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
