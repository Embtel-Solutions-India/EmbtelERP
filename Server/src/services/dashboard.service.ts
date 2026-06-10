import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";

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

export type RoleWorkspaceWidget = {
  key: string;
  title: string;
  value: number;
  label: string;
  tone: "primary" | "success" | "warning" | "danger" | "neutral";
};

export type RoleWorkspaceAction = {
  key: string;
  label: string;
  path: string;
};

export type RoleWorkspace = {
  roleKey: string;
  title: string;
  focus: string[];
  widgets: RoleWorkspaceWidget[];
  actions: RoleWorkspaceAction[];
  approvals: {
    pending: number;
    label: string;
  };
};

// ─── Aggregation scope ────────────────────────────────────────────────────────

type AggScope = {
  employeeIds: string[];
  teamIds: string[];
  businessIds: string[];
};

/**
 * Derives the correct employee/team/business ID sets for a given perspective.
 *
 * The scope.middleware passes `perspectiveTargetId` to `getDataScope` which
 * expects an employeeId; for BUSINESS / VERTICAL / BUSINESS_OWNER targets that
 * lookup returns null and the middleware silently falls back to the viewer's own
 * scope.  For high-role viewers (Super Admin) `buildScope` always returns ALL
 * records even when they've switched to a narrower perspective.
 *
 * This function re-derives scope directly from the DB for every perspective
 * type so that dashboard aggregation is always correct regardless of viewer
 * level.
 */
