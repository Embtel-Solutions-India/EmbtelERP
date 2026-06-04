import bcrypt from "bcryptjs";
import { PrismaClient, PerspectiveType } from "@prisma/client";

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash("Password@123", 12);

const organizationName = "Embtel ERP";

// ─── Business Definitions ─────────────────────────────────────────────────────
const businessDefinitions = [
  { name: "Immigration Business", code: "immigration" },
  { name: "Credential Evaluation", code: "credential-evaluation" },
  { name: "HR Department", code: "hr" },
  { name: "IT Services & Inhouse Team", code: "it-services" },
];

// ─── Vertical Definitions per Business ─────────────────────────────────────────
// Immigration: Sales, Marketing, Documentation
// Credential Evaluation: Sales, Marketing, Documentation, Professors
// HR: Recruitment
// IT: Sales, Marketing, Development
const verticalDefinitions: Record<string, { name: string; code: string }[]> = {
  immigration: [{ name: "Immigration Operations", code: "imm-ops" }],
  "credential-evaluation": [
    { name: "Evaluation Operations", code: "eval-ops" },
  ],
  hr: [{ name: "HR Operations", code: "hr-ops" }],
  "it-services": [{ name: "IT Operations", code: "it-ops" }],
};

// ─── Team Definitions per Vertical ────────────────────────────────────────────
const teamDefinitions: Record<string, { name: string; code: string }[]> = {
  "imm-ops": [
    { name: "Sales Team", code: "imm-sales" },
    { name: "Marketing Team", code: "imm-marketing" },
    { name: "Documentation Team", code: "imm-docs" },
  ],
  "eval-ops": [
    { name: "Sales Team", code: "eval-sales" },
    { name: "Marketing Team", code: "eval-marketing" },
    { name: "Documentation Team", code: "eval-docs" },
    { name: "Professors Team", code: "eval-professors" },
  ],
  "hr-ops": [{ name: "Recruitment Team", code: "hr-recruitment" }],
  "it-ops": [
    { name: "Sales Team", code: "it-sales" },
    { name: "Marketing Team", code: "it-marketing" },
    { name: "Development Team", code: "it-dev" },
  ],
};

