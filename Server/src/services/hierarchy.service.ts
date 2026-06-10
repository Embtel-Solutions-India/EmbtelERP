import { prisma } from "../config/prisma.js";

export type RoleTreeNode = {
  id: string;
  name: string;
  nodeType: "business" | "employee";
  designation?: string;
  roleLevel?: number;
  children: RoleTreeNode[];
};

export type HierarchyNode = {
  id: string;
  name: string;
  employeeId: string;
  roleLevel: number;
  designation?: string;
  nodeType: "employee" | "business" | "vertical" | "team";
  businessId?: string;
  verticalId?: string;
  teamId?: string;
  children: HierarchyNode[];
};

export type OrganizationTree = {
  businesses: BusinessTreeNode[];
};

export type BusinessTreeNode = {
  id: string;
  name: string;
  code: string;
  nodeType: "business";
  head?: HierarchyNode;
  verticals: VerticalTreeNode[];
};

export type VerticalTreeNode = {
  id: string;
  name: string;
  code: string;
  nodeType: "vertical";
  manager?: HierarchyNode;
  teams: TeamTreeNode[];
};

export type TeamTreeNode = {
  id: string;
  name: string;
  code: string;
  nodeType: "team";
  manager?: HierarchyNode;
  members: HierarchyNode[];
};

type HierarchyRow = {
  id: string;
  firstName: string;
  lastName: string;
  businessId: string;
  departmentId: string | null;
  teamId: string | null;
  verticalId: string | null;
  roleId: string;
  managerId: string | null;
  designation: string | null;
};

type IdRow = {
  id: string;
};

type ManagerRow = {
  mgr: string;
};

export async function getDescendants(
  employeeId: string,
): Promise<HierarchyRow[]> {
  let rows: IdRow[];

  try {
    rows = await prisma.$queryRaw<IdRow[]>`
      WITH RECURSIVE hierarchy AS (
        SELECT e."id",
               e."managerId" AS "managerRef"
        FROM "Employee" e
        WHERE e."managerId" = ${employeeId}

        UNION ALL

        SELECT child."id",
               child."managerId" AS "managerRef"
        FROM "Employee" child
        INNER JOIN hierarchy parent
          ON child."managerId" = parent."id"
      )
      SELECT DISTINCT id
      FROM hierarchy;
    `;
  } catch (err) {
    console.error("prisma:$queryRaw getDescendants error", err);
    throw err;
  }

  const ids = rows.map((r) => r.id);

  if (ids.length === 0) return [];

  return prisma.employee.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    orderBy: {
      firstName: "asc",
    },
  });
}

export async function getDescendantIds(employeeId: string): Promise<string[]> {
  let rows: IdRow[];

  try {
    rows = await prisma.$queryRaw<IdRow[]>`
      WITH RECURSIVE hierarchy AS (
        SELECT e."id",
               e."managerId" AS "managerRef"
        FROM "Employee" e
        WHERE e."managerId" = ${employeeId}

        UNION ALL

        SELECT child."id",
               child."managerId" AS "managerRef"
        FROM "Employee" child
        INNER JOIN hierarchy parent
          ON child."managerId" = parent."id"
      )
      SELECT DISTINCT id
      FROM hierarchy;
    `;
  } catch (err) {
    console.error("prisma:$queryRaw getDescendantIds error", err);
    throw err;
  }

  return rows.map((r) => r.id);
}

export async function isDescendantOf(
  candidateId: string,
  ancestorId: string,
): Promise<boolean> {
  const descendants = await getDescendantIds(ancestorId);
  return descendants.includes(candidateId);
}

export async function getManagers(employeeId: string): Promise<HierarchyRow[]> {
  let rows: ManagerRow[];

  try {
    rows = await prisma.$queryRaw<ManagerRow[]>`
      WITH RECURSIVE managers AS (
        SELECT e."managerId" AS "mgr",
               1 AS depth
        FROM "Employee" e
        WHERE e.id = ${employeeId}
          AND e."managerId" IS NOT NULL

        UNION ALL

        SELECT mgr2."managerId" AS "mgr",
               managers.depth + 1
        FROM "Employee" mgr2
        JOIN managers
          ON mgr2.id = managers.mgr
        WHERE mgr2."managerId" IS NOT NULL
      )
      SELECT DISTINCT mgr
      FROM managers;
    `;
  } catch (err) {
    console.error("prisma:$queryRaw getManagers error", err);
    throw err;
  }

  const ids = rows.map((r) => r.mgr).filter((id): id is string => Boolean(id));

  if (ids.length === 0) return [];

  return prisma.employee.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    orderBy: {
      firstName: "asc",
    },
  });
}

