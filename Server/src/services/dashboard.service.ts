import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";
import { getDescendantIds } from "./hierarchy.service.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CurrentPerspective = {
  type: string;
  targetId: string;
};

export type AggregationLevel =
  | "SELF"
  | "TEAM"
  | "DEPARTMENT"
  | "BUSINESS"
  | "DESCENDANT"
  | "ALL"
  | "BUSINESS_OWNER"
  | "HEAD"
  | "VERTICAL"
  | "TEAM_MANAGER"
  | "EMPLOYEE";

export type DashboardOverview = {
  employeeCount: number;
  taskCount: number;
  taskCompleted: number;
  taskPending: number;
  taskOverdue: number;
  activityCount: number;
  auditCount: number;
  perspective: {
    type: string;
    targetId: string;
    label: string;
    aggregationLevel: AggregationLevel;
  } | null;
  teamKpis: TeamKpiSummary | null;
  employeeKpis: EmployeeKpiSummary | null;
  businessKpis: BusinessKpiSummary | null;
};

export type TeamKpiSummary = {
  teamName: string;
  memberCount: number;
  taskCount: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  targetAchievement: number;
  completionRate: number;
  monthlyRevenue: number;
  monthlyTarget: number;
};

export type EmployeeKpiSummary = {
  name: string;
  designation: string | null;
  taskCount: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  performanceScore: number;
  productivity: number;
};

export type BusinessKpiSummary = {
  businessName: string;
  departmentCount: number;
  teamCount: number;
  verticalCount: number;
  employeeCount: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  targetAchievement: number;
};

export type BusinessAnalytics = {
  businessId: string;
  businessName: string;
  businessCode: string;
  employeeCount: number;
  teamCount: number;
  verticalCount: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  targetAchievement: number;
  leadsGenerated: number;
  conversions: number;
  revenue: number;
  teams: {
    id: string;
    name: string;
    memberCount: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
  }[];
};

export type DashboardPerformance = {
  period: string;
  revenue: number;
  target: number;
  leads: number;
  conversions: number;
  tasksCompleted: number;
  tasksCreated: number;
  employeeProductivity: number;
};

export type DashboardInsight = {
  type: "positive" | "negative" | "neutral";
  category: string;
  message: string;
  metric: string;
  change: number;
  trend: "up" | "down" | "stable";
};

