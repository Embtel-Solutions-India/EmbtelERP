import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { getAvailablePerspectives, switchPerspective, clearPerspective, getPerspectiveInfo, } from "../services/perspective.service.js";
const switchSchema = z.object({
    targetType: z.enum([
        "ORGANIZATION",
        "BUSINESS",
        "BUSINESS_OWNER",
        "DEPARTMENT",
        "VERTICAL",
        "HEAD",
        "TEAM",
        "MANAGER",
        "EMPLOYEE",
        "INTERN",
    ]),
    targetId: z.string().min(1),
});
export const perspectivesRouter = Router();
perspectivesRouter.use(authenticate);
// GET /api/perspectives - Returns current perspective and available perspectives tree
perspectivesRouter.get("/", asyncHandler(async (req, res) => {
    const result = await getAvailablePerspectives(req.user.employeeId);
    res.json({ data: result });
}));
// GET /api/perspectives/current - Returns current perspective info with breadcrumb
perspectivesRouter.get("/current", asyncHandler(async (req, res) => {
    const info = await getPerspectiveInfo(req.user.employeeId);
    res.json({ data: info });
}));
// POST /api/perspectives/switch - Switch to a different perspective
perspectivesRouter.post("/switch", validateBody(switchSchema), asyncHandler(async (req, res) => {
    const session = await switchPerspective(req.user.employeeId, req.body.targetType, req.body.targetId);
    res.json({ data: session });
}));
// POST /api/perspectives/reset - Reset perspective to self
perspectivesRouter.post("/reset", asyncHandler(async (req, res) => {
    await clearPerspective(req.user.employeeId);
    res.json({ data: { message: "Perspective reset to self" } });
}));
