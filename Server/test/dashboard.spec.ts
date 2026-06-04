import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock prisma client
vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    employee: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    business: {
      findUnique: vi.fn(),
    },
    department: {
      findUnique: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    task: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    activity: {
      count: vi.fn(),
    },
    auditLog: {
      count: vi.fn(),
    },
    marketingKPI: {
      findMany: vi.fn(),
    },
  },
}));

// Mock hierarchy service
vi.mock("../src/services/hierarchy.service.js", () => ({
  getDescendantIds: vi.fn(),
}));

import { prisma } from "../src/config/prisma.js";
import {
  getDashboardOverview,
  getDashboardPerformance,
  getDashboardInsights,
  getDashboardTeam,
} from "../src/services/dashboard.service.js";

const mockScope = {
  visibleEmployees: ["emp1", "emp2", "emp3"],
  visibleBusinesses: ["biz1"],
  visibleTeams: ["team1"],
  visibleDepartments: ["dept1"],
};

describe("Dashboard Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDashboardOverview", () => {
    it("returns overview with correct counts", async () => {
      (prisma.employee.count as any).mockResolvedValue(3);
      (prisma.activity.count as any).mockResolvedValue(15);
      (prisma.auditLog.count as any).mockResolvedValue(8);
      (prisma.task.count as any).mockResolvedValueOnce(20); // total
      (prisma.task.count as any).mockResolvedValueOnce(12); // completed
      (prisma.task.count as any).mockResolvedValueOnce(8); // pending
      (prisma.task.count as any).mockResolvedValueOnce(3); // overdue
      (prisma.marketingKPI.findMany as any).mockResolvedValue([]);
      (prisma.employee.findUnique as any).mockResolvedValue({
        role: { level: 4 },
      });

      const result = await getDashboardOverview(mockScope);

      expect(result.employeeCount).toBe(3);
      expect(result.taskCount).toBe(20);
      expect(result.taskCompleted).toBe(12);
      expect(result.taskPending).toBe(8);
      expect(result.taskOverdue).toBe(3);
      expect(result.activityCount).toBe(15);
      expect(result.auditCount).toBe(8);
      expect(result.perspective).toBeNull();
    });

    it("returns business KPIs when perspective is BUSINESS", async () => {
      (prisma.employee.count as any).mockResolvedValue(3);
      (prisma.activity.count as any).mockResolvedValue(10);
      (prisma.auditLog.count as any).mockResolvedValue(5);
      (prisma.task.count as any).mockResolvedValueOnce(15);
      (prisma.task.count as any).mockResolvedValueOnce(8);
      (prisma.task.count as any).mockResolvedValueOnce(7);
      (prisma.task.count as any).mockResolvedValueOnce(2);
      (prisma.marketingKPI.findMany as any).mockResolvedValue([
        { value: 80, target: 100, metricType: "LEADS_GENERATED" },
      ]);
      (prisma.employee.findUnique as any).mockResolvedValue({
        role: { level: 4 },
      });
      (prisma.business.findUnique as any).mockResolvedValue({
        id: "biz1",
        name: "Immigration Business",
        _count: { departments: 4, teams: 3, employees: 10 },
      });

      const result = await getDashboardOverview(mockScope, {
        type: "BUSINESS",
        targetId: "biz1",
      });

      expect(result.businessKpis).not.toBeNull();
      expect(result.businessKpis!.businessName).toBe("Immigration Business");
      expect(result.businessKpis!.departmentCount).toBe(4);
      expect(result.businessKpis!.teamCount).toBe(3);
      expect(result.businessKpis!.employeeCount).toBe(10);
      expect(result.perspective).not.toBeNull();
      expect(result.perspective!.type).toBe("BUSINESS");
      expect(result.perspective!.aggregationLevel).toBe("BUSINESS_OWNER");
    });

    it("returns employee KPIs when perspective is EMPLOYEE", async () => {
      (prisma.employee.count as any).mockResolvedValue(1);
      (prisma.activity.count as any).mockResolvedValue(5);
      (prisma.auditLog.count as any).mockResolvedValue(2);
      // First getTaskStats call (in Promise.all): total, completed, pending, overdue
      (prisma.task.count as any).mockResolvedValueOnce(10);
      (prisma.task.count as any).mockResolvedValueOnce(6);
      (prisma.task.count as any).mockResolvedValueOnce(4);
      (prisma.task.count as any).mockResolvedValueOnce(1);
      // Second getTaskStats call (line 333): total, completed, pending, overdue
      (prisma.task.count as any).mockResolvedValueOnce(10);
      (prisma.task.count as any).mockResolvedValueOnce(6);
      (prisma.task.count as any).mockResolvedValueOnce(4);
      (prisma.task.count as any).mockResolvedValueOnce(1);
      (prisma.marketingKPI.findMany as any).mockResolvedValue([]);
      // Call 1: employee details lookup (line 322)
      (prisma.employee.findUnique as any).mockResolvedValueOnce({
        id: "emp1",
        firstName: "John",
        lastName: "Doe",
        designation: "Executive",
        _count: { tasksOwned: 10 },
      });
      // Call 2: viewer role lookup (line 382)
      (prisma.employee.findUnique as any).mockResolvedValueOnce({
        role: { level: 1 },
      });
      // Call 3: perspective label lookup (line 134 in getPerspectiveLabel)
      (prisma.employee.findUnique as any).mockResolvedValueOnce({
        firstName: "John",
        lastName: "Doe",
      });

      const result = await getDashboardOverview(mockScope, {
        type: "EMPLOYEE",
        targetId: "emp1",
      });

      expect(result.employeeKpis).not.toBeNull();
      expect(result.employeeKpis!.name).toBe("John Doe");
      expect(result.employeeKpis!.designation).toBe("Executive");
      expect(result.employeeKpis!.taskCount).toBe(10);
      expect(result.employeeKpis!.completedTasks).toBe(6);
      expect(result.perspective!.aggregationLevel).toBe("DESCENDANT");
    });
  });

  describe("getDashboardPerformance", () => {
    it("returns performance data grouped by month", async () => {
      (prisma.marketingKPI.findMany as any).mockResolvedValue([
        {
          value: 100,
          target: 200,
          metricType: "LEADS_GENERATED",
          periodStart: new Date("2025-01-01"),
          periodEnd: new Date("2025-02-01"),
        },
        {
          value: 50,
          target: 100,
          metricType: "CAMPAIGN_SUCCESS",
          periodStart: new Date("2025-02-01"),
          periodEnd: new Date("2025-03-01"),
        },
      ]);
      (prisma.task.findMany as any).mockResolvedValue([
        {
          status: "completed",
          createdAt: new Date("2025-01-15"),
          assigneeId: "emp1",
        },
        {
          status: "pending",
          createdAt: new Date("2025-01-20"),
          assigneeId: "emp1",
        },
        {
          status: "completed",
          createdAt: new Date("2025-02-10"),
          assigneeId: "emp2",
        },
      ]);

      const result = await getDashboardPerformance(mockScope);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty("period");
      expect(result[0]).toHaveProperty("revenue");
      expect(result[0]).toHaveProperty("target");
      expect(result[0]).toHaveProperty("leads");
      expect(result[0]).toHaveProperty("conversions");
      expect(result[0]).toHaveProperty("tasksCompleted");
      expect(result[0]).toHaveProperty("tasksCreated");
      expect(result[0]).toHaveProperty("employeeProductivity");
    });
  });

  describe("getDashboardInsights", () => {
    it("generates insights from real data", async () => {
      (prisma.task.count as any).mockResolvedValueOnce(20); // total
      (prisma.task.count as any).mockResolvedValueOnce(15); // completed
      (prisma.task.count as any).mockResolvedValueOnce(5); // pending
      (prisma.task.count as any).mockResolvedValueOnce(2); // overdue
      (prisma.task.findMany as any).mockResolvedValue([
        {
          title: "Review documents",
          assignee: { firstName: "John", lastName: "Doe" },
        },
      ]);
      (prisma.marketingKPI.findMany as any).mockResolvedValue([
        {
          value: 120,
          target: 100,
          metricType: "LEADS_GENERATED",
          name: "Leads Generated",
          team: { name: "Sales Team" },
        },
      ]);
      (prisma.employee.findFirst as any).mockResolvedValue({
        firstName: "Jane",
        lastName: "Smith",
        _count: { tasksOwned: 8 },
      });

      const insights = await getDashboardInsights(mockScope);

      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0]).toHaveProperty("type");
      expect(insights[0]).toHaveProperty("category");
      expect(insights[0]).toHaveProperty("message");
      expect(insights[0]).toHaveProperty("metric");
      expect(insights[0]).toHaveProperty("change");
      expect(insights[0]).toHaveProperty("trend");

      // Should have positive insight for high completion rate
      const positiveInsight = insights.find((i) => i.type === "positive");
      expect(positiveInsight).toBeDefined();
    });

    it("generates negative insight for low completion rate", async () => {
      (prisma.task.count as any).mockResolvedValueOnce(20); // total
      (prisma.task.count as any).mockResolvedValueOnce(5); // completed (25%)
      (prisma.task.count as any).mockResolvedValueOnce(15); // pending
      (prisma.task.count as any).mockResolvedValueOnce(8); // overdue
      (prisma.task.findMany as any).mockResolvedValue([]);
      (prisma.marketingKPI.findMany as any).mockResolvedValue([]);
      (prisma.employee.findFirst as any).mockResolvedValue(null);

      const insights = await getDashboardInsights(mockScope);

      const negativeInsight = insights.find((i) => i.type === "negative");
      expect(negativeInsight).toBeDefined();
      expect(negativeInsight!.category).toBe("Tasks");
    });
  });

  describe("getDashboardTeam", () => {
    it("returns team rankings sorted by completion rate", async () => {
      (prisma.team.findMany as any).mockResolvedValue([
        {
          id: "team1",
          name: "Sales Team",
          _count: { employees: 5, tasks: 10 },
          employees: [{ id: "emp1" }, { id: "emp2" }],
        },
        {
          id: "team2",
          name: "Marketing Team",
          _count: { employees: 3, tasks: 8 },
          employees: [{ id: "emp3" }],
        },
      ]);
      (prisma.task.count as any).mockResolvedValueOnce(10); // team1 total
      (prisma.task.count as any).mockResolvedValueOnce(8); // team1 completed
      (prisma.task.count as any).mockResolvedValueOnce(2); // team1 pending
      (prisma.task.count as any).mockResolvedValueOnce(1); // team1 overdue
      (prisma.marketingKPI.findMany as any).mockResolvedValueOnce([]);
      (prisma.task.count as any).mockResolvedValueOnce(8); // team2 total
      (prisma.task.count as any).mockResolvedValueOnce(4); // team2 completed
      (prisma.task.count as any).mockResolvedValueOnce(4); // team2 pending
      (prisma.task.count as any).mockResolvedValueOnce(2); // team2 overdue
      (prisma.marketingKPI.findMany as any).mockResolvedValueOnce([]);

      const teams = await getDashboardTeam(mockScope);

      expect(teams.length).toBe(2);
      expect(teams[0].ranking).toBe(1); // Sales Team (80% completion)
      expect(teams[1].ranking).toBe(2); // Marketing Team (50% completion)
      expect(teams[0].completionRate).toBeGreaterThan(teams[1].completionRate);
    });
  });
});
