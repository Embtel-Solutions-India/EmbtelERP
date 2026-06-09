import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveAggregationScope } from "../services/dashboard.service.js";

export const workspaceRouter = Router();
workspaceRouter.use(authenticate, attachScope);

// ── GET /workspace/leads ─────────────────────────────────────────────────────
// Returns scoped marketing leads for the current user's scope
workspaceRouter.get(
  "/leads",
  asyncHandler(async (req, res) => {
    const { employeeIds, businessIds, teamIds } = await resolveAggregationScope(
      req.scope!,
      req.currentPerspective ?? null,
    );

    const leads = await prisma.marketingLead.findMany({
      where: {
        OR: [
          ...(businessIds.length ? [{ businessId: { in: businessIds } }] : []),
          ...(teamIds.length ? [{ teamId: { in: teamIds } }] : []),
          ...(employeeIds.length ? [{ assignedToId: { in: employeeIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        assignedTo: { select: { firstName: true, lastName: true, designation: true } },
        campaign: { select: { name: true } },
      },
    });

    // Summary counts
    const total = leads.length;
    const hot = leads.filter((l) => l.status === "QUALIFIED").length;
    const converted = leads.filter((l) => l.status === "CONVERTED").length;
    const newLeads = leads.filter((l) => l.status === "NEW").length;
    const contacted = leads.filter((l) => l.status === "CONTACTED").length;
    const lost = leads.filter((l) => l.status === "LOST").length;
    const totalValue = leads.reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0);
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    res.json({
      data: {
        leads,
        summary: { total, hot, converted, newLeads, contacted, lost, totalValue, conversionRate },
      },
    });
  }),
);

// ── GET /workspace/followups ─────────────────────────────────────────────────
// Returns pending tasks due today or overdue for the current scope
workspaceRouter.get(
  "/followups",
  asyncHandler(async (req, res) => {
    const { employeeIds, businessIds } = await resolveAggregationScope(
      req.scope!,
      req.currentPerspective ?? null,
    );

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          ...(employeeIds.length ? [{ assigneeId: { in: employeeIds } }] : []),
          ...(businessIds.length ? [{ businessId: { in: businessIds } }] : []),
        ],
        status: { notIn: ["completed", "done", "COMPLETED"] },
        dueDate: { lte: today },
      },
      orderBy: { dueDate: "asc" },
      take: 50,
      include: {
        assignee: { select: { firstName: true, lastName: true } },
      },
    });

    const todayTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate >= startOfDay,
    );
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < startOfDay,
    );

    res.json({
      data: {
        tasks,
        todayCount: todayTasks.length,
        overdueCount: overdueTasks.length,
        totalPending: tasks.length,
      },
    });
  }),
);

// ── GET /workspace/team-leaderboard ─────────────────────────────────────────
// Returns team member performance rankings for manager+ roles
workspaceRouter.get(
  "/team-leaderboard",
  asyncHandler(async (req, res) => {
    const { employeeIds, teamIds } = await resolveAggregationScope(
      req.scope!,
      req.currentPerspective ?? null,
    );

    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds }, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designation: true,
        level: true,
        tasksOwned: {
          select: { status: true, priority: true, dueDate: true },
        },
        marketingLeadsAssigned: {
          select: { status: true, estimatedValue: true },
        },
      },
    });

    const ranked = employees
      .map((emp) => {
        const tasks = emp.tasksOwned;
        const leads = emp.marketingLeadsAssigned;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) =>
          ["completed", "done", "COMPLETED"].includes(t.status),
        ).length;
        const overdueTasks = tasks.filter(
          (t) =>
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            !["completed", "done", "COMPLETED"].includes(t.status),
        ).length;
        const convertedLeads = leads.filter((l) => l.status === "CONVERTED").length;
        const leadValue = leads.reduce(
          (s, l) => s + Number(l.estimatedValue ?? 0),
          0,
        );
        const score =
          totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        return {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          designation: emp.designation,
          level: emp.level,
          totalTasks,
          completedTasks,
          overdueTasks,
          convertedLeads,
          leadValue: Math.round(leadValue),
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((emp, idx) => ({ ...emp, rank: idx + 1 }));

    res.json({ data: ranked });
  }),
);

// ── GET /workspace/approvals ─────────────────────────────────────────────────
// Returns unread notifications / pending approvals for current user
workspaceRouter.get(
  "/approvals",
  asyncHandler(async (req, res) => {
    const viewerId = req.user!.employeeId;
    const { businessIds } = await resolveAggregationScope(
      req.scope!,
      req.currentPerspective ?? null,
    );

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientId: viewerId },
          ...(businessIds.length ? [{ businessId: { in: businessIds } }] : []),
        ],
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        actor: { select: { firstName: true, lastName: true, designation: true } },
      },
    });

    res.json({
      data: {
        notifications,
        pendingCount: notifications.length,
      },
    });
  }),
);

