import { prisma } from "../config/prisma.js";
import { getDescendants } from "./hierarchy.service.js";
export async function getDataScope(userId, perspectiveEmployeeId) {
    const viewer = await prisma.employee.findUnique({
        where: { id: userId },
        include: { role: true },
    });
    if (!viewer) {
        return {
            visibleEmployees: [],
            visibleBusinesses: [],
            visibleDepartments: [],
            visibleTeams: [],
        };
    }
    const perspectiveTarget = perspectiveEmployeeId
        ? await prisma.employee.findUnique({ where: { id: perspectiveEmployeeId } })
        : viewer;
    if (!perspectiveTarget) {
        return {
            visibleEmployees: [],
            visibleBusinesses: [],
            visibleDepartments: [],
            visibleTeams: [],
        };
    }
    if (viewer.id !== perspectiveTarget.id) {
        const descendants = await getDescendants(viewer.id);
        if (!descendants.some((employee) => employee.id === perspectiveTarget.id)) {
            return getSelfScope(viewer);
        }
    }
    return buildScope(viewer, perspectiveTarget);
}
export async function getScopedEmployees(scope) {
    return prisma.employee.findMany({
        where: {
            id: { in: scope.visibleEmployees },
        },
    });
}
export async function getActivePerspectiveForUser(userId) {
    const active = await prisma.perspective.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
    });
    return active
        ? {
            userId: active.userId,
            currentPerspectiveId: active.currentPerspectiveId,
            perspectiveType: active.perspectiveType,
        }
        : null;
}
function getSelfScope(employee) {
    return {
        visibleEmployees: [employee.id],
        visibleBusinesses: [employee.businessId],
        visibleDepartments: employee.departmentId ? [employee.departmentId] : [],
        visibleTeams: employee.teamId ? [employee.teamId] : [],
    };
}
async function buildScope(viewer, perspectiveTarget) {
    const baseEmployees = await getDescendants(perspectiveTarget.id);
    const employeeIds = [
        perspectiveTarget.id,
        ...baseEmployees.map((employee) => employee.id),
    ];
    const businessIds = [perspectiveTarget.businessId];
    const departmentIds = await collectDepartmentIds(viewer, perspectiveTarget, employeeIds);
    const teamIds = await collectTeamIds(viewer, perspectiveTarget, employeeIds);
    if (viewer.role.level >= 5) {
        const businesses = await prisma.business.findMany({ select: { id: true } });
        const departments = await prisma.department.findMany({
            select: { id: true },
        });
        const teams = await prisma.team.findMany({ select: { id: true } });
        return {
            visibleEmployees: (await prisma.employee.findMany({ select: { id: true } })).map((row) => row.id),
            visibleBusinesses: businesses.map((row) => row.id),
            visibleDepartments: departments.map((row) => row.id),
            visibleTeams: teams.map((row) => row.id),
        };
    }
    if (viewer.role.level >= 4) {
        const employees = await prisma.employee.findMany({
            where: { businessId: viewer.businessId },
            select: { id: true },
        });
        const departments = await prisma.department.findMany({
            where: { businessId: viewer.businessId },
            select: { id: true },
        });
        const teams = await prisma.team.findMany({
            where: { businessId: viewer.businessId },
            select: { id: true },
        });
        return {
            visibleEmployees: employees.map((row) => row.id),
            visibleBusinesses: [viewer.businessId],
            visibleDepartments: departments.map((row) => row.id),
            visibleTeams: teams.map((row) => row.id),
        };
    }
    return {
        visibleEmployees: employeeIds,
        visibleBusinesses: businessIds,
        visibleDepartments: departmentIds,
        visibleTeams: teamIds,
    };
}
async function collectDepartmentIds(viewer, perspectiveTarget, employeeIds) {
    const departments = await prisma.department.findMany({
        where: {
            businessId: perspectiveTarget.businessId,
            employees: {
                some: {
                    id: { in: employeeIds },
                },
            },
        },
        select: { id: true },
    });
    if (viewer.role.level >= 4) {
        return departments.map((row) => row.id);
    }
    if (viewer.role.level >= 3) {
        return departments.map((row) => row.id);
    }
    if (viewer.role.level >= 2) {
        return viewer.departmentId ? [viewer.departmentId] : [];
    }
    return viewer.departmentId ? [viewer.departmentId] : [];
}
async function collectTeamIds(viewer, perspectiveTarget, employeeIds) {
    const teams = await prisma.team.findMany({
        where: {
            businessId: perspectiveTarget.businessId,
            employees: {
                some: {
                    id: { in: employeeIds },
                },
            },
        },
        select: { id: true },
    });
    if (viewer.role.level >= 4) {
        return teams.map((row) => row.id);
    }
    if (viewer.role.level >= 3) {
        return teams.map((row) => row.id);
    }
    if (viewer.role.level >= 2) {
        return teams.map((row) => row.id);
    }
    return viewer.teamId ? [viewer.teamId] : [];
}
