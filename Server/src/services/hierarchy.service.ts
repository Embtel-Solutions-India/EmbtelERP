import { prisma } from "../config/prisma.js";

export type HierarchyNode = {
  id: string;
  name: string;
  employeeId: string;
  roleLevel: number;
  children: HierarchyNode[];
};

type HierarchyRow = {
  id: string;
  firstName: string;
  lastName: string;
  businessId: string;
  departmentId: string | null;
  teamId: string | null;
  roleId: string;
  reportsToId: string | null;
};

export async function getDescendants(
  employeeId: string,
): Promise<HierarchyRow[]> {
  const rows = await prisma.$queryRaw<HierarchyRow[]>`
    WITH RECURSIVE hierarchy AS (
      SELECT e."id", e."firstName", e."lastName", e."businessId", e."departmentId", e."teamId", e."roleId", e."reportsToId"
      FROM "Employee" e
      WHERE e."reportsToId" = ${employeeId}
      UNION ALL
      SELECT child."id", child."firstName", child."lastName", child."businessId", child."departmentId", child."teamId", child."roleId", child."reportsToId"
      FROM "Employee" child
      INNER JOIN hierarchy parent ON child."reportsToId" = parent."id"
    )
    SELECT DISTINCT *
    FROM hierarchy h
    ORDER BY h."firstName" ASC
  `;

  return rows;
}

export async function getDescendantIds(employeeId: string): Promise<string[]> {
  const employees = await getDescendants(employeeId);
  return employees.map((employee) => employee.id);
}

export async function isDescendantOf(
  candidateId: string,
  ancestorId: string,
): Promise<boolean> {
  const descendants = await getDescendantIds(ancestorId);
  return descendants.includes(candidateId);
}

export async function getHierarchyTree(
  rootEmployeeId: string,
): Promise<HierarchyNode | null> {
  const employees = await prisma.$queryRaw<
    Array<HierarchyRow & { depth: number }>
  >`
    WITH RECURSIVE hierarchy AS (
      SELECT e."id", e."firstName", e."lastName", e."businessId", e."departmentId", e."teamId", e."roleId", e."reportsToId", 0 AS depth
      FROM "Employee" e
      WHERE e."id" = ${rootEmployeeId}
      UNION ALL
      SELECT child."id", child."firstName", child."lastName", child."businessId", child."departmentId", child."teamId", child."roleId", child."reportsToId", parent.depth + 1 AS depth
      FROM "Employee" child
      INNER JOIN hierarchy parent ON child."reportsToId" = parent."id"
    )
    SELECT * FROM hierarchy
    ORDER BY depth ASC
  `;

  if (employees.length === 0) {
    return null;
  }

  const tree = new Map<string, HierarchyNode>();
  for (const employee of employees) {
    tree.set(employee.id, {
      id: employee.id,
      employeeId: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      roleLevel: 0,
      children: [],
    });
  }

  for (const employee of employees) {
    const node = tree.get(employee.id);
    if (!node) {
      continue;
    }
    const managerId = employee.reportsToId;
    if (managerId && tree.has(managerId)) {
      tree.get(managerId)!.children.push(node);
    }
  }

  return tree.get(rootEmployeeId) ?? null;
}
