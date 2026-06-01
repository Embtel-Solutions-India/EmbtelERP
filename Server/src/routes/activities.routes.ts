import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listActivities } from "../services/activity.service.js";

export const activitiesRouter = Router();

activitiesRouter.use(authenticate, attachScope);

activitiesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const activities = await listActivities(req.scope!);
    res.json({ data: activities });
  }),
);
