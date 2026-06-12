import { prisma } from "../config/prisma.js";
import { getDescendants, getDescendantIds } from "./hierarchy.service.js";
// NOTE: buildScope only needs descendant *ids*, so it uses getDescendantIds
// (a single recursive query) rather than getDescendants (which additionally
// fetches full employee rows) — one fewer round-trip on every scoped request.
import { getActivePerspectiveForUser } from "./perspective.service.js";
import { isWorkforceManager } from "../utils/workforce.js";

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

// ── Scope cache ───────────────────────────────────────────────────────────────
// Every authenticated request runs getDataScope via attachScope; a dashboard
// mount fires ~15 concurrent requests, each previously recomputing the same
// scope (2–3 sequential DB round-trips). Cache the *promise* keyed by
// user+perspective so concurrent requests collapse into one computation, with a
// short TTL bounding staleness after org-structure changes.
const SCOPE_TTL_MS = 60_000;
const scopeCache = new Map<string, { expires: number; value: Promise<DataScope> }>();

/** Drop cached scopes (all users, or one) after hierarchy/role mutations. */
export function invalidateScopeCache(userId?: string) {
  if (!userId) { scopeCache.clear(); return; }
  for (const key of scopeCache.keys()) {
    if (key.startsWith(`${userId}:`)) scopeCache.delete(key);
  }
}

export async function getDataScope(
  userId: string,
  perspectiveTargetId: string | null,
): Promise<DataScope> {
  const key = `${userId}:${perspectiveTargetId ?? "self"}`;
  const hit = scopeCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const value = computeDataScope(userId, perspectiveTargetId);
  scopeCache.set(key, { expires: Date.now() + SCOPE_TTL_MS, value });
  // Never cache a rejection (e.g. transient DB error).
  value.catch(() => scopeCache.delete(key));
  return value;
}

async function computeDataScope(
  userId: string,
  perspectiveTargetId: string | null,
): Promise<DataScope> {
  try {
    const viewer = await prisma.employee.findUnique({
      where: { id: userId },
      select: {
        id: true,
        businessId: true,
        organizationId: true,
        departmentId: true,
        teamId: true,
        verticalId: true,
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

      // Defense-in-depth: re-assert business and sub-tree authorization
      if (team.businessId !== viewer.businessId) return getSelfScope(viewer as any);
      const viewerRoleLevel = viewer.role?.level ?? viewer.level ?? 0;
      if (viewerRoleLevel < 2 && viewer.teamId !== team.id) {
        const descendantIds = await getDescendantIds(viewer.id);
        const subordinates = await prisma.employee.findMany({
          where: { teamId: team.id, id: { in: descendantIds } },
          select: { id: true },
        });
        if (subordinates.length === 0) return getSelfScope(viewer as any);
      }

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

      // Defense-in-depth: re-assert business and sub-tree authorization
      if (vertical.businessId !== viewer.businessId) return getSelfScope(viewer as any);
      const viewerRoleLevelV = viewer.role?.level ?? viewer.level ?? 0;
      if (viewerRoleLevelV < 2 && (viewer as any).verticalId !== vertical.id) {
        const descendantIds = await getDescendantIds(viewer.id);
        const subordinates = await prisma.employee.findMany({
          where: { verticalId: vertical.id, id: { in: descendantIds } },
          select: { id: true },
        });
        if (subordinates.length === 0) return getSelfScope(viewer as any);
      }

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
        select: { id: true, organizationId: true }
      });
      if (!business) return getSelfScope(viewer as any);

      // Defense-in-depth: re-assert authorization
      const viewerRoleLevelB = viewer.role?.level ?? viewer.level ?? 0;
      if (viewerRoleLevelB < 4 && business.id !== viewer.businessId) {
        return getSelfScope(viewer as any);
      }
      if (viewerRoleLevelB >= 4 && business.organizationId !== viewer.organizationId) {
        return getSelfScope(viewer as any);
      }

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
    organizationId: string;
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
    const orgBusinesses = await prisma.business.findMany({
      where: { organizationId: viewer.organizationId },
      select: { id: true },
    });
    const orgBusinessIds = orgBusinesses.map((b: { id: string }) => b.id);

    const [employees, departments, teams] = await Promise.all([
      prisma.employee.findMany({
        where: { businessId: { in: orgBusinessIds } },
        select: { id: true },
      }),
      prisma.department.findMany({
        where: { businessId: { in: orgBusinessIds } },
        select: { id: true },
      }),
      prisma.team.findMany({
        where: { businessId: { in: orgBusinessIds } },
        select: { id: true },
      }),
    ]);

    return {
      visibleEmployees: employees.map((row: { id: string }) => row.id),
      visibleBusinesses: orgBusinessIds,
      visibleDepartments: departments.map((row: { id: string }) => row.id),
      visibleTeams: teams.map((row: { id: string }) => row.id),
    };
  }

  // HR workforce managers: expand employee visibility across the whole org but keep
  // operational scope (business/dept/team) pinned to their own business so they
  // cannot read sales/marketing/leads from other businesses.
  // Only applies when the viewer is acting as themselves (no perspective switch).
  if (viewer.id === perspectiveTarget.id && await isWorkforceManager({ businessId: viewer.businessId, roleLevel: viewer.role?.level ?? viewer.level ?? 0 })) {
    const [orgEmployees, departments, teams] = await Promise.all([
      prisma.employee.findMany({
        where: { organizationId: viewer.organizationId },
        select: { id: true },
      }),
      prisma.department.findMany({
        where: { businessId: viewer.businessId },
        select: { id: true },
      }),
      prisma.team.findMany({
        where: { businessId: viewer.businessId },
        select: { id: true },
      }),
    ]);
    return {
      visibleEmployees: orgEmployees.map((e: { id: string }) => e.id),
      visibleBusinesses: [viewer.businessId],
      visibleDepartments: departments.map((d: { id: string }) => d.id),
      visibleTeams: teams.map((t: { id: string }) => t.id),
    };
  }

  const descendantIds = await getDescendantIds(perspectiveTarget.id);
  const employeeIds = [perspectiveTarget.id, ...descendantIds];
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
