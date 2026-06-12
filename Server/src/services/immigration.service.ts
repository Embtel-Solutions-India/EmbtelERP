import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthBand = "EXCELLENT" | "AVERAGE" | "NEEDS_ATTENTION";

export interface HealthScoreComponents {
  revenueGrowth: number;
  leadConversion: number;
  taskCompletion: number;
  onTimeCompletion: number;
  approvalRate: number;
}

export interface HealthScore {
  score: number;
  band: HealthBand;
  components: HealthScoreComponents;
}

export interface ImmigrationKpis {
  totalVerticals: number;
  activeClients: number;
  newLeadsThisMonth: number;
  activeCases: number;
  approvalRate: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPct: number;
  pendingCases: number;
  overdueCases: number;
  teamProductivity: number;
  totalEmployees: number;
  healthScore: HealthScore;
}

export interface VerticalSummary {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  employeeCount: number;
  teamCount: number;
  activeLeads: number;
  wonLeads: number;
  revenue: number;
  taskCount: number;
  completedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  leadConversionRate: number;
  healthScore: HealthScore;
  rank: number;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
  taskCount: number;
  completedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
}

export interface TeamSummary {
  id: string;
  name: string;
  memberCount: number;
  taskCount: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface LeadItem {
  id: string;
  status: string;
  priority: string | null;
  estimatedValue: number;
  createdAt: Date;
  assignee: { id: string; name: string } | null;
  vertical: { id: string; name: string } | null;
}

export interface LeadFunnel {
  stage: string;
  count: number;
  value: number;
}

export interface VerticalDetail extends VerticalSummary {
  departments: DepartmentSummary[];
  teams: TeamSummary[];
  recentLeads: LeadItem[];
}

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  deals: number;
  avgDealSize: number;
}

export interface RevenueByVertical {
  verticalId: string;
  verticalName: string;
  revenue: number;
  deals: number;
}

export interface CaseItem {
  id: string;
  title: string;
  priority: string | null;
  status: string;
  dueDate: Date | null;
  isOverdue: boolean;
  assignee: { id: string; name: string } | null;
  vertical: { id: string; name: string } | null;
}

export interface CaseKanban {
  columns: { id: string; title: string; tasks: CaseItem[] }[];
}

export interface EmployeeSummary {
  id: string;
  name: string;
  designation: string | null;
  vertical: string | null;
  department: string | null;
  team: string | null;
  taskCount: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  leadsAssigned: number;
  leadsConverted: number;
  conversionRate: number;
  healthScore: HealthScore;
}

export interface ApprovalItem {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
  requestedBy: { id: string; name: string } | null;
  vertical: { id: string; name: string } | null;
}

export interface EscalationItem {
  id: string;
  title: string;
  priority: string | null;
  status: string;
  dueDate: Date | null;
  daysOverdue: number;
  assignee: { id: string; name: string } | null;
  vertical: { id: string; name: string } | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function pct(num: number, den: number): number {
  return den > 0 ? clamp((num / den) * 100) : 0;
}

function growthPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return clamp(((current - previous) / previous) * 100);
}

function computeHealthScore(c: HealthScoreComponents): HealthScore {
  const score = clamp(
    c.revenueGrowth    * 0.25 +
    c.leadConversion   * 0.25 +
    c.taskCompletion   * 0.20 +
    c.onTimeCompletion * 0.20 +
    c.approvalRate     * 0.10,
  );
  const band: HealthBand =
    score >= 90 ? "EXCELLENT" : score >= 70 ? "AVERAGE" : "NEEDS_ATTENTION";
  return { score, band, components: c };
}

function monthBounds(offset = 0): { gte: Date; lt: Date } {
  const now = new Date();
  return {
    gte: new Date(now.getFullYear(), now.getMonth() + offset, 1),
    lt:  new Date(now.getFullYear(), now.getMonth() + offset + 1, 1),
  };
}

function emptyHealthScore(): HealthScore {
  return computeHealthScore({
    revenueGrowth: 0, leadConversion: 0, taskCompletion: 0,
    onTimeCompletion: 0, approvalRate: 0,
  });
}

