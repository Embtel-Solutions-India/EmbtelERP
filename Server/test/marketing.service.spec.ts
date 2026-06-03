import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    employee: { findUnique: vi.fn() },
    marketingCampaign: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    marketingTask: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    marketingLead: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    marketingActivity: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    marketingKPI: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../src/services/activity-writer.service.js", () => ({
  recordActivity: vi.fn(),
}));

import { prisma } from "../src/config/prisma.js";
import {
  createMarketingActivity,
  createMarketingCampaign,
  createMarketingKPI,
  createMarketingLead,
  createMarketingTask,
  getMarketingExecutiveDashboard,
  getMarketingInternDashboard,
  getMarketingManagerDashboard,
  listMarketingActivities,
  listMarketingCampaigns,
  listMarketingKPIs,
  listMarketingLeads,
  listMarketingTasks,
  updateMarketingActivity,
  updateMarketingCampaign,
  updateMarketingKPI,
  updateMarketingLead,
  updateMarketingTask,
} from "../src/services/marketing.service.js";

const scope = {
  visibleEmployees: ["manager-1", "exec-1", "intern-1"],
  visibleBusinesses: ["business-1"],
  visibleDepartments: ["dept-1"],
  visibleTeams: ["team-1"],
};

const managerCtx = {
  viewer: {
    id: "manager-1",
    employeeId: "manager-1",
    roleLevel: 2,
    businessId: "business-1",
    organizationId: "org-1",
  },
  scope,
  effectiveUserId: "manager-1",
};

const executiveCtx = {
  viewer: {
    id: "exec-1",
    employeeId: "exec-1",
    roleLevel: 1,
    businessId: "business-1",
    organizationId: "org-1",
  },
  scope,
  effectiveUserId: "exec-1",
};

const internCtx = {
  viewer: {
    id: "intern-1",
    employeeId: "intern-1",
    roleLevel: 0,
    businessId: "business-1",
    organizationId: "org-1",
  },
  scope,
  effectiveUserId: "intern-1",
};

function mockEmployee(id: string, level: number) {
  (prisma.employee.findUnique as any).mockResolvedValue({
    id,
    organizationId: "org-1",
    businessId: "business-1",
    teamId: "team-1",
    role: { level },
    level,
  });
}

