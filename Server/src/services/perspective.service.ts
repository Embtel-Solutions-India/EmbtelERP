import type { PerspectiveTargetType } from "@prisma/client";
import { ActivityAction } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { getDescendantIds, isDescendantOf } from "./hierarchy.service.js";
import { isWorkforceManager } from "../utils/workforce.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PerspectiveSessionData = {
  id: string;
  userId: string;
  perspectiveType: PerspectiveTargetType;
  perspectiveTargetId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PerspectiveNode = {
  id: string;
  type:
    | "BUSINESS"
    | "BUSINESS_OWNER"
    | "VERTICAL"
    | "TEAM"
    | "HEAD"
    | "MANAGER"
    | "EMPLOYEE"
    | "INTERN";
  label: string;
  children?: PerspectiveNode[];
  memberCount?: number;
  designation?: string;
};

export type AvailablePerspectivesResponse = {
  currentPerspective: PerspectiveSessionData | null;
  availablePerspectives: PerspectiveNode[];
};

export type PerspectiveInfo = {
  id: string;
  type: PerspectiveTargetType;
  targetId: string;
  label: string;
  breadcrumb: { type: PerspectiveTargetType; id: string; label: string }[];
};

// ─── Service Functions ───────────────────────────────────────────────────────

/**
 * Get the current active perspective session for a user.
 */
