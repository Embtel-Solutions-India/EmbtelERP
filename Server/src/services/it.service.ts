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
  assignee:   { select: { id: true, firstName: true, lastName: true, email: true } },
  assignedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy:  { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.ITSprintTaskInclude;

const COLUMNS: ITBoardColumn[] = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"];

function effectiveId(ctx: ITContext): string {
  return ctx.effectiveUserId ?? ctx.viewer.employeeId;
}

/** Effective level (employee override wins over role), mirrors assertITAccess. */
function viewerLevel(ctx: ITContext): number {
  return ctx.viewer.employeeLevel ?? ctx.viewer.roleLevel ?? 0;
}

/** A task is "self" iff nobody assigned it and the creator assigned it to themselves. */
function isSelfTask(t: { assignedById: string | null; createdById: string | null; assigneeId: string | null }): boolean {
  return t.assignedById === null && t.createdById !== null && t.createdById === t.assigneeId;
}

/** Immediate direct reports of an employee (the "+1 up" manager sees these). */
async function directReportIds(managerId: string): Promise<string[]> {
  const reports = await prisma.employee.findMany({
    where:  { managerId },
    select: { id: true },
  });
  return reports.map((r) => r.id);
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

export async function getITSprint(ctx: ITContext, opts: { projectId?: string | null } = {}) {
  await assertITAccess(ctx);
  const sprint = await getActiveSprint();
  if (!sprint) return { sprint: null, columns: COLUMNS.map((key) => ({ key, tasks: [] })) };

  const where: Prisma.ITSprintTaskWhereInput = { sprintId: sprint.id };
  if (opts.projectId) where.projectId = opts.projectId;

  const all = await prisma.iTSprintTask.findMany({
    where,
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    include: taskInclude,
  });

  // Self-task isolation: a self-created task (nobody assigned it; creator ==
  // assignee) is private to its owner and that owner's immediate manager. Every
  // existing/team/assigned task fails isSelfTask() and is always visible, so the
  // shared board is unchanged for all pre-existing data.
  const me = effectiveId(ctx);
  const reports = await directReportIds(me);
  const tasks = all.filter(
    (t) => !isSelfTask(t) || t.assigneeId === me || (t.assigneeId !== null && reports.includes(t.assigneeId)),
  );

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
  projectId?: string | null;
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
      // An explicit assignee at creation that isn't the creator is a manager
      // assignment → record the assigner so it shows as a "blue" assigned task.
      assignedById:   input.assigneeId && input.assigneeId !== me ? me : null,
      projectId:      input.projectId ?? null,
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
  if ("projectId"   in input) data.projectId     = input.projectId ?? null;
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

// ─── Projects ───────────────────────────────────────────────────────────────

/**
 * Active IT projects + per-project progress derived from the active sprint's
 * tasks. Multiple projects run in parallel and share the one IT team.
 */
export async function listITProjects(ctx: ITContext) {
  await assertITAccess(ctx);
  const businessId = await getITBusinessId();
  if (!businessId) return [];

  const [projects, sprint] = await Promise.all([
    prisma.iTProject.findMany({
      where:   { businessId, status: "ACTIVE" },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    }),
    getActiveSprint(),
  ]);

  const counts = sprint
    ? await prisma.iTSprintTask.groupBy({
        by:      ["projectId", "column"],
        where:   { sprintId: sprint.id, projectId: { not: null } },
        _count:  { _all: true },
      })
    : [];

  return projects.map((p) => {
    const rows = counts.filter((c) => c.projectId === p.id);
    const totalTasks = rows.reduce((sum, r) => sum + r._count._all, 0);
    const doneTasks  = rows.filter((r) => r.column === DONE).reduce((sum, r) => sum + r._count._all, 0);
    const progress   = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    return {
      id: p.id, name: p.name, code: p.code, description: p.description,
      color: p.color, status: p.status, orderIndex: p.orderIndex,
      totalTasks, doneTasks, progress,
    };
  });
}

// ─── Team load ──────────────────────────────────────────────────────────────

const OPEN_COLUMNS:        ITBoardColumn[] = ["BACKLOG", "TODO"];
const IN_PROGRESS_COLUMNS: ITBoardColumn[] = ["IN_PROGRESS", "REVIEW"];
const OVERLOAD_TASKS  = 5;  // > this many active tasks → overloaded
const OVERLOAD_POINTS = 13; // …or > this many active story points

/**
 * Each IT team member's workload across the active sprint, DERIVED purely from
 * task counts (no capacity column). Members with no tasks still appear with
 * zeroes so the view shows available capacity.
 */
export async function getITTeamLoad(ctx: ITContext) {
  await assertITAccess(ctx);
  const businessId = await getITBusinessId();
  if (!businessId) return [];
  const sprint = await getActiveSprint();

  const members = await prisma.employee.findMany({
    where:   { businessId, isActive: true },
    select:  { id: true, firstName: true, lastName: true, designation: true },
    orderBy: { level: "desc" },
  });

  const tasks = sprint
    ? await prisma.iTSprintTask.findMany({
        where:  { sprintId: sprint.id, column: { not: DONE }, assigneeId: { not: null } },
        select: { assigneeId: true, column: true, storyPoints: true },
      })
    : [];

  return members.map((m) => {
    const mine            = tasks.filter((t) => t.assigneeId === m.id);
    const openCount       = mine.filter((t) => OPEN_COLUMNS.includes(t.column)).length;
    const inProgressCount = mine.filter((t) => IN_PROGRESS_COLUMNS.includes(t.column)).length;
    const totalActive     = mine.length;
    const storyPointsActive = mine.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
    return {
      id: m.id,
      name: `${m.firstName} ${m.lastName}`.trim(),
      designation: m.designation,
      openCount, inProgressCount, totalActive, storyPointsActive,
      overloaded: totalActive > OVERLOAD_TASKS || storyPointsActive > OVERLOAD_POINTS,
    };
  });
}

// ─── Assign a task (manager/TL action) ────────────────────────────────────────

/**
 * Reassign an existing sprint task to a team member. Restricted to managers
 * (level ≥ 2) or to the assignee's own manager; sets assignedById so the task
 * shows as "assigned" (blue) for the recipient, and publishes an in-app
 * Notification to them.
 */
export async function assignITTask(ctx: ITContext, id: string, assigneeId: string) {
  await assertITAccess(ctx);
  const sprint = await requireActiveSprint();
  const me = effectiveId(ctx);

  const existing = await prisma.iTSprintTask.findFirst({
    where: { id, businessId: sprint.businessId, teamId: sprint.teamId },
  });
  if (!existing) throw new ApiError(404, "IT task not found");

  // Authorization: managers (L2+) may assign to anyone; otherwise the caller may
  // only assign to their own direct reports.
  if (viewerLevel(ctx) < 2) {
    const reports = await directReportIds(me);
    if (!reports.includes(assigneeId)) {
      throw new ApiError(403, "Only a team lead can assign this task");
    }
  }

  // Validate the assignee is an active member of the IT business.
  const assignee = await prisma.employee.findFirst({
    where:  { id: assigneeId, businessId: sprint.businessId, isActive: true },
    select: { id: true },
  });
  if (!assignee) throw new ApiError(400, "Assignee must be an active IT team member");

  const task = await prisma.iTSprintTask.update({
    where: { id },
    data:  { assigneeId, assignedById: me },
    include: taskInclude,
  });

  await recordActivity({
    actorId: me, businessId: task.businessId,
    action: "ASSIGNMENT_CHANGE", targetType: "ITSprintTask", targetId: task.id,
    metadata: { assigneeId },
  });
  await recordAudit({
    actorId: me, businessId: task.businessId,
    action: "ASSIGNMENT_CHANGE", entityType: "ITSprintTask", entityName: task.title,
    entityId: task.id, before: existing, after: task,
  });

  // Publish an in-app notification to the assignee (best-effort — a failure here
  // must not roll back the assignment). Read via GET /workspace/notifications.
  try {
    await prisma.notification.create({
      data: {
        businessId:  task.businessId,
        actorId:     me,
        recipientId: assigneeId,
        type:        "IT_TASK_ASSIGNED",
        payload: {
          taskId:    task.id,
          title:     task.title,
          projectId: task.projectId,
          column:    task.column,
          priority:  task.priority,
        },
        isRead: false,
      },
    });
  } catch {
    // swallow — notification is non-critical
  }

  return task;
}

// ─── My tasks (assigned vs self) ──────────────────────────────────────────────

/**
 * The caller's tasks in the active sprint. `assigned` = handed to me by someone
 * else (blue); `self` = self-picked / self-created; `all` = both.
 */
export async function listMyITTasks(ctx: ITContext, filter: "assigned" | "self" | "all" = "all") {
  await assertITAccess(ctx);
  const me = effectiveId(ctx);
  const sprint = await getActiveSprint();
  if (!sprint) return [];

  const where: Prisma.ITSprintTaskWhereInput = { sprintId: sprint.id, assigneeId: me };
  if (filter === "assigned") where.assignedById = { not: null };
  if (filter === "self")     where.assignedById = null;

  const tasks = await prisma.iTSprintTask.findMany({
    where,
    orderBy: [{ column: "asc" }, { orderIndex: "asc" }],
    include: taskInclude,
  });

  return tasks.map((t) => ({ ...t, isAssignedToMe: t.assignedById !== null }));
}

// ─── Self-task CRUD (owner-private) ───────────────────────────────────────────

/** Locate one of the caller's own self-tasks or throw 404 (isolation guard). */
async function requireMySelfTask(me: string, id: string) {
  const task = await prisma.iTSprintTask.findFirst({
    where: { id, createdById: me, assigneeId: me, assignedById: null },
  });
  if (!task) throw new ApiError(404, "Self task not found");
  return task;
}

export async function createMySelfTask(ctx: ITContext, input: CreateTaskInput) {
  await assertITAccess(ctx);
  const sprint = await requireActiveSprint();
  const me = effectiveId(ctx);

  const targetColumn = input.column ?? "TODO";
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
      assigneeId:     me,     // self-assigned
      assignedById:   null,   // nobody assigned it → private self-task
      projectId:      input.projectId ?? null,
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
    metadata: { selfTask: true, column: task.column },
  });

  return { ...task, isAssignedToMe: false };
}

export async function updateMySelfTask(ctx: ITContext, id: string, input: Partial<CreateTaskInput>) {
  await assertITAccess(ctx);
  const me = effectiveId(ctx);
  const existing = await requireMySelfTask(me, id);

  const data: Prisma.ITSprintTaskUncheckedUpdateInput = {};
  if ("title"       in input) data.title       = input.title;
  if ("description" in input) data.description  = input.description ?? null;
  if ("column"      in input) data.column       = input.column;
  if ("priority"    in input) data.priority     = input.priority;
  if ("storyPoints" in input) data.storyPoints  = input.storyPoints ?? null;
  if ("projectId"   in input) data.projectId     = input.projectId ?? null;
  if ("prdRef"      in input) data.prdRef        = input.prdRef ?? null;
  if ("dueDate"     in input) data.dueDate       = input.dueDate ?? null;

  const task = await prisma.iTSprintTask.update({ where: { id }, data, include: taskInclude });

  await recordActivity({
    actorId: me, businessId: task.businessId,
    action: input.column !== undefined && input.column !== existing.column ? "STATUS_CHANGE" : "UPDATE",
    targetType: "ITSprintTask", targetId: task.id,
    metadata: { selfTask: true, column: task.column },
  });

  return { ...task, isAssignedToMe: false };
}

export async function deleteMySelfTask(ctx: ITContext, id: string) {
  await assertITAccess(ctx);
  const me = effectiveId(ctx);
  const existing = await requireMySelfTask(me, id);

  await prisma.iTSprintTask.delete({ where: { id } });

  await recordActivity({
    actorId: me, businessId: existing.businessId,
    action: "DELETE", targetType: "ITSprintTask", targetId: existing.id,
    metadata: { selfTask: true },
  });

  return { id };
}
