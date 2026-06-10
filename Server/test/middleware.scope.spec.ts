import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";

// Mock service methods used by attachScope
vi.mock("../src/services/perspective.service.js", () => ({
  getActivePerspectiveForUser: vi.fn(),
}));

vi.mock("../src/services/scope.service.js", () => ({
  getDataScope: vi.fn(),
}));

// Separate prisma mock for the scope-service unit tests below
vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    employee: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    business: { findMany: vi.fn() },
    department: { findMany: vi.fn() },
    team: { findMany: vi.fn() },
    perspectiveSession: { findFirst: vi.fn() },
  },
}));

import { attachScope } from "../src/middleware/scope.middleware.js";
import { getActivePerspectiveForUser } from "../src/services/perspective.service.js";
import { getDataScope } from "../src/services/scope.service.js";

describe("Scope Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attaches viewer, effectiveUser and dataScope", async () => {
    const req: any = { user: { employeeId: "viewer1", id: "u1" } };
    const res: any = {};
    const next = vi.fn();

    (getActivePerspectiveForUser as any).mockResolvedValue({
      userId: "u1",
      perspectiveTargetId: "target1",
    });
    (getDataScope as any).mockResolvedValue({
      visibleEmployees: ["target1"],
      visibleBusinesses: ["b1"],
      visibleDepartments: [],
      visibleTeams: [],
    });

    await attachScope(req, res, next as any);

    expect(req.viewer).toBeDefined();
    expect(req.effectiveUser).toEqual({ id: "target1" });
    expect(req.dataScope).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it("L4 Business Owner: req.scope surfaces all org businesses", async () => {
    const req: any = { user: { employeeId: "owner1", id: "u1" } };
    const res: any = {};
    const next = vi.fn();

    (getActivePerspectiveForUser as any).mockResolvedValue(null);
    // Simulate what buildScope returns for a level-4 viewer:
    // visibleBusinesses = all four org businesses, not just the owner's home business.
    (getDataScope as any).mockResolvedValue({
      visibleEmployees: ["e1", "e2", "e3", "e4"],
      visibleBusinesses: ["b-imm", "b-eval", "b-hr", "b-it"],
      visibleDepartments: [],
      visibleTeams: [],
    });

    await attachScope(req, res, next as any);

    expect(req.scope?.visibleBusinesses).toHaveLength(4);
    expect(req.scope?.visibleBusinesses).toContain("b-imm");
    expect(req.scope?.visibleBusinesses).toContain("b-eval");
    expect(req.scope?.visibleBusinesses).toContain("b-hr");
    expect(req.scope?.visibleBusinesses).toContain("b-it");
    expect(next).toHaveBeenCalled();
  });
});

// ─── Scope Service — unit tests for level-4 org-wide scope ───────────────────
// vi.mock hoists the scope.service mock above all imports, so we must use
// vi.importActual inside a beforeAll to get the real getDataScope while
// still benefiting from the prisma mock below.

import { prisma } from "../src/config/prisma.js";

describe("Scope Service — L4 Business Owner org-wide scope", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let getRealDataScope: (userId: string, perspectiveTargetId: string | null) => Promise<any>;

  beforeAll(async () => {
    const mod = await vi.importActual<typeof import("../src/services/scope.service.js")>(
      "../src/services/scope.service.js",
    );
    getRealDataScope = mod.getDataScope;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all org businesses when Owner has no active perspective", async () => {
    (prisma.employee.findUnique as any).mockResolvedValue({
      id: "owner1",
      businessId: "b-imm",
      organizationId: "org1",
      departmentId: null,
      teamId: null,
      level: 4,
      role: { level: 4 },
    });
    (prisma.perspectiveSession.findFirst as any).mockResolvedValue(null);
    (prisma.business.findMany as any).mockResolvedValue([
      { id: "b-imm" },
      { id: "b-eval" },
      { id: "b-hr" },
      { id: "b-it" },
    ]);
    (prisma.department.findMany as any).mockResolvedValue([]);
    (prisma.team.findMany as any).mockResolvedValue([]);
    (prisma.employee.findMany as any).mockResolvedValue([{ id: "e1" }, { id: "e2" }]);

    const scope = await getRealDataScope("owner1", null);

    expect(scope.visibleBusinesses).toHaveLength(4);
    expect(scope.visibleBusinesses).toContain("b-imm");
    expect(scope.visibleBusinesses).toContain("b-eval");
    expect(scope.visibleBusinesses).toContain("b-hr");
    expect(scope.visibleBusinesses).toContain("b-it");
  });

  it("queries businesses by organizationId, not by the owner's single businessId", async () => {
    (prisma.employee.findUnique as any).mockResolvedValue({
      id: "owner1",
      businessId: "b-imm",
      organizationId: "org1",
      departmentId: null,
      teamId: null,
      level: 4,
      role: { level: 4 },
    });
    (prisma.perspectiveSession.findFirst as any).mockResolvedValue(null);
    (prisma.business.findMany as any).mockResolvedValue([{ id: "b-imm" }, { id: "b-eval" }]);
    (prisma.department.findMany as any).mockResolvedValue([]);
    (prisma.team.findMany as any).mockResolvedValue([]);
    (prisma.employee.findMany as any).mockResolvedValue([]);

    await getRealDataScope("owner1", null);

    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org1" } }),
    );
  });
});