export async function getActivePerspectiveForUser(
  userId: string,
): Promise<PerspectiveSessionData | null> {
  return prisma.perspectiveSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Get available perspectives (hierarchy tree) and current perspective for a user.
 * Returns a tree structure: Businesses → Teams → Employees
 */
export async function getAvailablePerspectives(
  userId: string,
): Promise<AvailablePerspectivesResponse> {
  const viewer = await prisma.employee.findUnique({
    where: { id: userId },
    include: {
      role: { select: { level: true } },
      business: { select: { id: true, name: true } },
    },
  });

  if (!viewer) {
    throw new ApiError(404, "Employee not found");
  }

  const currentPerspective = await getActivePerspectiveForUser(userId);

  // Get all descendant employee IDs
  const descendantIds = await getDescendantIds(userId);
  const allVisibleIds = [userId, ...descendantIds];

  // Get the businesses the viewer has access to
  const viewerBusinessIds = await getViewerBusinessIds(viewer);

  // Build the hierarchy tree
  const tree = await buildHierarchyTree(
    viewer,
    viewerBusinessIds,
    allVisibleIds,
  );

  return {
    currentPerspective,
    availablePerspectives: tree,
  };
}

/**
 * Switch perspective to a target (TEAM or EMPLOYEE).
 * Validates that the target is a descendant of the viewer.
 */
export async function switchPerspective(
  userId: string,
  targetType: PerspectiveTargetType,
  targetId: string,
): Promise<PerspectiveSessionData> {
  const viewer = await prisma.employee.findUnique({
    where: { id: userId },
    include: { role: { select: { level: true } } },
  });

  if (!viewer) {
    throw new ApiError(404, "Viewer not found");
  }

  // Validate access to the target
  await validatePerspectiveAccess(userId, targetType, targetId);

  // Delete any existing perspective session for this user (only one active)
  await prisma.perspectiveSession.deleteMany({ where: { userId } });

  // Create new perspective session
  const session = await prisma.perspectiveSession.create({
    data: {
      userId,
      perspectiveType: targetType,
      perspectiveTargetId: targetId,
    },
  });

  // Audit log
  try {
    await prisma.auditLog.create({
      data: {
        businessId: viewer.businessId,
        actorId: viewer.id,
        action: ActivityAction.PERSPECTIVE_SWITCH,
        entityType: "PerspectiveSession",
        entityId: session.id,
        before: {},
        after: {
          userId,
          perspectiveType: targetType,
          perspectiveTargetId: targetId,
        },
      },
    });
  } catch (err) {
    console.error("Failed to create audit log for perspective switch", err);
  }

  return session;
}

/**
 * Reset perspective to self (clear any active perspective).
 */
export async function clearPerspective(userId: string): Promise<void> {
  await prisma.perspectiveSession.deleteMany({ where: { userId } });
}

/**
 * Validate that a user can access a given perspective target.
 */
export async function validatePerspectiveAccess(
  userId: string,
  targetType: PerspectiveTargetType,
  targetId: string,
): Promise<boolean> {
  const viewer = await prisma.employee.findUnique({
    where: { id: userId },
    select: {
      id: true,
      businessId: true,
      organizationId: true,
      verticalId: true,
      teamId: true,
      departmentId: true,
      role: { select: { level: true } },
    },
  });

  if (!viewer) {
    throw new ApiError(404, "Viewer not found");
  }

  // Super admin (level 5) can access everything
  if (viewer.role.level >= 5) {
    return true;
  }

  // Workforce managers (HR) may switch to any employee perspective in the org,
  // provided the target is at or below their own role level.
  // They cannot access BUSINESS / VERTICAL / TEAM scopes outside their own business.
  if (
    viewer.role.level < 4 &&
    (targetType === "EMPLOYEE" || targetType === "MANAGER" || targetType === "INTERN") &&
    (await isWorkforceManager({ businessId: viewer.businessId, roleLevel: viewer.role.level }))
  ) {
    const target = await prisma.employee.findUnique({
      where: { id: targetId },
      select: { level: true },
    });
    if (!target) throw new ApiError(404, "Target employee not found");
    if (viewer.role.level < (target.level ?? 0)) {
      throw new ApiError(403, "Access denied: cannot switch to higher hierarchy level");
    }
    return true;
  }

  // Enforce structural scope boundaries (businessId / verticalId / teamId / role level).
  await validateScopeBoundaries(viewer, targetType, targetId);

  switch (targetType) {
    case "ORGANIZATION": {
      // Only super admin can access organization level
      if (viewer.role.level < 5) {
        throw new ApiError(
          403,
          "Access denied: cannot view organization scope",
        );
      }
      return true;
    }

    case "BUSINESS": {
      // Business owner (level 4) can access their own business
      if (viewer.role.level >= 4) {
        const business = await prisma.business.findUnique({
          where: { id: targetId },
          select: { organizationId: true },
        });
        if (!business) throw new ApiError(404, "Business not found");
        if (business.organizationId !== viewer.organizationId) {
          throw new ApiError(403, "Access denied: cross-organization access");
        }
        return true;
      }
      // Others can only access if they belong to that business
      if (viewer.businessId !== targetId) {
        throw new ApiError(403, "Access denied: cannot view other businesses");
      }
      return true;
    }

    case "DEPARTMENT": {
      const department = await prisma.department.findUnique({
        where: { id: targetId },
        select: { businessId: true },
      });
      if (!department) throw new ApiError(404, "Department not found");
      if (department.businessId !== viewer.businessId) {
        throw new ApiError(403, "Access denied: cross-business access");
      }
      // L3+: full business access
      if (viewer.role.level >= 3) return true;
      // L0-L2: must belong to this department or have subordinates here
      if (viewer.departmentId === targetId) return true;
      const deptDescendants = await getDescendantIds(viewer.id);
      const inDept = await prisma.employee.findMany({
        where: { departmentId: targetId, id: { in: deptDescendants } },
        select: { id: true },
      });
      if (inDept.length === 0) {
        throw new ApiError(403, "Access denied: no employees in this department");
      }
      return true;
    }

    case "VERTICAL": {
      const vertical = await prisma.vertical.findUnique({
        where: { id: targetId },
        select: { businessId: true },
      });
      if (!vertical) throw new ApiError(404, "Vertical not found");
      if (vertical.businessId !== viewer.businessId) {
        throw new ApiError(403, "Access denied: cross-business access");
      }
      // L2+: validateScopeBoundaries already enforced vertical restrictions
      if (viewer.role.level >= 2) return true;
      // L0-L1: must be in this vertical or have subordinates here
      if (viewer.verticalId === targetId) return true;
      const vertDescendants = await getDescendantIds(viewer.id);
      const inVertical = await prisma.employee.findMany({
        where: { verticalId: targetId, id: { in: vertDescendants } },
        select: { id: true },
      });
      if (inVertical.length === 0) {
        throw new ApiError(403, "Access denied: no managed employees in this vertical");
      }
      return true;
    }

    case "HEAD": {
      // HEAD perspective is like BUSINESS scope but for a specific head
      const headEmployee = await prisma.employee.findUnique({
        where: { id: targetId },
        select: { businessId: true, level: true },
      });
      if (!headEmployee) throw new ApiError(404, "Head employee not found");
      if (headEmployee.businessId !== viewer.businessId) {
        throw new ApiError(403, "Access denied: cross-business access");
      }
      return true;
    }

    case "TEAM": {
      const team = await prisma.team.findUnique({
        where: { id: targetId },
        select: { businessId: true },
      });
      if (!team) throw new ApiError(404, "Team not found");
      if (team.businessId !== viewer.businessId) {
        throw new ApiError(403, "Access denied: cross-business access");
      }
      // L2+: validateScopeBoundaries already enforced vertical/team restrictions
      if (viewer.role.level >= 2) return true;
      // L0-L1: must be in this team or have subordinates here
      if (viewer.teamId === targetId) return true;
      const teamDescendants = await getDescendantIds(viewer.id);
      const inTeam = await prisma.employee.findMany({
        where: { teamId: targetId, id: { in: teamDescendants } },
        select: { id: true },
      });
      if (inTeam.length === 0) {
        throw new ApiError(403, "Access denied: no managed employees in this team");
      }
      return true;
    }

    case "EMPLOYEE": {
      if (userId === targetId) return true;
      const allowed = await isDescendantOf(targetId, userId);
      if (!allowed) {
        throw new ApiError(403, "Access denied: can only view descendants");
      }
      return true;
    }

    case "BUSINESS_OWNER": {
      // Only Business Owner (4) or Super Admin (5) may use this perspective type
      if (viewer.role.level < 4) {
        throw new ApiError(
          403,
          "Access denied: Business Owner perspective requires level 4+",
        );
      }
      const business = await prisma.business.findUnique({
        where: { id: targetId },
        select: { organizationId: true },
      });
      if (!business) throw new ApiError(404, "Business not found");
      if (business.organizationId !== viewer.organizationId) {
        throw new ApiError(403, "Access denied: cross-organization access");
      }
      return true;
    }

    case "MANAGER": {
      if (userId === targetId) return true;
      const allowed = await isDescendantOf(targetId, userId);
      if (!allowed) {
        throw new ApiError(403, "Access denied: can only view descendants");
      }
      return true;
    }

    case "INTERN": {
      if (userId === targetId) return true;
      const allowed = await isDescendantOf(targetId, userId);
      if (!allowed) {
        throw new ApiError(403, "Access denied: can only view descendants");
      }
      return true;
    }

    default:
      throw new ApiError(400, "Invalid perspective type");
  }
}

/**
 * Get perspective info including breadcrumb trail.
 */
export async function getPerspectiveInfo(
  userId: string,
): Promise<PerspectiveInfo | null> {
  const session = await getActivePerspectiveForUser(userId);
  if (!session) return null;

  const breadcrumb = await buildBreadcrumb(
    session.perspectiveType,
    session.perspectiveTargetId,
  );

  return {
    id: session.id,
    type: session.perspectiveType,
    targetId: session.perspectiveTargetId,
    label: breadcrumb[breadcrumb.length - 1]?.label ?? "Unknown",
    breadcrumb,
  };
}

// ─── Helper Functions ────────────────────────────────────────────────────────

async function getViewerBusinessIds(viewer: {
  id: string;
  businessId: string;
  organizationId: string;
  role: { level: number };
}): Promise<string[]> {
  // Super admin (level 5) sees all businesses
  if (viewer.role.level >= 5) {
    const businesses = await prisma.business.findMany({
      select: { id: true },
    });
    return businesses.map((b) => b.id);
  }

  // Business owner (level 4) sees all businesses in their organization
  if (viewer.role.level >= 4) {
    const businesses = await prisma.business.findMany({
      where: { organizationId: viewer.organizationId },
      select: { id: true },
    });
    return businesses.map((b) => b.id);
  }

  // Others only see their own business
  return [viewer.businessId];
}

function employeeNodeType(level: number | null): PerspectiveNode["type"] {
  if (level === 3) return "HEAD";
  if (level === 2) return "MANAGER";
  if (level === 0) return "INTERN";
  return "EMPLOYEE";
}

async function buildHierarchyTree(
  viewer: {
    id: string;
    businessId: string;
    organizationId: string;
    role: { level: number };
  },
  businessIds: string[],
  visibleEmployeeIds: string[],
): Promise<PerspectiveNode[]> {
  const tree: PerspectiveNode[] = [];
  const viewerLevel = viewer.role.level;

  const businesses = await prisma.business.findMany({
    where: { id: { in: businessIds }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  for (const business of businesses) {
    // Business owners see the business node as BUSINESS_OWNER so clicking it
    // switches to that role-scoped perspective; all others use BUSINESS.
    const businessNodeType: PerspectiveNode["type"] =
      viewerLevel >= 4 ? "BUSINESS_OWNER" : "BUSINESS";

    const businessNode: PerspectiveNode = {
      id: business.id,
      type: businessNodeType,
      label: business.name,
      children: [],
    };

    // HEAD employees belong to the business but are not assigned to a team;
    // surface them directly under the business node.
    const headEmployees = await prisma.employee.findMany({
      where: {
        businessId: business.id,
        id: { in: visibleEmployeeIds },
        isActive: true,
        level: 3,
        teamId: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designation: true,
      },
      orderBy: { firstName: "asc" },
    });

    for (const head of headEmployees) {
      businessNode.children!.push({
        id: head.id,
        type: "HEAD",
        label: `${head.firstName} ${head.lastName}`,
        designation: head.designation ?? undefined,
      });
    }

    const verticals = await prisma.vertical.findMany({
      where: { businessId: business.id, isActive: true },
      select: {
        id: true,
        name: true,
        _count: { select: { employees: true } },
      },
      orderBy: { name: "asc" },
    });

    for (const vertical of verticals) {
      const verticalNode: PerspectiveNode = {
        id: vertical.id,
        type: "VERTICAL",
        label: vertical.name,
        memberCount: vertical._count.employees,
        children: [],
      };

      // Vertical-level employees not assigned to a team (e.g. Vertical Managers)
      const verticalManagers = await prisma.employee.findMany({
        where: {
          verticalId: vertical.id,
          id: { in: visibleEmployeeIds },
          isActive: true,
          teamId: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          level: true,
        },
        orderBy: { firstName: "asc" },
      });

      for (const vm of verticalManagers) {
        verticalNode.children!.push({
          id: vm.id,
          type: employeeNodeType(vm.level),
          label: `${vm.firstName} ${vm.lastName}`,
          designation: vm.designation ?? undefined,
        });
      }

      const teams = await prisma.team.findMany({
        where: {
          verticalId: vertical.id,
          isActive: true,
          employees: { some: { id: { in: visibleEmployeeIds } } },
        },
        select: {
          id: true,
          name: true,
          _count: { select: { employees: true } },
        },
        orderBy: { name: "asc" },
      });

      for (const team of teams) {
        const teamNode: PerspectiveNode = {
          id: team.id,
          type: "TEAM",
          label: team.name,
          memberCount: team._count.employees,
          children: [],
        };

        const employees = await prisma.employee.findMany({
          where: {
            teamId: team.id,
            id: { in: visibleEmployeeIds },
            isActive: true,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            level: true,
          },
          orderBy: { firstName: "asc" },
        });

        for (const employee of employees) {
          teamNode.children!.push({
            id: employee.id,
            type: employeeNodeType(employee.level),
            label: `${employee.firstName} ${employee.lastName}`,
            designation: employee.designation ?? undefined,
          });
        }

        verticalNode.children!.push(teamNode);
      }

      businessNode.children!.push(verticalNode);
    }

    tree.push(businessNode);
  }

  return tree;
}

async function buildBreadcrumb(
  type: PerspectiveTargetType,
  targetId: string,
): Promise<{ type: PerspectiveTargetType; id: string; label: string }[]> {
  const breadcrumb: {
    type: PerspectiveTargetType;
    id: string;
    label: string;
  }[] = [];

  switch (type) {
    case "ORGANIZATION": {
      const org = await prisma.organization.findUnique({
        where: { id: targetId },
        select: { id: true, name: true },
      });
      if (org) {
        breadcrumb.push({ type: "ORGANIZATION", id: org.id, label: org.name });
      }
      break;
    }

    case "BUSINESS": {
      const business = await prisma.business.findUnique({
        where: { id: targetId },
        select: { id: true, name: true },
      });
      if (business) {
        breadcrumb.push({
          type: "BUSINESS",
          id: business.id,
          label: business.name,
        });
      }
      break;
    }

    case "DEPARTMENT": {
      const dept = await prisma.department.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          name: true,
          business: { select: { id: true, name: true } },
        },
      });
      if (dept) {
        breadcrumb.push({
          type: "BUSINESS",
          id: dept.business.id,
          label: dept.business.name,
        });
        breadcrumb.push({ type: "DEPARTMENT", id: dept.id, label: dept.name });
      }
      break;
    }

    case "VERTICAL": {
      const vertical = await prisma.vertical.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          name: true,
          business: { select: { id: true, name: true } },
        },
      });
      if (vertical) {
        breadcrumb.push({
          type: "BUSINESS",
          id: vertical.business.id,
          label: vertical.business.name,
        });
        breadcrumb.push({
          type: "VERTICAL",
          id: vertical.id,
          label: vertical.name,
        });
      }
      break;
    }

    case "HEAD": {
      const headEmployee = await prisma.employee.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          business: { select: { id: true, name: true } },
        },
      });
      if (headEmployee) {
        breadcrumb.push({
          type: "BUSINESS",
          id: headEmployee.business.id,
          label: headEmployee.business.name,
        });
        breadcrumb.push({
          type: "HEAD",
          id: headEmployee.id,
          label: `${headEmployee.firstName} ${headEmployee.lastName}`,
        });
      }
      break;
    }

    case "TEAM": {
      const team = await prisma.team.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          name: true,
          business: { select: { id: true, name: true } },
          vertical: { select: { id: true, name: true } },
        },
      });
      if (team) {
        breadcrumb.push({
          type: "BUSINESS",
          id: team.business.id,
          label: team.business.name,
        });
        if (team.vertical) {
          breadcrumb.push({
            type: "VERTICAL",
            id: team.vertical.id,
            label: team.vertical.name,
          });
        }
        breadcrumb.push({ type: "TEAM", id: team.id, label: team.name });
      }
      break;
    }

    case "BUSINESS_OWNER": {
      const business = await prisma.business.findUnique({
        where: { id: targetId },
        select: { id: true, name: true },
      });
      if (business) {
        breadcrumb.push({
          type: "BUSINESS_OWNER",
          id: business.id,
          label: business.name,
        });
      }
      break;
    }

    // EMPLOYEE, MANAGER, and INTERN all share the same team → employee crumb structure.
    // The only difference is the type label on the final node.
    case "EMPLOYEE":
    case "MANAGER":
    case "INTERN": {
      const employee = await prisma.employee.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          team: {
            select: {
              id: true,
              name: true,
              business: { select: { id: true, name: true } },
              vertical: { select: { id: true, name: true } },
            },
          },
        },
      });
      if (employee) {
        if (employee.team) {
          breadcrumb.push({
            type: "BUSINESS",
            id: employee.team.business.id,
            label: employee.team.business.name,
          });
          if (employee.team.vertical) {
            breadcrumb.push({
              type: "VERTICAL",
              id: employee.team.vertical.id,
              label: employee.team.vertical.name,
            });
          }
          breadcrumb.push({
            type: "TEAM",
            id: employee.team.id,
            label: employee.team.name,
          });
        }
        breadcrumb.push({
          type,
          id: employee.id,
          label: `${employee.firstName} ${employee.lastName}`,
        });
      }
      break;
    }
  }

  return breadcrumb;
}