export type DashboardTeam = {
  id: string;
  name: string;
  memberCount: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  targetAchievement: number;
  ranking: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getPerspectiveLabel(
  type: string,
  targetId: string,
): Promise<string> {
  switch (type) {
    case "BUSINESS": {
      const b = await prisma.business.findUnique({
        where: { id: targetId },
        select: { name: true },
      });
      return b?.name ?? "Unknown Business";
    }
    case "DEPARTMENT": {
      const d = await prisma.department.findUnique({
        where: { id: targetId },
        select: { name: true },
      });
      return d?.name ?? "Unknown Department";
    }
    case "VERTICAL": {
      const v = await prisma.vertical.findUnique({
        where: { id: targetId },
        select: { name: true },
      });
      return v?.name ?? "Unknown Vertical";
    }
    case "HEAD": {
      const e = await prisma.employee.findUnique({
        where: { id: targetId },
        select: { firstName: true, lastName: true },
      });
      return e ? `${e.firstName} ${e.lastName}` : "Unknown Head";
    }
    case "TEAM": {
      const t = await prisma.team.findUnique({
        where: { id: targetId },
        select: { name: true },
      });
      return t?.name ?? "Unknown Team";
    }
    case "EMPLOYEE": {
      const e = await prisma.employee.findUnique({
        where: { id: targetId },
        select: { firstName: true, lastName: true },
      });
      return e ? `${e.firstName} ${e.lastName}` : "Unknown Employee";
    }
    default:
      return "Organization";
  }
}

function determineAggregationLevel(
  type: string,
  viewerRoleLevel: number,
): AggregationLevel {
  if (viewerRoleLevel >= 5) return "ALL";
  switch (type) {
    case "ORGANIZATION":
      return "ALL";
    case "BUSINESS":
      return viewerRoleLevel >= 4 ? "BUSINESS_OWNER" : "BUSINESS";
    case "HEAD":
      return "HEAD";
    case "VERTICAL":
      return "VERTICAL";
    case "DEPARTMENT":
      return "DEPARTMENT";
    case "TEAM":
      return viewerRoleLevel >= 2 ? "TEAM_MANAGER" : "TEAM";
    case "EMPLOYEE":
      return viewerRoleLevel >= 1 ? "DESCENDANT" : "EMPLOYEE";
    default:
      return "SELF";
  }
}

async function getTaskStats(
  employeeIds: string[],
  businessIds: string[],
): Promise<{
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}> {
  const now = new Date();
  const [total, completed, pending, overdue] = await Promise.all([
    prisma.task.count({
      where: {
        OR: [
          { assigneeId: { in: employeeIds } },
          { businessId: { in: businessIds } },
        ],
      },
    }),
    prisma.task.count({
      where: {
        status: "completed",
        OR: [
          { assigneeId: { in: employeeIds } },
          { businessId: { in: businessIds } },
        ],
      },
    }),
    prisma.task.count({
      where: {
        status: { notIn: ["completed", "cancelled"] },
        OR: [
          { assigneeId: { in: employeeIds } },
          { businessId: { in: businessIds } },
        ],
      },
    }),
    prisma.task.count({
      where: {
        status: { notIn: ["completed", "cancelled"] },
        dueDate: { lt: now },
        OR: [
          { assigneeId: { in: employeeIds } },
          { businessId: { in: businessIds } },
        ],
      },
    }),
  ]);

  return { total, completed, pending, overdue };
}

async function getMarketingKpiStats(
  businessIds: string[],
  teamIds: string[],
  employeeIds: string[],
): Promise<{
  targetAchievement: number;
  leadsGenerated: number;
  conversions: number;
}> {
  const kpis = await prisma.marketingKPI.findMany({
    where: {
      OR: [
        { businessId: { in: businessIds } },
        { teamId: { in: teamIds } },
        { employeeId: { in: employeeIds } },
      ],
    },
    select: { value: true, target: true, metricType: true },
  });

  let targetAchievement = 0;
  let leadsGenerated = 0;
  let conversions = 0;

  for (const kpi of kpis) {
    if (kpi.metricType === "LEADS_GENERATED") {
      leadsGenerated += Number(kpi.value);
    }
    if (kpi.metricType === "CAMPAIGN_SUCCESS") {
      conversions += Number(kpi.value);
    }
    if (kpi.target && Number(kpi.target) > 0) {
      targetAchievement += (Number(kpi.value) / Number(kpi.target)) * 100;
    }
  }

  const count = kpis.filter((k) => k.target && Number(k.target) > 0).length;
  return {
    targetAchievement: count > 0 ? Math.round(targetAchievement / count) : 0,
    leadsGenerated,
    conversions,
  };
}

// ─── Main Dashboard Service ──────────────────────────────────────────────────

export async function getDashboardOverview(
  scope: DataScope,
  perspective?: CurrentPerspective | null,
): Promise<DashboardOverview> {
  const employeeIds = scope.visibleEmployees;
  const businessIds = scope.visibleBusinesses;
  const teamIds = scope.visibleTeams;
  const departmentIds = scope.visibleDepartments;

  const [employeeCount, activityCount, auditCount, taskStats, marketingStats] =
    await Promise.all([
      prisma.employee.count({ where: { id: { in: employeeIds } } }),
      prisma.activity.count({
        where: { businessId: { in: businessIds } },
      }),
      prisma.auditLog.count({
        where: { businessId: { in: businessIds } },
      }),
      getTaskStats(employeeIds, businessIds),
      getMarketingKpiStats(businessIds, teamIds, employeeIds),
    ]);

  // Team-specific KPIs
  let teamKpis: TeamKpiSummary | null = null;
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
      const teamTaskStats = await getTaskStats(
        employeeIds.filter((eid) => {
          // We'll get team members separately
          return true;
        }),
        businessIds,
      );
      teamKpis = {
        teamName: team.name,
        memberCount: team._count.employees,
        taskCount: team._count.tasks,
        completedTasks: teamTaskStats.completed,
        pendingTasks: teamTaskStats.pending,
        overdueTasks: teamTaskStats.overdue,
        targetAchievement: marketingStats.targetAchievement,
        completionRate:
          teamTaskStats.total > 0
            ? Math.round((teamTaskStats.completed / teamTaskStats.total) * 100)
            : 0,
        monthlyRevenue: marketingStats.leadsGenerated * 1000,
        monthlyTarget: marketingStats.leadsGenerated * 1500,
      };
    }
  }

  // Employee-specific KPIs
  let employeeKpis: EmployeeKpiSummary | null = null;
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
      const empTaskStats = await getTaskStats([employee.id], []);
      employeeKpis = {
        name: `${employee.firstName} ${employee.lastName}`,
        designation: employee.designation,
        taskCount: employee._count.tasksOwned,
        completedTasks: empTaskStats.completed,
        pendingTasks: empTaskStats.pending,
        overdueTasks: empTaskStats.overdue,
        performanceScore:
          empTaskStats.total > 0
            ? Math.round((empTaskStats.completed / empTaskStats.total) * 100)
            : 0,
        productivity:
          empTaskStats.total > 0
            ? Math.round(
                (empTaskStats.completed / Math.max(empTaskStats.total, 1)) *
                  100,
              )
            : 0,
      };
    }
  }

  // Business-specific KPIs
  let businessKpis: BusinessKpiSummary | null = null;
  if (perspective?.type === "BUSINESS") {
    const business = await prisma.business.findUnique({
      where: { id: perspective.targetId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            departments: true,
            teams: true,
            verticals: true,
            employees: true,
          },
        },
      },
    });
    if (business) {
      businessKpis = {
        businessName: business.name,
        departmentCount: business._count.departments,
        teamCount: business._count.teams,
        verticalCount: business._count.verticals,
        employeeCount: business._count.employees,
        totalTasks: taskStats.total,
        completedTasks: taskStats.completed,
        pendingTasks: taskStats.pending,
        overdueTasks: taskStats.overdue,
        targetAchievement: marketingStats.targetAchievement,
      };
    }
  }

  const viewer = await prisma.employee.findUnique({
    where: { id: employeeIds[0] ?? "" },
    select: { role: { select: { level: true } } },
  });

  const perspectiveLabel = perspective
    ? await getPerspectiveLabel(perspective.type, perspective.targetId)
    : "Self";

  return {
    employeeCount,
    taskCount: taskStats.total,
    taskCompleted: taskStats.completed,
    taskPending: taskStats.pending,
    taskOverdue: taskStats.overdue,
    activityCount,
    auditCount,
    perspective: perspective
      ? {
          type: perspective.type,
          targetId: perspective.targetId,
          label: perspectiveLabel,
          aggregationLevel: determineAggregationLevel(
            perspective.type,
            viewer?.role.level ?? 0,
          ),
        }
      : null,
    teamKpis,
    employeeKpis,
    businessKpis,
  };
}