export async function getHierarchyTree(
  rootEmployeeId: string,
): Promise<HierarchyNode | null> {
  let rows: IdRow[];

  try {
    rows = await prisma.$queryRaw<IdRow[]>`
      WITH RECURSIVE hierarchy AS (
        SELECT e."id",
               e."managerId" AS "managerRef",
               0 AS depth
        FROM "Employee" e
        WHERE e."id" = ${rootEmployeeId}

        UNION ALL

        SELECT child."id",
               child."managerId" AS "managerRef",
               parent.depth + 1 AS depth
        FROM "Employee" child
        INNER JOIN hierarchy parent
          ON child."managerId" = parent.id
      )
      SELECT DISTINCT id
      FROM hierarchy;
    `;
  } catch (err) {
    console.error("prisma:$queryRaw getHierarchyTree error", err);
    throw err;
  }

  const ids = rows.map((r) => r.id);

  if (ids.length === 0) return null;

  const employees = await prisma.employee.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      roleId: true,
      managerId: true,
      designation: true,
      teamId: true,
      verticalId: true,
      businessId: true,
    },
  });

  const tree = new Map<string, HierarchyNode>();

  for (const employee of employees) {
    tree.set(employee.id, {
      id: employee.id,
      employeeId: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      roleLevel: 0,
      designation: employee.designation ?? undefined,
      nodeType: "employee",
      businessId: employee.businessId,
      verticalId: employee.verticalId ?? undefined,
      teamId: employee.teamId ?? undefined,
      children: [],
    });
  }

  for (const employee of employees) {
    const node = tree.get(employee.id);

    if (!node) continue;

    const managerId = employee.managerId;

    if (managerId && tree.has(managerId)) {
      tree.get(managerId)!.children.push(node);
    }
  }

  return tree.get(rootEmployeeId) ?? null;
}

/**
 * Get the full organization tree starting from Business Owner level.
 * Shows all businesses, verticals, teams, and their heads/managers.
 */
export async function getFullOrganizationTree(): Promise<OrganizationTree> {
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    include: {
      verticals: {
        where: { isActive: true },
        include: {
          teams: {
            where: { isActive: true },
            include: {
              employees: {
                where: { isActive: true },
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  designation: true,
                  managerId: true,
                  roleId: true,
                  level: true,
                },
                orderBy: { firstName: "asc" },
              },
            },
          },
          employees: {
            where: { isActive: true, teamId: null },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              designation: true,
              managerId: true,
              roleId: true,
              level: true,
            },
          },
        },
      },
      employees: {
        where: { isActive: true, verticalId: null, teamId: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          managerId: true,
          roleId: true,
          level: true,
        },
      },
    },
  });

  const businessNodes: BusinessTreeNode[] = businesses.map((business) => {
    // Find the head of this business (employee with level 3 who reports to business owner)
    const head = business.employees.find((e) => e.level === 3);

    const verticalNodes: VerticalTreeNode[] = business.verticals.map(
      (vertical) => {
        // Find the vertical manager (employee with designation "Vertical Manager" in this vertical)
        const manager = vertical.employees.find(
          (e) => e.designation === "Vertical Manager",
        );

        const teamNodes: TeamTreeNode[] = vertical.teams.map((team) => {
          // Find team manager (highest level employee in the team)
          const teamManager = team.employees.find(
            (e) =>
              e.level === 2 ||
              e.designation?.includes("Head") ||
              e.designation?.includes("Manager") ||
              e.designation?.includes("Lead"),
          );

          const members: HierarchyNode[] = team.employees
            .filter((e) => e.id !== teamManager?.id)
            .map((e) => ({
              id: e.id,
              employeeId: e.id,
              name: `${e.firstName} ${e.lastName}`,
              roleLevel: e.level ?? 0,
              designation: e.designation ?? undefined,
              nodeType: "employee" as const,
              children: [],
            }));

          return {
            id: team.id,
            name: team.name,
            code: team.code,
            nodeType: "team" as const,
            manager: teamManager
              ? {
                  id: teamManager.id,
                  employeeId: teamManager.id,
                  name: `${teamManager.firstName} ${teamManager.lastName}`,
                  roleLevel: teamManager.level ?? 0,
                  designation: teamManager.designation ?? undefined,
                  nodeType: "employee" as const,
                  children: [],
                }
              : undefined,
            members,
          };
        });

        return {
          id: vertical.id,
          name: vertical.name,
          code: vertical.code,
          nodeType: "vertical" as const,
          manager: manager
            ? {
                id: manager.id,
                employeeId: manager.id,
                name: `${manager.firstName} ${manager.lastName}`,
                roleLevel: manager.level ?? 0,
                designation: manager.designation ?? undefined,
                nodeType: "employee" as const,
                children: [],
              }
            : undefined,
          teams: teamNodes,
        };
      },
    );

    return {
      id: business.id,
      name: business.name,
      code: business.code,
      nodeType: "business" as const,
      head: head
        ? {
            id: head.id,
            employeeId: head.id,
            name: `${head.firstName} ${head.lastName}`,
            roleLevel: head.level ?? 0,
            designation: head.designation ?? undefined,
            nodeType: "employee" as const,
            children: [],
          }
        : undefined,
      verticals: verticalNodes,
    };
  });

  return { businesses: businessNodes };
}

