import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { requireRole, ROLE_LEVEL } from "../middleware/rbac.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createITTaskSchema,
  updateITTaskSchema,
  createEodSchema,
} from "../validations/it.validation.js";
import {
  overview,
  sprint,
  createTask,
  updateTask,
  createEod,
  listEod,
} from "../controllers/it.controller.js";

export const itRouter = Router();

// authenticate + attachScope (preserves the read-only impersonation write-block).
// requireRole(EXECUTIVE) is a floor; true IT isolation is enforced in the service
// layer, which hard-scopes every query to the IT development team.
itRouter.use(authenticate, attachScope, requireRole(ROLE_LEVEL.EXECUTIVE));

itRouter.get(  "/overview",        asyncHandler(overview));
itRouter.get(  "/sprint",          asyncHandler(sprint));
itRouter.post( "/sprint/tasks",    validateBody(createITTaskSchema), asyncHandler(createTask));
itRouter.patch("/sprint/tasks/:id", validateBody(updateITTaskSchema), asyncHandler(updateTask));
itRouter.get(  "/eod",             asyncHandler(listEod));
itRouter.post( "/eod",             validateBody(createEodSchema), asyncHandler(createEod));
