import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";

export type AuditLogQuery = {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  action?: string;
  entityType?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
};

const SORTABLE = new Set(["createdAt", "action", "entityType", "entityName"]);

const actorSelect = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    designation: true,
    role: { select: { name: true } },
    department: { select: { name: true } },
  },
} satisfies Prisma.EmployeeDefaultArgs;

// Hierarchical RBAC: a viewer may read audit entries authored by anyone within
// their visible-employee set (self + subordinates, expanded per role/perspective
// in scope.service). Interns therefore see only their own; heads see their tree;
// business owners / super admins see the whole org.
export async function listAuditLogs(scope: DataScope, query: AuditLogQuery = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(query.pageSize) || 25));

  const sortField = SORTABLE.has(String(query.sort)) ? String(query.sort) : "createdAt";
  const order: "asc" | "desc" = query.order === "asc" ? "asc" : "desc";

  const and: Prisma.AuditLogWhereInput[] = [
    { actorId: { in: scope.visibleEmployees } },
  ];

  if (query.action) {
    and.push({ action: query.action as Prisma.AuditLogWhereInput["action"] });
  }
  if (query.entityType) {
    and.push({ entityType: query.entityType });
  }
  if (query.department) {
    and.push({ actor: { department: { name: { equals: query.department, mode: "insensitive" } } } });
  }
  if (query.dateFrom || query.dateTo) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.dateFrom) createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      to.setHours(23, 59, 59, 999);
      createdAt.lte = to;
    }
    and.push({ createdAt });
  }
  if (query.search) {
    const s = query.search;
    and.push({
      OR: [
        { entityName: { contains: s, mode: "insensitive" } },
        { entityType: { contains: s, mode: "insensitive" } },
        { entityId: { contains: s, mode: "insensitive" } },
        { actor: { firstName: { contains: s, mode: "insensitive" } } },
        { actor: { lastName: { contains: s, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.AuditLogWhereInput = { AND: and };

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: actorSelect },
    }),
  ]);

  const data = rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityName: row.entityName,
    entityId: row.entityId,
    before: row.before,
    after: row.after,
    createdAt: row.createdAt,
    ipAddress: row.ipAddress,
    user: row.actor
      ? `${row.actor.firstName} ${row.actor.lastName}`.trim()
      : "System",
    userEmail: row.actor?.email ?? null,
    role: row.actor?.role?.name ?? null,
    department: row.actor?.department?.name ?? null,
  }));

  return { data, total, page, pageSize };
}