export async function getDashboardPerformance(
  scope: DataScope,
  perspective?: CurrentPerspective | null,
): Promise<DashboardPerformance[]> {
  const employeeIds = scope.visibleEmployees;
  const businessIds = scope.visibleBusinesses;

  // Get marketing KPIs grouped by period
  const kpis = await prisma.marketingKPI.findMany({
    where: {
      OR: [
        { businessId: { in: businessIds } },
        { employeeId: { in: employeeIds } },
      ],
    },
    select: {
      value: true,
      target: true,
      metricType: true,
      periodStart: true,
      periodEnd: true,
    },
    orderBy: { periodStart: "asc" },
  });

  // Get tasks for performance metrics
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: { in: employeeIds } },
        { businessId: { in: businessIds } },
      ],
    },
    select: {
      status: true,
      createdAt: true,
      assigneeId: true,
    },
  });

  // Group by month
  const monthlyMap = new Map<
    string,
    {
      revenue: number;
      target: number;
      leads: number;
      conversions: number;
      tasksCompleted: number;
      tasksCreated: number;
      employeeProductivity: number;
    }
  >();

  for (const kpi of kpis) {
    const monthKey = kpi.periodStart.toISOString().slice(0, 7);
    const entry = monthlyMap.get(monthKey) ?? {
      revenue: 0,
      target: 0,
      leads: 0,
      conversions: 0,
      tasksCompleted: 0,
      tasksCreated: 0,
      employeeProductivity: 0,
    };

    if (kpi.metricType === "LEADS_GENERATED") {
      entry.leads += Number(kpi.value);
    }
    if (kpi.metricType === "CAMPAIGN_SUCCESS") {
      entry.conversions += Number(kpi.value);
    }
    if (kpi.target) {
      entry.target += Number(kpi.target);
    }
    // Use value as revenue proxy for budget-related KPIs
    if (kpi.metricType === "BUDGET_UTILIZATION") {
      entry.revenue += Number(kpi.value);
    }

    monthlyMap.set(monthKey, entry);
  }

  for (const task of tasks) {
    const monthKey = task.createdAt.toISOString().slice(0, 7);
    const entry = monthlyMap.get(monthKey) ?? {
      revenue: 0,
      target: 0,
      leads: 0,
      conversions: 0,
      tasksCompleted: 0,
      tasksCreated: 0,
      employeeProductivity: 0,
    };

    entry.tasksCreated += 1;
    if (task.status === "completed") {
      entry.tasksCompleted += 1;
    }

    monthlyMap.set(monthKey, entry);
  }

  // Convert to array and calculate productivity
  const result: DashboardPerformance[] = [];
  for (const [period, data] of monthlyMap) {
    result.push({
      period,
      revenue: data.revenue,
      target: data.target,
      leads: data.leads,
      conversions: data.conversions,
      tasksCompleted: data.tasksCompleted,
      tasksCreated: data.tasksCreated,
      employeeProductivity:
        data.tasksCreated > 0
          ? Math.round((data.tasksCompleted / data.tasksCreated) * 100)
          : 0,
    });
  }

  return result.sort((a, b) => a.period.localeCompare(b.period));
}

