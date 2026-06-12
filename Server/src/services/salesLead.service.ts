import { SalesLeadStatus, Prisma } from "@prisma/client";
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

/** Generate the next human-readable, unique lead code (e.g. LD-000123). */
async function nextLeadCode(): Promise<string> {
  const last = await prisma.salesLead.findFirst({
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

// ─── Public API ───────────────────────────────────────────────────────────────

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
  // `immigration` is an optional nested object from a parallel branch's form;
  // it is not a SalesLead column, so drop it before the Prisma write.
  delete (baseData as Record<string, unknown>).immigration;

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

  const lead = await prisma.salesLead.update({
    where: { id },
    data: {
      status:      SalesLeadStatus.CONVERTED,
      convertedAt: existing.convertedAt ?? new Date(),
      leadScore:   computeLeadScore({ ...existing, status: SalesLeadStatus.CONVERTED }),
    },
    include: leadInclude,
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
  if (
    existing.status !== SalesLeadStatus.QUALIFIED &&
    existing.status !== SalesLeadStatus.CONVERTED
  ) {
    throw new ApiError(400, "Only qualified or converted leads can be transferred to Documentation");
  }

  const lead = await prisma.salesLead.update({
    where: { id },
    data: {
      status:        SalesLeadStatus.TRANSFERRED,
      transferredAt: existing.transferredAt ?? new Date(),
    },
    include: leadInclude,
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
