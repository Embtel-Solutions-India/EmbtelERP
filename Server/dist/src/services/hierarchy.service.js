import { prisma } from "../config/prisma.js";
export async function getDescendants(employeeId) {
    // use recursive CTE to get descendant ids then fetch full rows via Prisma
    let ids;
    try {
        ids = await prisma.$queryRaw `
    WITH RECURSIVE hierarchy AS (
      SELECT e."id", COALESCE(e."managerId", e."reportsToId") AS "managerRef"
      FROM "Employee" e
      WHERE COALESCE(e."managerId", e."reportsToId") = ${employeeId}
      UNION ALL
      SELECT child."id", COALESCE(child."managerId", child."reportsToId") AS "managerRef"
      FROM "Employee" child
      INNER JOIN hierarchy parent ON COALESCE(child."managerId", child."reportsToId") = parent."id"
    )
    SELECT DISTINCT id FROM hierarchy;
  `;
    }
    catch (err) {
        console.error('prisma:$queryRaw getDescendants error', err);
        throw err;
    }
    if (!ids || ids.length === 0)
        return [];
    return prisma.employee.findMany({
        where: { id: { in: ids } },
        orderBy: { firstName: "asc" },
    });
}
export async function getDescendantIds(employeeId) {
    let ids;
    try {
        ids = await prisma.$queryRaw `
    WITH RECURSIVE hierarchy AS (
      SELECT e."id", COALESCE(e."managerId", e."reportsToId") AS "managerRef"
      FROM "Employee" e
      WHERE COALESCE(e."managerId", e."reportsToId") = ${employeeId}
      UNION ALL
      SELECT child."id", COALESCE(child."managerId", child."reportsToId") AS "managerRef"
      FROM "Employee" child
      INNER JOIN hierarchy parent ON COALESCE(child."managerId", child."reportsToId") = parent."id"
    )
    SELECT DISTINCT id FROM hierarchy;
  `;
    }
    catch (err) {
        console.error('prisma:$queryRaw getDescendantIds error', err);
        throw err;
    }
    return ids ?? [];
}
export async function isDescendantOf(candidateId, ancestorId) {
    const descendants = await getDescendantIds(ancestorId);
    return descendants.includes(candidateId);
}
export async function getManagers(employeeId) {
    let ids;
    try {
        ids = await prisma.$queryRaw `
    WITH RECURSIVE managers AS (
      SELECT COALESCE(e."managerId", e."reportsToId") AS "mgr", 1 AS depth FROM "Employee" e WHERE e.id = ${employeeId} AND COALESCE(e."managerId", e."reportsToId") IS NOT NULL
      UNION ALL
      SELECT COALESCE(mgr2."managerId", mgr2."reportsToId") AS "mgr", managers.depth + 1
      FROM "Employee" mgr2
      JOIN managers ON mgr2.id = managers.mgr
      WHERE COALESCE(mgr2."managerId", mgr2."reportsToId") IS NOT NULL
    )
    SELECT DISTINCT mgr FROM managers;
  `;
    }
    catch (err) {
        console.error('prisma:$queryRaw getManagers error', err);
        throw err;
    }
    if (!ids || ids.length === 0)
        return [];
    return prisma.employee.findMany({
        where: { id: { in: ids } },
        orderBy: { firstName: "asc" },
    });
}
export async function getHierarchyTree(rootEmployeeId) {
    // get all descendant ids including root
    let ids;
    try {
        ids = await prisma.$queryRaw `
    WITH RECURSIVE hierarchy AS (
      SELECT e."id", COALESCE(e."managerId", e."reportsToId") AS "managerRef", 0 AS depth
      FROM "Employee" e
      WHERE e."id" = ${rootEmployeeId}
      UNION ALL
      SELECT child."id", COALESCE(child."managerId", child."reportsToId") AS "managerRef", parent.depth + 1 AS depth
      FROM "Employee" child
      INNER JOIN hierarchy parent ON COALESCE(child."managerId", child."reportsToId") = parent.id
    )
    SELECT DISTINCT id FROM hierarchy;
  `;
    }
    catch (err) {
        console.error('prisma:$queryRaw getHierarchyTree error', err);
        throw err;
    }
    if (!ids || ids.length === 0)
        return null;
    const employees = await prisma.employee.findMany({
        where: { id: { in: ids } },
        select: { id: true, firstName: true, lastName: true, roleId: true, reportsToId: true },
    });
    const tree = new Map();
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
        if (!node)
            continue;
        const managerId = employee.reportsToId;
        if (managerId && tree.has(managerId)) {
            tree.get(managerId).children.push(node);
        }
    }
    return tree.get(rootEmployeeId) ?? null;
}
