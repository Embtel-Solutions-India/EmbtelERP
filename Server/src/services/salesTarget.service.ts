import {
  Prisma,
  SalesLeadStatus,
  SalesLeadPaymentStatus,
  SalesTaskType,
  SalesTaskStatus,
  SalesTargetStatus,
  SalesTargetMetric,
} from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";
import { ApiError } from "../utils/ApiError.js";
import { recordAudit } from "./activity-writer.service.js";
import { getDescendantIds } from "./hierarchy.service.js";

export type SalesTargetContext = {
  viewer: AuthUser;
  scope: DataScope;
  effectiveUserId?: string | null;
};

export type SalesRole =
  | "HEAD_PLUS"
  | "VERTICAL_MANAGER"
  | "SALES_HEAD"
  | "EXECUTIVE"
  | "INTERN";

type TargetAccess = {
  employeeId: string;
  organizationId: string;
  businessId: string;
  verticalId: string | null;
  teamId: string | null;
  roleLevel: number;
  salesRole: SalesRole;
};

type CreateInput = Prisma.SalesTargetUncheckedCreateInput;

const targetInclude = {
  assignedTo: { select: { id: true, firstName: true, lastName: true, designation: true } },
  assignedBy: { select: { id: true, firstName: true, lastName: true, designation: true } },
} satisfies Prisma.SalesTargetInclude;

function salesRoleOf(roleLevel: number, teamId: string | null): SalesRole {
  if (roleLevel >= 3) return "HEAD_PLUS";
  if (roleLevel === 2) return teamId ? "SALES_HEAD" : "VERTICAL_MANAGER";
  if (roleLevel === 1) return "EXECUTIVE";
  return "INTERN";
}

async function resolveTargetAccess(ctx: SalesTargetContext): Promise<TargetAccess> {
  const effectiveId = ctx.effectiveUserId ?? ctx.viewer.employeeId;
  const emp = await prisma.employee.findUnique({
    where:  { id: effectiveId },
    select: {
      id: true, organizationId: true, businessId: true, verticalId: true,
      teamId: true, level: true, role: { select: { level: true } },
    },
  });
  if (!emp)                throw new ApiError(404, "Employee not found");
  if (!emp.organizationId) throw new ApiError(403, "Employee has no organisation");

  const roleLevel = emp.level ?? emp.role.level;
  return {
    employeeId:     emp.id,
    organizationId: emp.organizationId,
    businessId:     emp.businessId,
    verticalId:     emp.verticalId,
    teamId:         emp.teamId,
    roleLevel,
    salesRole:      salesRoleOf(roleLevel, emp.teamId),
  };
}

// ── Progress calculation ──────────────────────────────────────────────────────

const QUALIFIED_PLUS: SalesLeadStatus[] = [
  SalesLeadStatus.QUALIFIED, SalesLeadStatus.CONVERTED, SalesLeadStatus.TRANSFERRED,
];
const CLOSED: SalesLeadStatus[] = [
  SalesLeadStatus.CONVERTED, SalesLeadStatus.TRANSFERRED, SalesLeadStatus.LOST,
];
const PAID: SalesLeadPaymentStatus[] = [
  SalesLeadPaymentStatus.DONE, SalesLeadPaymentStatus.PARTIALLY_DONE,
];

/**
 * Live achievement for a metric over [start, end], counted across the given set
 * of contributing employees (assignee + their descendants for managers).
 */