export async function resolveAggregationScope(
  scope: DataScope,
  perspective: CurrentPerspective | null | undefined,
): Promise<AggScope> {
  if (!perspective) {
    return {
      employeeIds: scope.visibleEmployees,
      teamIds: scope.visibleTeams,
      businessIds: scope.visibleBusinesses,
    };
  }

  const { type, targetId } = perspective;

  switch (type) {
    // ── Self-only perspectives ────────────────────────────────────────────────
    case "EMPLOYEE":
    case "INTERN": {
      return { employeeIds: [targetId], teamIds: [], businessIds: [] };
    }

    // ── Manager: own team OR vertical (Vertical Manager has no teamId) ────────
    case "MANAGER": {
      const mgr = await prisma.employee.findUnique({
        where: { id: targetId },
        select: { teamId: true, verticalId: true, businessId: true },
      });
      if (!mgr) return { employeeIds: [targetId], teamIds: [], businessIds: [] };

      if (mgr.teamId) {
        const members = await prisma.employee.findMany({
          where: { teamId: mgr.teamId, isActive: true },
          select: { id: true },
        });
        return {
          employeeIds: [...new Set([targetId, ...members.map((e) => e.id)])],
          teamIds: [mgr.teamId],
          businessIds: mgr.businessId ? [mgr.businessId] : [],
        };
      }

      // Vertical Manager: no team assigned — scope to the entire vertical
      if (mgr.verticalId) {
        const [members, teams] = await Promise.all([
          prisma.employee.findMany({
            where: { verticalId: mgr.verticalId, isActive: true },
            select: { id: true },
          }),
          prisma.team.findMany({
            where: { verticalId: mgr.verticalId, isActive: true },
            select: { id: true },
          }),
        ]);
        return {
          employeeIds: members.map((e) => e.id),
          teamIds: teams.map((t) => t.id),
          businessIds: mgr.businessId ? [mgr.businessId] : [],
        };
      }

      return {
        employeeIds: [targetId],
        teamIds: [],
        businessIds: mgr.businessId ? [mgr.businessId] : [],
      };
    }

    // ── Vertical: all teams and employees inside this vertical ────────────────
    case "VERTICAL": {
      const vertical = await prisma.vertical.findUnique({
        where: { id: targetId },
        select: { businessId: true },
      });
      if (!vertical) return { employeeIds: [], teamIds: [], businessIds: [] };

      const [members, teams] = await Promise.all([
        prisma.employee.findMany({
          where: { verticalId: targetId, isActive: true },
          select: { id: true },
        }),
        prisma.team.findMany({
          where: { verticalId: targetId, isActive: true },
          select: { id: true },
        }),
      ]);

      return {
        employeeIds: members.map((e) => e.id),
        teamIds: teams.map((t) => t.id),
        businessIds: [vertical.businessId],
      };
    }

    // ── Business Head: all teams and employees in this business ───────────────
    case "HEAD": {
      const head = await prisma.employee.findUnique({
        where: { id: targetId },
        select: { businessId: true },
      });
      if (!head) return { employeeIds: [], teamIds: [], businessIds: [] };

      const [members, teams] = await Promise.all([
        prisma.employee.findMany({
          where: { businessId: head.businessId, isActive: true },
          select: { id: true },
        }),
        prisma.team.findMany({
          where: { businessId: head.businessId, isActive: true },
          select: { id: true },
        }),
      ]);

      return {
        employeeIds: members.map((e) => e.id),
        teamIds: teams.map((t) => t.id),
        businessIds: [head.businessId],
      };
    }

    // ── Business / Business Owner: targetId IS the businessId ─────────────────
    case "BUSINESS":
    case "BUSINESS_OWNER": {
      const [members, teams] = await Promise.all([
        prisma.employee.findMany({
          where: { businessId: targetId, isActive: true },
          select: { id: true },
        }),
        prisma.team.findMany({
          where: { businessId: targetId, isActive: true },
          select: { id: true },
        }),
      ]);

      return {
        employeeIds: members.map((e) => e.id),
        teamIds: teams.map((t) => t.id),
        businessIds: [targetId],
      };
    }

    // ── Team: all members of this team ───────────────────────────────────────
    case "TEAM": {
      const team = await prisma.team.findUnique({
        where: { id: targetId },
        select: { businessId: true },
      });
      if (!team) return { employeeIds: [], teamIds: [targetId], businessIds: [] };

      const members = await prisma.employee.findMany({
        where: { teamId: targetId, isActive: true },
        select: { id: true },
      });

      return {
        employeeIds: members.map((e) => e.id),
        teamIds: [targetId],
        businessIds: [team.businessId],
      };
    }

    // ── Department: all employees and teams in this department ────────────────
    case "DEPARTMENT": {
      const dept = await prisma.department.findUnique({
        where: { id: targetId },
        select: { businessId: true },
      });
      if (!dept) return { employeeIds: [], teamIds: [], businessIds: [] };

      const [members, teams] = await Promise.all([
        prisma.employee.findMany({
          where: { departmentId: targetId, isActive: true },
          select: { id: true },
        }),
        prisma.team.findMany({
          where: { departmentId: targetId, isActive: true },
          select: { id: true },
        }),
      ]);

      return {
        employeeIds: members.map((e) => e.id),
        teamIds: teams.map((t) => t.id),
        businessIds: [dept.businessId],
      };
    }

    // ── Organization / Super Admin: fall back to full middleware scope ─────────
    default: {
      return {
        employeeIds: scope.visibleEmployees,
        teamIds: scope.visibleTeams,
        businessIds: scope.visibleBusinesses,
      };
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getPerspectiveLabel(
  type: string,
  targetId: string,
): Promise<string> {
  switch (type) {
    case "BUSINESS":
    case "BUSINESS_OWNER": {
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
    case "HEAD":
    case "MANAGER":
    case "EMPLOYEE":
    case "INTERN": {
      const e = await prisma.employee.findUnique({
        where: { id: targetId },
        select: { firstName: true, lastName: true },
      });
      return e ? `${e.firstName} ${e.lastName}` : "Unknown Employee";
    }
    case "TEAM": {
      const t = await prisma.team.findUnique({
        where: { id: targetId },
        select: { name: true },
      });
      return t?.name ?? "Unknown Team";
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
    case "BUSINESS_OWNER":
      return "BUSINESS_OWNER";
    case "HEAD":
      return "HEAD";
    case "VERTICAL":
      return "VERTICAL";
    case "DEPARTMENT":
      return "DEPARTMENT";
    case "TEAM":
      return viewerRoleLevel >= 2 ? "TEAM_MANAGER" : "TEAM";
    case "MANAGER":
      return "TEAM_MANAGER";
    case "EMPLOYEE":
      return viewerRoleLevel >= 1 ? "DESCENDANT" : "EMPLOYEE";
    case "INTERN":
      return "SELF";
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
  if (employeeIds.length === 0 && businessIds.length === 0) {
    return { total: 0, completed: 0, pending: 0, overdue: 0 };
  }

  const now = new Date();
  const where = {
    OR: [
      ...(employeeIds.length > 0
        ? [{ assigneeId: { in: employeeIds } }]
        : []),
      ...(businessIds.length > 0
        ? [{ businessId: { in: businessIds } }]
        : []),
    ] as object[],
  };

  const [total, completed, pending, overdue] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: "completed" } }),
    prisma.task.count({
      where: { ...where, status: { notIn: ["completed", "cancelled"] } },
    }),
    prisma.task.count({
      where: {
        ...where,
        status: { notIn: ["completed", "cancelled"] },
        dueDate: { lt: now },
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
  if (
    businessIds.length === 0 &&
    teamIds.length === 0 &&
    employeeIds.length === 0
  ) {
    return { targetAchievement: 0, leadsGenerated: 0, conversions: 0 };
  }

  const kpis = await prisma.marketingKPI.findMany({
    where: {
      OR: [
        ...(businessIds.length > 0
          ? [{ businessId: { in: businessIds } }]
          : []),
        ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : []),
        ...(employeeIds.length > 0
          ? [{ employeeId: { in: employeeIds } }]
          : []),
      ] as object[],
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

function hasDesignation(designation: string, ...needles: string[]) {
  return needles.some((needle) => designation.includes(needle));
}

function completionRate(completed: number, total: number) {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function makeWidget(
  key: string,
  title: string,
  value: number,
  label: string,
  tone: RoleWorkspaceWidget["tone"] = "neutral",
): RoleWorkspaceWidget {
  return { key, title, value, label, tone };
}

function makeAction(
  key: string,
  label: string,
  path: string,
): RoleWorkspaceAction {
  return { key, label, path };
}

// ─── Main Dashboard Service ──────────────────────────────────────────────────

export async function getDashboardOverview(
  scope: DataScope,
  perspective?: CurrentPerspective | null,
): Promise<DashboardOverview> {
  const resolved = await resolveAggregationScope(scope, perspective);
  const { employeeIds, teamIds, businessIds } = resolved;

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

  // Team KPIs — shown when viewing a TEAM or MANAGER perspective
  let teamKpis: TeamKpiSummary | null = null;
  if (
    perspective?.type === "TEAM" ||
    (perspective?.type === "MANAGER" &&
      (await prisma.employee
        .findUnique({
          where: { id: perspective.targetId },
          select: { teamId: true },
        })
        .then((e) => !!e?.teamId)))
  ) {
    const teamId =
      perspective?.type === "TEAM"
        ? perspective.targetId
        : (
            await prisma.employee.findUnique({
              where: { id: perspective!.targetId },
              select: { teamId: true },
            })
          )?.teamId ?? null;

    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
          _count: { select: { employees: true, tasks: true } },
        },
      });
      if (team) {
        const teamMemberIds = (
          await prisma.employee.findMany({
            where: { teamId, isActive: true },
            select: { id: true },
          })
        ).map((e) => e.id);

        const tStats = await getTaskStats(teamMemberIds, []);
        const mStats = await getMarketingKpiStats([], [teamId], []);

        teamKpis = {
          teamName: team.name,
          memberCount: team._count.employees,
          taskCount: tStats.total,
          completedTasks: tStats.completed,
          pendingTasks: tStats.pending,
          overdueTasks: tStats.overdue,
          targetAchievement: mStats.targetAchievement,
          completionRate:
            tStats.total > 0
              ? Math.round((tStats.completed / tStats.total) * 100)
              : 0,
          monthlyRevenue: mStats.leadsGenerated * 1000,
          monthlyTarget: mStats.leadsGenerated * 1500,
        };
      }
    }
  }

  // Employee KPIs — shown for EMPLOYEE and INTERN perspectives
  let employeeKpis: EmployeeKpiSummary | null = null;
  if (
    perspective?.type === "EMPLOYEE" ||
    perspective?.type === "INTERN"
  ) {
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
      const empStats = await getTaskStats([employee.id], []);
      employeeKpis = {
        name: `${employee.firstName} ${employee.lastName}`,
        designation: employee.designation,
        taskCount: employee._count.tasksOwned,
        completedTasks: empStats.completed,
        pendingTasks: empStats.pending,
        overdueTasks: empStats.overdue,
        performanceScore:
          empStats.total > 0
            ? Math.round((empStats.completed / empStats.total) * 100)
            : 0,
        productivity:
          empStats.total > 0
            ? Math.round((empStats.completed / Math.max(empStats.total, 1)) * 100)
            : 0,
      };
    }
  }

  // Business KPIs — shown for BUSINESS and BUSINESS_OWNER perspectives
  let businessKpis: BusinessKpiSummary | null = null;
  if (
    perspective?.type === "BUSINESS" ||
    perspective?.type === "BUSINESS_OWNER"
  ) {
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
    where: { id: scope.visibleEmployees[0] ?? "" },
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
  const { employeeIds, businessIds } = await resolveAggregationScope(
    scope,
    perspective,
  );

  const whereOr: object[] = [];
  if (businessIds.length > 0) whereOr.push({ businessId: { in: businessIds } });
  if (employeeIds.length > 0) whereOr.push({ employeeId: { in: employeeIds } });

  const kpis =
    whereOr.length > 0
      ? await prisma.marketingKPI.findMany({
          where: { OR: whereOr },
          select: {
            value: true,
            target: true,
            metricType: true,
            periodStart: true,
          },
          orderBy: { periodStart: "asc" },
        })
      : [];

  const taskWhereOr: object[] = [];
  if (employeeIds.length > 0)
    taskWhereOr.push({ assigneeId: { in: employeeIds } });
  if (businessIds.length > 0)
    taskWhereOr.push({ businessId: { in: businessIds } });

  const tasks =
    taskWhereOr.length > 0
      ? await prisma.task.findMany({
          where: { OR: taskWhereOr },
          select: { status: true, createdAt: true },
        })
      : [];

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
    }
  >();

  const entry = (key: string) =>
    monthlyMap.get(key) ?? {
      revenue: 0,
      target: 0,
      leads: 0,
      conversions: 0,
      tasksCompleted: 0,
      tasksCreated: 0,
    };

  for (const kpi of kpis) {
    const key = kpi.periodStart.toISOString().slice(0, 7);
    const e = entry(key);
    if (kpi.metricType === "LEADS_GENERATED") e.leads += Number(kpi.value);
    if (kpi.metricType === "CAMPAIGN_SUCCESS") e.conversions += Number(kpi.value);
    if (kpi.target) e.target += Number(kpi.target);
    if (kpi.metricType === "BUDGET_UTILIZATION") e.revenue += Number(kpi.value);
    monthlyMap.set(key, e);
  }

  for (const task of tasks) {
    const key = task.createdAt.toISOString().slice(0, 7);
    const e = entry(key);
    e.tasksCreated += 1;
    if (task.status === "completed") e.tasksCompleted += 1;
    monthlyMap.set(key, e);
  }

  return [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, d]) => ({
      period,
      revenue: d.revenue,
      target: d.target,
      leads: d.leads,
      conversions: d.conversions,
      tasksCompleted: d.tasksCompleted,
      tasksCreated: d.tasksCreated,
      employeeProductivity:
        d.tasksCreated > 0
          ? Math.round((d.tasksCompleted / d.tasksCreated) * 100)
          : 0,
    }));
}

export async function getDashboardInsights(
  scope: DataScope,
  perspective?: CurrentPerspective | null,
): Promise<DashboardInsight[]> {
  const { employeeIds, teamIds, businessIds } = await resolveAggregationScope(
    scope,
    perspective,
  );

  const insights: DashboardInsight[] = [];

  // 1. Task completion rate
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

  // 2. Overdue task details (up to 3)
  if (taskStats.overdue > 0) {
    const overdueFilter: object[] = [];
    if (employeeIds.length > 0)
      overdueFilter.push({ assigneeId: { in: employeeIds } });
    if (businessIds.length > 0)
      overdueFilter.push({ businessId: { in: businessIds } });

    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { notIn: ["completed", "cancelled"] },
        dueDate: { lt: new Date() },
        OR: overdueFilter,
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

  // 3. KPI target tracking
  const kpiFilter: object[] = [];
  if (businessIds.length > 0)
    kpiFilter.push({ businessId: { in: businessIds } });
  if (teamIds.length > 0) kpiFilter.push({ teamId: { in: teamIds } });
  if (employeeIds.length > 0)
    kpiFilter.push({ employeeId: { in: employeeIds } });

  const kpis =
    kpiFilter.length > 0
      ? await prisma.marketingKPI.findMany({
          where: { OR: kpiFilter },
          select: {
            value: true,
            target: true,
            metricType: true,
            name: true,
            team: { select: { name: true } },
          },
        })
      : [];

  for (const kpi of kpis) {
    if (kpi.target && Number(kpi.target) > 0) {
      const pct = (Number(kpi.value) / Number(kpi.target)) * 100;
      if (pct >= 100) {
        insights.push({
          type: "positive",
          category: "Targets",
          message: `${kpi.team?.name ?? "Team"} exceeded ${kpi.name} target by ${Math.round(pct - 100)}%.`,
          metric: kpi.metricType,
          change: Math.round(pct - 100),
          trend: "up",
        });
      } else if (pct < 50) {
        insights.push({
          type: "negative",
          category: "Targets",
          message: `${kpi.name} is at ${Math.round(pct)}% of target. Needs improvement.`,
          metric: kpi.metricType,
          change: Math.round(pct),
          trend: "down",
        });
      }
    }
  }

  // 4. Top performer
  if (employeeIds.length > 0) {
    const topPerformer = await prisma.employee.findFirst({
      where: {
        id: { in: employeeIds },
        tasksOwned: { some: { status: "completed" } },
      },
      orderBy: {
        tasksOwned: { _count: "desc" },
      },
      select: {
        firstName: true,
        lastName: true,
        _count: {
          select: { tasksOwned: { where: { status: "completed" } } },
        },
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
  }

  // 5. Revenue trend
  const revenueKpis = kpis.filter(
    (k) =>
      k.metricType === "LEADS_GENERATED" ||
      k.metricType === "CAMPAIGN_SUCCESS",
  );
  if (revenueKpis.length >= 2) {
    const avg =
      revenueKpis.reduce((s, k) => s + Number(k.value), 0) /
      revenueKpis.length;
    insights.push({
      type: "neutral",
      category: "Revenue",
      message: `Revenue trend ${avg > 100 ? "improving" : "stable"} with ${revenueKpis.length} active metrics.`,
      metric: "revenue_trend",
      change: Math.round(avg),
      trend: avg > 100 ? "up" : "stable",
    });
  }

  // 6. Team size summary
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
  const { teamIds, businessIds } = await resolveAggregationScope(
    scope,
    perspective,
  );

  if (teamIds.length === 0 && businessIds.length === 0) return [];

  const teamFilter: object[] = [];
  if (teamIds.length > 0) teamFilter.push({ id: { in: teamIds } });
  if (businessIds.length > 0) teamFilter.push({ businessId: { in: businessIds } });

  const teams = await prisma.team.findMany({
    where: { OR: teamFilter, isActive: true },
    select: {
      id: true,
      name: true,
      _count: { select: { employees: true } },
      employees: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  const teamResults: DashboardTeam[] = [];

  for (const team of teams) {
    const memberIds = team.employees.map((e) => e.id);
    const [tStats, mStats] = await Promise.all([
      getTaskStats(memberIds, []),
      getMarketingKpiStats([], [team.id], []),
    ]);

    teamResults.push({
      id: team.id,
      name: team.name,
      memberCount: team._count.employees,
      completedTasks: tStats.completed,
      pendingTasks: tStats.pending,
      overdueTasks: tStats.overdue,
      completionRate:
        tStats.total > 0
          ? Math.round((tStats.completed / tStats.total) * 100)
          : 0,
      targetAchievement: mStats.targetAchievement,
      ranking: 0,
    });
  }

  teamResults.sort((a, b) => b.completionRate - a.completionRate);
  teamResults.forEach((t, i) => {
    t.ranking = i + 1;
  });

  return teamResults;
}

export async function getRoleWorkspace(
  scope: DataScope,
  viewer: AuthUser,
  perspective?: CurrentPerspective | null,
): Promise<RoleWorkspace> {
  const { employeeIds, teamIds, businessIds } = await resolveAggregationScope(
    scope,
    perspective,
  );

  const employee = await prisma.employee.findUnique({
    where: { id: viewer.employeeId },
    select: {
      designation: true,
      role: { select: { level: true, name: true } },
    },
  });

  const roleLevel = viewer.roleLevel ?? employee?.role.level ?? 0;
  const designation = (employee?.designation ?? employee?.role.name ?? "").toLowerCase();
  const taskStats = await getTaskStats(employeeIds, businessIds);

  const [
    employeeCount,
    documentCount,
    pendingDocuments,
    marketingCampaigns,
    marketingTasks,
    marketingLeads,
    notificationApprovals,
  ] = await Promise.all([
    prisma.employee.count({ where: { id: { in: employeeIds } } }),
    businessIds.length
      ? prisma.document.count({ where: { businessId: { in: businessIds } } })
      : Promise.resolve(0),
    businessIds.length
      ? prisma.document.count({
          where: {
            businessId: { in: businessIds },
            kind: { contains: "missing", mode: "insensitive" },
          },
        })
      : Promise.resolve(0),
    businessIds.length
      ? prisma.marketingCampaign.findMany({
          where: { businessId: { in: businessIds } },
          select: { status: true, budget: true, budgetSpent: true },
        })
      : Promise.resolve([]),
    businessIds.length || employeeIds.length || teamIds.length
      ? prisma.marketingTask.findMany({
          where: {
            OR: [
              ...(businessIds.length ? [{ businessId: { in: businessIds } }] : []),
              ...(teamIds.length ? [{ teamId: { in: teamIds } }] : []),
              ...(employeeIds.length ? [{ assignedToId: { in: employeeIds } }] : []),
            ],
          },
          select: { status: true, dueDate: true },
        })
      : Promise.resolve([]),
    businessIds.length || employeeIds.length || teamIds.length
      ? prisma.marketingLead.findMany({
          where: {
            OR: [
              ...(businessIds.length ? [{ businessId: { in: businessIds } }] : []),
              ...(teamIds.length ? [{ teamId: { in: teamIds } }] : []),
              ...(employeeIds.length ? [{ assignedToId: { in: employeeIds } }] : []),
            ],
          },
          select: { status: true, estimatedValue: true },
        })
      : Promise.resolve([]),
    businessIds.length || employeeIds.length
      ? prisma.notification.count({
          where: {
            isRead: false,
            OR: [
              ...(businessIds.length ? [{ businessId: { in: businessIds } }] : []),
              { recipientId: viewer.employeeId },
            ],
          },
        })
      : Promise.resolve(0),
  ]);

  const activeMarketingCampaigns = marketingCampaigns.filter(
    (campaign) => campaign.status === "ACTIVE",
  ).length;
  const completedMarketingTasks = marketingTasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const pendingMarketingTasks = marketingTasks.filter(
    (task) => !["COMPLETED", "CANCELLED"].includes(task.status),
  ).length;
  const leadValue = marketingLeads.reduce(
    (sum, lead) => sum + Number(lead.estimatedValue ?? 0),
    0,
  );
  const budget = marketingCampaigns.reduce(
    (acc, row) => ({
      allocated: acc.allocated + Number(row.budget ?? 0),
      spent: acc.spent + Number(row.budgetSpent ?? 0),
    }),
    { allocated: 0, spent: 0 },
  );
  const budgetUsage =
    budget.allocated > 0 ? Math.round((budget.spent / budget.allocated) * 100) : 0;

  if (roleLevel >= 5 || hasDesignation(designation, "super admin", "admin", "it head")) {
    return {
      roleKey: "super_admin",
      title: "System Administration Workspace",
      focus: ["System health", "Users and roles", "Audit visibility"],
      widgets: [
        makeWidget("employees", "Active Users", employeeCount, "employees in scope", "primary"),
        makeWidget("audit", "Audit Logs", await prisma.auditLog.count({ where: { businessId: { in: businessIds } } }), "recorded events", "neutral"),
        makeWidget("approvals", "Unread Requests", notificationApprovals, "permission and system notices", "warning"),
        makeWidget("tasks", "Open Tasks", taskStats.pending, "operational follow-up", "danger"),
      ],
      actions: [
        makeAction("org", "Organization Explorer", "/admin/org-explorer"),
        makeAction("reports", "Audit Reports", "/sales/reports"),
        makeAction("settings", "Settings", "/sales/settings"),
      ],
      approvals: { pending: notificationApprovals, label: "Unread system requests" },
    };
  }

  if (roleLevel >= 4 || hasDesignation(designation, "owner", "business head", "immigration head")) {
    return {
      roleKey: "business_owner",
      title: "Business Owner Workspace",
      focus: ["Revenue overview", "Department comparison", "KPI alerts"],
      widgets: [
        makeWidget("employees", "Employee Count", employeeCount, "active employees", "primary"),
        makeWidget("revenue", "Estimated Lead Value", Math.round(leadValue), "from converted pipeline", "success"),
        makeWidget("completion", "KPI Summary", completionRate(taskStats.completed, taskStats.total), "task completion %", "success"),
        makeWidget("pending", "Pending Work", taskStats.pending, "tasks needing action", "warning"),
      ],
      actions: [
        makeAction("analytics", "Analytics", "/owner/dashboard"),
        makeAction("reports", "Reports", "/sales/reports"),
        makeAction("finance", "Finance", "/owner/dashboard"),
      ],
      approvals: { pending: notificationApprovals, label: "Business approval requests" },
    };
  }

  if (hasDesignation(designation, "hr", "recruitment")) {
    return {
      roleKey: "hr_manager",
      title: "HR Workspace",
      focus: ["Employee operations", "Recruitment tasks", "Performance reviews"],
      widgets: [
        makeWidget("employees", "Total Employees", employeeCount, "active employees", "primary"),
        makeWidget("pending", "Open HR Tasks", taskStats.pending, "assigned follow-up", "warning"),
        makeWidget("completed", "Completed Tasks", taskStats.completed, "closed work", "success"),
        makeWidget("approvals", "Approvals", notificationApprovals, "people requests", "danger"),
      ],
      actions: [
        makeAction("employees", "Employees", "/hr/dashboard"),
        makeAction("performance", "Performance", "/sales/performance"),
        makeAction("reports", "Reports", "/sales/reports"),
      ],
      approvals: { pending: notificationApprovals, label: "HR approvals" },
    };
  }

  if (hasDesignation(designation, "documentation", "production")) {
    return {
      roleKey: roleLevel >= 2 ? "documentation_manager" : "documentation_executive",
      title: roleLevel >= 2 ? "Documentation Manager Workspace" : "Documentation Workspace",
      focus: ["Case processing", "Verification", "SLA attention"],
      widgets: [
        makeWidget("documents", "Documents", documentCount, "records in scope", "primary"),
        makeWidget("missing", "Missing Documents", pendingDocuments, "needs follow-up", "danger"),
        makeWidget("due", "Due Cases", taskStats.overdue, "overdue tasks", "warning"),
        makeWidget("sla", "SLA Compliance", completionRate(taskStats.completed, taskStats.total), "completion %", "success"),
      ],
      actions: [
        makeAction("cases", "Cases", "/production/dashboard"),
        makeAction("tasks", "Tasks", "/sales/tasks"),
        makeAction("reports", "Reports", "/sales/reports"),
      ],
      approvals: { pending: notificationApprovals, label: "QC and document approvals" },
    };
  }

  if (hasDesignation(designation, "marketing")) {
    const roleKey = roleLevel <= 0 ? "marketing_intern" : roleLevel >= 2 ? "marketing_manager" : "marketing_executive";
    return {
      roleKey,
      title:
        roleKey === "marketing_manager"
          ? "Marketing Manager Workspace"
          : roleKey === "marketing_intern"
            ? "Marketing Intern Workspace"
            : "Marketing Executive Workspace",
      focus: ["Campaign work", "Lead generation", "Content and activity tracking"],
      widgets: [
        makeWidget("leads", "Leads Generated", marketingLeads.length, "marketing leads", "primary"),
        makeWidget("campaigns", "Active Campaigns", activeMarketingCampaigns, "currently active", "success"),
        makeWidget("tasks", "Content Tasks", pendingMarketingTasks, "open marketing tasks", "warning"),
        makeWidget("budget", "Budget Usage", budgetUsage, "spent %", budgetUsage > 90 ? "danger" : "neutral"),
      ],
      actions: [
        makeAction("campaigns", "Campaigns", "/marketing/campaigns"),
        makeAction("tasks", "Tasks", "/marketing/tasks"),
        makeAction("reports", "Reports", "/marketing/reports"),
      ],
      approvals: { pending: notificationApprovals, label: "Campaign approval requests" },
    };
  }

  const salesRoleKey = roleLevel <= 0 ? "sales_intern" : roleLevel >= 2 ? "sales_head" : "sales_executive";
  return {
    roleKey: salesRoleKey,
    title:
      salesRoleKey === "sales_head"
        ? "Sales Head Workspace"
        : salesRoleKey === "sales_intern"
          ? "Sales Intern Workspace"
          : "Sales Executive Workspace",
    focus: ["Follow-ups", "Pipeline movement", "Revenue impact"],
    widgets: [
      makeWidget("assigned", "Assigned Leads", marketingLeads.length, "pipeline records", "primary"),
      makeWidget("followups", "Today's Follow Ups", taskStats.pending, "open tasks", "warning"),
      makeWidget("completed", "Completed Tasks", taskStats.completed + completedMarketingTasks, "closed work", "success"),
      makeWidget("revenue", "Revenue Impact", Math.round(leadValue), "estimated lead value", "success"),
    ],
    actions: [
      makeAction("leads", "Leads", "/sales/leads"),
      makeAction("followups", "Follow Ups", "/sales/follow-ups"),
      makeAction("performance", "Performance", "/sales/performance"),
    ],
    approvals: { pending: notificationApprovals, label: "Sales approval requests" },
  };
}
