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
});
