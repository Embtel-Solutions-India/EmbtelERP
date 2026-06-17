import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAssignableSubordinates } from "../services/hierarchy.service.js";
import {
  createDocumentationTaskSchema,
  updateDocumentationTaskSchema,
} from "../validations/documentationTask.validation.js";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/documentationTask.controller.js";

export const documentationRouter = Router();

documentationRouter.use(authenticate, attachScope);

// ── Documentation tasks (isolated DocumentationTask model) ───────────────────
// Hierarchy scoping mirrors Sales: super admin sees all, the general manager /
// head sees their vertical/business, executives & interns see only their own.
documentationRouter.get(   "/tasks",     asyncHandler(listTasks));
documentationRouter.post(  "/tasks",     validateBody(createDocumentationTaskSchema), asyncHandler(createTask));
documentationRouter.patch( "/tasks/:id", validateBody(updateDocumentationTaskSchema), asyncHandler(updateTask));
documentationRouter.delete("/tasks/:id", asyncHandler(deleteTask));

// Team members the caller may assign a task to (matches the tier-based guard in
// documentationTask.service.assertAssignable). Returns [] for execs/interns.
documentationRouter.get("/assignable-users", asyncHandler(async (req, res) => {
  const me = req.effectiveUser?.id ?? req.user!.employeeId;
  res.json({ data: await getAssignableSubordinates(me) });
}));