async function computeProgress(
  metric: SalesTargetMetric,
  employeeIds: string[],
  start: Date,
  end: Date,
): Promise<number> {
  if (employeeIds.length === 0) return 0;
  const inRange = { gte: start, lte: end };
  const E = { in: employeeIds };

  switch (metric) {
    case "LEADS_CREATED":
      return prisma.salesLead.count({ where: { createdById: E, createdAt: inRange } });
    case "LEADS_CONTACTED":
      return prisma.salesLead.count({ where: { assignedToId: E, status: { not: SalesLeadStatus.NEW }, createdAt: inRange } });
    case "QUALIFIED_LEADS":
      return prisma.salesLead.count({ where: { assignedToId: E, status: { in: QUALIFIED_PLUS }, createdAt: inRange } });
    case "CALLS_COMPLETED":
      return prisma.salesTask.count({ where: { assigneeId: E, taskType: SalesTaskType.CALL, status: SalesTaskStatus.COMPLETED, updatedAt: inRange } });
    case "WHATSAPP_FOLLOWUPS":
      return prisma.salesTask.count({ where: { assigneeId: E, taskType: SalesTaskType.WHATSAPP_FOLLOWUP, status: SalesTaskStatus.COMPLETED, updatedAt: inRange } });
    case "EMAIL_FOLLOWUPS":
      return prisma.salesTask.count({ where: { assigneeId: E, taskType: SalesTaskType.EMAIL_FOLLOWUP, status: SalesTaskStatus.COMPLETED, updatedAt: inRange } });
    case "CONSULTATIONS_SCHEDULED":
      return prisma.salesLead.count({ where: { assignedToId: E, consultationDate: inRange } });
    case "CONVERTED_CLIENTS":
      return prisma.salesLead.count({ where: { assignedToId: E, status: SalesLeadStatus.CONVERTED, convertedAt: inRange } });
    case "CLOSED_LEADS":
      return prisma.salesLead.count({ where: { assignedToId: E, status: { in: CLOSED }, updatedAt: inRange } });
    case "REVENUE_GENERATED": {
      const r = await prisma.salesLead.aggregate({ _sum: { estimatedValue: true }, where: { assignedToId: E, status: SalesLeadStatus.CONVERTED, convertedAt: inRange } });
      return Number(r._sum.estimatedValue ?? 0);
    }
    case "PAYMENTS_COLLECTED": {
      const r = await prisma.salesLead.aggregate({ _sum: { paymentAmount: true }, where: { assignedToId: E, paymentStatus: { in: PAID }, updatedAt: inRange } });
      return Number(r._sum.paymentAmount ?? 0);
    }
    default:
      return 0;
  }
}

// Memoised descendant lookup within a single request (one target list may share
// assignees) → [assignee, ...descendants]; for an exec/intern this is just self.
function descendantsMemo() {
  const cache = new Map<string, Promise<string[]>>();
  return async (assigneeId: string): Promise<string[]> => {
    if (!cache.has(assigneeId)) {
      cache.set(assigneeId, getDescendantIds(assigneeId).then((ids) => [assigneeId, ...ids]));
    }
    return cache.get(assigneeId)!;
  };
}

type TargetRow = Prisma.SalesTargetGetPayload<{ include: typeof targetInclude }>;

function effectiveStatus(target: TargetRow, progressPct: number): SalesTargetStatus {
  if (target.status === SalesTargetStatus.CANCELLED) return SalesTargetStatus.CANCELLED;
  if (progressPct >= 100) return SalesTargetStatus.COMPLETED;
  if (new Date() > target.endDate) return SalesTargetStatus.OVERDUE;
  return SalesTargetStatus.ACTIVE;
}

async function attachProgress(target: TargetRow, contributors: (id: string) => Promise<string[]>) {
  const ids = await contributors(target.assignedToId);
  const currentValue = await computeProgress(target.metric, ids, target.startDate, target.endDate);
  const targetValue = Number(target.targetValue);
  const progressPct = targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0;
  return {
    ...target,
    targetValue,
    currentValue,
    remainingValue: Math.max(0, targetValue - currentValue),
    progressPct,
    effectiveStatus: effectiveStatus(target, progressPct),
    assigneeName: target.assignedTo ? `${target.assignedTo.firstName} ${target.assignedTo.lastName}` : "—",
    assignedByName: target.assignedBy ? `${target.assignedBy.firstName} ${target.assignedBy.lastName}` : "—",
  };
}

export type TargetWithProgress = Awaited<ReturnType<typeof attachProgress>>;

// ── Scope ─────────────────────────────────────────────────────────────────────

async function visibleWhere(access: TargetAccess): Promise<Prisma.SalesTargetWhereInput> {
  if (access.salesRole === "EXECUTIVE" || access.salesRole === "INTERN") {
    return { assignedToId: access.employeeId };
  }
  // Managers/heads: own subtree (received + distributed) and anything they assigned.
  const subtree = [access.employeeId, ...(await getDescendantIds(access.employeeId))];
  return {
    organizationId: access.organizationId,
    OR: [{ assignedToId: { in: subtree } }, { assignedById: access.employeeId }],
  };
}

async function nextTargetCode(): Promise<string> {
  const last = await prisma.salesTarget.findFirst({ orderBy: { targetCode: "desc" }, select: { targetCode: true } });
  const n = (last?.targetCode?.match(/(\d+)\s*$/)?.[1] ? parseInt(last!.targetCode!.match(/(\d+)\s*$/)![1], 10) : 0) + 1;
  return `TG-${String(n).padStart(6, "0")}`;
}

