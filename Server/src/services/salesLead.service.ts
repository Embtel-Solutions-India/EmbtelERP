import { SalesLeadStatus, SalesLeadPaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";
import { ApiError } from "../utils/ApiError.js";
import { recordActivity, recordAudit } from "./activity-writer.service.js";

export type SalesLeadContext = {
  viewer: AuthUser;
  scope: DataScope;
  effectiveUserId?: string | null;
};

type SalesAccess = {
  employeeId: string;
  organizationId: string;
  roleLevel: number;
  scope: DataScope;
};

type CreateInput = Prisma.SalesLeadUncheckedCreateInput;
type UpdateInput = Prisma.SalesLeadUncheckedUpdateInput;

// Only the assignee is rendered in the lead table/cards; the full business/team/
// creator joins were unused payload, so they're omitted to keep the list lean.
const leadInclude = {
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.SalesLeadInclude;

async function resolveAccess(ctx: SalesLeadContext): Promise<SalesAccess> {
  const viewerId   = ctx.viewer.employeeId;
  const effectiveId = ctx.effectiveUserId ?? viewerId;

  // Fast path (the common case — acting as self): the JWT already carries the
  // role level and organisation, and `attachScope` has already computed the
  // visibility set (org-wide for level >= 4). Avoid re-querying the DB here —
  // every avoided round-trip is ~0.6–1.5s on a remote pooled connection.
  if (effectiveId === viewerId && ctx.viewer.organizationId) {
    return {
      employeeId:     viewerId,
      organizationId: ctx.viewer.organizationId,
      // Mirror the per-employee level (which can override the role's level) so
      // executives/interns stay scoped to their own leads.
      roleLevel:      ctx.viewer.employeeLevel ?? ctx.viewer.roleLevel,
      scope:          ctx.scope,
    };
  }

  // Perspective switch (or a token missing org): resolve the effective employee.
  // `ctx.scope` is already perspective-aware from the middleware, so we only need
  // the effective role level + organisation here.
  const employee = await prisma.employee.findUnique({
    where:  { id: effectiveId },
    select: { id: true, organizationId: true, level: true, role: { select: { level: true } } },
  });
  if (!employee)                throw new ApiError(404, "Employee not found");
  if (!employee.organizationId) throw new ApiError(403, "Employee has no organisation");

  return {
    employeeId:     employee.id,
    organizationId: employee.organizationId,
    roleLevel:      employee.level ?? employee.role.level,
    scope:          ctx.scope,
  };
}

function baseWhere(access: SalesAccess) {
  return {
    organizationId: access.organizationId,
    businessId:     { in: access.scope.visibleBusinesses },
  };
}

function teamOrEmployeeFilter(access: SalesAccess): Record<string, unknown> {
  // Heads+ (level >= 3): see all leads in their org scope — no extra filter needed.
  if (access.roleLevel >= 3) return {};

  // Managers (level 2): see leads owned by anyone in their team/employee scope.
  if (access.roleLevel >= 2) {
    const or: Record<string, unknown>[] = [];
    if (access.scope.visibleTeams.length > 0) {
      or.push({ teamId: { in: access.scope.visibleTeams } });
    }
    if (access.scope.visibleEmployees.length > 0) {
      or.push({ assignedToId: { in: access.scope.visibleEmployees } });
      or.push({ createdById:  { in: access.scope.visibleEmployees } });
    }
    return or.length > 0 ? { OR: or } : { id: "__no_sales_scope__" };
  }

  // Executives and interns (level 0–1): own leads only.
  return {
    OR: [
      { assignedToId: access.employeeId },
      { createdById:  access.employeeId },
    ],
  };
}

function scopedWhere(access: SalesAccess) {
  return { ...baseWhere(access), ...teamOrEmployeeFilter(access) };
}

function normalizeMoney(value: unknown) {
  return value === null || value === undefined
    ? value
    : new Prisma.Decimal(value as Prisma.Decimal.Value);
}

const MONEY_FIELDS = ["estimatedValue", "budgetAvailable", "expectedInvestment", "paymentAmount"] as const;

function normalizeMoneyFields<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = { ...input };
  for (const field of MONEY_FIELDS) {
    if (field in out) out[field] = normalizeMoney(out[field]);
  }
  return out as T;
}

const QUALIFIED_OR_BEYOND: SalesLeadStatus[] = [
  SalesLeadStatus.QUALIFIED,
  SalesLeadStatus.CONVERTED,
  SalesLeadStatus.TRANSFERRED,
];

// ── Lifecycle state machine ─────────────────────────────────────────────────
// Single source of truth for legal status transitions. Enforced in every
// status-mutating path (update/convert/transfer) so illegal jumps (e.g.
// NEW → TRANSFERRED) are rejected with 400 rather than silently accepted.
const ALLOWED_TRANSITIONS: Record<SalesLeadStatus, SalesLeadStatus[]> = {
  [SalesLeadStatus.NEW]:                    [SalesLeadStatus.CONTACTED, SalesLeadStatus.LOST],
  [SalesLeadStatus.CONTACTED]:              [SalesLeadStatus.CONSULTATION_SCHEDULED, SalesLeadStatus.DOCUMENTS_REQUESTED, SalesLeadStatus.QUALIFIED, SalesLeadStatus.LOST],
  [SalesLeadStatus.CONSULTATION_SCHEDULED]: [SalesLeadStatus.DOCUMENTS_REQUESTED, SalesLeadStatus.QUALIFIED, SalesLeadStatus.LOST],
  [SalesLeadStatus.DOCUMENTS_REQUESTED]:    [SalesLeadStatus.QUALIFIED, SalesLeadStatus.LOST],
  [SalesLeadStatus.QUALIFIED]:              [SalesLeadStatus.CONVERTED, SalesLeadStatus.TRANSFERRED, SalesLeadStatus.LOST],
  [SalesLeadStatus.CONVERTED]:              [SalesLeadStatus.TRANSFERRED],
  [SalesLeadStatus.TRANSFERRED]:            [],
  [SalesLeadStatus.LOST]:                   [],
};

/** Reject illegal lifecycle transitions. A no-op (same status) is always allowed. */
function assertTransition(from: SalesLeadStatus, to: SalesLeadStatus) {
  if (from === to) return;
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new ApiError(400, `Illegal lead status transition: ${from} → ${to}`);
  }
}

