import { Prisma, ITBoardColumn } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";
import { ApiError } from "../utils/ApiError.js";
import { recordActivity, recordAudit } from "./activity-writer.service.js";

/**
 * IT development module service.
 *
 * ISOLATION: every query is hard-scoped to the IT development team's
 * business + team (derived from the single active IT sprint). The route guard
 * already limits who can call these endpoints (IT designations + level 4/5),
 * but this service-level scoping is the real isolation boundary — a non-IT
 * caller who somehow reaches the router can still only ever see IT data.
 */

export type ITContext = {
  viewer: AuthUser;
  scope: DataScope;
  effectiveUserId?: string | null;
};

const DONE: ITBoardColumn = "DONE";

const taskInclude = {
  assignee:  { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.ITSprintTaskInclude;

const COLUMNS: ITBoardColumn[] = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"];

function effectiveId(ctx: ITContext): string {
  return ctx.effectiveUserId ?? ctx.viewer.employeeId;
}

/** Resolve the IT development business id (active sprint → team code → business code). */
async function getITBusinessId(): Promise<string | null> {
  const sprint = await getActiveSprint();
  if (sprint) return sprint.businessId;
  const team = await prisma.team.findFirst({ where: { code: "it-team" }, select: { businessId: true } });
  if (team) return team.businessId;
  const biz = await prisma.business.findFirst({ where: { code: "it-services" }, select: { id: true } });
  return biz?.id ?? null;
}

/**
 * Backend isolation gate: the IT dashboard is restricted to IT's own staff
 * (members of the IT business) plus level 4/5 oversight (Business Owner /
 * Super Admin). Every other department is denied — the route guard mirrors this
 * on the client, but this is the authoritative server-side check.
 */
async function assertITAccess(ctx: ITContext): Promise<void> {
  const level = ctx.viewer.employeeLevel ?? ctx.viewer.roleLevel ?? 0;
  if (level >= 4) return;
  const itBusinessId = await getITBusinessId();
  if (itBusinessId && ctx.viewer.businessId === itBusinessId) return;
  throw new ApiError(403, "IT dashboard is restricted to the IT team");
}

/**
 * The active IT sprint defines the IT business + team scope. There is exactly
 * one active sprint for the IT development team; if none exists yet, callers
 * render empty states.
 */
async function getActiveSprint() {
  return prisma.iTSprint.findFirst({
    where:   { isActive: true },
    orderBy: { startDate: "desc" },
  });
}

/** Resolve the active sprint or throw — used by write paths that need a target. */
async function requireActiveSprint() {
  const sprint = await getActiveSprint();
  if (!sprint) throw new ApiError(404, "No active IT sprint");
  return sprint;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getITOverview(ctx: ITContext) {
  await assertITAccess(ctx);
  const sprint = await getActiveSprint();
  if (!sprint) {
    return {
      sprint: null,
      kpis: { tasksThisSprint: 0, tasksCompleted: 0, openTasks: 0, sprintVelocity: 0, sprintDaysLeft: 0, targetPoints: 0 },
      burndown: [],
      recentActivity: [],
    };
  }

  const [tasks, burndown, recent] = await Promise.all([
    prisma.iTSprintTask.findMany({
      where:  { sprintId: sprint.id },
      select: { column: true, storyPoints: true },
    }),
    prisma.iTBurndownPoint.findMany({
      where:   { sprintId: sprint.id },
      orderBy: { dayIndex: "asc" },
      select:  { dayIndex: true, date: true, idealPoints: true, actualPoints: true },
    }),
    prisma.iTSprintTask.findMany({
      where:   { sprintId: sprint.id },
      orderBy: { updatedAt: "desc" },
      take:    6,
      include: taskInclude,
    }),
  ]);

  const tasksThisSprint = tasks.length;
  const tasksCompleted  = tasks.filter((t) => t.column === DONE).length;
  const openTasks       = tasksThisSprint - tasksCompleted;
  const sprintVelocity  = tasks
    .filter((t) => t.column === DONE)
    .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
  const sprintDaysLeft  = Math.max(
    0,
    Math.ceil((sprint.endDate.getTime() - Date.now()) / 86400000),
  );

  const recentActivity = recent.map((t) => ({
    id:        t.id,
    title:     t.title,
    column:    t.column,
    updatedAt: t.updatedAt,
    actor:     t.assignee
      ? `${t.assignee.firstName} ${t.assignee.lastName}`.trim()
      : (t.createdBy ? `${t.createdBy.firstName} ${t.createdBy.lastName}`.trim() : null),
  }));

  return {
    sprint: {
      id: sprint.id, name: sprint.name, goal: sprint.goal,
      startDate: sprint.startDate, endDate: sprint.endDate, targetPoints: sprint.targetPoints,
    },
    kpis: { tasksThisSprint, tasksCompleted, openTasks, sprintVelocity, sprintDaysLeft, targetPoints: sprint.targetPoints },
    burndown,
    recentActivity,
  };
}

export async function getITSprint(ctx: ITContext) {
  await assertITAccess(ctx);
  const sprint = await getActiveSprint();
  if (!sprint) return { sprint: null, columns: COLUMNS.map((key) => ({ key, tasks: [] })) };

  const tasks = await prisma.iTSprintTask.findMany({
    where:   { sprintId: sprint.id },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    include: taskInclude,
  });

  const donePoints = tasks
    .filter((t) => t.column === DONE)
    .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

  return {
    sprint: {
      id: sprint.id, name: sprint.name, goal: sprint.goal,
      startDate: sprint.startDate, endDate: sprint.endDate,
      targetPoints: sprint.targetPoints, donePoints,
    },
    columns: COLUMNS.map((key) => ({ key, tasks: tasks.filter((t) => t.column === key) })),
  };
}

type CreateTaskInput = {
  title: string;
  description?: string | null;
  column?: ITBoardColumn;
  priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  storyPoints?: number | null;
  assigneeId?: string | null;
  prdRef?: string | null;
  dueDate?: Date | null;
};

export async function createITTask(ctx: ITContext, input: CreateTaskInput) {
  await assertITAccess(ctx);
  const sprint = await requireActiveSprint();
  const me = effectiveId(ctx);

  // Highest existing orderIndex in the target column → append.
  const targetColumn = input.column ?? "BACKLOG";
  const last = await prisma.iTSprintTask.findFirst({
    where:   { sprintId: sprint.id, column: targetColumn },
    orderBy: { orderIndex: "desc" },
    select:  { orderIndex: true },
  });

  const task = await prisma.iTSprintTask.create({
    data: {
      sprintId:       sprint.id,
      organizationId: sprint.organizationId,
      businessId:     sprint.businessId,
      teamId:         sprint.teamId,
      createdById:    me,
      assigneeId:     input.assigneeId ?? null,
      title:          input.title,
      description:    input.description ?? null,
      column:         targetColumn,
      priority:       input.priority ?? "MEDIUM",
      storyPoints:    input.storyPoints ?? null,
      prdRef:         input.prdRef ?? null,
      dueDate:        input.dueDate ?? null,
      orderIndex:     (last?.orderIndex ?? -1) + 1,
    },
    include: taskInclude,
  });

  await recordActivity({
    actorId: me, businessId: task.businessId,
    action: "CREATE", targetType: "ITSprintTask", targetId: task.id,
    metadata: { column: task.column, priority: task.priority },
  });
  await recordAudit({
    actorId: me, businessId: task.businessId,
    action: "CREATE", entityType: "ITSprintTask", entityName: task.title,
    entityId: task.id, before: null, after: task,
  });

  return task;
}

export async function updateITTask(ctx: ITContext, id: string, input: Partial<CreateTaskInput>) {
  await assertITAccess(ctx);
  const sprint = await requireActiveSprint();
  const me = effectiveId(ctx);

  // Scope guard: the task must belong to the active IT sprint's business+team.
  const existing = await prisma.iTSprintTask.findFirst({
    where: { id, businessId: sprint.businessId, teamId: sprint.teamId },
  });
  if (!existing) throw new ApiError(404, "IT task not found");

  const data: Prisma.ITSprintTaskUncheckedUpdateInput = {};
  if ("title"       in input) data.title       = input.title;
  if ("description" in input) data.description  = input.description ?? null;
  if ("column"      in input) data.column       = input.column;
  if ("priority"    in input) data.priority     = input.priority;
  if ("storyPoints" in input) data.storyPoints  = input.storyPoints ?? null;
  if ("assigneeId"  in input) data.assigneeId   = input.assigneeId ?? null;
  if ("prdRef"      in input) data.prdRef        = input.prdRef ?? null;
  if ("dueDate"     in input) data.dueDate       = input.dueDate ?? null;

  const task = await prisma.iTSprintTask.update({ where: { id }, data, include: taskInclude });

  const columnChanged = input.column !== undefined && input.column !== existing.column;
  await recordActivity({
    actorId: me, businessId: task.businessId,
    action: columnChanged ? "STATUS_CHANGE" : "UPDATE",
    targetType: "ITSprintTask", targetId: task.id,
    metadata: { column: task.column },
  });
  await recordAudit({
    actorId: me, businessId: task.businessId,
    action: columnChanged ? "STATUS_CHANGE" : "UPDATE",
    entityType: "ITSprintTask", entityName: task.title,
    entityId: task.id, before: existing, after: task,
  });

  return task;
}

type EodInput = {
  reportDate: Date;
  completed: string;
  pending?: string | null;
  blockers?: string | null;
  tomorrow?: string | null;
};

export async function submitEod(ctx: ITContext, input: EodInput) {
  await assertITAccess(ctx);
  const sprint = await getActiveSprint();
  const me = effectiveId(ctx);

  // Anchor the report to the IT business+team. Fall back to the caller's own
  // record only if there is no active sprint to derive scope from.
  let organizationId = sprint?.organizationId ?? null;
  let businessId = sprint?.businessId ?? null;
  let teamId: string | null = sprint?.teamId ?? null;
  if (!businessId || !organizationId) {
    const emp = await prisma.employee.findUnique({
      where:  { id: me },
      select: { organizationId: true, businessId: true, teamId: true },
    });
    if (!emp?.businessId || !emp.organizationId) throw new ApiError(403, "Employee has no business");
    organizationId = emp.organizationId;
    businessId = emp.businessId;
    teamId = emp.teamId;
  }

  const report = await prisma.iTEodReport.create({
    data: {
      organizationId,
      businessId,
      teamId,
      employeeId: me,
      reportDate: input.reportDate,
      completed:  input.completed,
      pending:    input.pending ?? null,
      blockers:   input.blockers ?? null,
      tomorrow:   input.tomorrow ?? null,
    },
  });

  await recordActivity({
    actorId: me, businessId,
    action: "CREATE", targetType: "ITEodReport", targetId: report.id,
  });

  return report;
}

export async function listMyEod(ctx: ITContext) {
  await assertITAccess(ctx);
  const me = effectiveId(ctx);
  return prisma.iTEodReport.findMany({
    where:   { employeeId: me },
    orderBy: { reportDate: "desc" },
    take:    30,
  });
}