describe("Marketing service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists campaigns with organization, business, and perspective scope", async () => {
    mockEmployee("manager-1", 2);
    (prisma.marketingCampaign.findMany as any).mockResolvedValue([]);

    await listMarketingCampaigns(managerCtx as any);

    expect(prisma.marketingCampaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          businessId: { in: ["business-1"] },
          OR: expect.arrayContaining([
            { teamId: { in: ["team-1"] } },
            { assignedToId: { in: ["manager-1", "exec-1", "intern-1"] } },
          ]),
        }),
      }),
    );
  });

  it("allows executives to create only assigned campaigns", async () => {
    mockEmployee("exec-1", 1);
    (prisma.marketingCampaign.create as any).mockResolvedValue({
      id: "campaign-1",
      businessId: "business-1",
      name: "Awareness",
    });

    await createMarketingCampaign(executiveCtx as any, {
      businessId: "business-1",
      teamId: "team-1",
      name: "Awareness",
      channel: "social",
    });

    expect(prisma.marketingCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          createdById: "exec-1",
          assignedToId: "exec-1",
        }),
      }),
    );
  });

  it("prevents executives from reassigning campaigns", async () => {
    mockEmployee("exec-1", 1);
    (prisma.marketingCampaign.findFirst as any).mockResolvedValue({
      id: "campaign-1",
      businessId: "business-1",
      assignedToId: "exec-1",
      createdById: "exec-1",
    });

    await expect(
      updateMarketingCampaign(executiveCtx as any, "campaign-1", {
        assignedToId: "intern-1",
      }),
    ).rejects.toThrow("Only managers can reassign marketing campaigns");
  });

  it("creates manager-assigned tasks", async () => {
    mockEmployee("manager-1", 2);
    (prisma.marketingTask.create as any).mockResolvedValue({
      id: "task-1",
      businessId: "business-1",
      assignedToId: "exec-1",
    });

    await createMarketingTask(managerCtx as any, {
      businessId: "business-1",
      teamId: "team-1",
      assignedToId: "exec-1",
      title: "Post campaign update",
    });

    expect(prisma.marketingTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          createdById: "manager-1",
          assignedToId: "exec-1",
        }),
      }),
    );
  });

  it("lets interns update only assigned tasks", async () => {
    mockEmployee("intern-1", 0);
    (prisma.marketingTask.findFirst as any).mockResolvedValue({
      id: "task-1",
      assignedToId: "intern-1",
    });
    (prisma.marketingTask.update as any).mockResolvedValue({
      id: "task-1",
      businessId: "business-1",
      assignedToId: "intern-1",
    });

    await updateMarketingTask(internCtx as any, "task-1", { status: "COMPLETED" });

    expect(prisma.marketingTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLETED" }),
      }),
    );
  });

  it("lists leads with perspective scope", async () => {
    mockEmployee("manager-1", 2);
    (prisma.marketingLead.findMany as any).mockResolvedValue([]);

    await listMarketingLeads(managerCtx as any);

    expect(prisma.marketingLead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1" }),
      }),
    );
  });

  it("creates executive leads assigned to self", async () => {
    mockEmployee("exec-1", 1);
    (prisma.marketingLead.create as any).mockResolvedValue({
      id: "lead-1",
      businessId: "business-1",
      source: "landing-page",
    });

    await createMarketingLead(executiveCtx as any, {
      businessId: "business-1",
      name: "Prospect",
      source: "landing-page",
    });

    expect(prisma.marketingLead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedToId: "exec-1", createdById: "exec-1" }),
      }),
    );
  });

  it("updates converted leads with convertedAt", async () => {
    mockEmployee("exec-1", 1);
    (prisma.marketingLead.findFirst as any).mockResolvedValue({
      id: "lead-1",
      assignedToId: "exec-1",
      createdById: "exec-1",
    });
    (prisma.marketingLead.update as any).mockResolvedValue({ id: "lead-1", businessId: "business-1" });

    await updateMarketingLead(executiveCtx as any, "lead-1", { status: "CONVERTED" });

    expect(prisma.marketingLead.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ convertedAt: expect.any(Date) }) }),
    );
  });

  it("creates daily activity reports under the actor", async () => {
    mockEmployee("intern-1", 0);
    (prisma.marketingActivity.create as any).mockResolvedValue({
      id: "activity-1",
      businessId: "business-1",
      type: "DAILY_REPORT",
    });

    await createMarketingActivity(internCtx as any, {
      businessId: "business-1",
      type: "DAILY_REPORT",
      title: "Daily report",
    });

    expect(prisma.marketingActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ actorId: "intern-1" }) }),
    );
  });

  it("prevents interns from updating another employee activity", async () => {
    mockEmployee("intern-1", 0);
    (prisma.marketingActivity.findFirst as any).mockResolvedValue({ id: "activity-1", actorId: "exec-1" });

    await expect(
      updateMarketingActivity(internCtx as any, "activity-1", { title: "Changed" }),
    ).rejects.toThrow("You can update only your own marketing reports");
  });

  it("lists activities and KPIs through scoped filters", async () => {
    mockEmployee("manager-1", 2);
    (prisma.marketingActivity.findMany as any).mockResolvedValue([]);
    (prisma.marketingKPI.findMany as any).mockResolvedValue([]);

    await listMarketingActivities(managerCtx as any);
    await listMarketingKPIs(managerCtx as any);

    expect(prisma.marketingActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ businessId: { in: ["business-1"] } }) }),
    );
    expect(prisma.marketingKPI.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }) }),
    );
  });

  it("allows managers to create and update KPIs", async () => {
    mockEmployee("manager-1", 2);
    (prisma.marketingKPI.create as any).mockResolvedValue({ id: "kpi-1" });
    (prisma.marketingKPI.findFirst as any).mockResolvedValue({ id: "kpi-1" });
    (prisma.marketingKPI.update as any).mockResolvedValue({ id: "kpi-1" });

    await createMarketingKPI(managerCtx as any, {
      businessId: "business-1",
      metricType: "LEADS_GENERATED",
      name: "Leads",
      value: 10,
      periodStart: new Date("2026-06-01"),
      periodEnd: new Date("2026-06-30"),
    });
    await updateMarketingKPI(managerCtx as any, "kpi-1", { value: 12 });

    expect(prisma.marketingKPI.create).toHaveBeenCalled();
    expect(prisma.marketingKPI.update).toHaveBeenCalled();
  });

  it("builds manager dashboard metrics", async () => {
    mockEmployee("manager-1", 2);
    (prisma.marketingCampaign.count as any)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(6);
    (prisma.marketingLead.count as any).mockResolvedValue(20);
    (prisma.marketingTask.count as any).mockResolvedValueOnce(4).mockResolvedValueOnce(8);
    (prisma.marketingActivity.count as any).mockResolvedValue(10);
    (prisma.marketingCampaign.findMany as any).mockResolvedValue([
      { budget: 1000, budgetSpent: 250 },
      { budget: 500, budgetSpent: 250 },
    ]);

    const dashboard = await getMarketingManagerDashboard(managerCtx as any);

    expect(dashboard).toMatchObject({
      activeCampaigns: 2,
      campaignSuccessRate: 0.5,
      leadsGenerated: 20,
      pendingTasks: 4,
      budgetUtilization: { allocated: 1500, spent: 500 },
    });
  });

  it("builds executive and intern dashboards", async () => {
    mockEmployee("exec-1", 1);
    (prisma.marketingCampaign.findMany as any).mockResolvedValue([]);
    (prisma.marketingTask.findMany as any).mockResolvedValue([]);
    (prisma.marketingActivity.findMany as any).mockResolvedValue([]);
    (prisma.marketingKPI.findMany as any).mockResolvedValue([]);

    await expect(getMarketingExecutiveDashboard(executiveCtx as any)).resolves.toMatchObject({
      assignedCampaigns: [],
      assignedTasks: [],
      dailyReports: [],
      personalKPIs: [],
    });

    vi.clearAllMocks();
    mockEmployee("intern-1", 0);
    (prisma.marketingTask.findMany as any).mockResolvedValue([]);
    (prisma.marketingTask.count as any).mockResolvedValue(1);
    (prisma.marketingActivity.findMany as any).mockResolvedValue([]);

    await expect(getMarketingInternDashboard(internCtx as any)).resolves.toMatchObject({
      assignedTasks: [],
      completedTasks: 1,
      dailyActivityLog: [],
    });
  });
});
