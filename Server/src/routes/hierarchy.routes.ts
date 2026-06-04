import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getDescendants,
  getHierarchyTree,
  getFullOrganizationTree,
  getBusinessHierarchyTree,
  getNodeAncestors,
  getNodeDescendants,
} from "../services/hierarchy.service.js";
import { getManagers } from "../services/hierarchy.service.js";
import { getAvailablePerspectives } from "../services/perspective.service.js";

export const hierarchyRouter = Router();

hierarchyRouter.use(authenticate, attachScope);

/**
 * GET /hierarchy/tree
 * Get the full organization tree (all businesses, verticals, teams).
 */
hierarchyRouter.get(
  "/tree",
  asyncHandler(async (req, res) => {
    const rootId = req.perspective?.perspectiveTargetId ?? req.user!.employeeId;
    const tree = await getHierarchyTree(rootId);
    res.json({ data: tree });
  }),
);

/**
 * GET /hierarchy/organization-tree
 * Get the full organization tree for the business owner dashboard.
 */
hierarchyRouter.get(
  "/organization-tree",
  asyncHandler(async (req, res) => {
    const tree = await getFullOrganizationTree();
    res.json({ data: tree });
  }),
);

/**
 * GET /hierarchy/business/:businessId/tree
 * Get hierarchy tree for a specific business.
 */
hierarchyRouter.get(
  "/business/:businessId/tree",
  asyncHandler(async (req, res) => {
    const tree = await getBusinessHierarchyTree(String(req.params.businessId));
    res.json({ data: tree });
  }),
);

/**
 * GET /hierarchy/descendants/:id
 * Get all descendants of an employee.
 */
hierarchyRouter.get(
  "/descendants/:id",
  asyncHandler(async (req, res) => {
    const descendants = await getDescendants(String(req.params.id));
    res.json({ data: descendants });
  }),
);

/**
 * GET /hierarchy/ancestors/:id
 * Get all ancestors (chain up) of an employee.
 */
hierarchyRouter.get(
  "/ancestors/:id",
  asyncHandler(async (req, res) => {
    const ancestors = await getNodeAncestors(String(req.params.id));
    res.json({ data: ancestors });
  }),
);

/**
 * GET /hierarchy/node-descendants/:id
 * Get all descendants of a node with full details.
 */
hierarchyRouter.get(
  "/node-descendants/:id",
  asyncHandler(async (req, res) => {
    const descendants = await getNodeDescendants(String(req.params.id));
    res.json({ data: descendants });
  }),
);

/**
 * GET /hierarchy/available-perspectives
 * Get available perspectives for the current user.
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
 * Get all managers above an employee.
 */
hierarchyRouter.get(
  "/managers/:id",
  asyncHandler(async (req, res) => {
    const managers = await getManagers(String(req.params.id));
    res.json({ data: managers });
  }),
);
