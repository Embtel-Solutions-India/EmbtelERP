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
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from "../src/config/prisma.js";
import {
  getHierarchyTree,
  getFullOrganizationTree,
  getBusinessHierarchyTree,
  getNodeAncestors,
  getNodeDescendants,
  isDescendantOf,
} from "../src/services/hierarchy.service.js";

describe("Hierarchy Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getHierarchyTree", () => {
    it("returns null for non-existent employee", async () => {
      (prisma.$queryRaw as any).mockResolvedValue([]);

      const result = await getHierarchyTree("nonexistent");
      expect(result).toBeNull();
    });

    it("builds a tree for an employee with no subordinates", async () => {
      (prisma.$queryRaw as any).mockResolvedValue([{ id: "emp1" }]);
      (prisma.employee.findMany as any).mockResolvedValue([
        {
          id: "emp1",
          firstName: "John",
          lastName: "Doe",
          roleId: "role1",
          reportsToId: null,
          designation: "Intern",
          teamId: null,
          verticalId: null,
          businessId: "b1",
        },
      ]);

      const result = await getHierarchyTree("emp1");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("emp1");
      expect(result!.name).toBe("John Doe");
      expect(result!.children).toHaveLength(0);
    });

    it("builds a tree with children", async () => {
      (prisma.$queryRaw as any).mockResolvedValue([
        { id: "mgr1" },
        { id: "emp1" },
        { id: "emp2" },
      ]);
      (prisma.employee.findMany as any).mockResolvedValue([
        {
          id: "mgr1",
          firstName: "Manager",
          lastName: "One",
          roleId: "role2",
          reportsToId: null,
          designation: "Manager",
          teamId: "t1",
          verticalId: "v1",
          businessId: "b1",
        },
        {
          id: "emp1",
          firstName: "Employee",
          lastName: "One",
          roleId: "role1",
          reportsToId: "mgr1",
          designation: "Executive",
          teamId: "t1",
          verticalId: "v1",
          businessId: "b1",
        },
        {
          id: "emp2",
          firstName: "Employee",
          lastName: "Two",
          roleId: "role1",
          reportsToId: "mgr1",
          designation: "Executive",
          teamId: "t1",
          verticalId: "v1",
          businessId: "b1",
        },
      ]);

      const result = await getHierarchyTree("mgr1");
      expect(result).not.toBeNull();
      expect(result!.children).toHaveLength(2);
      expect(result!.children[0].name).toBe("Employee One");
      expect(result!.children[1].name).toBe("Employee Two");
    });
  });

  describe("getFullOrganizationTree", () => {
    it("returns empty businesses array when no businesses exist", async () => {
      (prisma.business.findMany as any).mockResolvedValue([]);

      const result = await getFullOrganizationTree();
      expect(result.businesses).toHaveLength(0);
    });

    it("returns organization tree with businesses, verticals, and teams", async () => {
      (prisma.business.findMany as any).mockResolvedValue([
        {
          id: "b1",
          name: "Immigration Business",
          code: "IMM",
          isActive: true,
          verticals: [
            {
              id: "v1",
              name: "Sales Vertical",
              code: "SALES",
              isActive: true,
              teams: [
                {
                  id: "t1",
                  name: "Sales Team A",
                  code: "SA",
                  isActive: true,
                  employees: [
                    {
                      id: "emp1",
                      firstName: "Sales",
                      lastName: "Head",
                      designation: "Sales Head",
                      reportsToId: "vm1",
                      roleId: "role2",
                      level: 2,
                    },
                    {
                      id: "emp2",
                      firstName: "Sales",
                      lastName: "Exec",
                      designation: "Sales Executive",
                      reportsToId: "emp1",
                      roleId: "role1",
                      level: 1,
                    },
                  ],
                },
              ],
              employees: [
                {
                  id: "vm1",
                  firstName: "Vertical",
                  lastName: "Manager",
                  designation: "Vertical Manager",
                  reportsToId: "head1",
                  roleId: "role2",
                  level: 2,
                },
              ],
            },
          ],
          employees: [
            {
              id: "head1",
              firstName: "Head",
              lastName: "Immigration",
              designation: "Head of Immigration",
              reportsToId: "owner1",
              roleId: "role3",
              level: 3,
            },
          ],
        },
      ]);

      const result = await getFullOrganizationTree();
      expect(result.businesses).toHaveLength(1);
      expect(result.businesses[0].name).toBe("Immigration Business");
      expect(result.businesses[0].head?.name).toBe("Head Immigration");
      expect(result.businesses[0].verticals).toHaveLength(1);
      expect(result.businesses[0].verticals[0].name).toBe("Sales Vertical");
      expect(result.businesses[0].verticals[0].manager?.name).toBe(
        "Vertical Manager",
      );
      expect(result.businesses[0].verticals[0].teams).toHaveLength(1);
      expect(result.businesses[0].verticals[0].teams[0].name).toBe(
        "Sales Team A",
      );
      expect(result.businesses[0].verticals[0].teams[0].manager?.name).toBe(
        "Sales Head",
      );
      expect(result.businesses[0].verticals[0].teams[0].members).toHaveLength(
        1,
      );
    });
  });

  describe("getBusinessHierarchyTree", () => {
    it("returns null for non-existent business", async () => {
      (prisma.business.findUnique as any).mockResolvedValue(null);

      const result = await getBusinessHierarchyTree("nonexistent");
      expect(result).toBeNull();
    });

    it("returns business tree with verticals and teams", async () => {
      (prisma.business.findUnique as any).mockResolvedValue({
        id: "b1",
        name: "Immigration Business",
        code: "IMM",
        isActive: true,
        verticals: [
          {
            id: "v1",
            name: "Sales Vertical",
            code: "SALES",
            isActive: true,
            teams: [
              {
                id: "t1",
                name: "Sales Team",
                code: "ST",
                isActive: true,
                employees: [
                  {
                    id: "emp1",
                    firstName: "Sales",
                    lastName: "Head",
                    designation: "Sales Head",
                    reportsToId: "vm1",
                    roleId: "role2",
                    level: 2,
                  },
                ],
              },
            ],
            employees: [
              {
                id: "vm1",
                firstName: "Vertical",
                lastName: "Manager",
                designation: "Vertical Manager",
                reportsToId: "head1",
                roleId: "role2",
                level: 2,
              },
            ],
          },
        ],
        employees: [
          {
            id: "head1",
            firstName: "Head",
            lastName: "Immigration",
            designation: "Head of Immigration",
            reportsToId: "owner1",
            roleId: "role3",
            level: 3,
          },
        ],
      });

      const result = await getBusinessHierarchyTree("b1");
      expect(result).not.toBeNull();
      expect(result!.name).toBe("Immigration Business");
      expect(result!.verticals).toHaveLength(1);
      expect(result!.verticals[0].teams).toHaveLength(1);
    });
  });

  describe("getNodeAncestors", () => {
    it("returns empty array for employee with no manager", async () => {
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: "emp1",
        firstName: "John",
        lastName: "Doe",
        designation: "Super Admin",
        reportsToId: null,
        level: 5,
        businessId: "b1",
        verticalId: null,
        teamId: null,
      });

      const result = await getNodeAncestors("emp1");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("John Doe");
    });

    it("returns full ancestor chain", async () => {
      (prisma.employee.findUnique as any)
        .mockResolvedValueOnce({
          id: "intern1",
          firstName: "Intern",
          lastName: "User",
          designation: "Intern",
          reportsToId: "exec1",
          level: 0,
          businessId: "b1",
          verticalId: "v1",
          teamId: "t1",
        })
        .mockResolvedValueOnce({
          id: "exec1",
          firstName: "Executive",
          lastName: "User",
          designation: "Executive",
          reportsToId: "mgr1",
          level: 1,
          businessId: "b1",
          verticalId: "v1",
          teamId: "t1",
        })
        .mockResolvedValueOnce({
          id: "mgr1",
          firstName: "Manager",
          lastName: "User",
          designation: "Manager",
          reportsToId: null,
          level: 2,
          businessId: "b1",
          verticalId: "v1",
          teamId: "t1",
        });

      const result = await getNodeAncestors("intern1");
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("Manager User");
      expect(result[1].name).toBe("Executive User");
      expect(result[2].name).toBe("Intern User");
    });
  });

  describe("isDescendantOf", () => {
    it("returns true when candidate is a descendant", async () => {
      (prisma.$queryRaw as any).mockResolvedValue([
        { id: "desc1" },
        { id: "desc2" },
      ]);

      const result = await isDescendantOf("desc1", "ancestor1");
      expect(result).toBe(true);
    });

    it("returns false when candidate is not a descendant", async () => {
      (prisma.$queryRaw as any).mockResolvedValue([
        { id: "desc1" },
        { id: "desc2" },
      ]);

      const result = await isDescendantOf("notdesc", "ancestor1");
      expect(result).toBe(false);
    });
  });
});
