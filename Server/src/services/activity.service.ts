import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";

export async function listActivities(scope: DataScope) {
  return prisma.activity.findMany({
    where: { businessId: { in: scope.visibleBusinesses } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
}
