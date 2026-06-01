import { prisma } from "../config/prisma.js";
export async function getDashboardSummary(scope) {
    const [employeeCount, taskCount, activityCount, auditCount] = await Promise.all([
        prisma.employee.count({ where: { id: { in: scope.visibleEmployees } } }),
        prisma.task.count({
            where: { businessId: { in: scope.visibleBusinesses } },
        }),
        prisma.activity.count({
            where: { businessId: { in: scope.visibleBusinesses } },
        }),
        prisma.auditLog.count({
            where: { businessId: { in: scope.visibleBusinesses } },
        }),
    ]);
    return {
        employeeCount,
        taskCount,
        activityCount,
        auditCount,
    };
}
