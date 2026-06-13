import {
  MarketingActivityType,
  MarketingCampaignStatus,
  MarketingLeadStatus,
  MarketingTaskStatus,
  SalesLeadStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { DataScope } from "./scope.service.js";
import { ApiError } from "../utils/ApiError.js";
import { recordActivity, recordAudit } from "./activity-writer.service.js";
import { computeLeadScore, nextLeadCode, recordAssignmentHistory, recordStatusHistory } from "./salesLead.service.js";
import { canAssignTaskTo, getAssignableSubordinates } from "./hierarchy.service.js";

export type MarketingRequestContext = {
  viewer: AuthUser;
  scope: DataScope;
  effectiveUserId?: string | null;
};

type MarketingAccess = {
  employeeId: string;
  organizationId: string;
  roleLevel: number;
  scope: DataScope;
};

type EntityKind = "campaign" | "task" | "lead" | "activity" | "kpi";

type CreateCampaignInput = Prisma.MarketingCampaignUncheckedCreateInput;
type UpdateCampaignInput = Prisma.MarketingCampaignUncheckedUpdateInput;
type CreateTaskInput = Prisma.MarketingTaskUncheckedCreateInput;
type UpdateTaskInput = Prisma.MarketingTaskUncheckedUpdateInput;
type CreateLeadInput = Prisma.MarketingLeadUncheckedCreateInput;
type UpdateLeadInput = Prisma.MarketingLeadUncheckedUpdateInput;
type CreateActivityInput = Prisma.MarketingActivityUncheckedCreateInput;
type UpdateActivityInput = Prisma.MarketingActivityUncheckedUpdateInput;
type CreateKPIInput = Prisma.MarketingKPIUncheckedCreateInput;
type UpdateKPIInput = Prisma.MarketingKPIUncheckedUpdateInput;

const campaignInclude = {
  business: true,
  team: true,
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.MarketingCampaignInclude;

const taskInclude = {
  campaign: true,
  business: true,
  team: true,
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.MarketingTaskInclude;

const leadInclude = {
  campaign: true,
  business: true,
  team: true,
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.MarketingLeadInclude;

const activityInclude = {
  campaign: true,
  task: true,
  lead: true,
  business: true,
  team: true,
  actor: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.MarketingActivityInclude;

const kpiInclude = {
  campaign: true,
  business: true,
  team: true,
  employee: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.MarketingKPIInclude;

async function resolveAccess(ctx: MarketingRequestContext): Promise<MarketingAccess> {
  const effectiveId = ctx.effectiveUserId ?? ctx.viewer.employeeId;
  const employee = await prisma.employee.findUnique({
    where: { id: effectiveId },
    include: { role: true },
  });

  if (!employee) {
    throw new ApiError(404, "Effective employee not found");
  }

  if (!employee.organizationId) {
    throw new ApiError(403, "Employee is not attached to an organization");
  }

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
      visibleBusinesses: businesses.map((row) => row.id),
      visibleEmployees: employees.map((row) => row.id),
      visibleTeams: teams.map((row) => row.id),
      visibleDepartments: departments.map((row) => row.id),
    };
  }

  return {
    employeeId: employee.id,
    organizationId: employee.organizationId,
    roleLevel,
    scope: scoped,
  };
}

function baseWhere(access: MarketingAccess) {
  return {
    organizationId: access.organizationId,
    businessId: { in: access.scope.visibleBusinesses },
  };
}

function teamOrEmployeeScope(
  access: MarketingAccess,
  kind: EntityKind,
): Record<string, unknown> {
  if (access.roleLevel >= 3) {
    return {};
  }

  if (access.roleLevel >= 2) {
    const or: Record<string, unknown>[] = [];
    if (access.scope.visibleTeams.length > 0) {
      or.push({ teamId: { in: access.scope.visibleTeams } });
    }
    if (access.scope.visibleEmployees.length > 0) {
      if (kind === "activity") {
        or.push({ actorId: { in: access.scope.visibleEmployees } });
      } else if (kind === "kpi") {
        or.push({ employeeId: { in: access.scope.visibleEmployees } });
      } else {
        or.push({ assignedToId: { in: access.scope.visibleEmployees } });
        or.push({ createdById: { in: access.scope.visibleEmployees } });
      }
    }
    return or.length > 0 ? { OR: or } : { id: "__no_marketing_scope__" };
  }

  if (kind === "activity") {
    return { actorId: access.employeeId };
  }
  if (kind === "kpi") {
    return { employeeId: access.employeeId };
  }
  return {
    OR: [{ assignedToId: access.employeeId }, { createdById: access.employeeId }],
  };
}

function scopedWhere(
  access: MarketingAccess,
  kind: EntityKind,
): Record<string, unknown> {
  return {
    ...baseWhere(access),
    ...teamOrEmployeeScope(access, kind),
  };
}

function assertBusinessInScope(access: MarketingAccess, businessId: string) {
  if (!access.scope.visibleBusinesses.includes(businessId)) {
    throw new ApiError(403, "Business is outside the active perspective scope");
  }
}

function assertTeamInScope(access: MarketingAccess, teamId?: string | null) {
  if (!teamId || access.roleLevel >= 3) {
    return;
  }
  if (!access.scope.visibleTeams.includes(teamId)) {
    throw new ApiError(403, "Team is outside the active perspective scope");
  }
}

function assertEmployeeInScope(
  access: MarketingAccess,
  employeeId?: string | null,
) {
  if (!employeeId || access.roleLevel >= 4) {
    return;
  }
  if (!access.scope.visibleEmployees.includes(employeeId)) {
    throw new ApiError(
      403,
      "Employee is outside the active perspective scope",
    );
  }
}

function canManage(access: MarketingAccess) {
  return access.roleLevel >= 2;
}

function canExecute(access: MarketingAccess) {
  return access.roleLevel >= 1;
}

function assertMarketingManager(access: MarketingAccess) {
  if (!canManage(access)) {
    throw new ApiError(403, "Marketing manager access is required");
  }
}

/**
 * Hierarchical task-assignment guard (mirrors the Sales rule). Self-assignment
 * is always allowed; otherwise the assignee must be in the caller's reporting
 * subtree at the tier directly below them (Vertical Manager → Heads,
 * Marketing Head → Executives/Interns). Executives/interns cannot assign.
 */
async function assertAssignable(access: MarketingAccess, assigneeId: string) {
  if (assigneeId === access.employeeId) return;
  if (access.roleLevel < 2) {
    throw new ApiError(403, "You are not allowed to assign tasks to others");
  }
  if (!(await canAssignTaskTo(access.employeeId, assigneeId))) {
    throw new ApiError(403, "You can only assign tasks to your team members");
  }
}

function normalizeMoney(value: unknown) {
  return value === null || value === undefined ? value : new Prisma.Decimal(value as Prisma.Decimal.Value);
}

function normalizeCreateCampaign(input: Partial<CreateCampaignInput>) {
  return {
    ...input,
    budget: normalizeMoney(input.budget),
    budgetSpent: normalizeMoney(input.budgetSpent),
  } as CreateCampaignInput;
}

function normalizeCreateLead(input: Partial<CreateLeadInput>) {
  return {
    ...input,
    estimatedValue:     normalizeMoney(input.estimatedValue),
    budgetAvailable:    normalizeMoney(input.budgetAvailable),
    expectedInvestment: normalizeMoney(input.expectedInvestment),
  } as CreateLeadInput;
}

// Synced capture fields feed the shared sales lead-score (no second scorer).
function marketingLeadScore(input: {
  priority?: string | null;
  urgencyLevel?: unknown;
  budgetAvailable?: unknown;
  expectedInvestment?: unknown;
  workExperienceYears?: number | null;
  consultationRequired?: boolean | null;
  familyImmigrationRequired?: boolean | null;
}): number {
  return computeLeadScore({
    priority:                  input.priority ?? undefined,
    urgencyLevel:              (input.urgencyLevel as string | null | undefined) ?? undefined,
    budgetAvailable:           input.budgetAvailable,
    expectedInvestment:        input.expectedInvestment,
    workExperienceYears:       input.workExperienceYears ?? undefined,
    consultationRequired:      input.consultationRequired ?? undefined,
    familyImmigrationRequired: input.familyImmigrationRequired ?? undefined,
  });
}

function normalizeCreateKPI(input: Partial<CreateKPIInput>) {
  return {
    ...input,
    value: normalizeMoney(input.value) as Prisma.Decimal,
    target: normalizeMoney(input.target),
  } as CreateKPIInput;
}

async function ensureScopedCampaign(id: string, access: MarketingAccess) {
  const campaign = await prisma.marketingCampaign.findFirst({
    where: { id, ...scopedWhere(access, "campaign") },
  });
  if (!campaign) throw new ApiError(404, "Marketing campaign not found");
  return campaign;
}

async function ensureScopedTask(id: string, access: MarketingAccess) {
  const task = await prisma.marketingTask.findFirst({
    where: { id, ...scopedWhere(access, "task") },
  });
  if (!task) throw new ApiError(404, "Marketing task not found");
  return task;
}

async function ensureScopedLead(id: string, access: MarketingAccess) {
  const lead = await prisma.marketingLead.findFirst({
    where: { id, ...scopedWhere(access, "lead") },
  });
  if (!lead) throw new ApiError(404, "Marketing lead not found");
  return lead;
}

async function ensureScopedActivity(id: string, access: MarketingAccess) {
  const activity = await prisma.marketingActivity.findFirst({
    where: { id, ...scopedWhere(access, "activity") },
  });
  if (!activity) throw new ApiError(404, "Marketing activity not found");
  return activity;
}

async function ensureScopedKPI(id: string, access: MarketingAccess) {
  const kpi = await prisma.marketingKPI.findFirst({
    where: { id, ...scopedWhere(access, "kpi") },
  });
  if (!kpi) throw new ApiError(404, "Marketing KPI not found");
  return kpi;
}

export async function listMarketingCampaigns(ctx: MarketingRequestContext) {
  const access = await resolveAccess(ctx);
  return prisma.marketingCampaign.findMany({
    where: scopedWhere(access, "campaign"),
    include: campaignInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getMarketingCampaign(ctx: MarketingRequestContext, id: string) {
  const access = await resolveAccess(ctx);
  const campaign = await prisma.marketingCampaign.findFirst({
    where: { id, ...scopedWhere(access, "campaign") },
    include: campaignInclude,
  });
  if (!campaign) throw new ApiError(404, "Marketing campaign not found");
  return campaign;
}

export async function createMarketingCampaign(ctx: MarketingRequestContext, input: Partial<CreateCampaignInput>) {
  const access = await resolveAccess(ctx);
  if (!canExecute(access)) throw new ApiError(403, "Marketing executive access is required");
  assertBusinessInScope(access, String(input.businessId));
  assertTeamInScope(access, input.teamId as string | null | undefined);
  assertEmployeeInScope(access, input.assignedToId as string | null | undefined);

  const data = normalizeCreateCampaign({
    ...input,
    organizationId: access.organizationId,
    createdById: access.employeeId,
    assignedToId: canManage(access) ? input.assignedToId ?? null : access.employeeId,
  });

  const campaign = await prisma.marketingCampaign.create({ data, include: campaignInclude });
  await recordActivity({
    actorId: access.employeeId,
    businessId: campaign.businessId,
    action: "CREATE",
    targetType: "MarketingCampaign",
    targetId: campaign.id,
    metadata: { name: campaign.name },
  });
  return campaign;
}

export async function updateMarketingCampaign(ctx: MarketingRequestContext, id: string, input: Partial<UpdateCampaignInput>) {
  const access = await resolveAccess(ctx);
  const existing = await ensureScopedCampaign(id, access);
  if (!canManage(access) && existing.createdById !== access.employeeId && existing.assignedToId !== access.employeeId) {
    throw new ApiError(403, "You can update only assigned marketing campaigns");
  }
  if (!canManage(access) && "assignedToId" in input) {
    throw new ApiError(403, "Only managers can reassign marketing campaigns");
  }
  assertTeamInScope(access, input.teamId as string | null | undefined);
  assertEmployeeInScope(access, input.assignedToId as string | null | undefined);

  const campaign = await prisma.marketingCampaign.update({
    where: { id },
    data: normalizeCreateCampaign(input as Partial<CreateCampaignInput>),
    include: campaignInclude,
  });
  await recordActivity({
    actorId: access.employeeId,
    businessId: campaign.businessId,
    action: "UPDATE",
    targetType: "MarketingCampaign",
    targetId: campaign.id,
  });
  return campaign;
}

export async function listMarketingTasks(ctx: MarketingRequestContext) {
  const access = await resolveAccess(ctx);
  return prisma.marketingTask.findMany({
    where: scopedWhere(access, "task"),
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });
}

/** Team members the caller may assign a marketing task to ([] for execs/interns). */
export async function listMarketingAssignableUsers(ctx: MarketingRequestContext) {
  const access = await resolveAccess(ctx);
  return getAssignableSubordinates(access.employeeId);
}

export async function getMarketingTask(ctx: MarketingRequestContext, id: string) {
  const access = await resolveAccess(ctx);
  const task = await prisma.marketingTask.findFirst({
    where: { id, ...scopedWhere(access, "task") },
    include: taskInclude,
  });
  if (!task) throw new ApiError(404, "Marketing task not found");
  return task;
}

export async function createMarketingTask(ctx: MarketingRequestContext, input: Partial<CreateTaskInput>) {
  const access = await resolveAccess(ctx);
  assertBusinessInScope(access, String(input.businessId));
  assertTeamInScope(access, input.teamId as string | null | undefined);

  // Tasks may only be assigned to the caller's team members (tier below them);
  // everyone — including executives/interns — can create self-assigned tasks.
  const requestedAssignee = input.assignedToId ? String(input.assignedToId) : access.employeeId;
  await assertAssignable(access, requestedAssignee);

  const task = await prisma.marketingTask.create({
    data: {
      ...input,
      organizationId: access.organizationId,
      createdById: access.employeeId,
      assignedToId: requestedAssignee,
      status: input.status ?? MarketingTaskStatus.TODO,
    } as CreateTaskInput,
    include: taskInclude,
  });
  await recordActivity({
    actorId: access.employeeId,
    businessId: task.businessId,
    action: "CREATE",
    targetType: "MarketingTask",
    targetId: task.id,
    metadata: { assignedToId: task.assignedToId },
  });
  return task;
}

export async function updateMarketingTask(ctx: MarketingRequestContext, id: string, input: Partial<UpdateTaskInput>) {
  const access = await resolveAccess(ctx);
  const existing = await ensureScopedTask(id, access);
  if (!canManage(access) && existing.assignedToId !== access.employeeId) {
    throw new ApiError(403, "You can update only assigned marketing tasks");
  }
  if (!canManage(access) && ("assignedToId" in input || "teamId" in input || "campaignId" in input)) {
    throw new ApiError(403, "Only managers can reassign or move marketing tasks");
  }
  assertTeamInScope(access, input.teamId as string | null | undefined);
  // Reassignment is restricted to the caller's team members (tier below them).
  if ("assignedToId" in input && input.assignedToId != null && input.assignedToId !== existing.assignedToId) {
    await assertAssignable(access, String(input.assignedToId));
  }

  const status = input.status as MarketingTaskStatus | undefined;
  const data = {
    ...input,
    completedAt: status === MarketingTaskStatus.COMPLETED ? input.completedAt ?? new Date() : input.completedAt,
  };
  const task = await prisma.marketingTask.update({ where: { id }, data, include: taskInclude });
  await recordActivity({
    actorId: access.employeeId,
    businessId: task.businessId,
    action: "UPDATE",
    targetType: "MarketingTask",
    targetId: task.id,
  });
  return task;
}

export async function listMarketingLeads(ctx: MarketingRequestContext) {
  const access = await resolveAccess(ctx);
  return prisma.marketingLead.findMany({
    where: scopedWhere(access, "lead"),
    include: leadInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function createMarketingLead(ctx: MarketingRequestContext, input: Partial<CreateLeadInput>) {
  const access = await resolveAccess(ctx);
  if (!canExecute(access)) throw new ApiError(403, "Marketing executive access is required");
  assertBusinessInScope(access, String(input.businessId));
  assertTeamInScope(access, input.teamId as string | null | undefined);
  assertEmployeeInScope(access, input.assignedToId as string | null | undefined);

  const lead = await prisma.marketingLead.create({
    data: normalizeCreateLead({
      ...input,
      organizationId: access.organizationId,
      createdById: access.employeeId,
      assignedToId: canManage(access) ? input.assignedToId ?? access.employeeId : access.employeeId,
      leadScore: marketingLeadScore(input),
    }),
    include: leadInclude,
  });
  await recordActivity({
    actorId: access.employeeId,
    businessId: lead.businessId,
    action: "CREATE",
    targetType: "MarketingLead",
    targetId: lead.id,
    metadata: { source: lead.source },
  });
  return lead;
}

export async function updateMarketingLead(ctx: MarketingRequestContext, id: string, input: Partial<UpdateLeadInput>) {
  const access = await resolveAccess(ctx);
  const existing = await ensureScopedLead(id, access);
  if (!canManage(access) && existing.assignedToId !== access.employeeId && existing.createdById !== access.employeeId) {
    throw new ApiError(403, "You can update only assigned marketing leads");
  }
  if (!canManage(access) && "assignedToId" in input) {
    throw new ApiError(403, "Only managers can reassign marketing leads");
  }
  assertTeamInScope(access, input.teamId as string | null | undefined);
  assertEmployeeInScope(access, input.assignedToId as string | null | undefined);

  const data = normalizeCreateLead(input as Partial<CreateLeadInput>);
  if (input.status === MarketingLeadStatus.CONVERTED && !input.convertedAt) {
    data.convertedAt = new Date();
  }
  // Re-derive the score from the merged (existing + incoming) capture fields.
  data.leadScore = marketingLeadScore({ ...existing, ...input } as Parameters<typeof marketingLeadScore>[0]);
  const lead = await prisma.marketingLead.update({ where: { id }, data, include: leadInclude });
  await recordActivity({
    actorId: access.employeeId,
    businessId: lead.businessId,
    action: "UPDATE",
    targetType: "MarketingLead",
    targetId: lead.id,
  });
  return lead;
}

/**
 * Phase 1 Marketing→Sales handoff. Promotes a MarketingLead into the sales
 * pipeline: creates a linked SalesLead (assigned to a Sales Executive that is
 * within the promoter's scope) and marks the marketing lead CONVERTED — both in
 * a single transaction so the chain can never be left half-formed. Records
 * ASSIGNMENT_CHANGE / STATUS_CHANGE on both entities for the ownership history.
 */
export async function promoteMarketingLeadToSales(
  ctx: MarketingRequestContext,
  marketingLeadId: string,
  input: { assignedToId: string; teamId?: string | null; verticalId?: string | null },
) {
  const access = await resolveAccess(ctx);
  if (!canExecute(access)) {
    throw new ApiError(403, "Marketing executive access is required to promote leads");
  }

  const mLead = await ensureScopedLead(marketingLeadId, access);

  // Idempotency: a marketing lead can be promoted at most once.
  if (mLead.status === MarketingLeadStatus.CONVERTED) {
    throw new ApiError(409, "Marketing lead is already converted");
  }
  const alreadyPromoted = await prisma.salesLead.findUnique({
    where: { marketingLeadId },
    select: { id: true },
  });
  if (alreadyPromoted) {
    throw new ApiError(409, "Marketing lead has already been promoted to sales");
  }

  // Receiving sales executive must be within the promoter's scope (per policy)
  // and an active employee in the lead's own business.
  assertEmployeeInScope(access, input.assignedToId);
  const assignee = await prisma.employee.findFirst({
    where: { id: input.assignedToId, isActive: true, businessId: mLead.businessId },
    select: { id: true },
  });
  if (!assignee) {
    throw new ApiError(400, "Assigned sales executive must be an active employee in the lead's business");
  }
  assertTeamInScope(access, input.teamId ?? mLead.teamId ?? undefined);

  const salesLead = await prisma.$transaction(async (tx) => {
    let created;
    // Retry only on leadCode collisions (mirrors createSalesLead); a
    // marketingLeadId collision means a concurrent promote already won.
    for (let attempt = 0; ; attempt++) {
      try {
        created = await tx.salesLead.create({
          data: {
            leadCode:       await nextLeadCode(tx),
            organizationId: access.organizationId,
            businessId:     mLead.businessId,
            teamId:         input.teamId ?? mLead.teamId ?? null,
            verticalId:     input.verticalId ?? mLead.verticalId ?? null,
            name:           mLead.name,
            email:          mLead.email,
            phone:          mLead.phone,
            source:         mLead.source,
            estimatedValue: mLead.estimatedValue,
            status:         SalesLeadStatus.NEW,
            createdById:    access.employeeId,
            assignedToId:   input.assignedToId,
            marketingLeadId: mLead.id,
            // Carry the synced capture fields through to Sales (Phase 6).
            company:                   mLead.company,
            whatsappNumber:            mLead.whatsappNumber,
            countryOfResidence:        mLead.countryOfResidence,
            nationality:               mLead.nationality,
            visaCategory:              mLead.visaCategory,
            interestedVisa:            mLead.interestedVisa,
            currentStatus:             mLead.currentStatus,
            education:                 mLead.education,
            workExperienceYears:       mLead.workExperienceYears,
            budgetAvailable:           mLead.budgetAvailable,
            expectedInvestment:        mLead.expectedInvestment,
            consultationRequired:      mLead.consultationRequired ?? false,
            consultationDate:          mLead.consultationDate,
            ...(mLead.priorityLevel ? { priorityLevel: mLead.priorityLevel } : {}),
            ...(mLead.urgencyLevel  ? { urgencyLevel:  mLead.urgencyLevel  } : {}),
            ...(mLead.priority      ? { priority:      mLead.priority      } : {}),
            familyImmigrationRequired: mLead.familyImmigrationRequired ?? false,
            leadScore:      computeLeadScore({
              priority:                  mLead.priority ?? undefined,
              urgencyLevel:              mLead.urgencyLevel ?? undefined,
              budgetAvailable:           mLead.budgetAvailable,
              expectedInvestment:        mLead.expectedInvestment,
              workExperienceYears:       mLead.workExperienceYears ?? undefined,
              consultationRequired:      mLead.consultationRequired ?? undefined,
              familyImmigrationRequired: mLead.familyImmigrationRequired ?? undefined,
              status:                    SalesLeadStatus.NEW,
            }),
          },
          include: { assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } } },
        });
        break;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          const target = err.meta?.target as string[] | string | undefined;
          const hitLeadCode = Array.isArray(target)
            ? target.includes("leadCode")
            : target === "leadCode" || (typeof target === "string" && target.includes("leadCode"));
          if (hitLeadCode && attempt < 5) continue;
          throw new ApiError(409, "Marketing lead has already been promoted to sales");
        }
        throw err;
      }
    }

    await tx.marketingLead.update({
      where: { id: mLead.id },
      data: { status: MarketingLeadStatus.CONVERTED, convertedAt: new Date() },
    });

    // First link of the ownership chain: Marketing owner → Sales executive.
    await recordAssignmentHistory(
      {
        leadId:         created.id,
        reason:         "PROMOTED_FROM_MARKETING",
        fromEmployeeId: mLead.assignedToId ?? mLead.createdById,
        toEmployeeId:   input.assignedToId,
        changedById:    access.employeeId,
        note:           `Promoted from marketing lead ${mLead.id}`,
      },
      tx,
    );
    // Open the lifecycle trail at NEW.
    await recordStatusHistory(
      {
        leadId:      created.id,
        toStatus:    created.status,
        changedById: access.employeeId,
        note:        `Promoted from marketing lead ${mLead.id}`,
      },
      tx,
    );

    return created;
  });

  // Ownership-chain events (best-effort; outside the transaction).
  await recordActivity({
    actorId: access.employeeId,
    businessId: salesLead.businessId,
    action: "ASSIGNMENT_CHANGE",
    targetType: "SalesLead",
    targetId: salesLead.id,
    metadata: {
      promotedFromMarketingLeadId: mLead.id,
      assignedToId: input.assignedToId,
      source: mLead.source,
    },
  });
  await recordActivity({
    actorId: access.employeeId,
    businessId: mLead.businessId,
    action: "STATUS_CHANGE",
    targetType: "MarketingLead",
    targetId: mLead.id,
    metadata: { status: MarketingLeadStatus.CONVERTED, promotedToSalesLeadId: salesLead.id },
  });
  await recordAudit({
    actorId: access.employeeId,
    businessId: salesLead.businessId,
    action: "ASSIGNMENT_CHANGE",
    entityType: "SalesLead",
    entityName: salesLead.name,
    entityId: salesLead.id,
    before: null,
    after: salesLead,
  });

  return salesLead;
}

export async function listMarketingActivities(ctx: MarketingRequestContext) {
  const access = await resolveAccess(ctx);
  return prisma.marketingActivity.findMany({
    where: scopedWhere(access, "activity"),
    include: activityInclude,
    orderBy: { reportDate: "desc" },
  });
}

export async function createMarketingActivity(ctx: MarketingRequestContext, input: Partial<CreateActivityInput>) {
  const access = await resolveAccess(ctx);
  assertBusinessInScope(access, String(input.businessId));
  assertTeamInScope(access, input.teamId as string | null | undefined);

  const activity = await prisma.marketingActivity.create({
    data: {
      ...input,
      organizationId: access.organizationId,
      actorId: access.employeeId,
      type: input.type ?? MarketingActivityType.OTHER,
      metadata: input.metadata as Prisma.InputJsonValue,
    } as CreateActivityInput,
    include: activityInclude,
  });
  await recordActivity({
    actorId: access.employeeId,
    businessId: activity.businessId,
    action: "CREATE",
    targetType: "MarketingActivity",
    targetId: activity.id,
    metadata: { type: activity.type },
  });
  return activity;
}

export async function updateMarketingActivity(ctx: MarketingRequestContext, id: string, input: Partial<UpdateActivityInput>) {
  const access = await resolveAccess(ctx);
  const existing = await ensureScopedActivity(id, access);
  if (!canManage(access) && existing.actorId !== access.employeeId) {
    throw new ApiError(403, "You can update only your own marketing reports");
  }
  assertTeamInScope(access, input.teamId as string | null | undefined);

  return prisma.marketingActivity.update({
    where: { id },
    data: { ...input, metadata: input.metadata as Prisma.InputJsonValue },
    include: activityInclude,
  });
}

export async function listMarketingKPIs(ctx: MarketingRequestContext) {
  const access = await resolveAccess(ctx);
  return prisma.marketingKPI.findMany({
    where: scopedWhere(access, "kpi"),
    include: kpiInclude,
    orderBy: { periodEnd: "desc" },
  });
}

export async function createMarketingKPI(ctx: MarketingRequestContext, input: Partial<CreateKPIInput>) {
  const access = await resolveAccess(ctx);
  assertMarketingManager(access);
  assertBusinessInScope(access, String(input.businessId));
  assertTeamInScope(access, input.teamId as string | null | undefined);

  return prisma.marketingKPI.create({
    data: normalizeCreateKPI({ ...input, organizationId: access.organizationId }),
    include: kpiInclude,
  });
}

export async function updateMarketingKPI(ctx: MarketingRequestContext, id: string, input: Partial<UpdateKPIInput>) {
  const access = await resolveAccess(ctx);
  assertMarketingManager(access);
  await ensureScopedKPI(id, access);
  assertTeamInScope(access, input.teamId as string | null | undefined);
  assertEmployeeInScope(access, input.employeeId as string | null | undefined);

  return prisma.marketingKPI.update({
    where: { id },
    data: normalizeCreateKPI(input as Partial<CreateKPIInput>),
    include: kpiInclude,
  });
}

export async function getMarketingManagerDashboard(ctx: MarketingRequestContext) {
  const access = await resolveAccess(ctx);
  assertMarketingManager(access);
  const where = scopedWhere(access, "campaign");
  const taskWhere = scopedWhere(access, "task");
  const leadWhere = scopedWhere(access, "lead");

  const [activeCampaigns, completedCampaigns, totalCampaigns, leadsGenerated, pendingTasks, completedTasks, teamActivity, budgetRows] = await Promise.all([
    prisma.marketingCampaign.count({ where: { ...where, status: MarketingCampaignStatus.ACTIVE } }),
    prisma.marketingCampaign.count({ where: { ...where, status: MarketingCampaignStatus.COMPLETED } }),
    prisma.marketingCampaign.count({ where }),
    prisma.marketingLead.count({ where: leadWhere }),
    prisma.marketingTask.count({ where: { ...taskWhere, status: { in: [MarketingTaskStatus.TODO, MarketingTaskStatus.IN_PROGRESS, MarketingTaskStatus.BLOCKED] } } }),
    prisma.marketingTask.count({ where: { ...taskWhere, status: MarketingTaskStatus.COMPLETED } }),
    prisma.marketingActivity.count({ where: scopedWhere(access, "activity") }),
    prisma.marketingCampaign.findMany({ where, select: { budget: true, budgetSpent: true } }),
  ]);

  const budget = budgetRows.reduce(
    (acc, row) => ({
      allocated: acc.allocated + Number(row.budget ?? 0),
      spent: acc.spent + Number(row.budgetSpent ?? 0),
    }),
    { allocated: 0, spent: 0 },
  );

  return {
    activeCampaigns,
    campaignSuccessRate: totalCampaigns === 0 ? 0 : completedCampaigns / totalCampaigns,
    leadsGenerated,
    teamProductivity: {
      completedTasks,
      activityReports: teamActivity,
    },
    pendingTasks,
    budgetUtilization: {
      ...budget,
      utilizationRate: budget.allocated === 0 ? 0 : budget.spent / budget.allocated,
    },
  };
}

export async function getMarketingExecutiveDashboard(ctx: MarketingRequestContext) {
  const access = await resolveAccess(ctx);
  if (!canExecute(access)) throw new ApiError(403, "Marketing executive access is required");
  const own = { organizationId: access.organizationId, businessId: { in: access.scope.visibleBusinesses } };
  const [assignedCampaigns, assignedTasks, dailyReports, personalKPIs] = await Promise.all([
    prisma.marketingCampaign.findMany({ where: { ...own, OR: [{ assignedToId: access.employeeId }, { createdById: access.employeeId }] }, include: campaignInclude, orderBy: { createdAt: "desc" } }),
    prisma.marketingTask.findMany({ where: { ...own, assignedToId: access.employeeId }, include: taskInclude, orderBy: { dueDate: "asc" } }),
    prisma.marketingActivity.findMany({ where: { ...own, actorId: access.employeeId }, include: activityInclude, orderBy: { reportDate: "desc" }, take: 30 }),
    prisma.marketingKPI.findMany({ where: { ...own, employeeId: access.employeeId }, include: kpiInclude, orderBy: { periodEnd: "desc" } }),
  ]);
  return { assignedCampaigns, assignedTasks, dailyReports, personalKPIs };
}

export async function getMarketingInternDashboard(ctx: MarketingRequestContext) {
  const access = await resolveAccess(ctx);
  const own = { organizationId: access.organizationId, businessId: { in: access.scope.visibleBusinesses } };
  const [assignedTasks, completedTasks, dailyActivityLog] = await Promise.all([
    prisma.marketingTask.findMany({ where: { ...own, assignedToId: access.employeeId }, include: taskInclude, orderBy: { dueDate: "asc" } }),
    prisma.marketingTask.count({ where: { ...own, assignedToId: access.employeeId, status: MarketingTaskStatus.COMPLETED } }),
    prisma.marketingActivity.findMany({ where: { ...own, actorId: access.employeeId }, include: activityInclude, orderBy: { reportDate: "desc" }, take: 30 }),
  ]);
  return { assignedTasks, completedTasks, dailyActivityLog };
}

export async function deleteMarketingCampaign(ctx: MarketingRequestContext, id: string) {
  const access = await resolveAccess(ctx);
  assertMarketingManager(access);
  const existing = await ensureScopedCampaign(id, access);
  await prisma.marketingCampaign.delete({ where: { id: existing.id } });
  await recordActivity({
    actorId: access.employeeId,
    businessId: existing.businessId,
    action: "DELETE",
    targetType: "MarketingCampaign",
    targetId: existing.id,
  });
}

export async function deleteMarketingTask(ctx: MarketingRequestContext, id: string) {
  const access = await resolveAccess(ctx);
  const existing = await ensureScopedTask(id, access);
  if (!canManage(access) && existing.createdById !== access.employeeId) {
    throw new ApiError(403, "You can delete only your own created marketing tasks");
  }
  await prisma.marketingTask.delete({ where: { id: existing.id } });
  await recordActivity({
    actorId: access.employeeId,
    businessId: existing.businessId,
    action: "DELETE",
    targetType: "MarketingTask",
    targetId: existing.id,
  });
}

export async function deleteMarketingLead(ctx: MarketingRequestContext, id: string) {
  const access = await resolveAccess(ctx);
  const existing = await ensureScopedLead(id, access);
  if (!canManage(access) && existing.createdById !== access.employeeId) {
    throw new ApiError(403, "You can delete only your own created marketing leads");
  }
  await prisma.marketingLead.delete({ where: { id: existing.id } });
  await recordActivity({
    actorId: access.employeeId,
    businessId: existing.businessId,
    action: "DELETE",
    targetType: "MarketingLead",
    targetId: existing.id,
  });
}