// ── GET /workspace/kpis ──────────────────────────────────────────────────────
// Returns KPI targets vs actuals for the current scope
workspaceRouter.get(
  "/kpis",
  asyncHandler(async (req, res) => {
    const { employeeIds, businessIds, teamIds } = await resolveAggregationScope(
      req.scope!,
      req.currentPerspective ?? null,
    );

    const kpis = await prisma.marketingKPI.findMany({
      where: {
        OR: [
          ...(businessIds.length ? [{ businessId: { in: businessIds } }] : []),
          ...(teamIds.length ? [{ teamId: { in: teamIds } }] : []),
          ...(employeeIds.length ? [{ employeeId: { in: employeeIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        employee: { select: { firstName: true, lastName: true } },
        campaign: { select: { name: true } },
      },
    });

    // Aggregate KPI summary
    const summary = kpis.reduce(
      (acc, kpi) => {
        const value = Number(kpi.value ?? 0);
        const target = Number(kpi.target ?? 0);
        return {
          totalValue: acc.totalValue + value,
          totalTarget: acc.totalTarget + target,
          count: acc.count + 1,
        };
      },
      { totalValue: 0, totalTarget: 0, count: 0 },
    );

    const achievementRate =
      summary.totalTarget > 0
        ? Math.round((summary.totalValue / summary.totalTarget) * 100)
        : 0;

    res.json({
      data: {
        kpis,
        summary: { ...summary, achievementRate },
      },
    });
  }),
);

// ── GET /workspace/pipeline ──────────────────────────────────────────────────
// Returns lead pipeline grouped by status/stage for Sales roles
workspaceRouter.get(
  "/pipeline",
  asyncHandler(async (req, res) => {
    const { employeeIds, businessIds, teamIds } = await resolveAggregationScope(
      req.scope!,
      req.currentPerspective ?? null,
    );

    const leads = await prisma.marketingLead.findMany({
      where: {
        OR: [
          ...(businessIds.length ? [{ businessId: { in: businessIds } }] : []),
          ...(teamIds.length ? [{ teamId: { in: teamIds } }] : []),
          ...(employeeIds.length ? [{ assignedToId: { in: employeeIds } }] : []),
        ],
      },
      select: { status: true, estimatedValue: true, source: true, createdAt: true },
    });

    const stages = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];
    const pipeline = stages.map((stage) => {
      const stageLeads = leads.filter((l) => l.status === stage);
      return {
        stage,
        count: stageLeads.length,
        value: Math.round(
          stageLeads.reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0),
        ),
      };
    });

    res.json({ data: { pipeline, total: leads.length } });
  }),
);

// ── GET /workspace/activities ────────────────────────────────────────────────
// Returns recent activity log for the current scope
workspaceRouter.get(
  "/activities",
  asyncHandler(async (req, res) => {
    const { employeeIds, businessIds } = await resolveAggregationScope(
      req.scope!,
      req.currentPerspective ?? null,
    );

    const activities = await prisma.activity.findMany({
      where: {
        OR: [
          ...(employeeIds.length ? [{ actorId: { in: employeeIds } }] : []),
          ...(businessIds.length ? [{ businessId: { in: businessIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        actor: { select: { firstName: true, lastName: true, designation: true } },
      },
    });

    res.json({ data: activities });
  }),
);

// ── GET /workspace/team-stats ────────────────────────────────────────────────
// Returns aggregated stats per team for Managers+
workspaceRouter.get(
  "/team-stats",
  asyncHandler(async (req, res) => {
    const { teamIds } = await resolveAggregationScope(
      req.scope!,
      req.currentPerspective ?? null,
    );

    if (!teamIds.length) {
      return res.json({ data: [] });
    }

    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      include: {
        employees: { select: { id: true, isActive: true } },
        tasks: { select: { status: true, dueDate: true } },
        marketingLeads: { select: { status: true, estimatedValue: true } },
        marketingCampaigns: { select: { status: true, budget: true, budgetSpent: true } },
      },
    });

    const result = teams.map((team) => {
      const activeMembers = team.employees.filter((e) => e.isActive).length;
      const tasks = team.tasks;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) =>
        ["completed", "done", "COMPLETED"].includes(t.status),
      ).length;
      const overdueTasks = tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          !["completed", "done", "COMPLETED"].includes(t.status),
      ).length;
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const leads = team.marketingLeads;
      const convertedLeads = leads.filter((l) => l.status === "CONVERTED").length;
      const revenue = leads.reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0);
      const campaigns = team.marketingCampaigns;
      const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;

      return {
        id: team.id,
        name: team.name,
        memberCount: team.employees.length,
        activeMembers,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        convertedLeads,
        revenue: Math.round(revenue),
        activeCampaigns,
      };
    });

    res.json({ data: result });
  }),
);
