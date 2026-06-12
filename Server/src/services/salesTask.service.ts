import { Prisma, SalesTaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";
import { ApiError } from "../utils/ApiError.js";
import { recordActivity, recordAudit } from "./activity-writer.service.js";

export type SalesTaskContext = {
  viewer: AuthUser;
  scope: DataScope;
  effectiveUserId?: string | null;
};

type SalesTaskAccess = {
  employeeId: string;
  organizationId: string;
  businessId: string;
  roleLevel: number;
  scope: DataScope;
};

type CreateInput = Prisma.SalesTaskUncheckedCreateInput;
type UpdateInput = Prisma.SalesTaskUncheckedUpdateInput;

const taskInclude = {
  lead:     { select: { id: true, leadCode: true, name: true, status: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy:{ select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.SalesTaskInclude;

const DONE_STATUSES: SalesTaskStatus[] = [SalesTaskStatus.COMPLETED, SalesTaskStatus.CANCELLED];

async function resolveAccess(ctx: SalesTaskContext): Promise<SalesTaskAccess> {
  const viewerId    = ctx.viewer.employeeId;
  const effectiveId = ctx.effectiveUserId ?? viewerId;

  // Fast path (acting as self): derive role/org/business from the JWT and reuse
  // the scope already computed by `attachScope` (org-wide for level >= 4),
  // avoiding redundant DB round-trips on the read path.
  if (effectiveId === viewerId && ctx.viewer.organizationId && ctx.viewer.businessId) {
    return {
      employeeId:     viewerId,
      organizationId: ctx.viewer.organizationId,
      businessId:     ctx.viewer.businessId,
      // Mirror the per-employee level (which can override the role's level) so
      // executives/interns stay scoped to their own tasks.
      roleLevel:      ctx.viewer.employeeLevel ?? ctx.viewer.roleLevel,
      scope:          ctx.scope,
    };
  }

  const employee = await prisma.employee.findUnique({
    where:  { id: effectiveId },
    select: { id: true, organizationId: true, businessId: true, level: true, role: { select: { level: true } } },
  });
  if (!employee)                throw new ApiError(404, "Employee not found");
  if (!employee.organizationId) throw new ApiError(403, "Employee has no organisation");

  return {
    employeeId:     employee.id,
    organizationId: employee.organizationId,
    businessId:     employee.businessId,
    roleLevel:      employee.level ?? employee.role.level,
    scope:          ctx.scope,
  };
}

// Team/vertical defaults for a new task are pulled from the creator's own record
// (only needed on create, so this lookup stays off the hot read paths).
async function employeeTeamVertical(employeeId: string) {
  const e = await prisma.employee.findUnique({
    where:  { id: employeeId },
    select: { teamId: true, verticalId: true },
  });
  return { teamId: e?.teamId ?? null, verticalId: e?.verticalId ?? null };
}

function baseWhere(access: SalesTaskAccess) {
  return { businessId: { in: access.scope.visibleBusinesses } };
}

function teamOrEmployeeFilter(access: SalesTaskAccess): Record<string, unknown> {
  if (access.roleLevel >= 3) return {};
  if (access.roleLevel >= 2) {
    const or: Record<string, unknown>[] = [];
    if (access.scope.visibleTeams.length > 0)     or.push({ teamId: { in: access.scope.visibleTeams } });
    if (access.scope.visibleEmployees.length > 0) {
      or.push({ assigneeId:  { in: access.scope.visibleEmployees } });
      or.push({ createdById: { in: access.scope.visibleEmployees } });
    }
    return or.length > 0 ? { OR: or } : { id: "__no_scope__" };
  }
  // Executives / interns: own tasks only.
  return { OR: [{ assigneeId: access.employeeId }, { createdById: access.employeeId }] };
}

function scopedWhere(access: SalesTaskAccess) {
  return { ...baseWhere(access), ...teamOrEmployeeFilter(access) };
}

async function ensureScopedTask(id: string, access: SalesTaskAccess) {
  const task = await prisma.salesTask.findFirst({ where: { id, ...scopedWhere(access) } });
  if (!task) throw new ApiError(404, "Sales task not found");
  return task;
}

/** Next human-readable, unique task code (e.g. ST-000123). */
async function nextTaskCode(): Promise<string> {
  const last = await prisma.salesTask.findFirst({
    orderBy: { taskCode: "desc" },
    select:  { taskCode: true },
  });
  const lastNum = last?.taskCode?.match(/(\d+)\s*$/)?.[1];
  const next = (lastNum ? parseInt(lastNum, 10) : 0) + 1;
  return `ST-${String(next).padStart(6, "0")}`;
}

/**
 * When a task result is recorded or the task is completed, append an entry to
 * the related lead's activity timeline so outcomes are visible against the lead.
 */
async function recordOutcomeOnLead(
  access: SalesTaskAccess,
  task: { id: string; title: string; leadId: string | null; result: string | null; status: string },
) {
  if (!task.leadId) return;
  await recordActivity({
    actorId:    access.employeeId,
    businessId: access.businessId,
    action:     "UPDATE",
    targetType: "SalesLead",
    targetId:   task.leadId,
    metadata:   { salesTaskId: task.id, taskTitle: task.title, result: task.result, status: task.status },
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listSalesTasks(ctx: SalesTaskContext) {
  const access = await resolveAccess(ctx);
  return prisma.salesTask.findMany({
    where:   scopedWhere(access),
    include: taskInclude,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
}

export async function createSalesTask(ctx: SalesTaskContext, input: Partial<CreateInput>) {
  const access = await resolveAccess(ctx);

  // Managers can assign to anyone in scope; everyone else is self-assigned.
  const assigneeId = access.roleLevel >= 2
    ? (input.assigneeId ?? access.employeeId)
    : access.employeeId;

  if (input.assigneeId && access.roleLevel < 4 && !access.scope.visibleEmployees.includes(String(input.assigneeId))) {
    throw new ApiError(403, "Assignee is outside the active perspective scope");
  }

  // Default team/vertical from the creator's own record when not supplied.
  const needsDefaults = input.teamId == null || input.verticalId == null;
  const defaults = needsDefaults ? await employeeTeamVertical(access.employeeId) : { teamId: null, verticalId: null };

  const baseData = {
    ...input,
    organizationId: access.organizationId,
    businessId:     access.businessId,
    teamId:         (input.teamId as string | null | undefined) ?? defaults.teamId,
    verticalId:     (input.verticalId as string | null | undefined) ?? defaults.verticalId,
    createdById:    access.employeeId,
    assigneeId,
  } as CreateInput;

  let task;
  for (let attempt = 0; ; attempt++) {
    try {
      task = await prisma.salesTask.create({
        data:    { ...baseData, taskCode: await nextTaskCode() },
        include: taskInclude,
      });
      break;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 5) continue;
      throw err;
    }
  }

  await recordActivity({
    actorId: access.employeeId, businessId: task.businessId,
    action: "CREATE", targetType: "SalesTask", targetId: task.id,
    metadata: { taskType: task.taskType, leadId: task.leadId },
  });
  await recordAudit({
    actorId: access.employeeId, businessId: task.businessId,
    action: "CREATE", entityType: "SalesTask", entityName: task.title,
    entityId: task.id, before: null, after: task,
  });
  await recordOutcomeOnLead(access, task);

  return task;
}

export async function updateSalesTask(ctx: SalesTaskContext, id: string, input: Partial<UpdateInput>) {
  const access   = await resolveAccess(ctx);
  const existing = await ensureScopedTask(id, access);

  if (
    access.roleLevel < 2 &&
    existing.assigneeId !== access.employeeId &&
    existing.createdById !== access.employeeId
  ) {
    throw new ApiError(403, "You can only update your own tasks");
  }
  if (access.roleLevel < 2 && "assigneeId" in input) {
    throw new ApiError(403, "Only managers can reassign tasks");
  }

  const data: Partial<UpdateInput> = { ...input };

  // Stamp completedAt when the task transitions into a terminal state.
  const newStatus = (input.status as SalesTaskStatus | undefined) ?? existing.status;
  const becameDone = DONE_STATUSES.includes(newStatus) && !DONE_STATUSES.includes(existing.status);
  if (becameDone && !existing.completedAt) data.completedAt = new Date();

  const task = await prisma.salesTask.update({ where: { id }, data, include: taskInclude });

  const statusChanged = input.status !== undefined && input.status !== existing.status;
  const action = statusChanged ? "STATUS_CHANGE" : "UPDATE";

  await recordActivity({
    actorId: access.employeeId, businessId: task.businessId,
    action, targetType: "SalesTask", targetId: task.id,
    metadata: { status: task.status, result: task.result },
  });
  await recordAudit({
    actorId: access.employeeId, businessId: task.businessId,
    action, entityType: "SalesTask", entityName: task.title,
    entityId: task.id, before: existing, after: task,
  });

  // Outcome history → lead activity timeline (result set/changed or completed).
  const resultChanged = "result" in input && input.result !== existing.result;
  if (resultChanged || becameDone) await recordOutcomeOnLead(access, task);

  return task;
}

export async function deleteSalesTask(ctx: SalesTaskContext, id: string) {
  const access   = await resolveAccess(ctx);
  const existing = await ensureScopedTask(id, access);

  if (
    access.roleLevel < 2 &&
    existing.assigneeId !== access.employeeId &&
    existing.createdById !== access.employeeId
  ) {
    throw new ApiError(403, "You can only delete your own tasks");
  }

  await prisma.salesTask.delete({ where: { id } });
  await recordActivity({
    actorId: access.employeeId, businessId: existing.businessId,
    action: "DELETE", targetType: "SalesTask", targetId: id,
  });
  await recordAudit({
    actorId: access.employeeId, businessId: existing.businessId,
    action: "DELETE", entityType: "SalesTask", entityName: existing.title,
    entityId: id, before: existing, after: null,
  });
}
