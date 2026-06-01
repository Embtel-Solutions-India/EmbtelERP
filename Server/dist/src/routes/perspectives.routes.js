import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { getAvailablePerspectives, switchPerspective, } from "../services/perspective.service.js";
const switchSchema = z.object({
    currentPerspectiveId: z.string().min(1),
});
export const perspectivesRouter = Router();
perspectivesRouter.use(authenticate);
perspectivesRouter.get("/available", asyncHandler(async (req, res) => {
    const perspectives = await getAvailablePerspectives(req.user.employeeId);
    res.json({ data: perspectives });
}));
perspectivesRouter.post("/switch", validateBody(switchSchema), asyncHandler(async (req, res) => {
    const perspective = await switchPerspective(req.user.employeeId, req.body.currentPerspectiveId);
    res.json({ data: perspective });
}));