// ── Public reads ────────────────────────────────────────────────────────────

export async function listTargets(ctx: SalesTargetContext): Promise<TargetWithProgress[]> {
  const access = await resolveTargetAccess(ctx);
  const targets = await prisma.salesTarget.findMany({
    where:   await visibleWhere(access),
    include: targetInclude,
    orderBy: { createdAt: "desc" },
  });
  const contributors = descendantsMemo();
  return Promise.all(targets.map((t) => attachProgress(t, contributors)));
}

export async function getTarget(ctx: SalesTargetContext, id: string): Promise<TargetWithProgress> {
  const access = await resolveTargetAccess(ctx);
  const target = await prisma.salesTarget.findFirst({
    where: { id, ...(await visibleWhere(access)) },
    include: targetInclude,
  });
  if (!target) throw new ApiError(404, "Target not found");
  return attachProgress(target, descendantsMemo());
}

export async function getTargetHistory(ctx: SalesTargetContext, id: string) {
  await getTarget(ctx, id); // enforces visibility
  return prisma.salesTargetHistory.findMany({
    where: { targetId: id },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { id: true, firstName: true, lastName: true } } },
  });
}

/** Employees the current user may assign targets to. */
export async function getAssignableUsers(ctx: SalesTargetContext) {
  const access = await resolveTargetAccess(ctx);
  if (access.salesRole !== "VERTICAL_MANAGER" && access.salesRole !== "HEAD_PLUS" && access.salesRole !== "SALES_HEAD") {
    return [];
  }
  const descendantIds = await getDescendantIds(access.employeeId);
  if (descendantIds.length === 0) return [];

  const employees = await prisma.employee.findMany({
    where: { id: { in: descendantIds }, isActive: true },
    select: { id: true, firstName: true, lastName: true, designation: true, level: true, teamId: true, role: { select: { level: true } } },
  });

  const filtered = employees.filter((e) => {
    const lvl = e.level ?? e.role.level;
    if (access.salesRole === "SALES_HEAD") return lvl <= 1;        // execs & interns
    return lvl === 2 && !!e.teamId;                                 // VM / head → Sales Heads
  });

  return filtered.map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    designation: e.designation,
    level: e.level ?? e.role.level,
  }));
}

