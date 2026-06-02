import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  getAvailablePerspectives,
  switchPerspective,
  getActivePerspectiveForUser,
} from "../services/perspective.service.js";

const switchSchema = z.object({
  targetUserId: z.string().min(1),
});

export const perspectivesRouter = Router();

perspectivesRouter.use(authenticate);

perspectivesRouter.get(
  "/available",
  asyncHandler(async (req, res) => {
    const perspectives = await getAvailablePerspectives(req.user!.employeeId);
    res.json({ data: perspectives });
  }),
);

perspectivesRouter.post(
  "/switch",
  validateBody(switchSchema),
  asyncHandler(async (req, res) => {
    const perspective = await switchPerspective(
      req.user!.employeeId,
      req.body.targetUserId,
    );
    res.json({ data: perspective });
  }),
);

perspectivesRouter.post(
  "/reset",
  asyncHandler(async (req, res) => {
    // reset perspective to self
    const perspective = await switchPerspective(
      req.user!.employeeId,
      req.user!.employeeId,
    );
    res.json({ data: perspective });
  }),
);

perspectivesRouter.get(
  "/current",
  asyncHandler(async (req, res) => {
    const perspective = await getActivePerspectiveForUser(req.user!.employeeId);
    res.json({ data: perspective });
  }),
);