export async function getDashboardInsights(
  scope: DataScope,
  perspective?: CurrentPerspective | null,
): Promise<DashboardInsight[]> {
  const employeeIds = scope.visibleEmployees;
  const businessIds = scope.visibleBusinesses;
  const insights: DashboardInsight[] = [];

  // 1. Task completion rate insight
  const taskStats = await getTaskStats(employeeIds, businessIds);
  const completionRate =
    taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

  if (completionRate >= 70) {
    insights.push({
      type: "positive",
      category: "Tasks",
      message: `Task completion rate is ${Math.round(completionRate)}%. Team is performing well.`,
      metric: "completion_rate",
      change: Math.round(completionRate),
      trend: "up",
    });
  } else if (completionRate < 40) {
    insights.push({
      type: "negative",
      category: "Tasks",
      message: `Task completion rate is only ${Math.round(completionRate)}%. ${taskStats.overdue} overdue tasks require attention.`,
      metric: "completion_rate",
      change: Math.round(completionRate),
      trend: "down",
    });
  } else {
    insights.push({
      type: "neutral",
      category: "Tasks",
      message: `${taskStats.pending} tasks pending, ${taskStats.overdue} overdue. Focus on priority tasks.`,
      metric: "pending_tasks",
      change: taskStats.pending,
      trend: "stable",
    });
  }

  // 2. Overdue tasks alert
  if (taskStats.overdue > 0) {
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { notIn: ["completed", "cancelled"] },
        dueDate: { lt: new Date() },
        OR: [
          { assigneeId: { in: employeeIds } },
          { businessId: { in: businessIds } },
        ],
      },
      take: 3,
      select: {
        title: true,
        assignee: { select: { firstName: true, lastName: true } },
      },
    });

    for (const task of overdueTasks) {
      const assigneeName = task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : "Unassigned";
      insights.push({
        type: "negative",
        category: "Overdue Tasks",
        message: `"${task.title}" assigned to ${assigneeName} is overdue.`,
        metric: "overdue_task",
        change: 1,
        trend: "down",
      });
    }
  }

  // 3. Marketing KPI insights
  const kpis = await prisma.marketingKPI.findMany({
    where: {
      OR: [
        { businessId: { in: businessIds } },
        { teamId: { in: scope.visibleTeams } },
        { employeeId: { in: employeeIds } },
      ],
    },
    select: {
      value: true,
      target: true,
      metricType: true,
      name: true,
      team: { select: { name: true } },
    },
  });

  for (const kpi of kpis) {
    if (kpi.target && Number(kpi.target) > 0) {
      const achievement = (Number(kpi.value) / Number(kpi.target)) * 100;
      if (achievement >= 100) {
        const teamName = kpi.team?.name ?? "Team";
        insights.push({
          type: "positive",
          category: "Targets",
          message: `${teamName} exceeded ${kpi.name} target by ${Math.round(achievement - 100)}%.`,
          metric: kpi.metricType,
          change: Math.round(achievement - 100),
          trend: "up",
        });
      } else if (achievement < 50) {
        insights.push({
          type: "negative",
          category: "Targets",
          message: `${kpi.name} is at ${Math.round(achievement)}% of target. Needs improvement.`,
          metric: kpi.metricType,
          change: Math.round(achievement),
          trend: "down",
        });
      }
    }
  }

  // 4. Top performer insight
  const topPerformer = await prisma.employee.findFirst({
    where: {
      id: { in: employeeIds },
      tasksOwned: {
        some: { status: "completed" },
      },
    },
    orderBy: {
      tasksOwned: { _count: "desc" },
    },
    select: {
      firstName: true,
      lastName: true,
      _count: { select: { tasksOwned: { where: { status: "completed" } } } },
    },
  });

  if (topPerformer && topPerformer._count.tasksOwned > 0) {
    insights.push({
      type: "positive",
      category: "Performance",
      message: `Top performer: ${topPerformer.firstName} ${topPerformer.lastName} with ${topPerformer._count.tasksOwned} completed tasks.`,
      metric: "top_performer",
      change: topPerformer._count.tasksOwned,
      trend: "up",
    });
  }

  // 5. Revenue trend insight
  const recentKpis = kpis.filter(
    (k) =>
      k.metricType === "LEADS_GENERATED" || k.metricType === "CAMPAIGN_SUCCESS",
  );
  if (recentKpis.length >= 2) {
    const totalValue = recentKpis.reduce((sum, k) => sum + Number(k.value), 0);
    const avgValue = totalValue / recentKpis.length;
    insights.push({
      type: "neutral",
      category: "Revenue",
      message: `Revenue trend ${avgValue > 100 ? "improving" : "stable"} with ${recentKpis.length} active metrics.`,
      metric: "revenue_trend",
      change: Math.round(avgValue),
      trend: avgValue > 100 ? "up" : "stable",
    });
  }

  // 6. Employee count insight
  if (employeeIds.length > 0) {
    insights.push({
      type: "neutral",
      category: "Team",
      message: `${employeeIds.length} employees in current scope. ${taskStats.completed} tasks completed.`,
      metric: "team_size",
      change: employeeIds.length,
      trend: "stable",
    });
  }

  return insights;
}