// Conversion requires at least a partial payment (per the lifecycle spec).
const PAYMENT_OK_FOR_CONVERT: SalesLeadPaymentStatus[] = [
  SalesLeadPaymentStatus.DONE,
  SalesLeadPaymentStatus.PARTIALLY_DONE,
];

/** Reject conversion when payment is not at least partially completed. */
function assertConvertPaymentOk(paymentStatus: SalesLeadPaymentStatus) {
  if (!PAYMENT_OK_FOR_CONVERT.includes(paymentStatus)) {
    throw new ApiError(400, "Lead can be converted only after payment is at least partially completed (PARTIALLY_DONE or DONE)");
  }
}

/**
 * Transparent weighted 0–100 lead score. Recomputed on every create/update so
 * the value on the form is always derived (read-only) rather than user-entered.
 */
export function computeLeadScore(lead: {
  priority?: string | null;
  urgencyLevel?: string | null;
  budgetAvailable?: unknown;
  expectedInvestment?: unknown;
  workExperienceYears?: number | null;
  consultationRequired?: boolean | null;
  familyImmigrationRequired?: boolean | null;
  status?: SalesLeadStatus | null;
}): number {
  let score = 0;

  // Interested level (priority: hot / warm / cold)
  const interest = String(lead.priority ?? "warm").toLowerCase();
  score += interest === "hot" ? 30 : interest === "warm" ? 20 : 10;

  // Urgency
  const urgency = String(lead.urgencyLevel ?? "MEDIUM").toUpperCase();
  score += urgency === "HIGH" ? 15 : urgency === "LOW" ? 5 : 10;

  // Budget / expected investment
  const money = Math.max(
    Number(lead.budgetAvailable ?? 0) || 0,
    Number(lead.expectedInvestment ?? 0) || 0,
  );
  score += money >= 50000 ? 20 : money >= 10000 ? 12 : money > 0 ? 6 : 0;

  // Work experience
  const years = Number(lead.workExperienceYears ?? 0) || 0;
  score += years >= 5 ? 10 : years >= 2 ? 5 : 0;

  if (lead.consultationRequired) score += 10;
  if (lead.familyImmigrationRequired) score += 5;
  if (lead.status && QUALIFIED_OR_BEYOND.includes(lead.status)) score += 10;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Generate the next human-readable, unique lead code (e.g. LD-000123).
 * Accepts an optional Prisma client so it can run inside a `$transaction`
 * (e.g. the Marketing→Sales promotion); defaults to the global client.
 */
export async function nextLeadCode(
  client: Prisma.TransactionClient = prisma,
): Promise<string> {
  const last = await client.salesLead.findFirst({
    orderBy: { leadCode: "desc" },
    select:  { leadCode: true },
  });
  const lastNum = last?.leadCode?.match(/(\d+)\s*$/)?.[1];
  const next = (lastNum ? parseInt(lastNum, 10) : 0) + 1;
  return `LD-${String(next).padStart(6, "0")}`;
}

async function ensureScopedLead(id: string, access: SalesAccess) {
  const lead = await prisma.salesLead.findFirst({
    where: { id, ...scopedWhere(access) },
  });
  if (!lead) throw new ApiError(404, "Sales lead not found");
  return lead;
}

/**
 * Append one row to a lead's never-overwritten ownership chain
 * (LeadAssignmentHistory). Accepts an optional Prisma client so it can run
 * inside a `$transaction` (e.g. the Marketing→Sales promotion); defaults to the
 * global client. Errors propagate — the chain is an audit record, not best-effort.
 */
export async function recordAssignmentHistory(
  input: {
    leadId: string;
    reason: Prisma.LeadAssignmentHistoryUncheckedCreateInput["reason"];
    fromEmployeeId?: string | null;
    toEmployeeId?: string | null;
    changedById?: string | null;
    note?: string | null;
  },
  client: Prisma.TransactionClient = prisma,
) {
  await client.leadAssignmentHistory.create({
    data: {
      leadId:         input.leadId,
      reason:         input.reason,
      fromEmployeeId: input.fromEmployeeId ?? null,
      toEmployeeId:   input.toEmployeeId ?? null,
      changedById:    input.changedById ?? null,
      note:           input.note ?? null,
    },
  });
}

/**
 * Append one row to a lead's never-overwritten lifecycle trail
 * (LeadStatusHistory). Accepts an optional Prisma client for use inside a
 * `$transaction`; defaults to the global client. Errors propagate.
 */
export async function recordStatusHistory(
  input: {
    leadId: string;
    toStatus: SalesLeadStatus;
    fromStatus?: SalesLeadStatus | null;
    changedById?: string | null;
    note?: string | null;
  },
  client: Prisma.TransactionClient = prisma,
) {
  await client.leadStatusHistory.create({
    data: {
      leadId:      input.leadId,
      toStatus:    input.toStatus,
      fromStatus:  input.fromStatus ?? null,
      changedById: input.changedById ?? null,
      note:        input.note ?? null,
    },
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Ownership chain for a lead (newest first), with from/to/actor names resolved. */
export async function getLeadAssignmentHistory(ctx: SalesLeadContext, id: string) {
  const access = await resolveAccess(ctx);
  await ensureScopedLead(id, access); // enforces visibility

  const rows = await prisma.leadAssignmentHistory.findMany({
    where:   { leadId: id },
    orderBy: { createdAt: "desc" },
    include: { changedBy: { select: { id: true, firstName: true, lastName: true } } },
  });

  // Batch-resolve from/to employee names (soft refs, no relation on the model).
  const empIds = [
    ...new Set(
      rows.flatMap((r) => [r.fromEmployeeId, r.toEmployeeId]).filter((v): v is string => Boolean(v)),
    ),
  ];
  const emps = empIds.length
    ? await prisma.employee.findMany({
        where:  { id: { in: empIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const byId = new Map(emps.map((e) => [e.id, e]));

  return rows.map((r) => ({
    ...r,
    fromEmployee: r.fromEmployeeId ? byId.get(r.fromEmployeeId) ?? null : null,
    toEmployee:   r.toEmployeeId   ? byId.get(r.toEmployeeId)   ?? null : null,
  }));
}

/** Lifecycle trail for a lead (newest first), with actor names resolved. */
export async function getLeadStatusHistory(ctx: SalesLeadContext, id: string) {
  const access = await resolveAccess(ctx);
  await ensureScopedLead(id, access); // enforces visibility

  return prisma.leadStatusHistory.findMany({
    where:   { leadId: id },
    orderBy: { createdAt: "desc" },
    include: { changedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
}

type TimelineEventType = "STATUS" | "ASSIGNMENT" | "TASK" | "PAYMENT";
type TimelineActor = { id: string; name: string } | null;
type TimelineEvent = {
  type:   TimelineEventType;
  at:     Date;
  actor:  TimelineActor;
  title:  string;
  detail: string | null;
};

const personName = (p: { firstName: string; lastName: string } | null | undefined) =>
  p ? `${p.firstName} ${p.lastName}`.trim() : null;
const personRef = (p: { id: string; firstName: string; lastName: string } | null | undefined): TimelineActor =>
  p ? { id: p.id, name: personName(p)! } : null;

/**
 * Read-only projection: the complete "one screen" view of a single lead —
 * origin, a derived summary, and one chronological timeline merging status,
 * ownership, follow-up tasks, and payment events. Not a new source of truth.
 */
export async function getLeadTimeline(ctx: SalesLeadContext, id: string) {
  const access = await resolveAccess(ctx);
  await ensureScopedLead(id, access); // enforces visibility

  const empSel = { select: { id: true, firstName: true, lastName: true } } as const;

  const lead = await prisma.salesLead.findUnique({
    where: { id },
    include: {
      assignedTo:    empSel,
      marketingLead: { select: { id: true, source: true, createdBy: empSel } },
    },
  });
  if (!lead) throw new ApiError(404, "Sales lead not found"); // unreachable after scope check

  const [statusRows, assignRows, tasks, paymentRows] = await Promise.all([
    prisma.leadStatusHistory.findMany({
      where: { leadId: id }, orderBy: { createdAt: "asc" }, include: { changedBy: empSel },
    }),
    prisma.leadAssignmentHistory.findMany({
      where: { leadId: id }, orderBy: { createdAt: "asc" }, include: { changedBy: empSel },
    }),
    prisma.salesTask.findMany({
      where: { leadId: id }, orderBy: { createdAt: "asc" }, include: { assignee: empSel },
    }),
    prisma.activity.findMany({
      where: { targetType: "SalesLead", targetId: id, action: "PAYMENT_STATUS_CHANGE" },
      orderBy: { createdAt: "asc" }, include: { actor: empSel },
    }),
  ]);

  // Resolve the soft from/to employee refs on assignment rows in one query.
  const empIds = [
    ...new Set(
      assignRows.flatMap((r) => [r.fromEmployeeId, r.toEmployeeId]).filter((v): v is string => Boolean(v)),
    ),
  ];
  const emps = empIds.length
    ? await prisma.employee.findMany({ where: { id: { in: empIds } }, select: { id: true, firstName: true, lastName: true } })
    : [];
  const byId = new Map(emps.map((e) => [e.id, e]));

  const timeline: TimelineEvent[] = [
    ...statusRows.map((r): TimelineEvent => ({
      type: "STATUS",
      at: r.createdAt,
      actor: personRef(r.changedBy),
      title: `Status → ${r.toStatus}`,
      detail: r.fromStatus ? `from ${r.fromStatus}` : "initial status",
    })),
    ...assignRows.map((r): TimelineEvent => {
      const from = r.fromEmployeeId ? byId.get(r.fromEmployeeId) : null;
      const to   = r.toEmployeeId   ? byId.get(r.toEmployeeId)   : null;
      return {
        type: "ASSIGNMENT",
        at: r.createdAt,
        actor: personRef(r.changedBy),
        title: `Owner → ${personName(to) ?? "unassigned"}`,
        detail: `${personName(from) ?? "—"} (${r.reason})`,
      };
    }),
    ...tasks.map((t): TimelineEvent => ({
      type: "TASK",
      at: t.completedAt ?? t.dueDate ?? t.createdAt,
      actor: personRef(t.assignee),
      title: t.title || t.taskType,
      detail: [t.taskType, t.result ? `result: ${t.result}` : null, `(${t.status})`].filter(Boolean).join(" · "),
    })),
    ...paymentRows.map((a): TimelineEvent => ({
      type: "PAYMENT",
      at: a.createdAt,
      actor: personRef(a.actor),
      title: "Payment status changed",
      detail: (a.metadata as { paymentStatus?: string } | null)?.paymentStatus ?? null,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  const firstContactAt =
    statusRows.find((r) => r.toStatus === SalesLeadStatus.CONTACTED)?.createdAt ?? null;
  const consultationAt =
    statusRows.find((r) => r.toStatus === SalesLeadStatus.CONSULTATION_SCHEDULED)?.createdAt ??
    tasks.find((t) => t.taskType === "CONSULTATION_MEETING")?.completedAt ?? null;
  const generatedBy = personRef(lead.marketingLead?.createdBy);
  const currentOwner = personRef(lead.assignedTo);

  return {
    lead: {
      id:             lead.id,
      leadCode:       lead.leadCode,
      name:           lead.name,
      status:         lead.status,
      source:         lead.source,
      leadScore:      lead.leadScore,
      paymentStatus:  lead.paymentStatus,
      paymentAmount:  lead.paymentAmount,
      estimatedValue: lead.estimatedValue,
      currentOwner,
    },
    origin: lead.marketingLead
      ? { marketingLeadId: lead.marketingLeadId, generatedBy, source: lead.marketingLead.source }
      : null,
    summary: {
      createdAt:        lead.createdAt,
      firstContactAt,
      consultationAt,
      convertedAt:      lead.convertedAt,
      transferredAt:    lead.transferredAt,
      currentOwner,
      generatedBy,
      revenueCollected: lead.paymentAmount, // this lead's collected payment — NOT org revenue (see P2)
    },
    timeline,
  };
}

export async function listSalesLeads(ctx: SalesLeadContext) {
  const access = await resolveAccess(ctx);
  return prisma.salesLead.findMany({
    where:   scopedWhere(access),
    include: leadInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function createSalesLead(ctx: SalesLeadContext, input: Partial<CreateInput>) {
  const access = await resolveAccess(ctx);
  if (access.roleLevel < 1) {
    throw new ApiError(403, "Sales executive access is required to create leads");
  }
  if (!access.scope.visibleBusinesses.includes(String(input.businessId))) {
    throw new ApiError(403, "Business is outside the active perspective scope");
  }
  if (input.teamId && access.roleLevel < 3 && !access.scope.visibleTeams.includes(String(input.teamId))) {
    throw new ApiError(403, "Team is outside the active perspective scope");
  }
  if (input.assignedToId && access.roleLevel < 4 && !access.scope.visibleEmployees.includes(String(input.assignedToId))) {
    throw new ApiError(403, "Assignee is outside the active perspective scope");
  }

  const assignedToId = access.roleLevel >= 2
    ? (input.assignedToId ?? access.employeeId)   // managers can assign in scope
    : access.employeeId;                          // executives are self-assigned

  const baseData = {
    ...normalizeMoneyFields(input),
    organizationId: access.organizationId,
    createdById:    access.employeeId,
    assignedToId,
    leadScore:      computeLeadScore({ ...input, status: input.status as SalesLeadStatus }),
  } as CreateInput;

  // Retry on the (rare) chance of a leadCode collision under concurrency.
  let lead;
  for (let attempt = 0; ; attempt++) {
    try {
      lead = await prisma.salesLead.create({
        data:    { ...baseData, leadCode: await nextLeadCode() },
        include: leadInclude,
      });
      break;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt < 5
      ) continue;
      throw err;
    }
  }

  // Start the ownership chain and lifecycle trail.
  await recordAssignmentHistory({
    leadId:       lead.id,
    reason:       "CREATED",
    toEmployeeId: lead.assignedToId,
    changedById:  access.employeeId,
  });
  await recordStatusHistory({
    leadId:      lead.id,
    toStatus:    lead.status,
    changedById: access.employeeId,
  });

  await recordActivity({
    actorId:    access.employeeId,
    businessId: lead.businessId,
    action:     "CREATE",
    targetType: "SalesLead",
    targetId:   lead.id,
    metadata:   { source: lead.source },
  });

  await recordAudit({
    actorId:    access.employeeId,
    businessId: lead.businessId,
    action:     "CREATE",
    entityType: "SalesLead",
    entityName: lead.name,
    entityId:   lead.id,
    before:     null,
    after:      lead,
  });

  return lead;
}

export async function updateSalesLead(
  ctx: SalesLeadContext,
  id: string,
  input: Partial<UpdateInput>,
) {
  const access   = await resolveAccess(ctx);
  const existing = await ensureScopedLead(id, access);

  if (
    access.roleLevel < 2 &&
    existing.assignedToId !== access.employeeId &&
    existing.createdById  !== access.employeeId
  ) {
    throw new ApiError(403, "You can only update leads assigned to you");
  }
  if (access.roleLevel < 2 && "assignedToId" in input) {
    throw new ApiError(403, "Only managers can reassign leads");
  }

  const data: Partial<UpdateInput> = normalizeMoneyFields(input);
  delete (data as Record<string, unknown>).immigration;

  // Recompute the derived lead score from the merged (existing + incoming) record.
  const merged = { ...existing, ...input } as Parameters<typeof computeLeadScore>[0];
  data.leadScore = computeLeadScore(merged);

  // Enforce the lifecycle state machine + payment gate on any status change.
  const statusChanging = input.status !== undefined && input.status !== existing.status;
  if (statusChanging) {
    assertTransition(existing.status, input.status as SalesLeadStatus);
    if (input.status === SalesLeadStatus.CONVERTED) {
      const effectivePayment =
        (input.paymentStatus as SalesLeadPaymentStatus | undefined) ?? existing.paymentStatus;
      assertConvertPaymentOk(effectivePayment);
    }
  }

  if (input.status === SalesLeadStatus.CONVERTED && !existing.convertedAt && !input.convertedAt) {
    data.convertedAt = new Date();
  }
  if (input.status === SalesLeadStatus.TRANSFERRED && !existing.transferredAt && !input.transferredAt) {
    data.transferredAt = new Date();
  }

  const lead = await prisma.salesLead.update({
    where:   { id },
    data,
    include: leadInclude,
  });

  // Classify the change so the audit trail records the most specific action.
  let action: "UPDATE" | "STATUS_CHANGE" | "PAYMENT_STATUS_CHANGE" | "ASSIGNMENT_CHANGE" = "UPDATE";
  if (input.paymentStatus !== undefined && input.paymentStatus !== existing.paymentStatus) {
    action = "PAYMENT_STATUS_CHANGE";
  } else if (input.status !== undefined && input.status !== existing.status) {
    action = "STATUS_CHANGE";
  } else if ("assignedToId" in input && input.assignedToId !== existing.assignedToId) {
    action = "ASSIGNMENT_CHANGE";
  }

  const metadata: Record<string, unknown> | undefined =
    action === "STATUS_CHANGE"          ? { status: lead.status } :
    action === "PAYMENT_STATUS_CHANGE"  ? { paymentStatus: lead.paymentStatus } :
    action === "ASSIGNMENT_CHANGE"      ? { assignedToId: lead.assignedToId } :
    undefined;

  // Extend the ownership chain on reassignment.
  if (action === "ASSIGNMENT_CHANGE") {
    await recordAssignmentHistory({
      leadId:         lead.id,
      reason:         "REASSIGNED",
      fromEmployeeId: existing.assignedToId,
      toEmployeeId:   lead.assignedToId,
      changedById:    access.employeeId,
    });
  }

  // Extend the lifecycle trail on status change.
  if (statusChanging) {
    await recordStatusHistory({
      leadId:      lead.id,
      fromStatus:  existing.status,
      toStatus:    lead.status,
      changedById: access.employeeId,
    });
  }

  await recordActivity({
    actorId:    access.employeeId,
    businessId: lead.businessId,
    action,
    targetType: "SalesLead",
    targetId:   lead.id,
    metadata,
  });

  await recordAudit({
    actorId:    access.employeeId,
    businessId: lead.businessId,
    action,
    entityType: "SalesLead",
    entityName: lead.name,
    entityId:   lead.id,
    before:     existing,
    after:      lead,
  });

  return lead;
}

/** Convert a lead (Sales Executive may convert their own lead). */
export async function convertSalesLead(ctx: SalesLeadContext, id: string) {
  const access   = await resolveAccess(ctx);
  const existing = await ensureScopedLead(id, access);

  if (
    access.roleLevel < 2 &&
    existing.assignedToId !== access.employeeId &&
    existing.createdById  !== access.employeeId
  ) {
    throw new ApiError(403, "You can only convert leads assigned to you");
  }

  // Lifecycle guard: only QUALIFIED → CONVERTED, and only with payment recorded.
  assertTransition(existing.status, SalesLeadStatus.CONVERTED);
  assertConvertPaymentOk(existing.paymentStatus);

  const lead = await prisma.salesLead.update({
    where: { id },
    data: {
      status:      SalesLeadStatus.CONVERTED,
      convertedAt: existing.convertedAt ?? new Date(),
      leadScore:   computeLeadScore({ ...existing, status: SalesLeadStatus.CONVERTED }),
    },
    include: leadInclude,
  });

  await recordStatusHistory({
    leadId: lead.id, fromStatus: existing.status, toStatus: lead.status,
    changedById: access.employeeId,
  });
  await recordActivity({
    actorId: access.employeeId, businessId: lead.businessId,
    action: "STATUS_CHANGE", targetType: "SalesLead", targetId: lead.id,
    metadata: { status: lead.status },
  });
  await recordAudit({
    actorId: access.employeeId, businessId: lead.businessId,
    action: "STATUS_CHANGE", entityType: "SalesLead", entityName: lead.name,
    entityId: lead.id, before: existing, after: lead,
  });

  return lead;
}

/** Transfer a qualified/converted lead to the Documentation team. */
export async function transferSalesLead(ctx: SalesLeadContext, id: string) {
  const access   = await resolveAccess(ctx);
  const existing = await ensureScopedLead(id, access);

  if (
    access.roleLevel < 2 &&
    existing.assignedToId !== access.employeeId &&
    existing.createdById  !== access.employeeId
  ) {
    throw new ApiError(403, "You can only transfer leads assigned to you");
  }
  // Lifecycle guard (single source of truth): the map permits TRANSFERRED only
  // from QUALIFIED or CONVERTED.
  assertTransition(existing.status, SalesLeadStatus.TRANSFERRED);

  const lead = await prisma.salesLead.update({
    where: { id },
    data: {
      status:        SalesLeadStatus.TRANSFERRED,
      transferredAt: existing.transferredAt ?? new Date(),
    },
    include: leadInclude,
  });

  // Ownership leaves Sales toward Documentation.
  await recordAssignmentHistory({
    leadId:         lead.id,
    reason:         "TRANSFERRED",
    fromEmployeeId: existing.assignedToId,
    toEmployeeId:   null,
    changedById:    access.employeeId,
    note:           "Transferred to Documentation team",
  });
  await recordStatusHistory({
    leadId: lead.id, fromStatus: existing.status, toStatus: lead.status,
    changedById: access.employeeId,
  });

  await recordActivity({
    actorId: access.employeeId, businessId: lead.businessId,
    action: "STATUS_CHANGE", targetType: "SalesLead", targetId: lead.id,
    metadata: { status: lead.status, transferredToDocumentation: true },
  });
  await recordAudit({
    actorId: access.employeeId, businessId: lead.businessId,
    action: "STATUS_CHANGE", entityType: "SalesLead", entityName: lead.name,
    entityId: lead.id, before: existing, after: lead,
  });

  return lead;
}

export async function deleteSalesLead(ctx: SalesLeadContext, id: string) {
  const access = await resolveAccess(ctx);
  if (access.roleLevel < 2) {
    throw new ApiError(403, "Sales manager access is required to delete leads");
  }
  const existing = await ensureScopedLead(id, access);
  await prisma.salesLead.delete({ where: { id } });
  await recordActivity({
    actorId:    access.employeeId,
    businessId: existing.businessId,
    action:     "DELETE",
    targetType: "SalesLead",
    targetId:   id,
  });

  await recordAudit({
    actorId:    access.employeeId,
    businessId: existing.businessId,
    action:     "DELETE",
    entityType: "SalesLead",
    entityName: existing.name,
    entityId:   id,
    before:     existing,
    after:      null,
  });
}
