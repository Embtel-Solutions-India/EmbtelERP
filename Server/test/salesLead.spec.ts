import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@prisma/client", () => ({
  SalesLeadStatus: {
    NEW: "NEW", CONTACTED: "CONTACTED", QUALIFIED: "QUALIFIED",
    PROPOSAL: "PROPOSAL", NEGOTIATION: "NEGOTIATION", WON: "WON", LOST: "LOST",
  },
  Prisma: {
    Decimal: class Decimal {
      constructor(val: unknown) { return val; }
    },
  },
}));

vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    employee:  { findUnique: vi.fn() },
    salesLead: {
      findMany:  vi.fn(),
      findFirst: vi.fn(),
      create:    vi.fn(),
      update:    vi.fn(),
      delete:    vi.fn(),
    },
  },
}));

vi.mock("../src/services/activity-writer.service.js", () => ({
  recordActivity: vi.fn(),
}));

import { prisma } from "../src/config/prisma.js";
import {
  createSalesLead,
  deleteSalesLead,
  listSalesLeads,
  updateSalesLead,
} from "../src/services/salesLead.service.js";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const scope = {
  visibleEmployees:   ["manager-1", "exec-1", "intern-1"],
  visibleBusinesses:  ["biz-1"],
  visibleDepartments: ["dept-1"],
  visibleTeams:       ["team-1"],
};

const managerCtx = {
  viewer:          { id: "manager-1", employeeId: "manager-1", roleLevel: 2, businessId: "biz-1", organizationId: "org-1" },
  scope,
  effectiveUserId: "manager-1",
};

const execCtx = {
  viewer:          { id: "exec-1", employeeId: "exec-1", roleLevel: 1, businessId: "biz-1", organizationId: "org-1" },
  scope,
  effectiveUserId: "exec-1",
};

const internCtx = {
  viewer:          { id: "intern-1", employeeId: "intern-1", roleLevel: 0, businessId: "biz-1", organizationId: "org-1" },
  scope,
  effectiveUserId: "intern-1",
};

function mockEmployee(id: string, level: number) {
  (prisma.employee.findUnique as any).mockResolvedValue({
    id,
    organizationId: "org-1",
    businessId:     "biz-1",
    teamId:         "team-1",
    level,
    role:           { level },
  });
}

const fakeLead = {
  id:             "lead-1",
  organizationId: "org-1",
  businessId:     "biz-1",
  teamId:         "team-1",
  createdById:    "exec-1",
  assignedToId:   "exec-1",
  name:           "Acme Corp",
  company:        "Acme",
  source:         "LinkedIn",
  status:         "NEW",
  priority:       "warm",
  estimatedValue: null,
};

// ─── listSalesLeads ───────────────────────────────────────────────────────────

describe("listSalesLeads", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns perspective-scoped leads for an executive", async () => {
    mockEmployee("exec-1", 1);
    (prisma.salesLead.findMany as any).mockResolvedValue([fakeLead]);

    const result = await listSalesLeads(execCtx);

    expect(result).toEqual([fakeLead]);
    expect(prisma.salesLead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          businessId: { in: ["biz-1"] },
        }),
      }),
    );
  });

  it("scopes to own leads for an executive (not the full team)", async () => {
    mockEmployee("exec-1", 1);
    (prisma.salesLead.findMany as any).mockResolvedValue([]);

    await listSalesLeads(execCtx);

    const callWhere = (prisma.salesLead.findMany as any).mock.calls[0][0].where;
    // Level 1 → OR [assignedToId, createdById] — no teamId filter
    expect(callWhere).toMatchObject({
      OR: expect.arrayContaining([
        { assignedToId: "exec-1" },
        { createdById:  "exec-1" },
      ]),
    });
  });

  it("manager (level 2) sees leads across their team scope", async () => {
    mockEmployee("manager-1", 2);
    (prisma.salesLead.findMany as any).mockResolvedValue([fakeLead]);

    await listSalesLeads(managerCtx);

    const callWhere = (prisma.salesLead.findMany as any).mock.calls[0][0].where;
    // Level 2 → OR [teamId, assignedToId, createdById]
    expect(callWhere).toHaveProperty("OR");
    const or = callWhere.OR as Record<string, unknown>[];
    expect(or.some((c) => "teamId" in c)).toBe(true);
  });
});

// ─── createSalesLead ─────────────────────────────────────────────────────────

