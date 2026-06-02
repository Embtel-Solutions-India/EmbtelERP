import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDescendants, getHierarchyTree, } from "../services/hierarchy.service.js";
import { getManagers } from "../services/hierarchy.service.js";
import { getAvailablePerspectives } from "../services/perspective.service.js";
export const hierarchyRouter = Router();
hierarchyRouter.use(authenticate, attachScope);
hierarchyRouter.get("/tree", asyncHandler(async (req, res) => {
    const rootId = req.perspective?.currentPerspectiveId ?? req.user.employeeId;
    const tree = await getHierarchyTree(rootId);
    res.json({ data: tree });
}));
hierarchyRouter.get("/descendants/:id", asyncHandler(async (req, res) => {
    const descendants = await getDescendants(String(req.params.id));
    res.json({ data: descendants });
}));
hierarchyRouter.get("/ancestors/:id", asyncHandler(async (req, res) => {
    const managers = await getManagers(String(req.params.id));
    res.json({ data: managers });
}));
hierarchyRouter.get("/available-perspectives", asyncHandler(async (req, res) => {
    const perspectives = await getAvailablePerspectives(req.user.employeeId);
    res.json({ data: perspectives });
}));
hierarchyRouter.get("/managers/:id", asyncHandler(async (req, res) => {
    const managers = await getManagers(String(req.params.id));
    res.json({ data: managers });
}));
