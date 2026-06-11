import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";
import { getImmigrationBusinessId } from "./immigration.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImmigrationTreeNode {
  id: string;
  name: string;
  nodeType: "vertical" | "department" | "employee";
  roleLevel?: number;
  designation?: string;
  memberCount?: number;
  children?: ImmigrationTreeNode[];
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Returns the immigration structural tree scoped to the viewer's permissions.
 *
 * HEAD (level ≥ 3): all verticals → their departments (inferred via employees)
 *                   → employees within each department.
 * MANAGER (level 2): only the viewer's own vertical (from scope.visibleTeams).
 */
export async function getImmigrationTree(
  scope: DataScope,
  viewerLevel: number,
): Promise<ImmigrationTreeNode[]> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return [];

  // For level 2 (Vertical Manager), restrict to their visible teams/vertical
  const employeeWhere: Record<string, unknown> =
    viewerLevel >= 3
      ? { businessId, isActive: true }
      : {
          businessId,
          isActive: true,
          ...(scope.visibleTeams.length
            ? { teamId: { in: scope.visibleTeams } }
            : { id: { in: scope.visibleEmployees } }),
        };

  // Fetch all verticals in the immigration business
  const allVerticals = await prisma.vertical.findMany({
    where: { businessId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Fetch all scoped employees with their vertical + department
  const employees = await prisma.employee.findMany({
    where: employeeWhere,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      verticalId: true,
      departmentId: true,
      designation: true,
      level: true,
      role: { select: { level: true } },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  // Collect which verticals are represented in the scoped employees
  const coveredVerticalIds = new Set(
    employees.map((e) => e.verticalId).filter(Boolean),
  );

  // Fetch all departments we need (those that have at least one scoped employee)
  const deptIds = [
    ...new Set(employees.map((e) => e.departmentId).filter(Boolean)),
  ] as string[];

  const departments =
    deptIds.length > 0
      ? await prisma.department.findMany({
          where: { id: { in: deptIds }, isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];

  const deptMap = new Map(departments.map((d) => [d.id, d]));

  // Build tree: Vertical → Departments → Employees
  const tree: ImmigrationTreeNode[] = [];

  for (const vertical of allVerticals) {
    if (!coveredVerticalIds.has(vertical.id)) continue;

    const vertEmps = employees.filter((e) => e.verticalId === vertical.id);

    // Group employees by department (null department = "No Department")
    const deptGroups = new Map<string | null, typeof vertEmps>();
    for (const emp of vertEmps) {
      const key = emp.departmentId ?? null;
      if (!deptGroups.has(key)) deptGroups.set(key, []);
      deptGroups.get(key)!.push(emp);
    }

    const deptChildren: ImmigrationTreeNode[] = [];

    for (const [deptId, deptEmps] of deptGroups) {
      const deptInfo = deptId ? deptMap.get(deptId) : null;
      const deptLabel = deptInfo?.name ?? "General";

      const empNodes: ImmigrationTreeNode[] = deptEmps.map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        nodeType: "employee",
        roleLevel: e.level ?? e.role?.level ?? 0,
        designation: e.designation ?? undefined,
      }));

      deptChildren.push({
        id: deptId ?? `${vertical.id}:general`,
        name: deptLabel,
        nodeType: "department",
        memberCount: empNodes.length,
        children: empNodes,
      });
    }

    // Sort departments alphabetically
    deptChildren.sort((a, b) => a.name.localeCompare(b.name));

    tree.push({
      id: vertical.id,
      name: vertical.name,
      nodeType: "vertical",
      memberCount: vertEmps.length,
      children: deptChildren,
    });
  }

  return tree;
}
