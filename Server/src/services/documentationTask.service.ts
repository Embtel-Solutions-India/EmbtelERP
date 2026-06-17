import { Prisma, DocumentationTaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";
import { ApiError } from "../utils/ApiError.js";
import { recordActivity, recordAudit } from "./activity-writer.service.js";
import { canAssignTaskTo } from "./hierarchy.service.js";

export type DocumentationTaskContext = {
  viewer: AuthUser;
  scope: DataScope;
  effectiveUserId?: string | null;
};

type DocumentationTaskAccess = {
  employeeId: string;
  organizationId: string;
  businessId: string;
  roleLevel: number;
  scope: DataScope;
};

type CreateInput = Prisma.DocumentationTaskUncheckedCreateInput;
type UpdateInput = Prisma.DocumentationTaskUncheckedUpdateInput;

const taskInclude = {
  assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy:{ select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.DocumentationTaskInclude;

const DONE_STATUSES: DocumentationTaskStatus[] = [
  DocumentationTaskStatus.COMPLETED,
  DocumentationTaskStatus.CANCELLED,
];

async function resolveAccess(ctx: DocumentationTaskContext): Promise<DocumentationTaskAccess> {
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

function baseWhere(access: DocumentationTaskAccess) {
  return { businessId: { in: access.scope.visibleBusinesses } };
}

function teamOrEmployeeFilter(access: DocumentationTaskAccess): Record<string, unknown> {
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

function scopedWhere(access: DocumentationTaskAccess) {
  return { ...baseWhere(access), ...teamOrEmployeeFilter(access) };
}

async function ensureScopedTask(id: string, access: DocumentationTaskAccess) {
  const task = await prisma.documentationTask.findFirst({ where: { id, ...scopedWhere(access) } });
  if (!task) throw new ApiError(404, "Documentation task not found");
  return task;
}

/**
 * Hierarchical assignment guard. Self-assignment is always allowed; otherwise
 * the assignee must sit at the tier directly below the caller in their reporting
 * subtree. Shared with the assignee picker via hierarchy.service.
 */
async function assertAssignable(access: DocumentationTaskAccess, assigneeId: string) {
  if (assigneeId === access.employeeId) return; // self-assign always ok
  if (access.roleLevel < 2) {
    throw new ApiError(403, "You are not allowed to assign tasks to others");
  }
  if (!(await canAssignTaskTo(access.employeeId, assigneeId))) {
    throw new ApiError(403, "You can only assign tasks to your team members");
  }
}

/** Next human-readable, unique task code (e.g. DT-000123). */
async function nextTaskCode(): Promise<string> {
  const last = await prisma.documentationTask.findFirst({
    orderBy: { taskCode: "desc" },
    select:  { taskCode: true },
  });
  const lastNum = last?.taskCode?.match(/(\d+)\s*$/)?.[1];
  const next = (lastNum ? parseInt(lastNum, 10) : 0) + 1;
  return `DT-${String(next).padStart(6, "0")}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listDocumentationTasks(ctx: DocumentationTaskContext) {
  const access = await resolveAccess(ctx);
  return prisma.documentationTask.findMany({
    where:   scopedWhere(access),
    include: taskInclude,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
}

export async function createDocumentationTask(ctx: DocumentationTaskContext, input: Partial<CreateInput>) {
  const access = await resolveAccess(ctx);

  // Tasks may only be assigned to the caller's direct reports (or self).
  const requestedAssignee = input.assigneeId ? String(input.assigneeId) : access.employeeId;
  await assertAssignable(access, requestedAssignee);
  const assigneeId = requestedAssignee;

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
      task = await prisma.documentationTask.create({
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
    action: "CREATE", targetType: "DocumentationTask", targetId: task.id,
    metadata: { taskType: task.taskType },
  });
  await recordAudit({
    actorId: access.employeeId, businessId: task.businessId,
    action: "CREATE", entityType: "DocumentationTask", entityName: task.title,
    entityId: task.id, before: null, after: task,
  });

  return task;
}

export async function updateDocumentationTask(ctx: DocumentationTaskContext, id: string, input: Partial<UpdateInput>) {
  const access   = await resolveAccess(ctx);
  const existing = await ensureScopedTask(id, access);

  if (
    access.roleLevel < 2 &&
    existing.assigneeId !== access.employeeId &&
    existing.createdById !== access.employeeId
  ) {
    throw new ApiError(403, "You can only update your own tasks");
  }
  // Block reassignment for non-managers — but only when the assignee is actually
  // changing (editing one's own task re-sends the unchanged assigneeId).
  if (
    access.roleLevel < 2 &&
    "assigneeId" in input &&
    input.assigneeId != null &&
    String(input.assigneeId) !== existing.assigneeId
  ) {
    throw new ApiError(403, "Only managers can reassign tasks");
  }
  // Reassignment is restricted to the caller's direct reports.
  if ("assigneeId" in input && input.assigneeId != null && input.assigneeId !== existing.assigneeId) {
    await assertAssignable(access, String(input.assigneeId));
  }

  const data: Partial<UpdateInput> = { ...input };

  // Stamp completedAt when the task transitions into a terminal state.
  const newStatus = (input.status as DocumentationTaskStatus | undefined) ?? existing.status;
  const becameDone = DONE_STATUSES.includes(newStatus) && !DONE_STATUSES.includes(existing.status);
  if (becameDone && !existing.completedAt) data.completedAt = new Date();

  const task = await prisma.documentationTask.update({ where: { id }, data, include: taskInclude });

  const statusChanged = input.status !== undefined && input.status !== existing.status;
  const action = statusChanged ? "STATUS_CHANGE" : "UPDATE";

  await recordActivity({
    actorId: access.employeeId, businessId: task.businessId,
    action, targetType: "DocumentationTask", targetId: task.id,
    metadata: { status: task.status, result: task.result },
  });
  await recordAudit({
    actorId: access.employeeId, businessId: task.businessId,
    action, entityType: "DocumentationTask", entityName: task.title,
    entityId: task.id, before: existing, after: task,
  });

  return task;
}

export async function deleteDocumentationTask(ctx: DocumentationTaskContext, id: string) {
  const access   = await resolveAccess(ctx);
  const existing = await ensureScopedTask(id, access);

  if (
    access.roleLevel < 2 &&
    existing.assigneeId !== access.employeeId &&
    existing.createdById !== access.employeeId
  ) {
    throw new ApiError(403, "You can only delete your own tasks");
  }

  await prisma.documentationTask.delete({ where: { id } });
  await recordActivity({
    actorId: access.employeeId, businessId: existing.businessId,
    action: "DELETE", targetType: "DocumentationTask", targetId: id,
  });
  await recordAudit({
    actorId: access.employeeId, businessId: existing.businessId,
    action: "DELETE", entityType: "DocumentationTask", entityName: existing.title,
    entityId: id, before: existing, after: null,
  });
}