describe("createSalesLead", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a lead with correct org, creator, and assignee", async () => {
    mockEmployee("exec-1", 1);
    (prisma.salesLead.create as any).mockResolvedValue({
      ...fakeLead,
      id:            "lead-new",
      createdById:   "exec-1",
      assignedToId:  "exec-1",
    });

    const result = await createSalesLead(execCtx, {
      businessId: "biz-1",
      name:       "Test Lead",
      source:     "Website",
    });

    expect(result.createdById).toBe("exec-1");
    expect(prisma.salesLead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          createdById:    "exec-1",
          // Executive is self-assigned
          assignedToId:   "exec-1",
        }),
      }),
    );
  });

  it("manager can assign the lead to another team member", async () => {
    mockEmployee("manager-1", 2);
    (prisma.salesLead.create as any).mockResolvedValue({
      ...fakeLead,
      assignedToId: "exec-1",
    });

    await createSalesLead(managerCtx, {
      businessId:   "biz-1",
      name:         "Big Deal",
      source:       "Referral",
      assignedToId: "exec-1",
    });

    expect(prisma.salesLead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedToId: "exec-1" }),
      }),
    );
  });

  it("throws 403 for intern (level 0)", async () => {
    mockEmployee("intern-1", 0);

    await expect(
      createSalesLead(internCtx, { businessId: "biz-1", name: "X", source: "Cold Call" }),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(prisma.salesLead.create).not.toHaveBeenCalled();
  });

  it("throws 403 when businessId is outside the scope", async () => {
    mockEmployee("exec-1", 1);

    await expect(
      createSalesLead(execCtx, {
        businessId: "biz-other",
        name:       "Out of Scope",
        source:     "LinkedIn",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── updateSalesLead — status transitions ────────────────────────────────────

describe("updateSalesLead — status transitions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("executive can move their own lead through the pipeline", async () => {
    mockEmployee("exec-1", 1);
    (prisma.salesLead.findFirst as any).mockResolvedValue({
      ...fakeLead,
      assignedToId: "exec-1",
      status:       "CONTACTED",
    });
    (prisma.salesLead.update as any).mockResolvedValue({
      ...fakeLead,
      status: "QUALIFIED",
    });

    const result = await updateSalesLead(execCtx, "lead-1", { status: "QUALIFIED" as any });

    expect(result.status).toBe("QUALIFIED");
    expect(prisma.salesLead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lead-1" },
        data:  expect.objectContaining({ status: "QUALIFIED" }),
      }),
    );
  });

  it("sets convertedAt automatically when status becomes WON", async () => {
    mockEmployee("exec-1", 1);
    (prisma.salesLead.findFirst as any).mockResolvedValue({
      ...fakeLead,
      assignedToId: "exec-1",
      status:       "NEGOTIATION",
    });
    (prisma.salesLead.update as any).mockResolvedValue({
      ...fakeLead,
      status:      "WON",
      convertedAt: new Date(),
    });

    await updateSalesLead(execCtx, "lead-1", { status: "WON" as any });

    const callData = (prisma.salesLead.update as any).mock.calls[0][0].data;
    expect(callData.convertedAt).toBeInstanceOf(Date);
  });

  it("does not overwrite an explicit convertedAt on WON", async () => {
    const explicitDate = new Date("2025-01-15");
    mockEmployee("exec-1", 1);
    (prisma.salesLead.findFirst as any).mockResolvedValue({
      ...fakeLead,
      assignedToId: "exec-1",
    });
    (prisma.salesLead.update as any).mockResolvedValue({
      ...fakeLead,
      status:      "WON",
      convertedAt: explicitDate,
    });

    await updateSalesLead(execCtx, "lead-1", {
      status:      "WON" as any,
      convertedAt: explicitDate,
    });

    const callData = (prisma.salesLead.update as any).mock.calls[0][0].data;
    // Service must NOT overwrite the caller-supplied date with new Date().
    expect(callData.convertedAt).toEqual(explicitDate);
  });

  it("throws 403 when executive tries to reassign a lead", async () => {
    mockEmployee("exec-1", 1);
    (prisma.salesLead.findFirst as any).mockResolvedValue({
      ...fakeLead,
      assignedToId: "exec-1",
    });

    await expect(
      updateSalesLead(execCtx, "lead-1", { assignedToId: "exec-other" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 403 when executive updates a lead not assigned to them", async () => {
    mockEmployee("exec-1", 1);
    (prisma.salesLead.findFirst as any).mockResolvedValue({
      ...fakeLead,
      assignedToId: "exec-other",
      createdById:  "exec-other",
    });

    await expect(
      updateSalesLead(execCtx, "lead-1", { status: "QUALIFIED" as any }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("manager can reassign a lead", async () => {
    mockEmployee("manager-1", 2);
    (prisma.salesLead.findFirst as any).mockResolvedValue({
      ...fakeLead,
      assignedToId: "exec-1",
    });
    (prisma.salesLead.update as any).mockResolvedValue({
      ...fakeLead,
      assignedToId: "exec-2",
    });

    const result = await updateSalesLead(managerCtx, "lead-1", {
      assignedToId: "exec-2",
    });
    expect(result.assignedToId).toBe("exec-2");
  });
});

// ─── deleteSalesLead ─────────────────────────────────────────────────────────

describe("deleteSalesLead", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows manager (level 2) to delete an in-scope lead", async () => {
    mockEmployee("manager-1", 2);
    (prisma.salesLead.findFirst as any).mockResolvedValue(fakeLead);
    (prisma.salesLead.delete as any).mockResolvedValue(fakeLead);

    await deleteSalesLead(managerCtx, "lead-1");

    expect(prisma.salesLead.delete).toHaveBeenCalledWith({ where: { id: "lead-1" } });
  });

  it("throws 403 for executive (level 1)", async () => {
    mockEmployee("exec-1", 1);

    await expect(
      deleteSalesLead(execCtx, "lead-1"),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(prisma.salesLead.delete).not.toHaveBeenCalled();
  });

  it("throws 404 when the lead is not found in scope", async () => {
    mockEmployee("manager-1", 2);
    (prisma.salesLead.findFirst as any).mockResolvedValue(null);

    await expect(
      deleteSalesLead(managerCtx, "ghost-lead"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