async function taskStatsFor(where: object): Promise<{
  total: number; completed: number; pending: number; overdue: number; onTime: number;
}> {
  const now = new Date();
  const [total, completed, pending, overdue, onTime] = await Promise.all([
    prisma.task.count({ where } as any),
    prisma.task.count({ where: { ...where as any, status: "completed" } }),
    prisma.task.count({ where: { ...where as any, status: { notIn: ["completed", "cancelled"] } } }),
    prisma.task.count({ where: { ...where as any, status: { notIn: ["completed", "cancelled"] }, dueDate: { lt: now } } }),
    prisma.task.count({ where: { ...where as any, status: "completed", dueDate: { gte: now } } }),
  ]);
  return { total, completed, pending, overdue, onTime };
}

async function leadStatsFor(where: object): Promise<{
  total: number; won: number; lost: number; active: number; wonValue: number;
}> {
  const leads = await prisma.salesLead.findMany({
    where: where as any,
    select: { status: true, estimatedValue: true },
  });
  const won   = leads.filter(l => l.status === "CONVERTED").length;
  const lost  = leads.filter(l => l.status === "LOST").length;
  return {
    total:    leads.length,
    won,
    lost,
    active:   leads.filter(l => !["CONVERTED", "LOST"].includes(l.status)).length,
    wonValue: leads.filter(l => l.status === "CONVERTED").reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0),
  };
}

function verticalHealthComponents(
  tasks: Awaited<ReturnType<typeof taskStatsFor>>,
  leads: Awaited<ReturnType<typeof leadStatsFor>>,
  prevRevenue = 0,
): HealthScoreComponents {
  return {
    revenueGrowth:    growthPct(leads.wonValue, prevRevenue),
    leadConversion:   pct(leads.won, leads.won + leads.lost),
    taskCompletion:   pct(tasks.completed, tasks.total),
    onTimeCompletion: pct(tasks.onTime, tasks.completed),
    approvalRate:     pct(tasks.completed, tasks.total),
  };
}

export async function getImmigrationBusinessId(scope: DataScope): Promise<string | null> {
  return scope.visibleBusinesses[0] ?? null;
}

// ─── KPI Summary ──────────────────────────────────────────────────────────────

export async function getImmigrationKpis(scope: DataScope): Promise<ImmigrationKpis> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) {
    return {
      totalVerticals: 0, activeClients: 0, newLeadsThisMonth: 0, activeCases: 0,
      approvalRate: 0, revenueThisMonth: 0, revenueLastMonth: 0, revenueGrowthPct: 0,
      pendingCases: 0, overdueCases: 0, teamProductivity: 0, totalEmployees: 0,
      healthScore: emptyHealthScore(),
    };
  }

  const thisMonth = monthBounds(0);
  const lastMonth = monthBounds(-1);

  const [
    totalVerticals,
    totalEmployees,
    tasks,
    leads,
    newLeadsThisMonth,
    revThis,
    revLast,
  ] = await Promise.all([
    prisma.vertical.count({ where: { businessId, isActive: true } }),
    prisma.employee.count({ where: { businessId, isActive: true } }),
    taskStatsFor({ businessId }),
    leadStatsFor({ businessId }),
    prisma.salesLead.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.salesLead.aggregate({
      where: { businessId, status: "CONVERTED", updatedAt: thisMonth },
      _sum: { estimatedValue: true },
    }),
    prisma.salesLead.aggregate({
      where: { businessId, status: "CONVERTED", updatedAt: lastMonth },
      _sum: { estimatedValue: true },
    }),
  ]);

  const revenueThisMonth = Number(revThis._sum.estimatedValue ?? 0);
  const revenueLastMonth = Number(revLast._sum.estimatedValue ?? 0);
  const revenueGrowthPct = growthPct(revenueThisMonth, revenueLastMonth);

  const components: HealthScoreComponents = {
    revenueGrowth:    clamp(revenueGrowthPct),
    leadConversion:   pct(leads.won, leads.won + leads.lost),
    taskCompletion:   pct(tasks.completed, tasks.total),
    onTimeCompletion: pct(tasks.onTime, tasks.completed),
    approvalRate:     pct(tasks.completed, tasks.total),
  };

  return {
    totalVerticals,
    activeClients:      leads.active,
    newLeadsThisMonth,
    activeCases:        tasks.pending,
    approvalRate:       components.approvalRate,
    revenueThisMonth,
    revenueLastMonth,
    revenueGrowthPct,
    pendingCases:       tasks.pending,
    overdueCases:       tasks.overdue,
    teamProductivity:   pct(tasks.completed, tasks.total),
    totalEmployees,
    healthScore:        computeHealthScore(components),
  };
}

