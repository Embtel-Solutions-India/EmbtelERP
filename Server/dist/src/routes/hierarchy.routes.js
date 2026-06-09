import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireRole, requireEmployeeScope, requireBusinessScope, ROLE_LEVEL, } from "../middleware/rbac.middleware.js";
import { getDescendants, getFullOrganizationTree, getBusinessHierarchyTree, getNodeAncestors, getNodeDescendants, getManagers, } from "../services/hierarchy.service.js";
import { getAvailablePerspectives } from "../services/perspective.service.js";
import { getHierarchyTreeHandler } from "../controllers/hierarchy.controller.js";
export const hierarchyRouter = Router();
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
hierarchyRouter.get("/organization-tree", requireRole(ROLE_LEVEL.BUSINESS_OWNER), asyncHandler(async (_req, res) => {
    const tree = await getFullOrganizationTree();
    res.json({ data: tree });
}));
/**
 * GET /hierarchy/business/:businessId/tree
 * Business-scoped tree — Head (3)+ with business scope check.
 */
hierarchyRouter.get("/business/:businessId/tree", requireRole(ROLE_LEVEL.HEAD), requireBusinessScope("businessId"), asyncHandler(async (req, res) => {
    const tree = await getBusinessHierarchyTree(String(req.params.businessId));
    res.json({ data: tree });
}));
/**
 * GET /hierarchy/descendants/:id
 * Descendants — caller must have :id in their employee scope.
 */
hierarchyRouter.get("/descendants/:id", requireEmployeeScope("id"), asyncHandler(async (req, res) => {
    const descendants = await getDescendants(String(req.params.id));
    res.json({ data: descendants });
}));
/**
 * GET /hierarchy/ancestors/:id
 * Ancestors — caller must have :id in their employee scope.
 */
hierarchyRouter.get("/ancestors/:id", requireEmployeeScope("id"), asyncHandler(async (req, res) => {
    const ancestors = await getNodeAncestors(String(req.params.id));
    res.json({ data: ancestors });
}));
/**
 * GET /hierarchy/node-descendants/:id
 * Node descendants — caller must have :id in their employee scope.
 */
hierarchyRouter.get("/node-descendants/:id", requireEmployeeScope("id"), asyncHandler(async (req, res) => {
    const descendants = await getNodeDescendants(String(req.params.id));
    res.json({ data: descendants });
}));
/**
 * GET /hierarchy/available-perspectives
 * Any authenticated user may list their own available perspectives.
 */
hierarchyRouter.get("/available-perspectives", asyncHandler(async (req, res) => {
    const perspectives = await getAvailablePerspectives(req.user.employeeId);
    res.json({ data: perspectives });
}));
/**
 * GET /hierarchy/managers/:id
 * Managers chain — caller must have :id in their employee scope.
 */
hierarchyRouter.get("/managers/:id", requireEmployeeScope("id"), asyncHandler(async (req, res) => {
    const managers = await getManagers(String(req.params.id));
    res.json({ data: managers });
}));