/**
 * Get hierarchy tree for a specific business.
 */
export async function getBusinessHierarchyTree(
  businessId: string,
): Promise<BusinessTreeNode | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      verticals: {
        where: { isActive: true },
        include: {
          teams: {
            where: { isActive: true },
            include: {
              employees: {
                where: { isActive: true },
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  designation: true,
                  managerId: true,
                  roleId: true,
                  level: true,
                },
                orderBy: { firstName: "asc" },
              },
            },
          },
          employees: {
            where: { isActive: true, teamId: null },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              designation: true,
              managerId: true,
              roleId: true,
              level: true,
            },
          },
        },
      },
      employees: {
        where: { isActive: true, verticalId: null, teamId: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          managerId: true,
          roleId: true,
          level: true,
        },
      },
    },
  });

  if (!business) return null;

  const head = business.employees.find((e) => e.level === 3);

  const verticalNodes: VerticalTreeNode[] = business.verticals.map(
    (vertical) => {
      const manager = vertical.employees.find(
        (e) => e.designation === "Vertical Manager",
      );

      const teamNodes: TeamTreeNode[] = vertical.teams.map((team) => {
        const teamManager = team.employees.find(
          (e) =>
            e.level === 2 ||
            e.designation?.includes("Head") ||
            e.designation?.includes("Manager") ||
            e.designation?.includes("Lead"),
        );

        const members: HierarchyNode[] = team.employees
          .filter((e) => e.id !== teamManager?.id)
          .map((e) => ({
            id: e.id,
            employeeId: e.id,
            name: `${e.firstName} ${e.lastName}`,
            roleLevel: e.level ?? 0,
            designation: e.designation ?? undefined,
            nodeType: "employee" as const,
            children: [],
          }));

        return {
          id: team.id,
          name: team.name,
          code: team.code,
          nodeType: "team" as const,
          manager: teamManager
            ? {
                id: teamManager.id,
                employeeId: teamManager.id,
                name: `${teamManager.firstName} ${teamManager.lastName}`,
                roleLevel: teamManager.level ?? 0,
                designation: teamManager.designation ?? undefined,
                nodeType: "employee" as const,
                children: [],
              }
            : undefined,
          members,
        };
      });

      return {
        id: vertical.id,
        name: vertical.name,
        code: vertical.code,
        nodeType: "vertical" as const,
        manager: manager
          ? {
              id: manager.id,
              employeeId: manager.id,
              name: `${manager.firstName} ${manager.lastName}`,
              roleLevel: manager.level ?? 0,
              designation: manager.designation ?? undefined,
              nodeType: "employee" as const,
              children: [],
            }
          : undefined,
        teams: teamNodes,
      };
    },
  );

  return {
    id: business.id,
    name: business.name,
    code: business.code,
    nodeType: "business" as const,
    head: head
      ? {
          id: head.id,
          employeeId: head.id,
          name: `${head.firstName} ${head.lastName}`,
          roleLevel: head.level ?? 0,
          designation: head.designation ?? undefined,
          nodeType: "employee" as const,
          children: [],
        }
      : undefined,
    verticals: verticalNodes,
  };
}