// ─── Verticals ────────────────────────────────────────────────────────────────

export async function getVerticals(scope: DataScope): Promise<VerticalSummary[]> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return [];

  const verticals = await prisma.vertical.findMany({
    where: { businessId },
    select: {
      id: true, name: true, code: true, isActive: true,
      _count: { select: { employees: true, teams: true } },
    },
    orderBy: { name: "asc" },
  });

  const results: VerticalSummary[] = await Promise.all(
    verticals.map(async (v) => {
      const [tasks, leads] = await Promise.all([
        taskStatsFor({ verticalId: v.id }),
        leadStatsFor({ verticalId: v.id }),
      ]);
      const hs = computeHealthScore(verticalHealthComponents(tasks, leads));
      return {
        id: v.id, name: v.name, code: v.code, isActive: v.isActive,
        employeeCount: v._count.employees,
        teamCount:     v._count.teams,
        activeLeads:   leads.active,
        wonLeads:      leads.won,
        revenue:       leads.wonValue,
        taskCount:     tasks.total,
        completedTasks: tasks.completed,
        overdueTasks:  tasks.overdue,
        taskCompletionRate: pct(tasks.completed, tasks.total),
        leadConversionRate: pct(leads.won, leads.won + leads.lost),
        healthScore:   hs,
        rank:          0,
      };
    }),
  );

  results.sort((a, b) => b.healthScore.score - a.healthScore.score);
  results.forEach((v, i) => { v.rank = i + 1; });
  return results;
}

export async function getVerticalDetail(
  scope: DataScope,
  verticalId: string,
): Promise<VerticalDetail | null> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return null;

  const vertical = await prisma.vertical.findFirst({
    where: { id: verticalId, businessId },
    select: { id: true, name: true, code: true, isActive: true },
  });
  if (!vertical) return null;

  const [tasks, leads, departments, teams, recentLeadRows] = await Promise.all([
    taskStatsFor({ verticalId }),
    leadStatsFor({ verticalId }),
    prisma.department.findMany({
      where: { businessId },
      select: {
        id: true, name: true, code: true,
        _count: { select: { employees: { where: { verticalId, isActive: true } } } },
      },
    }),
    prisma.team.findMany({
      where: { verticalId, isActive: true },
      select: { id: true, name: true, _count: { select: { employees: true } } },
    }),
    prisma.salesLead.findMany({
      where: { verticalId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, status: true, priority: true, estimatedValue: true, createdAt: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        vertical:   { select: { id: true, name: true } },
      },
    }),
  ]);

  const deptSummaries: DepartmentSummary[] = await Promise.all(
    departments.map(async (d) => {
      const dTasks = await taskStatsFor({ departmentId: d.id, verticalId });
      return {
        id: d.id, name: d.name, code: d.code,
        employeeCount: d._count.employees,
        taskCount:     dTasks.total,
        completedTasks: dTasks.completed,
        overdueTasks:  dTasks.overdue,
        taskCompletionRate: pct(dTasks.completed, dTasks.total),
      };
    }),
  );

  const teamSummaries: TeamSummary[] = await Promise.all(
    teams.map(async (t) => {
      const tTasks = await taskStatsFor({ teamId: t.id });
      return {
        id: t.id, name: t.name,
        memberCount:   t._count.employees,
        taskCount:     tTasks.total,
        completedTasks: tTasks.completed,
        overdueTasks:  tTasks.overdue,
        completionRate: pct(tTasks.completed, tTasks.total),
      };
    }),
  );

  const employeeCount = await prisma.employee.count({ where: { verticalId, isActive: true } });
  const hs = computeHealthScore(verticalHealthComponents(tasks, leads));

  return {
    id: vertical.id, name: vertical.name, code: vertical.code, isActive: vertical.isActive,
    employeeCount, teamCount: teams.length,
    activeLeads:   leads.active,
    wonLeads:      leads.won,
    revenue:       leads.wonValue,
    taskCount:     tasks.total,
    completedTasks: tasks.completed,
    overdueTasks:  tasks.overdue,
    taskCompletionRate: pct(tasks.completed, tasks.total),
    leadConversionRate: pct(leads.won, leads.won + leads.lost),
    healthScore:   hs,
    rank:          0,
    departments:   deptSummaries,
    teams:         teamSummaries,
    recentLeads: recentLeadRows.map(l => ({
      id: l.id, status: l.status, priority: l.priority,
      estimatedValue: Number(l.estimatedValue ?? 0),
      createdAt: l.createdAt,
      assignee: l.assignedTo
        ? { id: l.assignedTo.id, name: `${l.assignedTo.firstName} ${l.assignedTo.lastName}` }
        : null,
      vertical: l.vertical ? { id: l.vertical.id, name: l.vertical.name } : null,
    })),
  };
}

