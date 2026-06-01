import { prisma } from '../config/prisma.js';
export async function listAuditLogs(scope) {
    return prisma.auditLog.findMany({
        where: { businessId: { in: scope.visibleBusinesses } },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
            actor: {
                select: { id: true, firstName: true, lastName: true, email: true },
            },
        },
    });
}
