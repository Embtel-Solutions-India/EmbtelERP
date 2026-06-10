import { SalesLeadStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";
import { ApiError } from "../utils/ApiError.js";
import { recordActivity } from "./activity-writer.service.js";

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

const leadInclude = {
  business: true,
  team: true,
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy:  { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.SalesLeadInclude;

async function resolveAccess(ctx: SalesLeadContext): Promise<SalesAccess> {
  const effectiveId = ctx.effectiveUserId ?? ctx.viewer.employeeId;
  const employee = await prisma.employee.findUnique({
    where: { id: effectiveId },
    include: { role: true },
  });
  if (!employee)              throw new ApiError(404, "Employee not found");
  if (!employee.organizationId) throw new ApiError(403, "Employee has no organisation");

  const roleLevel = employee.level ?? employee.role.level;
  let scoped = ctx.scope;

  if (roleLevel >= 4) {
    const [businesses, employees, teams, departments] = await Promise.all([
      prisma.business.findMany({
        where: { organizationId: employee.organizationId },
        select: { id: true },
      }),
      prisma.employee.findMany({
        where: { organizationId: employee.organizationId },
        select: { id: true },
      }),
      prisma.team.findMany({
        where: { business: { organizationId: employee.organizationId } },
        select: { id: true },
      }),
      prisma.department.findMany({
        where: { business: { organizationId: employee.organizationId } },
        select: { id: true },
      }),
    ]);
    scoped = {
      visibleBusinesses:  businesses.map((r) => r.id),
      visibleEmployees:   employees.map((r) => r.id),
      visibleTeams:       teams.map((r) => r.id),
      visibleDepartments: departments.map((r) => r.id),
    };
  }

  return {
    employeeId:     employee.id,
    organizationId: employee.organizationId,
    roleLevel,
    scope:          scoped,
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

  const lead = await prisma.salesLead.create({
    data: {
      ...input,
      organizationId: access.organizationId,
      createdById:    access.employeeId,
      // Managers can assign to anyone in scope; executives are self-assigned.
      assignedToId:   access.roleLevel >= 2
        ? (input.assignedToId ?? access.employeeId)
        : access.employeeId,
      estimatedValue: normalizeMoney(input.estimatedValue),
    } as CreateInput,
    include: leadInclude,
  });

  await recordActivity({
    actorId:    access.employeeId,
    businessId: lead.businessId,
    action:     "CREATE",
    targetType: "SalesLead",
    targetId:   lead.id,
    metadata:   { source: lead.source },
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

  const data: Partial<UpdateInput> = {
    ...input,
    estimatedValue: normalizeMoney(input.estimatedValue),
  };

  if (input.status === SalesLeadStatus.WON && !input.convertedAt) {
    data.convertedAt = new Date();
  }

  const lead = await prisma.salesLead.update({
    where:   { id },
    data,
    include: leadInclude,
  });

  await recordActivity({
    actorId:    access.employeeId,
    businessId: lead.businessId,
    action:     input.status ? "STATUS_CHANGE" : "UPDATE",
    targetType: "SalesLead",
    targetId:   lead.id,
    metadata:   input.status ? { status: input.status } : undefined,
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
}