// ─── Leads ────────────────────────────────────────────────────────────────────

const LEAD_STAGES = ["NEW", "CONTACTED", "CONSULTATION_SCHEDULED", "DOCUMENTS_REQUESTED", "QUALIFIED", "CONVERTED", "TRANSFERRED", "LOST"];

export async function getLeads(
  scope: DataScope,
  filters: {
    verticalId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  },
): Promise<{ funnel: LeadFunnel[]; items: LeadItem[]; total: number; page: number; totalPages: number }> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return { funnel: [], items: [], total: 0, page: 1, totalPages: 0 };

  const base: any = { businessId };
  if (filters.verticalId) base.verticalId = filters.verticalId;
  if (filters.startDate || filters.endDate) {
    base.createdAt = {};
    if (filters.startDate) base.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate)   base.createdAt.lte = new Date(filters.endDate);
  }

  const where = { ...base, ...(filters.status ? { status: filters.status } : {}) };
  const page  = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, filters.limit ?? 20);

  const [total, items, funnelLeads] = await Promise.all([
    prisma.salesLead.count({ where }),
    prisma.salesLead.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, priority: true, estimatedValue: true, createdAt: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        vertical:   { select: { id: true, name: true } },
      },
    }),
    prisma.salesLead.findMany({
      where: base,
      select: { status: true, estimatedValue: true },
    }),
  ]);

  const funnel: LeadFunnel[] = LEAD_STAGES.map(stage => ({
    stage,
    count: funnelLeads.filter(l => l.status === stage).length,
    value: funnelLeads.filter(l => l.status === stage)
      .reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0),
  }));

  return {
    funnel,
    items: items.map(l => ({
      id: l.id, status: l.status, priority: l.priority,
      estimatedValue: Number(l.estimatedValue ?? 0),
      createdAt: l.createdAt,
      assignee: l.assignedTo
        ? { id: l.assignedTo.id, name: `${l.assignedTo.firstName} ${l.assignedTo.lastName}` }
        : null,
      vertical: l.vertical ? { id: l.vertical.id, name: l.vertical.name } : null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Revenue ──────────────────────────────────────────────────────────────────

export async function getRevenue(
  scope: DataScope,
  filters: {
    verticalId?: string;
    period?: "month" | "quarter" | "year";
    startDate?: string;
    endDate?: string;
  },
): Promise<{ byPeriod: RevenueByPeriod[]; byVertical: RevenueByVertical[]; total: number; deals: number }> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return { byPeriod: [], byVertical: [], total: 0, deals: 0 };

  const now = new Date();
  const where: any = { businessId, status: "CONVERTED" };
  if (filters.verticalId) where.verticalId = filters.verticalId;

  if (filters.startDate || filters.endDate) {
    where.updatedAt = {};
    if (filters.startDate) where.updatedAt.gte = new Date(filters.startDate);
    if (filters.endDate)   where.updatedAt.lte = new Date(filters.endDate);
  } else {
    const period = filters.period ?? "month";
    where.updatedAt =
      period === "year"    ? { gte: new Date(now.getFullYear(), 0, 1) } :
      period === "quarter" ? { gte: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1) } :
      { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  }

  const [wonLeads, allVerticals] = await Promise.all([
    prisma.salesLead.findMany({
      where,
      select: { estimatedValue: true, updatedAt: true, verticalId: true },
    }),
    prisma.vertical.findMany({
      where: { businessId },
      select: { id: true, name: true },
    }),
  ]);

  // Group by month
  const monthMap = new Map<string, { revenue: number; deals: number }>();
  for (const lead of wonLeads) {
    const key = lead.updatedAt.toISOString().slice(0, 7);
    const e   = monthMap.get(key) ?? { revenue: 0, deals: 0 };
    e.revenue += Number(lead.estimatedValue ?? 0);
    e.deals   += 1;
    monthMap.set(key, e);
  }
  const byPeriod: RevenueByPeriod[] = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, d]) => ({
      period, revenue: d.revenue, deals: d.deals,
      avgDealSize: d.deals > 0 ? Math.round(d.revenue / d.deals) : 0,
    }));

  // Group by vertical
  const verticalMap = new Map<string, { id: string; name: string; revenue: number; deals: number }>();
  for (const v of allVerticals) verticalMap.set(v.id, { id: v.id, name: v.name, revenue: 0, deals: 0 });
  for (const lead of wonLeads) {
    if (lead.verticalId && verticalMap.has(lead.verticalId)) {
      const e = verticalMap.get(lead.verticalId)!;
      e.revenue += Number(lead.estimatedValue ?? 0);
      e.deals   += 1;
    }
  }
  const byVertical: RevenueByVertical[] = [...verticalMap.values()]
    .map(v => ({ verticalId: v.id, verticalName: v.name, revenue: v.revenue, deals: v.deals }))
    .sort((a, b) => b.revenue - a.revenue);

  const total = wonLeads.reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0);
  return { byPeriod, byVertical, total, deals: wonLeads.length };
}