export async function getDashboardTeam(
  scope: DataScope,
  perspective?: CurrentPerspective | null,
): Promise<DashboardTeam[]> {
  const businessIds = scope.visibleBusinesses;
  const teamIds = scope.visibleTeams;

  const teams = await prisma.team.findMany({
    where: {
      OR: [{ id: { in: teamIds } }, { businessId: { in: businessIds } }],
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      _count: { select: { employees: true, tasks: true } },
      employees: {
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const teamResults: DashboardTeam[] = [];

  for (const team of teams) {
    const teamEmployeeIds = team.employees.map((e) => e.id);
    const taskStats = await getTaskStats(teamEmployeeIds, []);
    const marketingStats = await getMarketingKpiStats([], [team.id], []);

    teamResults.push({
      id: team.id,
      name: team.name,
      memberCount: team._count.employees,
      completedTasks: taskStats.completed,
      pendingTasks: taskStats.pending,
      overdueTasks: taskStats.overdue,
      completionRate:
        taskStats.total > 0
          ? Math.round((taskStats.completed / taskStats.total) * 100)
          : 0,
      targetAchievement: marketingStats.targetAchievement,
      ranking: 0, // Will be calculated after sorting
    });
  }

  // Sort by completion rate descending and assign ranking
  teamResults.sort((a, b) => b.completionRate - a.completionRate);
  teamResults.forEach((team, index) => {
    team.ranking = index + 1;
  });

  return teamResults;
}
