import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock prisma client used by services
vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    employee: { findUnique: vi.fn() },
    perspective: { deleteMany: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

// Mock hierarchy service helpers
vi.mock("../src/services/hierarchy.service.js", () => ({
  isDescendantOf: vi.fn(),
  getDescendants: vi.fn(),
}));

import { switchPerspective } from "../src/services/perspective.service.js";
import { prisma } from "../src/config/prisma.js";
import { isDescendantOf } from "../src/services/hierarchy.service.js";

describe("Perspective Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows switching to a descendant", async () => {
    // arrange
    (prisma.employee.findUnique as any).mockResolvedValueOnce({
      id: "viewer1",
      businessId: "b1",
    });
    (prisma.employee.findUnique as any).mockResolvedValueOnce({
      id: "target1",
      businessId: "b1",
    });
    (isDescendantOf as any).mockResolvedValue(true);
    (prisma.perspective.deleteMany as any).mockResolvedValue({ count: 0 });
    (prisma.perspective.create as any).mockResolvedValue({
      id: "p1",
      userId: "viewer1",
      currentPerspectiveId: "target1",
    });

    const result = await switchPerspective("viewer1", "target1");

    expect(result).toMatchObject({
      id: "p1",
      userId: "viewer1",
      currentPerspectiveId: "target1",
    });
    expect(prisma.perspective.deleteMany).toHaveBeenCalledWith({
      where: { userId: "viewer1" },
    });
    expect(prisma.perspective.create).toHaveBeenCalled();
  });

  it("denies switching to non-descendant", async () => {
    (prisma.employee.findUnique as any).mockResolvedValueOnce({
      id: "viewer2",
      businessId: "b1",
    });
    (prisma.employee.findUnique as any).mockResolvedValueOnce({
      id: "target2",
      businessId: "b1",
    });
    (isDescendantOf as any).mockResolvedValue(false);

    await expect(switchPerspective("viewer2", "target2")).rejects.toThrow();
    expect(prisma.perspective.create).not.toHaveBeenCalled();
  });
});