// ─── Cases (Tasks) ────────────────────────────────────────────────────────────

const CASE_STATUSES = ["pending", "in_progress", "completed", "cancelled"];

export async function getCases(
  scope: DataScope,
  filters: {
    verticalId?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  },
): Promise<{ kanban: CaseKanban; total: number; page: number; totalPages: number }> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return { kanban: { columns: [] }, total: 0, page: 1, totalPages: 0 };

  const now   = new Date();
  const where: any = { businessId };
  if (filters.verticalId) where.verticalId = filters.verticalId;
  if (filters.priority)   where.priority   = filters.priority;
  if (filters.status)     where.status     = filters.status;

  const page  = Math.max(1, filters.page ?? 1);
  const limit = Math.min(200, filters.limit ?? 50);

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      select: {
        id: true, title: true, priority: true, status: true, dueDate: true,
        assignee: { select: { id: true, firstName: true, lastName: true } },
        vertical: { select: { id: true, name: true } },
      },
    }),
  ]);

  const toItem = (t: typeof tasks[0]): CaseItem => ({
    id: t.id, title: t.title, priority: t.priority, status: t.status, dueDate: t.dueDate,
    isOverdue: !!(t.dueDate && t.dueDate < now && t.status !== "completed"),
    assignee: t.assignee
      ? { id: t.assignee.id, name: `${t.assignee.firstName} ${t.assignee.lastName}` }
      : null,
    vertical: t.vertical ? { id: t.vertical.id, name: t.vertical.name } : null,
  });

  const kanban: CaseKanban = {
    columns: CASE_STATUSES.map(s => ({
      id:    s,
      title: s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
      tasks: tasks.filter(t => t.status === s).map(toItem),
    })),
  };

  return { kanban, total, page, totalPages: Math.ceil(total / limit) };
}

// ─── Team / Employees ─────────────────────────────────────────────────────────

