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
    await prisma.perspectiveSession.deleteMany();
    await prisma.session.deleteMany();
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
    ]);
    await prisma.rolePermission.createMany({
        data: [
            { roleId: roles[4].id, permissionId: permissions[0].id },
            { roleId: roles[4].id, permissionId: permissions[1].id },
            { roleId: roles[5].id, permissionId: permissions[4].id },
        ],
    });
    const businesses = await Promise.all(businessDefinitions.map((business) => prisma.business.create({
        data: {
            organizationId: organization.id,
            name: business.name,
            code: business.code,
        },
    })));
    const businessDepartments = new Map();
    const businessTeams = new Map();
    for (const business of businesses) {
        const createdDepartments = [];
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
        const teamRows = [];
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
            fullName: "Amina Khan",
            email: "owner@embtelerp.com",
            passwordHash,
            level: roles[4].level,
            title: roles[4].name,
            designation: "Business Owner",
        },
    });
    const heads = [];
    for (let index = 0; index < businesses.length; index += 1) {
        const head = await prisma.employee.create({
            data: {
                organizationId: organization.id,
                businessId: businesses[index].id,
                departmentId: businessDepartments.get(businesses[index].id)?.[0] ?? null,
                teamId: businessTeams.get(businesses[index].id)?.[0]?.id ?? null,
                roleId: roles[3].id,
                reportsToId: owner.id,
                firstName: `Head${index + 1}`,
                lastName: "Lead",
                fullName: `Head${index + 1} Lead`,
                email: `head${index + 1}@embtelerp.com`,
                passwordHash,
                level: roles[3].level,
                title: roles[3].name,
                designation: `Department Head ${index + 1}`,
            },
        });
        heads.push(head);
    }
    const managers = [];
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
                fullName: `Manager${index + 1} Team`,
                email: `manager${index + 1}@embtelerp.com`,
                passwordHash,
                level: roles[2].level,
                title: roles[2].name,
                designation: `Manager ${index + 1}`,
            },
        });
        managers.push(manager);
    }
    const executives = [];
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
                fullName: `Executive${index + 1} Staff`,
                email: `executive${index + 1}@embtelerp.com`,
                passwordHash,
                level: roles[1].level,
                title: roles[1].name,
                designation: `Executive ${index + 1}`,
            },
        });
        executives.push(executive);
    }
    const interns = [];
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
                fullName: `Intern${index + 1} Trainee`,
                email: `intern${index + 1}@embtelerp.com`,
                passwordHash,
                level: roles[0].level,
                title: roles[0].name,
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
        let currentManagerId = employee.reportsToId;
        while (currentManagerId !== null) {
            await prisma.employeeHierarchy.create({
                data: {
                    employeeId: employee.id,
                    managerId: currentManagerId,
                    depth,
                },
            });
            const manager = await prisma.employee.findUnique({ where: { id: currentManagerId } });
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
