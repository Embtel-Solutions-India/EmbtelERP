import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";

export type CurrentPerspective = {
  type: string;
  targetId: string;
};

export async function getDashboardSummary(
  scope: DataScope,
  perspective?: CurrentPerspective,
) {
  const [employeeCount, taskCount, activityCount, auditCount] =
    await Promise.all([
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

  // Team-specific KPIs when viewing a team perspective
  let teamKpis = null;
  if (perspective?.type === "TEAM") {
    const team = await prisma.team.findUnique({
      where: { id: perspective.targetId },
      select: {
        id: true,
        name: true,
        _count: { select: { employees: true, tasks: true } },
      },
    });
    if (team) {
      teamKpis = {
        teamName: team.name,
        memberCount: team._count.employees,
        taskCount: team._count.tasks,
      };
    }
  }

  // Employee-specific KPIs when viewing an employee perspective
  let employeeKpis = null;
  if (perspective?.type === "EMPLOYEE") {
    const employee = await prisma.employee.findUnique({
      where: { id: perspective.targetId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designation: true,
        _count: { select: { tasksOwned: true } },
      },
    });
    if (employee) {
      employeeKpis = {
        name: `${employee.firstName} ${employee.lastName}`,
        designation: employee.designation,
        taskCount: employee._count.tasksOwned,
      };
    }
  }

  return {
    employeeCount,
    taskCount,
    activityCount,
    auditCount,
    perspective: perspective
      ? {
          type: perspective.type,
          targetId: perspective.targetId,
          teamKpis,
          employeeKpis,
        }
      : null,
  };
}
