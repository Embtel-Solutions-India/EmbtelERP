import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";

export async function listAuditLogs(scope: DataScope) {
  return prisma.auditLog.findMany({
    where: { businessId: { in: scope.visibleBusinesses } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      actor: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
}
