import { MarketingActivityType, MarketingCampaignStatus, MarketingLeadStatus, MarketingTaskStatus, Prisma, } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { recordActivity } from "./activity-writer.service.js";
const campaignInclude = {
    business: true,
    team: true,
    assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
    createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
};
const taskInclude = {
    campaign: true,
    business: true,
    team: true,
    assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
    createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
};
const leadInclude = {
    campaign: true,
    business: true,
    team: true,
    assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
    createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
};
const activityInclude = {
    campaign: true,
    task: true,
    lead: true,
    business: true,
    team: true,
    actor: { select: { id: true, firstName: true, lastName: true, email: true } },
};
const kpiInclude = {
    campaign: true,
    business: true,
    team: true,
    employee: { select: { id: true, firstName: true, lastName: true, email: true } },
};
async function resolveAccess(ctx) {
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
function baseWhere(access) {
    return {
        organizationId: access.organizationId,
        businessId: { in: access.scope.visibleBusinesses },
    };
}
function teamOrEmployeeScope(access, kind) {
    if (access.roleLevel >= 3) {
        return {};
    }
    if (access.roleLevel >= 2) {
        const or = [];
        if (access.scope.visibleTeams.length > 0) {
            or.push({ teamId: { in: access.scope.visibleTeams } });
        }
        if (access.scope.visibleEmployees.length > 0) {
            if (kind === "activity") {
                or.push({ actorId: { in: access.scope.visibleEmployees } });
            }
            else if (kind === "kpi") {
                or.push({ employeeId: { in: access.scope.visibleEmployees } });
            }
            else {
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
function scopedWhere(access, kind) {
    return {
        ...baseWhere(access),
        ...teamOrEmployeeScope(access, kind),
    };
}
function assertBusinessInScope(access, businessId) {
    if (!access.scope.visibleBusinesses.includes(businessId)) {
        throw new ApiError(403, "Business is outside the active perspective scope");
    }
}
function assertTeamInScope(access, teamId) {
    if (!teamId || access.roleLevel >= 3) {
        return;
    }
    if (!access.scope.visibleTeams.includes(teamId)) {
        throw new ApiError(403, "Team is outside the active perspective scope");
    }
}
function assertEmployeeInScope(access, employeeId) {
    if (!employeeId || access.roleLevel >= 4) {
        return;
    }
    if (!access.scope.visibleEmployees.includes(employeeId)) {
        throw new ApiError(403, "Employee is outside the active perspective scope");
    }
}
function canManage(access) {
    return access.roleLevel >= 2;
}
function canExecute(access) {
    return access.roleLevel >= 1;
}
function assertMarketingManager(access) {
    if (!canManage(access)) {
        throw new ApiError(403, "Marketing manager access is required");
    }
}
function normalizeMoney(value) {
    return value === null || value === undefined ? value : new Prisma.Decimal(value);
}
function normalizeCreateCampaign(input) {
    return {
        ...input,
        budget: normalizeMoney(input.budget),
        budgetSpent: normalizeMoney(input.budgetSpent),
    };
}
function normalizeCreateLead(input) {
    return {
        ...input,
        estimatedValue: normalizeMoney(input.estimatedValue),
    };
}
function normalizeCreateKPI(input) {
    return {
        ...input,
        value: normalizeMoney(input.value),
        target: normalizeMoney(input.target),
    };
}
async function ensureScopedCampaign(id, access) {
    const campaign = await prisma.marketingCampaign.findFirst({
        where: { id, ...scopedWhere(access, "campaign") },
    });
    if (!campaign)
        throw new ApiError(404, "Marketing campaign not found");
    return campaign;
}
async function ensureScopedTask(id, access) {
    const task = await prisma.marketingTask.findFirst({
        where: { id, ...scopedWhere(access, "task") },
    });
    if (!task)
        throw new ApiError(404, "Marketing task not found");
    return task;
}
async function ensureScopedLead(id, access) {
    const lead = await prisma.marketingLead.findFirst({
        where: { id, ...scopedWhere(access, "lead") },
    });
    if (!lead)
        throw new ApiError(404, "Marketing lead not found");
    return lead;
}
async function ensureScopedActivity(id, access) {
    const activity = await prisma.marketingActivity.findFirst({
        where: { id, ...scopedWhere(access, "activity") },
    });
    if (!activity)
        throw new ApiError(404, "Marketing activity not found");
    return activity;
}
async function ensureScopedKPI(id, access) {
    const kpi = await prisma.marketingKPI.findFirst({
        where: { id, ...scopedWhere(access, "kpi") },
    });
    if (!kpi)
        throw new ApiError(404, "Marketing KPI not found");
    return kpi;
}
export async function listMarketingCampaigns(ctx) {
    const access = await resolveAccess(ctx);
    return prisma.marketingCampaign.findMany({
        where: scopedWhere(access, "campaign"),
        include: campaignInclude,
        orderBy: { createdAt: "desc" },
    });
}
export async function getMarketingCampaign(ctx, id) {
    const access = await resolveAccess(ctx);
    const campaign = await prisma.marketingCampaign.findFirst({
        where: { id, ...scopedWhere(access, "campaign") },
        include: campaignInclude,
    });
    if (!campaign)
        throw new ApiError(404, "Marketing campaign not found");
    return campaign;
}
export async function createMarketingCampaign(ctx, input) {
    const access = await resolveAccess(ctx);
    if (!canExecute(access))
        throw new ApiError(403, "Marketing executive access is required");
    assertBusinessInScope(access, String(input.businessId));
    assertTeamInScope(access, input.teamId);
    assertEmployeeInScope(access, input.assignedToId);
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
export async function updateMarketingCampaign(ctx, id, input) {
    const access = await resolveAccess(ctx);
    const existing = await ensureScopedCampaign(id, access);
    if (!canManage(access) && existing.createdById !== access.employeeId && existing.assignedToId !== access.employeeId) {
        throw new ApiError(403, "You can update only assigned marketing campaigns");
    }
    if (!canManage(access) && "assignedToId" in input) {
        throw new ApiError(403, "Only managers can reassign marketing campaigns");
    }
    assertTeamInScope(access, input.teamId);
    assertEmployeeInScope(access, input.assignedToId);
    const campaign = await prisma.marketingCampaign.update({
        where: { id },
        data: normalizeCreateCampaign(input),
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
export async function listMarketingTasks(ctx) {
    const access = await resolveAccess(ctx);
    return prisma.marketingTask.findMany({
        where: scopedWhere(access, "task"),
        include: taskInclude,
        orderBy: { createdAt: "desc" },
    });
}
export async function getMarketingTask(ctx, id) {
    const access = await resolveAccess(ctx);
    const task = await prisma.marketingTask.findFirst({
        where: { id, ...scopedWhere(access, "task") },
        include: taskInclude,
    });
    if (!task)
        throw new ApiError(404, "Marketing task not found");
    return task;
}
export async function createMarketingTask(ctx, input) {
    const access = await resolveAccess(ctx);
    assertMarketingManager(access);
    assertBusinessInScope(access, String(input.businessId));
    assertTeamInScope(access, input.teamId);
    assertEmployeeInScope(access, input.assignedToId);
    const task = await prisma.marketingTask.create({
        data: {
            ...input,
            organizationId: access.organizationId,
            createdById: access.employeeId,
            status: input.status ?? MarketingTaskStatus.TODO,
        },
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
export async function updateMarketingTask(ctx, id, input) {
    const access = await resolveAccess(ctx);
    const existing = await ensureScopedTask(id, access);
    if (!canManage(access) && existing.assignedToId !== access.employeeId) {
        throw new ApiError(403, "You can update only assigned marketing tasks");
    }
    if (!canManage(access) && ("assignedToId" in input || "teamId" in input || "campaignId" in input)) {
        throw new ApiError(403, "Only managers can reassign or move marketing tasks");
    }
    assertTeamInScope(access, input.teamId);
    assertEmployeeInScope(access, input.assignedToId);
    const status = input.status;
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
export async function listMarketingLeads(ctx) {
    const access = await resolveAccess(ctx);
    return prisma.marketingLead.findMany({
        where: scopedWhere(access, "lead"),
        include: leadInclude,
        orderBy: { createdAt: "desc" },
    });
}
export async function createMarketingLead(ctx, input) {
    const access = await resolveAccess(ctx);
    if (!canExecute(access))
        throw new ApiError(403, "Marketing executive access is required");
    assertBusinessInScope(access, String(input.businessId));
    assertTeamInScope(access, input.teamId);
    assertEmployeeInScope(access, input.assignedToId);
    const lead = await prisma.marketingLead.create({
        data: normalizeCreateLead({
            ...input,
            organizationId: access.organizationId,
            createdById: access.employeeId,
            assignedToId: canManage(access) ? input.assignedToId ?? access.employeeId : access.employeeId,
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
export async function updateMarketingLead(ctx, id, input) {
    const access = await resolveAccess(ctx);
    const existing = await ensureScopedLead(id, access);
    if (!canManage(access) && existing.assignedToId !== access.employeeId && existing.createdById !== access.employeeId) {
        throw new ApiError(403, "You can update only assigned marketing leads");
    }
    if (!canManage(access) && "assignedToId" in input) {
        throw new ApiError(403, "Only managers can reassign marketing leads");
    }
    assertTeamInScope(access, input.teamId);
    assertEmployeeInScope(access, input.assignedToId);
    const data = normalizeCreateLead(input);
    if (input.status === MarketingLeadStatus.CONVERTED && !input.convertedAt) {
        data.convertedAt = new Date();
    }
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
export async function listMarketingActivities(ctx) {
    const access = await resolveAccess(ctx);
    return prisma.marketingActivity.findMany({
        where: scopedWhere(access, "activity"),
        include: activityInclude,
        orderBy: { reportDate: "desc" },
    });
}
export async function createMarketingActivity(ctx, input) {
    const access = await resolveAccess(ctx);
    assertBusinessInScope(access, String(input.businessId));
    assertTeamInScope(access, input.teamId);
    const activity = await prisma.marketingActivity.create({
        data: {
            ...input,
            organizationId: access.organizationId,
            actorId: access.employeeId,
            type: input.type ?? MarketingActivityType.OTHER,
            metadata: input.metadata,
        },
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
export async function updateMarketingActivity(ctx, id, input) {
    const access = await resolveAccess(ctx);
    const existing = await ensureScopedActivity(id, access);
    if (!canManage(access) && existing.actorId !== access.employeeId) {
        throw new ApiError(403, "You can update only your own marketing reports");
    }
    assertTeamInScope(access, input.teamId);
    return prisma.marketingActivity.update({
        where: { id },
        data: { ...input, metadata: input.metadata },
        include: activityInclude,
    });
}
export async function listMarketingKPIs(ctx) {
    const access = await resolveAccess(ctx);
    return prisma.marketingKPI.findMany({
        where: scopedWhere(access, "kpi"),
        include: kpiInclude,
        orderBy: { periodEnd: "desc" },
    });
}
export async function createMarketingKPI(ctx, input) {
    const access = await resolveAccess(ctx);
    assertMarketingManager(access);
    assertBusinessInScope(access, String(input.businessId));
    assertTeamInScope(access, input.teamId);
    return prisma.marketingKPI.create({
        data: normalizeCreateKPI({ ...input, organizationId: access.organizationId }),
        include: kpiInclude,
    });
}
export async function updateMarketingKPI(ctx, id, input) {
    const access = await resolveAccess(ctx);
    assertMarketingManager(access);
    await ensureScopedKPI(id, access);
    assertTeamInScope(access, input.teamId);
    assertEmployeeInScope(access, input.employeeId);
    return prisma.marketingKPI.update({
        where: { id },
        data: normalizeCreateKPI(input),
        include: kpiInclude,
    });
}
export async function getMarketingManagerDashboard(ctx) {
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
    const budget = budgetRows.reduce((acc, row) => ({
        allocated: acc.allocated + Number(row.budget ?? 0),
        spent: acc.spent + Number(row.budgetSpent ?? 0),
    }), { allocated: 0, spent: 0 });
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
export async function getMarketingExecutiveDashboard(ctx) {
    const access = await resolveAccess(ctx);
    if (!canExecute(access))
        throw new ApiError(403, "Marketing executive access is required");
    const own = { organizationId: access.organizationId, businessId: { in: access.scope.visibleBusinesses } };
    const [assignedCampaigns, assignedTasks, dailyReports, personalKPIs] = await Promise.all([
        prisma.marketingCampaign.findMany({ where: { ...own, OR: [{ assignedToId: access.employeeId }, { createdById: access.employeeId }] }, include: campaignInclude, orderBy: { createdAt: "desc" } }),
        prisma.marketingTask.findMany({ where: { ...own, assignedToId: access.employeeId }, include: taskInclude, orderBy: { dueDate: "asc" } }),
        prisma.marketingActivity.findMany({ where: { ...own, actorId: access.employeeId }, include: activityInclude, orderBy: { reportDate: "desc" }, take: 30 }),
        prisma.marketingKPI.findMany({ where: { ...own, employeeId: access.employeeId }, include: kpiInclude, orderBy: { periodEnd: "desc" } }),
    ]);
    return { assignedCampaigns, assignedTasks, dailyReports, personalKPIs };
}
export async function getMarketingInternDashboard(ctx) {
    const access = await resolveAccess(ctx);
    const own = { organizationId: access.organizationId, businessId: { in: access.scope.visibleBusinesses } };
    const [assignedTasks, completedTasks, dailyActivityLog] = await Promise.all([
        prisma.marketingTask.findMany({ where: { ...own, assignedToId: access.employeeId }, include: taskInclude, orderBy: { dueDate: "asc" } }),
        prisma.marketingTask.count({ where: { ...own, assignedToId: access.employeeId, status: MarketingTaskStatus.COMPLETED } }),
        prisma.marketingActivity.findMany({ where: { ...own, actorId: access.employeeId }, include: activityInclude, orderBy: { reportDate: "desc" }, take: 30 }),
    ]);
    return { assignedTasks, completedTasks, dailyActivityLog };
}
export async function deleteMarketingCampaign(ctx, id) {
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
export async function deleteMarketingTask(ctx, id) {
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
export async function deleteMarketingLead(ctx, id) {
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
