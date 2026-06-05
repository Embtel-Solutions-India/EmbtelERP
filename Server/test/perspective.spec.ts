import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    employee: { findUnique: vi.fn(), findMany: vi.fn() },
    business: { findUnique: vi.fn(), findMany: vi.fn() },
    vertical: { findMany: vi.fn(), findUnique: vi.fn() },
    team: { findMany: vi.fn() },
    perspectiveSession: { findFirst: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("../src/services/hierarchy.service.js", () => ({
  isDescendantOf: vi.fn(),
  getDescendants: vi.fn(),
  getDescendantIds: vi.fn(),
}));

import {
  switchPerspective,
  validatePerspectiveAccess,
} from "../src/services/perspective.service.js";
import { prisma } from "../src/config/prisma.js";
import { isDescendantOf } from "../src/services/hierarchy.service.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockViewer(overrides: object = {}) {
  (prisma.employee.findUnique as any).mockResolvedValueOnce({
    id: "viewer1",
    businessId: "b1",
    organizationId: "org1",
    role: { level: 4 },
    ...overrides,
  });
}

// ─── Existing behaviour ───────────────────────────────────────────────────────

describe("switchPerspective (existing)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows switching to a descendant EMPLOYEE", async () => {
    // switchPerspective calls employee.findUnique once, then validatePerspectiveAccess calls it again
    mockViewer({ role: { level: 4 } }); // consumed by switchPerspective
    mockViewer({ role: { level: 4 } }); // consumed by validatePerspectiveAccess
    (isDescendantOf as any).mockResolvedValue(true);
    (prisma.perspectiveSession.deleteMany as any).mockResolvedValue({ count: 0 });
    (prisma.perspectiveSession.create as any).mockResolvedValue({
      id: "p1",
      userId: "viewer1",
      perspectiveTargetId: "target1",
    });

    const result = await switchPerspective("viewer1", "EMPLOYEE", "target1");

    expect(result).toMatchObject({ id: "p1", perspectiveTargetId: "target1" });
    expect(prisma.perspectiveSession.deleteMany).toHaveBeenCalledWith({
      where: { userId: "viewer1" },
    });
  });

  it("denies switching to a non-descendant EMPLOYEE", async () => {
    mockViewer();
    (isDescendantOf as any).mockResolvedValue(false);

    await expect(
      switchPerspective("viewer1", "EMPLOYEE", "stranger"),
    ).rejects.toThrow();
    expect(prisma.perspectiveSession.create).not.toHaveBeenCalled();
  });
});

// ─── BUSINESS_OWNER ───────────────────────────────────────────────────────────

describe("validatePerspectiveAccess — BUSINESS_OWNER", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows level 4 to access their own business", async () => {
    mockViewer({ role: { level: 4 } });
    (prisma.business.findUnique as any).mockResolvedValue({ organizationId: "org1" });

    await expect(
      validatePerspectiveAccess("viewer1", "BUSINESS_OWNER", "b1"),
    ).resolves.toBe(true);
  });

  it("allows Super Admin (5) to access any business", async () => {
    mockViewer({ role: { level: 5 } });

    await expect(
      validatePerspectiveAccess("viewer1", "BUSINESS_OWNER", "any-business"),
    ).resolves.toBe(true);
    // Super Admin bypasses before the switch; prisma.business.findUnique not called
  });

  it("denies level 3 (Head) from using BUSINESS_OWNER perspective", async () => {
    mockViewer({ role: { level: 3 } });

    await expect(
      validatePerspectiveAccess("viewer1", "BUSINESS_OWNER", "b1"),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("denies level 4 crossing to another organization's business", async () => {
    mockViewer({ role: { level: 4 } });
    (prisma.business.findUnique as any).mockResolvedValue({ organizationId: "org_other" });

    await expect(
      validatePerspectiveAccess("viewer1", "BUSINESS_OWNER", "b_other"),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 404 when business does not exist", async () => {
    mockViewer({ role: { level: 4 } });
    (prisma.business.findUnique as any).mockResolvedValue(null);

    await expect(
      validatePerspectiveAccess("viewer1", "BUSINESS_OWNER", "ghost"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── MANAGER ─────────────────────────────────────────────────────────────────

describe("validatePerspectiveAccess — MANAGER", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows a manager to use their own MANAGER perspective", async () => {
    mockViewer({ id: "mgr1", role: { level: 2 } });

    await expect(
      validatePerspectiveAccess("mgr1", "MANAGER", "mgr1"),
    ).resolves.toBe(true);
  });

  it("allows a Head to switch to a subordinate manager's perspective", async () => {
    mockViewer({ id: "head1", role: { level: 3 } });
    (isDescendantOf as any).mockResolvedValue(true);

    await expect(
      validatePerspectiveAccess("head1", "MANAGER", "mgr1"),
    ).resolves.toBe(true);
  });

  it("denies access to an unrelated manager's perspective", async () => {
    mockViewer({ id: "mgr2", role: { level: 2 } });
    (isDescendantOf as any).mockResolvedValue(false);

    await expect(
      validatePerspectiveAccess("mgr2", "MANAGER", "mgr_other"),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── INTERN ──────────────────────────────────────────────────────────────────

describe("validatePerspectiveAccess — INTERN", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows an intern to use their own INTERN perspective", async () => {
    mockViewer({ id: "intern1", role: { level: 0 } });

    await expect(
      validatePerspectiveAccess("intern1", "INTERN", "intern1"),
    ).resolves.toBe(true);
  });

  it("allows a manager to view a subordinate intern's perspective", async () => {
    mockViewer({ id: "mgr1", role: { level: 2 } });
    (isDescendantOf as any).mockResolvedValue(true);

    await expect(
      validatePerspectiveAccess("mgr1", "INTERN", "intern1"),
    ).resolves.toBe(true);
  });

  it("denies access to an unrelated intern's perspective", async () => {
    mockViewer({ id: "mgr1", role: { level: 2 } });
    (isDescendantOf as any).mockResolvedValue(false);

    await expect(
      validatePerspectiveAccess("mgr1", "INTERN", "intern_other"),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── HEAD (was in service, was missing from switchSchema) ────────────────────

describe("validatePerspectiveAccess — HEAD", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows access to a head in the same business", async () => {
    mockViewer({ role: { level: 4 } });
    (prisma.employee.findUnique as any).mockResolvedValueOnce({
      businessId: "b1",
      level: 3,
    });

    await expect(
      validatePerspectiveAccess("viewer1", "HEAD", "head1"),
    ).resolves.toBe(true);
  });

  it("denies cross-business access to a head", async () => {
    mockViewer({ businessId: "b1", role: { level: 4 } });
    (prisma.employee.findUnique as any).mockResolvedValueOnce({
      businessId: "b_other",
      level: 3,
    });

    await expect(
      validatePerspectiveAccess("viewer1", "HEAD", "head_other"),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── VERTICAL (was in service, was missing from switchSchema) ────────────────

describe("validatePerspectiveAccess — VERTICAL", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows access to a vertical in the same business", async () => {
    mockViewer({ role: { level: 3 } });
    (prisma.vertical.findUnique as any).mockResolvedValueOnce({ businessId: "b1" });

    await expect(
      validatePerspectiveAccess("viewer1", "VERTICAL", "v1"),
    ).resolves.toBe(true);
  });
});