async function validateScopeBoundaries(
  viewer: {
    id: string;
    businessId: string;
    role: { level: number };
    verticalId: string | null;
    teamId: string | null;
  },
  targetType: PerspectiveTargetType,
  targetId: string,
) {
  const viewerLevel = viewer.role.level;

  // Super admin & Owner bypass
  if (viewerLevel >= 4) return;

  if (
    targetType === "EMPLOYEE" ||
    targetType === "MANAGER" ||
    targetType === "INTERN" ||
    targetType === "HEAD"
  ) {
    const target = await prisma.employee.findUnique({
      where: { id: targetId },
      select: {
        businessId: true,
        verticalId: true,
        teamId: true,
        level: true,
        role: { select: { level: true } },
      },
    });
    if (!target) throw new ApiError(404, "Target employee not found");

    const targetLevel = target.level ?? target.role.level;

    // Cannot escalate to a higher role level
    if (viewerLevel < targetLevel) {
      throw new ApiError(403, "Access denied: cannot switch to higher hierarchy level");
    }

    // Must be in the same business (enforced by businessId FK, not designation)
    if (target.businessId !== viewer.businessId) {
      throw new ApiError(403, "Access denied: cannot access employees in other businesses");
    }

    // L2 managers are further scoped by vertical and team membership
    if (viewerLevel === 2) {
      // viewer.verticalId != null (loose) catches both null and undefined
      if (viewer.verticalId != null && target.verticalId !== viewer.verticalId) {
        throw new ApiError(403, "Access denied: cannot access employees outside your vertical");
      }
      if (viewer.teamId != null && target.teamId !== viewer.teamId) {
        throw new ApiError(403, "Access denied: cannot access employees outside your team");
      }
    }
  }

  if (targetType === "TEAM") {
    const target = await prisma.team.findUnique({
      where: { id: targetId },
      select: { id: true, businessId: true, verticalId: true },
    });
    if (!target) throw new ApiError(404, "Target team not found");

    // Must be in the same business
    if (target.businessId !== viewer.businessId) {
      throw new ApiError(403, "Access denied: cannot access teams in other businesses");
    }

    // L2 managers: further scoped by vertical and team
    if (viewerLevel === 2) {
      if (viewer.verticalId != null && target.verticalId !== viewer.verticalId) {
        throw new ApiError(403, "Access denied: cannot access teams outside your vertical");
      }
      if (viewer.teamId != null && target.id !== viewer.teamId) {
        throw new ApiError(403, "Access denied: cannot access teams outside your own team");
      }
    }
  }

  if (targetType === "VERTICAL") {
    const target = await prisma.vertical.findUnique({
      where: { id: targetId },
      select: { id: true, businessId: true },
    });
    if (!target) throw new ApiError(404, "Target vertical not found");

    // Must be in the same business
    if (target.businessId !== viewer.businessId) {
      throw new ApiError(403, "Access denied: cannot access verticals in other businesses");
    }

    // L2 managers can only access their own vertical
    if (viewerLevel === 2 && viewer.verticalId != null && target.id !== viewer.verticalId) {
      throw new ApiError(403, "Access denied: cannot access other verticals");
    }
  }
}