async function buildEmployeeSummary(emp: {
  id: string; firstName: string; lastName: string; designation: string | null;
  vertical: { name: string } | null;
  department: { name: string } | null;
  team: { name: string } | null;
}): Promise<EmployeeSummary> {
  const [tasks, leads] = await Promise.all([
    taskStatsFor({ assigneeId: emp.id }),
    leadStatsFor({ assignedToId: emp.id }),
  ]);
  const components = verticalHealthComponents(tasks, leads);
  return {
    id:   emp.id,
    name: `${emp.firstName} ${emp.lastName}`,
    designation:   emp.designation,
    vertical:      emp.vertical?.name  ?? null,
    department:    emp.department?.name ?? null,
    team:          emp.team?.name      ?? null,
    taskCount:     tasks.total,
    completedTasks: tasks.completed,
    pendingTasks:  tasks.pending,
    overdueTasks:  tasks.overdue,
    completionRate: pct(tasks.completed, tasks.total),
    leadsAssigned:  leads.total,
    leadsConverted: leads.won,
    conversionRate: pct(leads.won, leads.won + leads.lost),
    healthScore:   computeHealthScore(components),
  };
}

export async function getTeam(
  scope: DataScope,
  filters: {
    verticalId?: string;
    departmentId?: string;
    teamId?: string;
    page?: number;
    limit?: number;
  },
): Promise<PaginatedResult<EmployeeSummary>> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return { items: [], total: 0, page: 1, totalPages: 0 };

  const where: any = { businessId, isActive: true };
  if (filters.verticalId)   where.verticalId   = filters.verticalId;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.teamId)       where.teamId       = filters.teamId;

  const page  = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, filters.limit ?? 20);

  const [total, employees] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { firstName: "asc" },
      select: {
        id: true, firstName: true, lastName: true, designation: true,
        vertical:   { select: { name: true } },
        department: { select: { name: true } },
        team:       { select: { name: true } },
      },
    }),
  ]);

  const items = await Promise.all(employees.map(buildEmployeeSummary));
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getEmployeeDetail(
  scope: DataScope,
  employeeId: string,
): Promise<EmployeeSummary | null> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return null;

  const emp = await prisma.employee.findFirst({
    where: { id: employeeId, businessId, isActive: true },
    select: {
      id: true, firstName: true, lastName: true, designation: true,
      vertical:   { select: { name: true } },
      department: { select: { name: true } },
      team:       { select: { name: true } },
    },
  });
  if (!emp) return null;
  return buildEmployeeSummary(emp);
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export async function getApprovals(
  scope: DataScope,
  filters: { page?: number; limit?: number },
): Promise<PaginatedResult<ApprovalItem>> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return { items: [], total: 0, page: 1, totalPages: 0 };

  // Approvals = high/urgent priority tasks not yet resolved
  const where = {
    businessId,
    status:   { notIn: ["completed", "cancelled"] },
    priority: { in: ["high", "urgent"] },
  };

  const page  = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, filters.limit ?? 20);

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, title: true, description: true, priority: true,
        status: true, dueDate: true, createdAt: true,
        assignee: { select: { id: true, firstName: true, lastName: true } },
        vertical: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    items: tasks.map(t => ({
      id: t.id, title: t.title, description: t.description,
      priority: t.priority, status: t.status,
      dueDate: t.dueDate, createdAt: t.createdAt,
      requestedBy: t.assignee
        ? { id: t.assignee.id, name: `${t.assignee.firstName} ${t.assignee.lastName}` }
        : null,
      vertical: t.vertical ? { id: t.vertical.id, name: t.vertical.name } : null,
    })),
    total, page, totalPages: Math.ceil(total / limit),
  };
}

export async function processApproval(
  scope: DataScope,
  taskId: string,
  decision: "approve" | "reject" | "info",
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return { success: false, error: "Business not found" };

  const task = await prisma.task.findFirst({ where: { id: taskId, businessId } });
  if (!task) return { success: false, error: "Task not found or not in scope" };

  const newStatus =
    decision === "approve" ? "completed" :
    decision === "reject"  ? "cancelled"  :
    task.status;

  const suffix = reason ? `\n\n[${decision.toUpperCase()}] ${reason}` : "";
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      ...(suffix ? { description: `${task.description ?? ""}${suffix}`.trim() } : {}),
    },
  });

  return { success: true };
}