/**
 * Get all ancestors of an employee (chain up to Business Owner).
 */
export async function getNodeAncestors(
  employeeId: string,
): Promise<HierarchyNode[]> {
  const ancestors: HierarchyNode[] = [];
  let currentId: string | null = employeeId;

  while (currentId) {
    const employee: {
      id: string;
      firstName: string;
      lastName: string;
      designation: string | null;
      managerId: string | null;
      level: number | null;
      businessId: string;
      verticalId: string | null;
      teamId: string | null;
    } | null = await prisma.employee.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designation: true,
        managerId: true,
        level: true,
        businessId: true,
        verticalId: true,
        teamId: true,
      },
    });

    if (!employee) break;

    ancestors.unshift({
      id: employee.id,
      employeeId: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      roleLevel: employee.level ?? 0,
      designation: employee.designation ?? undefined,
      nodeType: "employee",
      businessId: employee.businessId,
      verticalId: employee.verticalId ?? undefined,
      teamId: employee.teamId ?? undefined,
      children: [],
    });

    currentId = employee.managerId;
  }

  return ancestors;
}

/**
 * Get full org role tree: Business → Head → Vertical Manager → Manager → Executive → Intern.
 * Uses managerId to build the tree; employees whose manager is outside the business
 * scope are placed as direct children of the business node.
 *
 * Pass `businessIds` / `employeeIds` to restrict results to a caller's data scope.
 */
export async function getOrgRoleTree(opts?: {
  businessIds?: string[];
  employeeIds?: string[];
}): Promise<RoleTreeNode[]> {
  const businessFilter = opts?.businessIds?.length
    ? { id: { in: opts.businessIds }, isActive: true }
    : { isActive: true };

  const employeeFilter =
    opts?.employeeIds?.length
      ? { isActive: true, id: { in: opts.employeeIds } }
      : { isActive: true };

  const businesses = await prisma.business.findMany({
    where: businessFilter,
    include: {
      employees: {
        where: employeeFilter,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          managerId: true,
          level: true,
        },
        orderBy: { firstName: "asc" },
      },
    },
  });

  return businesses.map((business) => {
    const nodeMap = new Map<string, RoleTreeNode>();
    for (const e of business.employees) {
      nodeMap.set(e.id, {
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        nodeType: "employee",
        designation: e.designation ?? undefined,
        roleLevel: e.level ?? 0,
        children: [],
      });
    }

    const roots: RoleTreeNode[] = [];
    for (const e of business.employees) {
      const node = nodeMap.get(e.id)!;
      if (e.managerId && nodeMap.has(e.managerId)) {
        nodeMap.get(e.managerId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return {
      id: business.id,
      name: business.name,
      nodeType: "business",
      children: roots,
    };
  });
}

/**
 * Get all descendants of a node (employee) with full details.
 */
export async function getNodeDescendants(
  employeeId: string,
): Promise<HierarchyNode[]> {
  const descendantIds = await getDescendantIds(employeeId);

  if (descendantIds.length === 0) return [];

  const employees = await prisma.employee.findMany({
    where: { id: { in: descendantIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      level: true,
      businessId: true,
      verticalId: true,
      teamId: true,
      managerId: true,
    },
  });

  return employees.map((e) => ({
    id: e.id,
    employeeId: e.id,
    name: `${e.firstName} ${e.lastName}`,
    roleLevel: e.level ?? 0,
    designation: e.designation ?? undefined,
    nodeType: "employee" as const,
    businessId: e.businessId,
    verticalId: e.verticalId ?? undefined,
    teamId: e.teamId ?? undefined,
    children: [],
  }));
}
