import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveAggregationScope } from "../services/dashboard.service.js";
import {
  createSalesLeadSchema,
  updateSalesLeadSchema,
} from "../validations/salesLead.validation.js";
import {
  createSalesTaskSchema,
  updateSalesTaskSchema,
} from "../validations/salesTask.validation.js";
import {
  createLead,
  deleteLead,
  listLeads,
  updateLead,
  convertLead,
  transferLead,
} from "../controllers/salesLead.controller.js";
import {
  listTasks   as listSalesTasks,
  createTask  as createSalesTask,
  updateTask  as updateSalesTask,
  deleteTask  as deleteSalesTask,
} from "../controllers/salesTask.controller.js";

export const salesRouter = Router();

salesRouter.use(authenticate, attachScope);

salesRouter.get(   "/leads",     asyncHandler(listLeads));
salesRouter.post(  "/leads",     validateBody(createSalesLeadSchema), asyncHandler(createLead));
salesRouter.patch( "/leads/:id", validateBody(updateSalesLeadSchema), asyncHandler(updateLead));
salesRouter.delete("/leads/:id", asyncHandler(deleteLead));
salesRouter.post(  "/leads/:id/convert",  asyncHandler(convertLead));
salesRouter.post(  "/leads/:id/transfer", asyncHandler(transferLead));

// ── Sales tasks (isolated SalesTask model, sales-only) ───────────────────────
salesRouter.get(   "/tasks",     asyncHandler(listSalesTasks));
salesRouter.post(  "/tasks",     validateBody(createSalesTaskSchema), asyncHandler(createSalesTask));
salesRouter.patch( "/tasks/:id", validateBody(updateSalesTaskSchema), asyncHandler(updateSalesTask));
salesRouter.delete("/tasks/:id", asyncHandler(deleteSalesTask));

// ── GET /sales/leaderboard ───────────────────────────────────────────────────
// Sales-specific team performance ranking (mirrors /workspace/team-leaderboard
// but sourced from SalesLead, so Sales Head dashboards reflect real sales data).
salesRouter.get(
  "/leaderboard",
  asyncHandler(async (req, res) => {
    const { employeeIds } = await resolveAggregationScope(
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
        tasksOwned: { select: { status: true, dueDate: true } },
        salesLeadsAssigned: { select: { status: true, estimatedValue: true } },
      },
    });

    const ranked = employees
      .map((emp) => {
        const tasks = emp.tasksOwned;
        const leads = emp.salesLeadsAssigned;
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
        const wonLeads = leads.filter((l) => l.status === "CONVERTED").length;
        const leadValue = leads.reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0);
        const score = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          designation: emp.designation,
          level: emp.level,
          totalTasks,
          completedTasks,
          overdueTasks,
          convertedLeads: wonLeads,
          leadValue: Math.round(leadValue),
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((emp, idx) => ({ ...emp, rank: idx + 1 }));

    res.json({ data: ranked });
  }),
);

// ── GET /sales/team-stats ────────────────────────────────────────────────────
// Per-team aggregated sales stats for Sales Head dashboards.
salesRouter.get(
  "/team-stats",
  asyncHandler(async (req, res) => {
    const { teamIds } = await resolveAggregationScope(
      req.scope!,
      req.currentPerspective ?? null,
    );

    if (!teamIds.length) {
      res.json({ data: [] });
      return;
    }

    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      include: {
        employees: { select: { id: true, isActive: true } },
        tasks: { select: { status: true, dueDate: true } },
        salesLeads: { select: { status: true, estimatedValue: true } },
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
      const leads = team.salesLeads;
      const wonLeads = leads.filter((l) => l.status === "CONVERTED").length;
      const revenue = leads.reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0);

      return {
        id: team.id,
        name: team.name,
        memberCount: team.employees.length,
        activeMembers,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        convertedLeads: wonLeads,
        revenue: Math.round(revenue),
      };
    });

    res.json({ data: result });
  }),
);
