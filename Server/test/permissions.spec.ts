import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock prisma client
vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    employee: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    business: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    vertical: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    department: {
      findUnique: vi.fn(),
    },
    role: { findFirst: vi.fn() },
    perspectiveSession: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock hierarchy service helpers
vi.mock("../src/services/hierarchy.service.js", () => ({
  isDescendantOf: vi.fn(),
  getDescendants: vi.fn(),
  getDescendantIds: vi.fn(),
}));

import { validatePerspectiveAccess } from "../src/services/perspective.service.js";
import { requirePermission } from "../src/middleware/rbac.middleware.js";
import { prisma } from "../src/config/prisma.js";
import { isDescendantOf } from "../src/services/hierarchy.service.js";

describe("Permission Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Super Admin (Level 5)", () => {
    it("can access any perspective type", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "admin1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 5 },
      });

      const result = await validatePerspectiveAccess(
        "admin1",
        "ORGANIZATION",
        "org1",
      );
      expect(result).toBe(true);
    });

    it("can access any business", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "admin1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 5 },
      });

      const result = await validatePerspectiveAccess(
        "admin1",
        "BUSINESS",
        "b2",
      );
      expect(result).toBe(true);
    });
  });

  describe("Business Owner (Level 4)", () => {
    it("can access own business", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "owner1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 4 },
      });
      (prisma.business.findUnique as any).mockResolvedValue({
        id: "b1",
        organizationId: "org1",
      });

      const result = await validatePerspectiveAccess(
        "owner1",
        "BUSINESS",
        "b1",
      );
      expect(result).toBe(true);
    });

    it("can access own business's vertical", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "owner1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 4 },
      });
      (prisma.vertical.findUnique as any).mockResolvedValue({
        id: "v1",
        businessId: "b1",
      });

      const result = await validatePerspectiveAccess(
        "owner1",
        "VERTICAL",
        "v1",
      );
      expect(result).toBe(true);
    });

    it("can access own business's team", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "owner1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 4 },
      });
      (prisma.team.findUnique as any).mockResolvedValue({
        id: "t1",
        businessId: "b1",
      });

      const result = await validatePerspectiveAccess("owner1", "TEAM", "t1");
      expect(result).toBe(true);
    });

    it("can access own employees", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "owner1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 4 },
      });
      (isDescendantOf as any).mockResolvedValue(true);

      const result = await validatePerspectiveAccess(
        "owner1",
        "EMPLOYEE",
        "emp1",
      );
      expect(result).toBe(true);
    });
  });

  describe("Head (Level 3)", () => {
    it("can access own business", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "head1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 3 },
      });
      (prisma.business.findUnique as any).mockResolvedValue({
        id: "b1",
        organizationId: "org1",
      });

      const result = await validatePerspectiveAccess("head1", "BUSINESS", "b1");
      expect(result).toBe(true);
    });

    it("can access own vertical", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "head1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 3 },
      });
      (prisma.vertical.findUnique as any).mockResolvedValue({
        id: "v1",
        businessId: "b1",
      });

      const result = await validatePerspectiveAccess("head1", "VERTICAL", "v1");
      expect(result).toBe(true);
    });

    it("can access own team", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "head1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 3 },
      });
      (prisma.team.findUnique as any).mockResolvedValue({
        id: "t1",
        businessId: "b1",
        code: "imm-sales",
        name: "Sales Team",
        verticalId: "v1",
      });

      const result = await validatePerspectiveAccess("head1", "TEAM", "t1");
      expect(result).toBe(true);
    });
  });

  describe("Vertical Manager (Level 2)", () => {
    it("can access own vertical", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "vm1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 2 },
      });
      (prisma.vertical.findUnique as any).mockResolvedValue({
        id: "v1",
        businessId: "b1",
      });

      const result = await validatePerspectiveAccess("vm1", "VERTICAL", "v1");
      expect(result).toBe(true);
    });

    it("can access own team", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "vm1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 2 },
      });
      (prisma.team.findUnique as any).mockResolvedValue({
        id: "t1",
        businessId: "b1",
        code: "imm-sales",
        name: "Sales Team",
        verticalId: "v1",
      });

      const result = await validatePerspectiveAccess("vm1", "TEAM", "t1");
      expect(result).toBe(true);
    });

    it("can access own descendants", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "vm1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 2 },
      });
      (isDescendantOf as any).mockResolvedValue(true);

      const result = await validatePerspectiveAccess("vm1", "EMPLOYEE", "emp1");
      expect(result).toBe(true);
    });
  });

  describe("Executive (Level 1)", () => {
    it("can access self", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "exec1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 1 },
      });

      const result = await validatePerspectiveAccess(
        "exec1",
        "EMPLOYEE",
        "exec1",
      );
      expect(result).toBe(true);
    });

    it("can access direct reports", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "exec1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 1 },
      });
      (isDescendantOf as any).mockResolvedValue(true);

      const result = await validatePerspectiveAccess(
        "exec1",
        "EMPLOYEE",
        "intern1",
      );
      expect(result).toBe(true);
    });
  });

  describe("Intern (Level 0)", () => {
    it("can access self only", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "intern1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 0 },
      });

      const result = await validatePerspectiveAccess(
        "intern1",
        "EMPLOYEE",
        "intern1",
      );
      expect(result).toBe(true);
    });

    it("cannot access other employees", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "intern1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 0 },
      });
      (isDescendantOf as any).mockResolvedValue(false);

      await expect(
        validatePerspectiveAccess("intern1", "EMPLOYEE", "other1"),
      ).rejects.toThrow("Access denied");
    });
  });

  describe("Cross-Business Access Denial", () => {
    it("denies business owner from accessing other business", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "owner1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 4 },
      });
      (prisma.business.findUnique as any).mockResolvedValue({
        id: "b2",
        organizationId: "org2",
      });

      await expect(
        validatePerspectiveAccess("owner1", "BUSINESS", "b2"),
      ).rejects.toThrow("Access denied");
    });

    it("denies vertical access from different business", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "vm1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 2 },
      });
      (prisma.vertical.findUnique as any).mockResolvedValue({
        id: "v2",
        businessId: "b2",
      });

      await expect(
        validatePerspectiveAccess("vm1", "VERTICAL", "v2"),
      ).rejects.toThrow("Access denied");
    });

    it("denies team access from different business", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "mgr1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 2 },
      });
      (prisma.team.findUnique as any).mockResolvedValue({
        id: "t2",
        businessId: "b2",
        code: "other-sales",
        name: "Sales Team",
        verticalId: "v2",
      });

      await expect(
        validatePerspectiveAccess("mgr1", "TEAM", "t2"),
      ).rejects.toThrow("Access denied");
    });

    it("denies non-descendant employee access", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "mgr1",
        businessId: "b1",
        organizationId: "org1",
        role: { level: 2 },
      });
      (isDescendantOf as any).mockResolvedValue(false);

      await expect(
        validatePerspectiveAccess("mgr1", "EMPLOYEE", "other1"),
      ).rejects.toThrow("Access denied");
    });
  });

  describe("Structural authorization — designation-agnostic access", () => {
    it("blocks cross-business employee access by businessId, not by designation text", async () => {
      // Viewer in b-imm trying to access employee in b-eval.
      // No magic keyword in designation — must be blocked by businessId FK.
      (prisma.employee.findUnique as any)
        .mockResolvedValueOnce({
          id: "emp-imm",
          businessId: "b-imm",
          organizationId: "org1",
          verticalId: null,
          teamId: null,
          role: { level: 3 },
        })
        .mockResolvedValueOnce({
          businessId: "b-eval",
          verticalId: null,
          teamId: null,
          level: 1,
          role: { level: 1 },
        });

      await expect(
        validatePerspectiveAccess("emp-imm", "EMPLOYEE", "emp-eval"),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("restricts L2 viewer to their vertical via verticalId, not designation text", async () => {
      // Viewer has verticalId "v1" but designation is completely arbitrary.
      // Access to an employee in "v2" must be blocked by the verticalId FK.
      (prisma.employee.findUnique as any)
        .mockResolvedValueOnce({
          id: "mgr1",
          businessId: "b1",
          organizationId: "org1",
          verticalId: "v1",
          teamId: null,
          role: { level: 2 },
        })
        .mockResolvedValueOnce({
          businessId: "b1",
          verticalId: "v2",
          teamId: null,
          level: 1,
          role: { level: 1 },
        });

      await expect(
        validatePerspectiveAccess("mgr1", "EMPLOYEE", "emp-other-vert"),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("allows L2 viewer to access employees in the same vertical regardless of designation", async () => {
      (prisma.employee.findUnique as any)
        .mockResolvedValueOnce({
          id: "mgr1",
          businessId: "b1",
          organizationId: "org1",
          verticalId: "v1",
          teamId: null,
          role: { level: 2 },
        })
        .mockResolvedValueOnce({
          businessId: "b1",
          verticalId: "v1",
          teamId: "t1",
          level: 1,
          role: { level: 1 },
        });
      (isDescendantOf as any).mockResolvedValue(true);

      const result = await validatePerspectiveAccess("mgr1", "EMPLOYEE", "emp-same-vert");
      expect(result).toBe(true);
    });

    it("restricts team-scoped L2 viewer to their own team by teamId FK", async () => {
      // Viewer has both verticalId "v1" and teamId "t1".
      // Target is in the same vertical but a different team — must be blocked.
      (prisma.employee.findUnique as any)
        .mockResolvedValueOnce({
          id: "mgr1",
          businessId: "b1",
          organizationId: "org1",
          verticalId: "v1",
          teamId: "t1",
          role: { level: 2 },
        })
        .mockResolvedValueOnce({
          businessId: "b1",
          verticalId: "v1",
          teamId: "t2",
          level: 1,
          role: { level: 1 },
        });

      await expect(
        validatePerspectiveAccess("mgr1", "EMPLOYEE", "emp-other-team"),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe("HR Manager — workforce cross-business read", () => {
    it("can switch to an EMPLOYEE perspective of an employee in another business", async () => {
      (prisma.employee.findUnique as any)
        .mockResolvedValueOnce({
          id: "hr-mgr1",
          businessId: "b-hr",
          organizationId: "org1",
          designation: "HR Manager",
          verticalId: null,
          teamId: null,
          role: { level: 3 },
        }) // viewer
        .mockResolvedValueOnce({ level: 1 }); // target level check in workforce bypass
      // isWorkforceManager: role.findFirst for workforce:read:org + business.findUnique for hr-dept
      (prisma.role as any).findFirst.mockResolvedValueOnce({
        permissions: [{ permission: { code: "workforce:read:org" } }],
      });
      (prisma.business.findUnique as any).mockResolvedValueOnce({ code: "hr-dept" });

      const result = await validatePerspectiveAccess("hr-mgr1", "EMPLOYEE", "imm-exec1");
      expect(result).toBe(true);
    });

    it("cannot switch to a BUSINESS perspective of another business", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "hr-mgr1",
        businessId: "b-hr",
        organizationId: "org1",
        designation: "HR Manager",
        verticalId: null,
        teamId: null,
        role: { level: 3 },
      });

      await expect(
        validatePerspectiveAccess("hr-mgr1", "BUSINESS", "b-imm"),
      ).rejects.toThrow("Access denied");
    });

    it("cannot switch to a TEAM perspective in another business", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "hr-mgr1",
        businessId: "b-hr",
        organizationId: "org1",
        designation: "HR Manager",
        verticalId: null,
        teamId: null,
        role: { level: 3 },
      });
      (prisma.team.findUnique as any).mockResolvedValue({
        id: "t-imm1",
        businessId: "b-imm",
        code: "imm-sales",
        name: "Immigration Sales",
        verticalId: "v-imm",
      });

      await expect(
        validatePerspectiveAccess("hr-mgr1", "TEAM", "t-imm1"),
      ).rejects.toThrow("Access denied");
    });

    it("workforce:read:org required — HR intern lacks the permission and is denied", async () => {
      // HR intern is in the HR business but their role (level 0) has no workforce:read:org.
      // They fall through to validateScopeBoundaries which blocks cross-business access.
      (prisma.employee.findUnique as any)
        .mockResolvedValueOnce({
          id: "hr-intern1",
          businessId: "b-hr",
          organizationId: "org1",
          verticalId: null,
          teamId: null,
          role: { level: 0 },
        }) // viewer
        .mockResolvedValueOnce({
          businessId: "b-imm",
          verticalId: null,
          teamId: null,
          level: 0,
          role: { level: 0 },
        }); // validateScopeBoundaries target
      // isWorkforceManager: intern role has no workforce:read:org
      (prisma.role as any).findFirst.mockResolvedValueOnce({ permissions: [] });
      (prisma.business.findUnique as any).mockResolvedValueOnce({ code: "hr-dept" });

      await expect(
        validatePerspectiveAccess("hr-intern1", "EMPLOYEE", "imm-intern2"),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});

// ─── requirePermission middleware ─────────────────────────────────────────────

describe("requirePermission middleware", () => {
  it("allows a request when the caller holds the required permission", () => {
    const req = { user: { permissions: ["employees:write", "dashboard:org"] } } as any;
    const next = vi.fn();
    requirePermission("employees:write")(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("denies a request when the caller lacks the required permission", () => {
    const req = { user: { permissions: ["dashboard:org"] } } as any;
    const next = vi.fn();
    requirePermission("employees:write")(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it("denies when req.user is absent (unauthenticated)", () => {
    const req = {} as any;
    const next = vi.fn();
    requirePermission("audit:read")(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it("denies when the permissions array is empty", () => {
    const req = { user: { permissions: [] } } as any;
    const next = vi.fn();
    requirePermission("workforce:read:org")(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it("Super Admin with audit:read is allowed through", () => {
    const req = { user: { permissions: ["employees:write", "audit:read", "roles:write", "dashboard:org"] } } as any;
    const next = vi.fn();
    requirePermission("audit:read")(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("Business Owner without audit:read is denied", () => {
    const req = { user: { permissions: ["employees:write", "dashboard:org"] } } as any;
    const next = vi.fn();
    requirePermission("audit:read")(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it("workforce:read:org + HR business allows cross-org read via permission gate", async () => {
    // Viewer is an HR Manager: role carries workforce:read:org, business.code is hr-dept
    (prisma.employee.findUnique as any)
      .mockResolvedValueOnce({
        id: "hr-mgr2",
        businessId: "b-hr",
        organizationId: "org1",
        verticalId: null,
        teamId: null,
        role: { level: 3 },
      })
      .mockResolvedValueOnce({ level: 2 }); // target level check
    (prisma.role as any).findFirst.mockResolvedValueOnce({
      permissions: [{ permission: { code: "workforce:read:org" } }],
    });
    (prisma.business.findUnique as any).mockResolvedValueOnce({ code: "hr-dept" });

    const result = await validatePerspectiveAccess("hr-mgr2", "EMPLOYEE", "mgr-in-imm");
    expect(result).toBe(true);
  });
});