// ─── Escalations ──────────────────────────────────────────────────────────────

export async function getEscalations(
  scope: DataScope,
  filters: { verticalId?: string; page?: number; limit?: number },
): Promise<PaginatedResult<EscalationItem>> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return { items: [], total: 0, page: 1, totalPages: 0 };

  const now   = new Date();
  const where: any = {
    businessId,
    status:  { notIn: ["completed", "cancelled"] },
    dueDate: { lt: now },
  };
  if (filters.verticalId) where.verticalId = filters.verticalId;

  const page  = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, filters.limit ?? 20);

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { dueDate: "asc" },
      select: {
        id: true, title: true, priority: true, status: true, dueDate: true,
        assignee: { select: { id: true, firstName: true, lastName: true } },
        vertical: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    items: tasks.map(t => ({
      id: t.id, title: t.title, priority: t.priority, status: t.status, dueDate: t.dueDate,
      daysOverdue: t.dueDate
        ? Math.floor((now.getTime() - t.dueDate.getTime()) / 86_400_000)
        : 0,
      assignee: t.assignee
        ? { id: t.assignee.id, name: `${t.assignee.firstName} ${t.assignee.lastName}` }
        : null,
      vertical: t.vertical ? { id: t.vertical.id, name: t.vertical.name } : null,
    })),
    total, page, totalPages: Math.ceil(total / limit),
  };
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getReports(
  scope: DataScope,
  filters: {
    type?: string;
    verticalId?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<object> {
  const businessId = await getImmigrationBusinessId(scope);
  if (!businessId) return {};

  const dateFilter: any = {};
  if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
  if (filters.endDate)   dateFilter.lte = new Date(filters.endDate);

  const leadWhere: any = { businessId };
  if (filters.verticalId) leadWhere.verticalId = filters.verticalId;
  if (Object.keys(dateFilter).length) leadWhere.createdAt = dateFilter;

  const taskWhere: any = { businessId };
  if (filters.verticalId) taskWhere.verticalId = filters.verticalId;
  if (Object.keys(dateFilter).length) taskWhere.createdAt = dateFilter;

  const [leads, tasks, verticals] = await Promise.all([
    prisma.salesLead.findMany({
      where: leadWhere,
      select: { status: true, estimatedValue: true, createdAt: true, verticalId: true },
    }),
    taskStatsFor(taskWhere),
    prisma.vertical.findMany({
      where: { businessId },
      select: { id: true, name: true },
    }),
  ]);

  const wonLeads = leads.filter(l => l.status === "CONVERTED");
  const revenue  = wonLeads.reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0);
  const closed   = leads.filter(l => ["CONVERTED", "LOST"].includes(l.status)).length;

  return {
    summary: {
      totalLeads:          leads.length,
      wonLeads:            wonLeads.length,
      lostLeads:           leads.filter(l => l.status === "LOST").length,
      leadConversionRate:  pct(wonLeads.length, closed),
      totalRevenue:        revenue,
      avgDealSize:         wonLeads.length > 0 ? Math.round(revenue / wonLeads.length) : 0,
      totalTasks:          tasks.total,
      completedTasks:      tasks.completed,
      overdueTasks:        tasks.overdue,
      taskCompletionRate:  pct(tasks.completed, tasks.total),
    },
    funnel: LEAD_STAGES.map(stage => ({
      stage,
      count: leads.filter(l => l.status === stage).length,
      value: leads.filter(l => l.status === stage)
        .reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0),
    })),
    verticalBreakdown: verticals.map(v => ({
      id:      v.id,
      name:    v.name,
      leads:   leads.filter(l => l.verticalId === v.id).length,
      revenue: leads
        .filter(l => l.verticalId === v.id && l.status === "CONVERTED")
        .reduce((s, l) => s + Number(l.estimatedValue ?? 0), 0),
    })),
  };
}
