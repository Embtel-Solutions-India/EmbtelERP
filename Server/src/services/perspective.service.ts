import type { PerspectiveTargetType } from "@prisma/client";
import { ActivityAction } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { getDescendantIds, isDescendantOf } from "./hierarchy.service.js";

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
  type: "BUSINESS" | "TEAM" | "EMPLOYEE";
  label: string;
  children?: PerspectiveNode[];
  memberCount?: number;
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

  // Business owner (level 4) sees their own business
  if (viewer.role.level >= 4) {
    return [viewer.businessId];
  }

  // Others only see their own business
  return [viewer.businessId];
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

  // Get businesses
  const businesses = await prisma.business.findMany({
    where: { id: { in: businessIds }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  for (const business of businesses) {
    const businessNode: PerspectiveNode = {
      id: business.id,
      type: "BUSINESS",
      label: business.name,
      children: [],
    };

    // Get teams in this business that have visible employees
    const teams = await prisma.team.findMany({
      where: {
        businessId: business.id,
        isActive: true,
        employees: {
          some: {
            id: { in: visibleEmployeeIds },
          },
        },
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

      // Get employees in this team that are visible to the viewer
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
        },
        orderBy: { firstName: "asc" },
      });

      for (const employee of employees) {
        teamNode.children!.push({
          id: employee.id,
          type: "EMPLOYEE",
          label: `${employee.firstName} ${employee.lastName}`,
        });
      }

      businessNode.children!.push(teamNode);
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

    case "TEAM": {
      const team = await prisma.team.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          name: true,
          business: { select: { id: true, name: true } },
        },
      });
      if (team) {
        breadcrumb.push({
          type: "BUSINESS",
          id: team.business.id,
          label: team.business.name,
        });
        breadcrumb.push({ type: "TEAM", id: team.id, label: team.name });
      }
      break;
    }

    case "EMPLOYEE": {
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
          breadcrumb.push({
            type: "TEAM",
            id: employee.team.id,
            label: employee.team.name,
          });
        }
        breadcrumb.push({
          type: "EMPLOYEE",
          id: employee.id,
          label: `${employee.firstName} ${employee.lastName}`,
        });
      }
      break;
    }
  }

  return breadcrumb;
}