export async function getTargetSummary(ctx: SalesTargetContext) {
  const access = await resolveTargetAccess(ctx);
  const targets = await listTargets(ctx);

  const active = targets.filter((t) => t.effectiveStatus !== SalesTargetStatus.CANCELLED);
  const sum = (arr: TargetWithProgress[], k: "targetValue" | "currentValue") => arr.reduce((s, t) => s + t[k], 0);
  const avg = (arr: TargetWithProgress[]) => (arr.length ? Math.round(arr.reduce((s, t) => s + t.progressPct, 0) / arr.length) : 0);

  const byCategory = (cat: string) => {
    const set = active.filter((t) => t.category === cat);
    const tv = sum(set, "targetValue"); const cv = sum(set, "currentValue");
    return { targetValue: tv, currentValue: cv, progressPct: tv > 0 ? Math.min(100, Math.round((cv / tv) * 100)) : 0, count: set.length };
  };

  // Per-assignee ranking (team view for heads / VM).
  const byAssignee = new Map<string, { name: string; pcts: number[] }>();
  for (const t of active) {
    const e = byAssignee.get(t.assignedToId) ?? { name: t.assigneeName, pcts: [] };
    e.pcts.push(t.progressPct);
    byAssignee.set(t.assignedToId, e);
  }
  const ranking = [...byAssignee.entries()]
    .map(([employeeId, v]) => ({ employeeId, name: v.name, progressPct: Math.round(v.pcts.reduce((a, b) => a + b, 0) / v.pcts.length) }))
    .sort((a, b) => b.progressPct - a.progressPct);

  // Targets received by the current user personally (exec/intern/head perspective).
  const mine = active.filter((t) => t.assignedToId === access.employeeId);

  return {
    salesRole: access.salesRole,
    totals: {
      count: active.length,
      assigned: sum(active, "targetValue"),
      achieved: sum(active, "currentValue"),
      remaining: Math.max(0, sum(active, "targetValue") - sum(active, "currentValue")),
      avgProgressPct: avg(active),
      completed: active.filter((t) => t.effectiveStatus === SalesTargetStatus.COMPLETED).length,
      overdue: active.filter((t) => t.effectiveStatus === SalesTargetStatus.OVERDUE).length,
    },
    personal: {
      count: mine.length,
      assigned: sum(mine, "targetValue"),
      achieved: sum(mine, "currentValue"),
      remaining: Math.max(0, sum(mine, "targetValue") - sum(mine, "currentValue")),
      progressPct: avg(mine),
    },
    conversion: byCategory("CONVERSION"),
    revenue: byCategory("REVENUE"),
    ranking,
    salesHeadCount: ranking.length,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

async function logHistory(
  targetId: string,
  action: Prisma.SalesTargetHistoryUncheckedCreateInput["action"],
  actorId: string | null,
  opts: { assignedToId?: string | null; previousValue?: number | null; newValue?: number | null; note?: string } = {},
) {
  await prisma.salesTargetHistory.create({
    data: {
      targetId,
      action,
      actorId,
      assignedToId: opts.assignedToId ?? null,
      previousValue: opts.previousValue ?? null,
      newValue: opts.newValue ?? null,
      note: opts.note ?? null,
    },
  });
}

export async function createTarget(ctx: SalesTargetContext, input: any) {
  const access = await resolveTargetAccess(ctx);
  if (access.salesRole === "EXECUTIVE" || access.salesRole === "INTERN") {
    throw new ApiError(403, "You do not have permission to create targets");
  }

  const assignee = await prisma.employee.findUnique({
    where: { id: String(input.assignedToId) },
    select: { id: true, organizationId: true, businessId: true, verticalId: true, teamId: true, level: true, role: { select: { level: true } } },
  });
  if (!assignee) throw new ApiError(404, "Assignee not found");
  const assigneeLevel = assignee.level ?? assignee.role.level;

  const descendantIds = await getDescendantIds(access.employeeId);
  if (!descendantIds.includes(assignee.id)) {
    throw new ApiError(403, "You can only assign targets to people who report to you");
  }

  let category = input.category;
  let metric = input.metric;

  if (input.parentTargetId) {
    // ── Breakdown by a Sales Head ──
    if (access.salesRole !== "SALES_HEAD") {
      throw new ApiError(403, "Only a Sales Head can break down an assigned target");
    }
    const parent = await prisma.salesTarget.findUnique({ where: { id: String(input.parentTargetId) } });
    if (!parent) throw new ApiError(404, "Parent target not found");
    if (parent.assignedToId !== access.employeeId) {
      throw new ApiError(403, "You can only break down targets assigned to you");
    }
    if (assigneeLevel > 1) {
      throw new ApiError(403, "Sales Heads can only assign to Executives or Interns");
    }
    // Sub-targets inherit the parent's metric/category and stay within allocation.
    category = parent.category;
    metric = parent.metric;
    const siblings = await prisma.salesTarget.aggregate({
      _sum: { targetValue: true },
      where: { parentTargetId: parent.id, status: { not: SalesTargetStatus.CANCELLED } },
    });
    const already = Number(siblings._sum.targetValue ?? 0);
    if (already + Number(input.targetValue) > Number(parent.targetValue)) {
      throw new ApiError(400, `Allocation exceeds the parent target (remaining: ${Number(parent.targetValue) - already})`);
    }
  } else {
    // ── Top-level by Vertical Manager / Head ──
    if (access.salesRole !== "VERTICAL_MANAGER" && access.salesRole !== "HEAD_PLUS") {
      throw new ApiError(403, "Only a Vertical Manager can create top-level targets");
    }
    const assigneeIsSalesHead = assigneeLevel === 2 && !!assignee.teamId;
    if (!assigneeIsSalesHead) {
      throw new ApiError(403, "Vertical Managers can only assign targets to Sales Heads");
    }
  }

  const data: Omit<CreateInput, "targetCode"> = {
    organizationId: assignee.organizationId!,
    businessId:     assignee.businessId,
    verticalId:     assignee.verticalId ?? access.verticalId,
    teamId:         assignee.teamId,
    parentTargetId: input.parentTargetId ?? null,
    name:           input.name,
    category,
    metric,
    targetValue:    new Prisma.Decimal(input.targetValue),
    startDate:      new Date(input.startDate),
    endDate:        new Date(input.endDate),
    description:    input.description ?? null,
    assignedById:   access.employeeId,
    assignedToId:   assignee.id,
    createdById:    access.employeeId,
  };

  let target;
  for (let attempt = 0; ; attempt++) {
    try {
      target = await prisma.salesTarget.create({ data: { ...data, targetCode: await nextTargetCode() }, include: targetInclude });
      break;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 5) continue;
      throw err;
    }
  }

  await logHistory(target.id, "CREATED", access.employeeId, { assignedToId: target.assignedToId, newValue: Number(target.targetValue) });
  await logHistory(target.id, "ASSIGNED", access.employeeId, { assignedToId: target.assignedToId, newValue: Number(target.targetValue) });
  await recordAudit({
    actorId: access.employeeId, businessId: target.businessId,
    action: "CREATE", entityType: "SalesTarget", entityName: target.name, entityId: target.id,
    before: null, after: target,
  });

  return attachProgress(target, descendantsMemo());
}

async function ensureManageable(access: TargetAccess, id: string) {
  const target = await prisma.salesTarget.findUnique({ where: { id } });
  if (!target) throw new ApiError(404, "Target not found");
  const descendantIds = await getDescendantIds(access.employeeId);
  const manageable =
    target.assignedById === access.employeeId ||
    descendantIds.includes(target.assignedToId);
  if (!manageable) throw new ApiError(403, "You cannot modify this target");
  return target;
}

export async function updateTarget(ctx: SalesTargetContext, id: string, input: any) {
  const access = await resolveTargetAccess(ctx);
  if (access.salesRole === "EXECUTIVE" || access.salesRole === "INTERN") {
    throw new ApiError(403, "You do not have permission to modify targets");
  }
  const existing = await ensureManageable(access, id);

  const data: Prisma.SalesTargetUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
  if (input.status !== undefined) data.status = input.status;
  const valueChanged = input.targetValue !== undefined && Number(input.targetValue) !== Number(existing.targetValue);
  if (input.targetValue !== undefined) data.targetValue = new Prisma.Decimal(input.targetValue);

  const target = await prisma.salesTarget.update({ where: { id }, data, include: targetInclude });

  await logHistory(target.id, valueChanged ? "VALUE_CHANGED" : "UPDATED", access.employeeId, {
    assignedToId: target.assignedToId,
    previousValue: Number(existing.targetValue),
    newValue: Number(target.targetValue),
  });
  await recordAudit({
    actorId: access.employeeId, businessId: target.businessId,
    action: "UPDATE", entityType: "SalesTarget", entityName: target.name, entityId: target.id,
    before: existing, after: target,
  });

  return attachProgress(target, descendantsMemo());
}

export async function reassignTarget(ctx: SalesTargetContext, id: string, newAssigneeId: string) {
  const access = await resolveTargetAccess(ctx);
  const existing = await ensureManageable(access, id);

  const descendantIds = await getDescendantIds(access.employeeId);
  if (!descendantIds.includes(newAssigneeId)) {
    throw new ApiError(403, "You can only reassign to people who report to you");
  }
  const assignee = await prisma.employee.findUnique({
    where: { id: newAssigneeId },
    select: { id: true, verticalId: true, teamId: true, level: true, role: { select: { level: true } } },
  });
  if (!assignee) throw new ApiError(404, "Assignee not found");
  const lvl = assignee.level ?? assignee.role.level;
  const ok = existing.parentTargetId ? lvl <= 1 : (lvl === 2 && !!assignee.teamId);
  if (!ok) throw new ApiError(403, "Assignee role is not valid for this target");

  const target = await prisma.salesTarget.update({
    where: { id },
    data: { assignedToId: newAssigneeId, teamId: assignee.teamId, verticalId: assignee.verticalId ?? existing.verticalId },
    include: targetInclude,
  });

  await logHistory(target.id, "REASSIGNED", access.employeeId, { assignedToId: newAssigneeId, newValue: Number(target.targetValue) });
  await recordAudit({
    actorId: access.employeeId, businessId: target.businessId,
    action: "ASSIGNMENT_CHANGE", entityType: "SalesTarget", entityName: target.name, entityId: target.id,
    before: existing, after: target,
  });

  return attachProgress(target, descendantsMemo());
}

export async function cancelTarget(ctx: SalesTargetContext, id: string) {
  const access = await resolveTargetAccess(ctx);
  const existing = await ensureManageable(access, id);

  const target = await prisma.salesTarget.update({
    where: { id }, data: { status: SalesTargetStatus.CANCELLED }, include: targetInclude,
  });
  await logHistory(target.id, "CANCELLED", access.employeeId, { assignedToId: target.assignedToId });
  await recordAudit({
    actorId: access.employeeId, businessId: target.businessId,
    action: "STATUS_CHANGE", entityType: "SalesTarget", entityName: target.name, entityId: target.id,
    before: existing, after: target,
  });
  return attachProgress(target, descendantsMemo());
}
