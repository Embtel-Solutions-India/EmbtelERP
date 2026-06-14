import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  requireRole,
  requireEmployeeScope,
  requireBusinessScope,
  requirePermission,
  ROLE_LEVEL,
} from "../middleware/rbac.middleware.js";
import {
  getDescendants,
  getFullOrganizationTree,
  getBusinessHierarchyTree,
  getNodeAncestors,
  getNodeDescendants,
  getManagers,
  getEmployeeOverviewForAdmin,
  getEmployeeTasksForAdmin,
} from "../services/hierarchy.service.js";
import { getAvailablePerspectives } from "../services/perspective.service.js";
import { getHierarchyTreeHandler } from "../controllers/hierarchy.controller.js";

export const hierarchyRouter = Router();

// ── Config/metadata endpoint — only needs auth, not scope ───────────────────
hierarchyRouter.get(
  "/meta",
  authenticate,
  asyncHandler(async (_req, res) => {
    const [businesses, departments, teams, roles] = await Promise.all([
      prisma.business.findMany({ where: { isActive: true } }),
      prisma.department.findMany({ where: { isActive: true } }),
      prisma.team.findMany({ where: { isActive: true } }),
      prisma.role.findMany(),
    ])
    res.json({ data: { businesses, departments, teams, roles } })
  }),
)

hierarchyRouter.use(authenticate, attachScope);

/**
 * GET /hierarchy/tree
 * Returns the full org role tree: Business → Head → Vertical Manager → Manager → Executive → Intern.
 */
hierarchyRouter.get("/tree", asyncHandler(getHierarchyTreeHandler));

/**
 * GET /hierarchy/organization-tree
 * Full org tree — Business Owner (4) and Super Admin (5) only.
 */
hierarchyRouter.get(
  "/organization-tree",
  requireRole(ROLE_LEVEL.BUSINESS_OWNER),
  requirePermission("dashboard:org"),
  asyncHandler(async (_req, res) => {
    const tree = await getFullOrganizationTree();
    res.json({ data: tree });
  }),
);

/**
 * GET /hierarchy/super-admin/organization-tree
 * SUPER ADMIN ONLY — full real org tree for the sidebar Organization Explorer.
 */
hierarchyRouter.get(
  "/super-admin/organization-tree",
  requireRole(ROLE_LEVEL.SUPER_ADMIN),
  asyncHandler(async (_req, res) => {
    const tree = await getFullOrganizationTree();
    res.json({ data: tree });
  }),
);

/**
 * GET /hierarchy/super-admin/employee/:id
 * SUPER ADMIN ONLY — read-only employee overview (real data) for the drill-down.
 */
hierarchyRouter.get(
  "/super-admin/employee/:id",
  requireRole(ROLE_LEVEL.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const data = await getEmployeeOverviewForAdmin(String(req.params.id));
    if (!data) { res.status(404).json({ error: "Employee not found" }); return; }
    res.json({ data });
  }),
);

/**
 * GET /hierarchy/super-admin/employee/:id/tasks?period=daily|weekly|monthly
 * SUPER ADMIN ONLY — task details for an employee, filtered by period.
 */
hierarchyRouter.get(
  "/super-admin/employee/:id/tasks",
  requireRole(ROLE_LEVEL.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const period = String(req.query.period ?? "daily");
    const data = await getEmployeeTasksForAdmin(String(req.params.id), period);
    res.json({ data });
  }),
);

/**
 * GET /hierarchy/business/:businessId/tree
 * Business-scoped tree — Head (3)+ with business scope check.
 */
hierarchyRouter.get(
  "/business/:businessId/tree",
  requireRole(ROLE_LEVEL.HEAD),
  requireBusinessScope("businessId"),
  asyncHandler(async (req, res) => {
    const tree = await getBusinessHierarchyTree(String(req.params.businessId));
    res.json({ data: tree });
  }),
);

/**
 * GET /hierarchy/descendants/:id
 * Descendants — caller must have :id in their employee scope.
 */
hierarchyRouter.get(
  "/descendants/:id",
  requireEmployeeScope("id"),
  asyncHandler(async (req, res) => {
    const descendants = await getDescendants(String(req.params.id));
    res.json({ data: descendants });
  }),
);

/**
 * GET /hierarchy/ancestors/:id
 * Ancestors — caller must have :id in their employee scope.
 */
hierarchyRouter.get(
  "/ancestors/:id",
  requireEmployeeScope("id"),
  asyncHandler(async (req, res) => {
    const ancestors = await getNodeAncestors(String(req.params.id));
    res.json({ data: ancestors });
  }),
);

/**
 * GET /hierarchy/node-descendants/:id
 * Node descendants — caller must have :id in their employee scope.
 */
hierarchyRouter.get(
  "/node-descendants/:id",
  requireEmployeeScope("id"),
  asyncHandler(async (req, res) => {
    const descendants = await getNodeDescendants(String(req.params.id));
    res.json({ data: descendants });
  }),
);

/**
 * GET /hierarchy/available-perspectives
 * Any authenticated user may list their own available perspectives.
 */
hierarchyRouter.get(
  "/available-perspectives",
  asyncHandler(async (req, res) => {
    const perspectives = await getAvailablePerspectives(req.user!.employeeId);
    res.json({ data: perspectives });
  }),
);

/**
 * GET /hierarchy/managers/:id
 * Managers chain — caller must have :id in their employee scope.
 */
hierarchyRouter.get(
  "/managers/:id",
  requireEmployeeScope("id"),
  asyncHandler(async (req, res) => {
    const managers = await getManagers(String(req.params.id));
    res.json({ data: managers });
  }),
);

