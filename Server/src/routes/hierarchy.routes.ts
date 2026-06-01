import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getDescendants,
  getHierarchyTree,
} from "../services/hierarchy.service.js";

export const hierarchyRouter = Router();

hierarchyRouter.use(authenticate, attachScope);

hierarchyRouter.get(
  "/tree",
  asyncHandler(async (req, res) => {
    const rootId =
      req.perspective?.currentPerspectiveId ?? req.user!.employeeId;
    const tree = await getHierarchyTree(rootId);
    res.json({ data: tree });
  }),
);

hierarchyRouter.get(
  "/descendants/:id",
  asyncHandler(async (req, res) => {
    const descendants = await getDescendants(String(req.params.id));
    res.json({ data: descendants });
  }),
);