// ─── Designation Templates ────────────────────────────────────────────────────
const designationTemplates: Record<string, string> = {
  "Head of Immigration": "Head of Immigration",
  "Head of Evaluation": "Head of Evaluation",
  "HR Manager": "HR Manager",
  "IT Head": "IT Head",
  "Vertical Manager": "Vertical Manager",
  "Sales Head": "Sales Head",
  "Marketing Manager": "Marketing Manager",
  "Documentation Manager": "Documentation Manager",
  "Sales Executive": "Sales Executive",
  "Marketing Executive": "Marketing Executive",
  "Documentation Executive": "Documentation Executive",
  "Recruitment Executive": "Recruitment Executive",
  "Sales Intern": "Sales Intern",
  "Marketing Intern": "Marketing Intern",
  "Documentation Intern": "Documentation Intern",
  "HR Intern": "HR Intern",
  Professor: "Professor",
};

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

  // ─── Create Businesses ────────────────────────────────────────────────────
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

  const businessMap = new Map(businesses.map((b) => [b.code, b]));

  // ─── Create Verticals ─────────────────────────────────────────────────────
  const verticalMap = new Map<
    string,
    { id: string; code: string; businessId: string }[]
  >();

  for (const [businessCode, verticals] of Object.entries(verticalDefinitions)) {
    const business = businessMap.get(businessCode);
    if (!business) continue;

    const createdVerticals: { id: string; code: string; businessId: string }[] =
      [];
    for (const vertical of verticals) {
      const v = await prisma.vertical.create({
        data: {
          businessId: business.id,
          name: vertical.name,
          code: vertical.code,
        },
      });
      createdVerticals.push({
        id: v.id,
        code: v.code,
        businessId: business.id,
      });
    }
    verticalMap.set(businessCode, createdVerticals);
  }

  // ─── Create Teams ─────────────────────────────────────────────────────────
  const teamMap = new Map<
    string,
    { id: string; code: string; verticalId: string; businessId: string }[]
  >();

  for (const [verticalCode, teams] of Object.entries(teamDefinitions)) {
    // Find which business this vertical belongs to
    let verticalId: string | null = null;
    let businessId: string | null = null;
    for (const [, verticals] of verticalMap) {
      const found = verticals.find((v) => v.code === verticalCode);
      if (found) {
        verticalId = found.id;
        businessId = found.businessId;
        break;
      }
    }
    if (!verticalId || !businessId) continue;

    const createdTeams: {
      id: string;
      code: string;
      verticalId: string;
      businessId: string;
    }[] = [];
    for (const team of teams) {
      const t = await prisma.team.create({
        data: {
          businessId,
          verticalId,
          name: team.name,
          code: team.code,
        },
      });
      createdTeams.push({ id: t.id, code: t.code, verticalId, businessId });
    }
    teamMap.set(verticalCode, createdTeams);
  }

  // ─── Helper: Get team by code ─────────────────────────────────────────────
  function getTeamByCode(code: string) {
    for (const [, teams] of teamMap) {
      const found = teams.find((t) => t.code === code);
      if (found) return found;
    }
    return null;
  }

  function getVerticalByCode(code: string) {
    for (const [, verticals] of verticalMap) {
      const found = verticals.find((v) => v.code === code);
      if (found) return found;
    }
    return null;
  }

  // ─── Create Employees (Hierarchy) ─────────────────────────────────────────
  // Level 5: Super Admin
  const superAdmin = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: businessMap.get("immigration")!.id,
      roleId: roles[5].id,
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@embtelerp.com",
      passwordHash,
      designation: "Super Admin",
      level: 5,
    },
  });

  // Level 4: Business Owner
  const businessOwner = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: businessMap.get("immigration")!.id,
      roleId: roles[4].id,
      reportsToId: superAdmin.id,
      firstName: "Amina",
      lastName: "Khan",
      email: "owner@embtelerp.com",
      passwordHash,
      designation: "Business Owner",
      level: 4,
    },
  });

  // ─── Immigration Business Hierarchy ───────────────────────────────────────
  const immBusiness = businessMap.get("immigration")!;
  const immVertical = getVerticalByCode("imm-ops")!;

  // Head of Immigration
  const headImmigration = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: immBusiness.id,
      roleId: roles[3].id,
      reportsToId: businessOwner.id,
      firstName: "Rajesh",
      lastName: "Kumar",
      email: "head.immigration@embtelerp.com",
      passwordHash,
      designation: "Head of Immigration",
      level: 3,
    },
  });

  // Vertical Manager - Immigration
  const verticalManagerImm = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: immBusiness.id,
      verticalId: immVertical.id,
      roleId: roles[2].id,
      reportsToId: headImmigration.id,
      firstName: "Priya",
      lastName: "Sharma",
      email: "vm.immigration@embtelerp.com",
      passwordHash,
      designation: "Vertical Manager",
      level: 2,
    },
  });

  // Sales Head - Immigration
  const immSalesTeam = getTeamByCode("imm-sales")!;
  const salesHeadImm = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: immBusiness.id,
      teamId: immSalesTeam.id,
      verticalId: immVertical.id,
      roleId: roles[2].id,
      reportsToId: verticalManagerImm.id,
      firstName: "Amit",
      lastName: "Patel",
      email: "sales.head.imm@embtelerp.com",
      passwordHash,
      designation: "Sales Head",
      level: 2,
    },
  });

  // Marketing Manager - Immigration
  const immMarketingTeam = getTeamByCode("imm-marketing")!;
  const marketingMgrImm = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: immBusiness.id,
      teamId: immMarketingTeam.id,
      verticalId: immVertical.id,
      roleId: roles[2].id,
      reportsToId: verticalManagerImm.id,
      firstName: "Neha",
      lastName: "Gupta",
      email: "marketing.mgr.imm@embtelerp.com",
      passwordHash,
      designation: "Marketing Manager",
      level: 2,
    },
  });

  // Documentation Manager - Immigration
  const immDocsTeam = getTeamByCode("imm-docs")!;
  const docsMgrImm = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: immBusiness.id,
      teamId: immDocsTeam.id,
      verticalId: immVertical.id,
      roleId: roles[2].id,
      reportsToId: verticalManagerImm.id,
      firstName: "Suresh",
      lastName: "Reddy",
      email: "docs.mgr.imm@embtelerp.com",
      passwordHash,
      designation: "Documentation Manager",
      level: 2,
    },
  });

  // ─── Credential Evaluation Business Hierarchy ─────────────────────────────
  const evalBusiness = businessMap.get("credential-evaluation")!;
  const evalVertical = getVerticalByCode("eval-ops")!;

  // Head of Evaluation
  const headEvaluation = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: evalBusiness.id,
      roleId: roles[3].id,
      reportsToId: businessOwner.id,
      firstName: "Dr. Meera",
      lastName: "Iyer",
      email: "head.evaluation@embtelerp.com",
      passwordHash,
      designation: "Head of Evaluation",
      level: 3,
    },
  });

  // Vertical Manager - Evaluation
  const verticalManagerEval = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: evalBusiness.id,
      verticalId: evalVertical.id,
      roleId: roles[2].id,
      reportsToId: headEvaluation.id,
      firstName: "Karthik",
      lastName: "Nair",
      email: "vm.evaluation@embtelerp.com",
      passwordHash,
      designation: "Vertical Manager",
      level: 2,
    },
  });

  // Sales Head - Evaluation
  const evalSalesTeam = getTeamByCode("eval-sales")!;
  const salesHeadEval = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: evalBusiness.id,
      teamId: evalSalesTeam.id,
      verticalId: evalVertical.id,
      roleId: roles[2].id,
      reportsToId: verticalManagerEval.id,
      firstName: "Vikram",
      lastName: "Singh",
      email: "sales.head.eval@embtelerp.com",
      passwordHash,
      designation: "Sales Head",
      level: 2,
    },
  });

  // Marketing Manager - Evaluation
  const evalMarketingTeam = getTeamByCode("eval-marketing")!;
  const marketingMgrEval = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: evalBusiness.id,
      teamId: evalMarketingTeam.id,
      verticalId: evalVertical.id,
      roleId: roles[2].id,
      reportsToId: verticalManagerEval.id,
      firstName: "Ananya",
      lastName: "Das",
      email: "marketing.mgr.eval@embtelerp.com",
      passwordHash,
      designation: "Marketing Manager",
      level: 2,
    },
  });

  // Documentation Manager - Evaluation
  const evalDocsTeam = getTeamByCode("eval-docs")!;
  const docsMgrEval = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: evalBusiness.id,
      teamId: evalDocsTeam.id,
      verticalId: evalVertical.id,
      roleId: roles[2].id,
      reportsToId: verticalManagerEval.id,
      firstName: "Lakshmi",
      lastName: "Rao",
      email: "docs.mgr.eval@embtelerp.com",
      passwordHash,
      designation: "Documentation Manager",
      level: 2,
    },
  });

  // Professors - Evaluation
  const evalProfessorsTeam = getTeamByCode("eval-professors")!;
  const professorEval = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: evalBusiness.id,
      teamId: evalProfessorsTeam.id,
      verticalId: evalVertical.id,
      roleId: roles[2].id,
      reportsToId: verticalManagerEval.id,
      firstName: "Dr. Ramesh",
      lastName: "Joshi",
      email: "professor.eval@embtelerp.com",
      passwordHash,
      designation: "Professor",
      level: 2,
    },
  });

  // ─── HR Department Hierarchy ──────────────────────────────────────────────
  const hrBusiness = businessMap.get("hr")!;
  const hrVertical = getVerticalByCode("hr-ops")!;

  // HR Manager
  const hrManager = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: hrBusiness.id,
      roleId: roles[3].id,
      reportsToId: businessOwner.id,
      firstName: "Sunita",
      lastName: "Verma",
      email: "hr.manager@embtelerp.com",
      passwordHash,
      designation: "HR Manager",
      level: 3,
    },
  });

  // HR Executive
  const hrRecruitmentTeam = getTeamByCode("hr-recruitment")!;
  const hrExecutive = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: hrBusiness.id,
      teamId: hrRecruitmentTeam.id,
      verticalId: hrVertical.id,
      roleId: roles[1].id,
      reportsToId: hrManager.id,
      firstName: "Pooja",
      lastName: "Malhotra",
      email: "hr.executive@embtelerp.com",
      passwordHash,
      designation: "HR Executive",
      level: 1,
    },
  });

  // Recruitment Executive
  const recruitmentExecutive = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: hrBusiness.id,
      teamId: hrRecruitmentTeam.id,
      verticalId: hrVertical.id,
      roleId: roles[1].id,
      reportsToId: hrExecutive.id,
      firstName: "Rahul",
      lastName: "Kapoor",
      email: "recruitment.exec@embtelerp.com",
      passwordHash,
      designation: "Recruitment Executive",
      level: 1,
    },
  });

  // ─── IT Services Hierarchy ────────────────────────────────────────────────
  const itBusiness = businessMap.get("it-services")!;
  const itVertical = getVerticalByCode("it-ops")!;

  // IT Head
  const itHead = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: itBusiness.id,
      roleId: roles[3].id,
      reportsToId: businessOwner.id,
      firstName: "Arun",
      lastName: "Menon",
      email: "it.head@embtelerp.com",
      passwordHash,
      designation: "IT Head",
      level: 3,
    },
  });

  // IT Sales Team Lead
  const itSalesTeam = getTeamByCode("it-sales")!;
  const itSalesLead = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: itBusiness.id,
      teamId: itSalesTeam.id,
      verticalId: itVertical.id,
      roleId: roles[2].id,
      reportsToId: itHead.id,
      firstName: "Deepak",
      lastName: "Chopra",
      email: "it.sales.lead@embtelerp.com",
      passwordHash,
      designation: "Sales Team Lead",
      level: 2,
    },
  });

  // IT Marketing Team Lead
  const itMarketingTeam = getTeamByCode("it-marketing")!;
  const itMarketingLead = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: itBusiness.id,
      teamId: itMarketingTeam.id,
      verticalId: itVertical.id,
      roleId: roles[2].id,
      reportsToId: itHead.id,
      firstName: "Kavita",
      lastName: "Bose",
      email: "it.marketing.lead@embtelerp.com",
      passwordHash,
      designation: "Marketing Team Lead",
      level: 2,
    },
  });

  // IT Development Team Lead
  const itDevTeam = getTeamByCode("it-dev")!;
  const itDevLead = await prisma.employee.create({
    data: {
      organizationId: organization.id,
      businessId: itBusiness.id,
      teamId: itDevTeam.id,
      verticalId: itVertical.id,
      roleId: roles[2].id,
      reportsToId: itHead.id,
      firstName: "Sandeep",
      lastName: "Agarwal",
      email: "it.dev.lead@embtelerp.com",
      passwordHash,
      designation: "Development Team Lead",
      level: 2,
    },
  });

  // ─── Create Executives ────────────────────────────────────────────────────
  const teamManagers = [
    salesHeadImm,
    marketingMgrImm,
    docsMgrImm,
    salesHeadEval,
    marketingMgrEval,
    docsMgrEval,
    professorEval,
    hrExecutive,
    recruitmentExecutive,
    itSalesLead,
    itMarketingLead,
    itDevLead,
  ];

  const executives: Awaited<ReturnType<typeof prisma.employee.create>>[] = [];
  const execTemplates = [
    {
      mgr: salesHeadImm,
      team: immSalesTeam,
      vertical: immVertical,
      business: immBusiness,
      prefix: "Sales Exec Imm",
      email: "sales.exec.imm",
      designation: "Sales Executive",
    },
    {
      mgr: marketingMgrImm,
      team: immMarketingTeam,
      vertical: immVertical,
      business: immBusiness,
      prefix: "Marketing Exec Imm",
      email: "marketing.exec.imm",
      designation: "Marketing Executive",
    },
    {
      mgr: docsMgrImm,
      team: immDocsTeam,
      vertical: immVertical,
      business: immBusiness,
      prefix: "Docs Exec Imm",
      email: "docs.exec.imm",
      designation: "Documentation Executive",
    },
    {
      mgr: salesHeadEval,
      team: evalSalesTeam,
      vertical: evalVertical,
      business: evalBusiness,
      prefix: "Sales Exec Eval",
      email: "sales.exec.eval",
      designation: "Sales Executive",
    },
    {
      mgr: marketingMgrEval,
      team: evalMarketingTeam,
      vertical: evalVertical,
      business: evalBusiness,
      prefix: "Marketing Exec Eval",
      email: "marketing.exec.eval",
      designation: "Marketing Executive",
    },
    {
      mgr: docsMgrEval,
      team: evalDocsTeam,
      vertical: evalVertical,
      business: evalBusiness,
      prefix: "Docs Exec Eval",
      email: "docs.exec.eval",
      designation: "Documentation Executive",
    },
    {
      mgr: itSalesLead,
      team: itSalesTeam,
      vertical: itVertical,
      business: itBusiness,
      prefix: "IT Sales Exec",
      email: "it.sales.exec",
      designation: "Sales Executive",
    },
    {
      mgr: itMarketingLead,
      team: itMarketingTeam,
      vertical: itVertical,
      business: itBusiness,
      prefix: "IT Marketing Exec",
      email: "it.marketing.exec",
      designation: "Marketing Executive",
    },
    {
      mgr: itDevLead,
      team: itDevTeam,
      vertical: itVertical,
      business: itBusiness,
      prefix: "IT Dev",
      email: "it.dev",
      designation: "Developer",
    },
  ];

  for (let i = 0; i < execTemplates.length; i++) {
    const t = execTemplates[i];
    for (let j = 0; j < 2; j++) {
      const exec = await prisma.employee.create({
        data: {
          organizationId: organization.id,
          businessId: t.business.id,
          teamId: t.team.id,
          verticalId: t.vertical.id,
          roleId: roles[1].id,
          reportsToId: t.mgr.id,
          firstName: `${t.prefix} ${j + 1}`,
          lastName: "Staff",
          email: `${t.email}${j + 1}@embtelerp.com`,
          passwordHash,
          designation: t.designation,
          level: 1,
        },
      });
      executives.push(exec);
    }
  }

  // ─── Create Interns ───────────────────────────────────────────────────────
  const interns: Awaited<ReturnType<typeof prisma.employee.create>>[] = [];
  for (let i = 0; i < executives.length; i++) {
    const parent = executives[i];
    const intern = await prisma.employee.create({
      data: {
        organizationId: organization.id,
        businessId: parent.businessId,
        teamId: parent.teamId,
        verticalId: parent.verticalId,
        roleId: roles[0].id,
        reportsToId: parent.id,
        firstName: `Intern ${i + 1}`,
        lastName: "Trainee",
        email: `intern${i + 1}@embtelerp.com`,
        passwordHash,
        designation: `${parent.designation?.replace("Executive", "Intern") ?? "Intern"}`,
        level: 0,
      },
    });
    interns.push(intern);
  }

  // ─── Build EmployeeHierarchy records ──────────────────────────────────────
  const allEmployees = [
    superAdmin,
    businessOwner,
    headImmigration,
    verticalManagerImm,
    salesHeadImm,
    marketingMgrImm,
    docsMgrImm,
    headEvaluation,
    verticalManagerEval,
    salesHeadEval,
    marketingMgrEval,
    docsMgrEval,
    professorEval,
    hrManager,
    hrExecutive,
    recruitmentExecutive,
    itHead,
    itSalesLead,
    itMarketingLead,
    itDevLead,
    ...executives,
    ...interns,
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

      const manager = await prisma.employee.findUnique({
        where: { id: currentManagerId },
      });
      currentManagerId = manager?.reportsToId ?? null;
      depth += 1;
    }
  }

  // ─── Seed Tasks ───────────────────────────────────────────────────────────
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
    "Draft social media campaign",
    "Evaluate professor credentials",
    "Screen candidate resumes",
    "Deploy server updates",
    "Generate sales pipeline report",
  ];

  const allTaskableEmployees = [...teamManagers, ...executives, ...interns];
  const tasksCreated: string[] = [];
  for (let i = 0; i < 80; i += 1) {
    const assignee = allTaskableEmployees[i % allTaskableEmployees.length];
    const status = taskStatuses[i % taskStatuses.length];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (i % 30) - 10);

    const task = await prisma.task.create({
      data: {
        businessId: assignee.businessId,
        teamId: assignee.teamId,
        verticalId: assignee.verticalId,
        assigneeId: assignee.id,
        createdById: assignee.reportsToId ?? businessOwner.id,
        title: taskTitles[i % taskTitles.length],
        description: `Task #${i + 1} for ${assignee.firstName} ${assignee.lastName}`,
        status,
        priority: taskPriorities[i % taskPriorities.length],
        dueDate,
      },
    });
    tasksCreated.push(task.id);
  }

  // ─── Seed Marketing Campaigns ─────────────────────────────────────────────
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

  const allBusinesses = Array.from(businessMap.values());
  for (let i = 0; i < 16; i += 1) {
    const business = allBusinesses[i % allBusinesses.length];
    const businessCode =
      businessDefinitions.find((b) => b.name === business.name)?.code ?? "";
    const verticals = verticalMap.get(businessCode) ?? [];
    const vertical = verticals[0];
    const teams = teamMap.get(vertical?.code ?? "") ?? [];
    const team = teams[i % teams.length];

    const campaign = await prisma.marketingCampaign.create({
      data: {
        organizationId: organization.id,
        businessId: business.id,
        teamId: team?.id ?? null,
        verticalId: vertical?.id ?? null,
        createdById: businessOwner.id,
        assignedToId: teamManagers[i % teamManagers.length].id,
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

    // Seed Marketing KPIs
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
          verticalId: vertical?.id ?? null,
          employeeId: teamManagers[i % teamManagers.length].id,
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

    // Seed Marketing Leads
    const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];
    for (let l = 0; l < 5; l += 1) {
      await prisma.marketingLead.create({
        data: {
          organizationId: organization.id,
          businessId: business.id,
          teamId: team?.id ?? null,
          verticalId: vertical?.id ?? null,
          campaignId: campaign.id,
          createdById: businessOwner.id,
          assignedToId: teamManagers[i % teamManagers.length].id,
          name: `Lead ${i * 5 + l + 1} - ${business.name}`,
          email: `lead${i * 5 + l + 1}@example.com`,
          source: campaignChannels[l % campaignChannels.length],
          status: leadStatuses[l % leadStatuses.length] as any,
          estimatedValue: Math.round(10000 + Math.random() * 100000),
        },
      });
    }

    // Seed Marketing Tasks
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
          verticalId: vertical?.id ?? null,
          campaignId: campaign.id,
          assignedToId: teamManagers[i % teamManagers.length].id,
          createdById: businessOwner.id,
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

  // ─── Seed Activities ──────────────────────────────────────────────────────
  for (let i = 0; i < 40; i += 1) {
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

  // ─── Seed Initial Perspective ─────────────────────────────────────────────
  await prisma.perspective.create({
    data: {
      userId: businessOwner.id,
      currentPerspectiveId: businessOwner.id,
      perspectiveType: PerspectiveType.BUSINESS_OWNER,
    },
  });

  console.log("Seed complete with new hierarchy structure");
  console.log(`Created: ${allEmployees.length} employees across 4 businesses`);
  console.log(
    `Created: ${tasksCreated.length} tasks, 16 campaigns with KPIs, leads, and marketing tasks`,
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
