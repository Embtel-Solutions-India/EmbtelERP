import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock service methods used by attachScope
vi.mock("../src/services/scope.service.js", () => ({
  getActivePerspectiveForUser: vi.fn(),
  getDataScope: vi.fn(),
}));

import { attachScope } from "../src/middleware/scope.middleware.js";
import {
  getActivePerspectiveForUser,
  getDataScope,
} from "../src/services/scope.service.js";

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
      currentPerspectiveId: "target1",
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
});
