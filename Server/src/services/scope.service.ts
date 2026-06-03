import { prisma } from "../config/prisma.js";
import { getDescendants } from "./hierarchy.service.js";

export type DataScope = {
  visibleEmployees: string[];
  visibleBusinesses: string[];
  visibleDepartments: string[];
  visibleTeams: string[];
};

export type PerspectiveSession = {
  userId: string;
  perspectiveTargetId: string;
  perspectiveType: string;
};

export async function getDataScope(
  userId: string,
  perspectiveEmployeeId: string | null,
): Promise<DataScope> {
  try {
    const viewer = await prisma.employee.findUnique({
      where: { id: userId },
      select: {
        id: true,
        businessId: true,
        departmentId: true,
        teamId: true,
        level: true,
        role: { select: { level: true } },
      },
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
      ? await prisma.employee.findUnique({
          where: { id: perspectiveEmployeeId },
          select: {
            id: true,
            businessId: true,
            departmentId: true,
            teamId: true,
          },
        })
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
      if (
        !descendants.some((employee) => employee.id === perspectiveTarget.id)
      ) {
        return getSelfScope(viewer as any);
      }
    }

    return buildScope(
      { ...viewer, level: viewer.level ?? undefined },
      perspectiveTarget,
    );
  } catch (err) {
    console.error("getDataScope error", err);
    throw err;
  }
}

export async function getScopedEmployees(scope: DataScope) {
  return prisma.employee.findMany({
    where: {
      id: { in: scope.visibleEmployees },
    },
  });
}

export async function getActivePerspectiveForUser(
  userId: string,
): Promise<PerspectiveSession | null> {
  const active = await prisma.perspectiveSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return active
    ? {
        userId: active.userId,
        perspectiveTargetId: active.perspectiveTargetId,
        perspectiveType: active.perspectiveType,
      }
    : null;
}

function getSelfScope(employee: {
  id: string;
  businessId: string;
  departmentId: string | null;
  teamId: string | null;
}): DataScope {
  return {
    visibleEmployees: [employee.id],
    visibleBusinesses: [employee.businessId],
    visibleDepartments: employee.departmentId ? [employee.departmentId] : [],
    visibleTeams: employee.teamId ? [employee.teamId] : [],
  };
}

async function buildScope(
  viewer: {
    id: string;
    businessId: string;
    departmentId: string | null;
    teamId: string | null;
    role: { level: number };
    level?: number;
  },
  perspectiveTarget: {
    id: string;
    businessId: string;
    departmentId: string | null;
    teamId: string | null;
  },
): Promise<DataScope> {
  const baseEmployees = await getDescendants(perspectiveTarget.id);
  const employeeIds = [
    perspectiveTarget.id,
    ...baseEmployees.map((employee) => employee.id),
  ];
  const businessIds = [perspectiveTarget.businessId];
  const viewerLevel = viewer.level ?? viewer.role.level;

  const departmentIds = await collectDepartmentIds(
    viewer,
    perspectiveTarget,
    employeeIds,
    viewerLevel,
  );
  const teamIds = await collectTeamIds(
    viewer,
    perspectiveTarget,
    employeeIds,
    viewerLevel,
  );

  if (viewerLevel >= 5) {
    const businesses = await prisma.business.findMany({ select: { id: true } });
    const departments = await prisma.department.findMany({
      select: { id: true },
    });
    const teams = await prisma.team.findMany({ select: { id: true } });

    return {
      visibleEmployees: (
        await prisma.employee.findMany({ select: { id: true } })
      ).map((row: { id: string }) => row.id),
      visibleBusinesses: businesses.map((row: { id: string }) => row.id),
      visibleDepartments: departments.map((row: { id: string }) => row.id),
      visibleTeams: teams.map((row: { id: string }) => row.id),
    };
  }

  if (viewerLevel >= 4) {
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
      visibleEmployees: employees.map((row: { id: string }) => row.id),
      visibleBusinesses: [viewer.businessId],
      visibleDepartments: departments.map((row: { id: string }) => row.id),
      visibleTeams: teams.map((row: { id: string }) => row.id),
    };
  }

  return {
    visibleEmployees: employeeIds,
    visibleBusinesses: businessIds,
    visibleDepartments: departmentIds,
    visibleTeams: teamIds,
  };
}

async function collectDepartmentIds(
  viewer: { departmentId: string | null; role: { level: number } },
  perspectiveTarget: { businessId: string },
  employeeIds: string[],
  viewerLevel: number,
): Promise<string[]> {
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

  if (viewerLevel >= 4) {
    return departments.map((row: { id: string }) => row.id);
  }

  if (viewerLevel >= 3) {
    return departments.map((row: { id: string }) => row.id);
  }

  if (viewerLevel >= 2) {
    return viewer.departmentId ? [viewer.departmentId] : [];
  }

  return viewer.departmentId ? [viewer.departmentId] : [];
}

async function collectTeamIds(
  viewer: { teamId: string | null; role: { level: number } },
  perspectiveTarget: { businessId: string },
  employeeIds: string[],
  viewerLevel: number,
): Promise<string[]> {
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

  if (viewerLevel >= 4) {
    return teams.map((row: { id: string }) => row.id);
  }

  if (viewerLevel >= 3) {
    return teams.map((row: { id: string }) => row.id);
  }

  if (viewerLevel >= 2) {
    return teams.map((row: { id: string }) => row.id);
  }

  return viewer.teamId ? [viewer.teamId] : [];
}
