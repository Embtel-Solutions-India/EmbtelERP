import { prisma } from "../config/prisma.js";
import { getDescendants } from "./hierarchy.service.js";
import { getActivePerspectiveForUser } from "./perspective.service.js";

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
  perspectiveTargetId: string | null,
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

    if (!perspectiveTargetId) {
      return buildScope(
        { ...viewer, level: viewer.level ?? undefined },
        viewer,
      );
    }

    // Resolve active perspective session to determine the type
    const session = await prisma.perspectiveSession.findFirst({
      where: { userId },
    });

    if (!session || session.perspectiveTargetId !== perspectiveTargetId) {
      return buildScope(
        { ...viewer, level: viewer.level ?? undefined },
        viewer,
      );
    }

    const { perspectiveType, perspectiveTargetId: targetId } = session;

    // Handle TEAM target
    if (perspectiveType === "TEAM") {
      const team = await prisma.team.findUnique({
        where: { id: targetId },
        select: { id: true, businessId: true, departmentId: true }
      });
      if (!team) return getSelfScope(viewer as any);
      
      const teamEmployees = await prisma.employee.findMany({
        where: { teamId: team.id, isActive: true },
        select: { id: true }
      });

      return {
        visibleEmployees: teamEmployees.map(e => e.id),
        visibleBusinesses: [team.businessId],
        visibleDepartments: team.departmentId ? [team.departmentId] : [],
        visibleTeams: [team.id]
      };
    }

    // Handle VERTICAL target
    if (perspectiveType === "VERTICAL") {
      const vertical = await prisma.vertical.findUnique({
        where: { id: targetId },
        select: { id: true, businessId: true }
      });
      if (!vertical) return getSelfScope(viewer as any);

      const [teams, employees] = await Promise.all([
        prisma.team.findMany({
          where: { verticalId: vertical.id, isActive: true },
          select: { id: true }
        }),
        prisma.employee.findMany({
          where: { verticalId: vertical.id, isActive: true },
          select: { id: true }
        })
      ]);

      return {
        visibleEmployees: employees.map(e => e.id),
        visibleBusinesses: [vertical.businessId],
        visibleDepartments: [],
        visibleTeams: teams.map(t => t.id)
      };
    }

    // Handle BUSINESS or BUSINESS_OWNER target
    if (perspectiveType === "BUSINESS" || perspectiveType === "BUSINESS_OWNER") {
      const business = await prisma.business.findUnique({
        where: { id: targetId },
        select: { id: true }
      });
      if (!business) return getSelfScope(viewer as any);

      const [departments, teams, employees] = await Promise.all([
        prisma.department.findMany({
          where: { businessId: business.id, isActive: true },
          select: { id: true }
        }),
        prisma.team.findMany({
          where: { businessId: business.id, isActive: true },
          select: { id: true }
        }),
        prisma.employee.findMany({
          where: { businessId: business.id, isActive: true },
          select: { id: true }
        })
      ]);

      return {
        visibleEmployees: employees.map(e => e.id),
        visibleBusinesses: [business.id],
        visibleDepartments: departments.map(d => d.id),
        visibleTeams: teams.map(t => t.id)
      };
    }

    // Handle employee-based targets
    const perspectiveTarget = await prisma.employee.findUnique({
      where: { id: perspectiveTargetId },
      select: {
        id: true,
        businessId: true,
        departmentId: true,
        teamId: true,
      },
    });

    if (!perspectiveTarget) {
      return getSelfScope(viewer as any);
    }

    // Enforce descendant check
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
  const viewerLevel = viewer.level ?? viewer.role?.level ?? 1;

  if (viewerLevel >= 5) {
    const [businesses, departments, teams, employees] = await Promise.all([
      prisma.business.findMany({ select: { id: true } }),
      prisma.department.findMany({ select: { id: true } }),
      prisma.team.findMany({ select: { id: true } }),
      prisma.employee.findMany({ select: { id: true } })
    ]);

    return {
      visibleEmployees: employees.map((row: { id: string }) => row.id),
      visibleBusinesses: businesses.map((row: { id: string }) => row.id),
      visibleDepartments: departments.map((row: { id: string }) => row.id),
      visibleTeams: teams.map((row: { id: string }) => row.id),
    };
  }

  if (viewerLevel >= 4) {
    const [employees, departments, teams] = await Promise.all([
      prisma.employee.findMany({
        where: { businessId: viewer.businessId },
        select: { id: true },
      }),
      prisma.department.findMany({
        where: { businessId: viewer.businessId },
        select: { id: true },
      }),
      prisma.team.findMany({
        where: { businessId: viewer.businessId },
        select: { id: true },
      })
    ]);

    return {
      visibleEmployees: employees.map((row: { id: string }) => row.id),
      visibleBusinesses: [viewer.businessId],
      visibleDepartments: departments.map((row: { id: string }) => row.id),
      visibleTeams: teams.map((row: { id: string }) => row.id),
    };
  }

  const baseEmployees = await getDescendants(perspectiveTarget.id);
  const employeeIds = [
    perspectiveTarget.id,
    ...baseEmployees.map((employee) => employee.id),
  ];
  const businessIds = [perspectiveTarget.businessId];

  const [departmentIds, teamIds] = await Promise.all([
    collectDepartmentIds(
      viewer,
      perspectiveTarget,
      employeeIds,
      viewerLevel,
    ),
    collectTeamIds(
      viewer,
      perspectiveTarget,
      employeeIds,
      viewerLevel,
    )
  ]);

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
  if (viewerLevel < 3) {
    return viewer.departmentId ? [viewer.departmentId] : [];
  }

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

  return departments.map((row: { id: string }) => row.id);
}

async function collectTeamIds(
  viewer: { teamId: string | null; role: { level: number } },
  perspectiveTarget: { businessId: string },
  employeeIds: string[],
  viewerLevel: number,
): Promise<string[]> {
  if (viewerLevel < 2) {
    return viewer.teamId ? [viewer.teamId] : [];
  }

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

  return teams.map((row: { id: string }) => row.id);
}
