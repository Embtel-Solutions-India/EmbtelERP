import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  requireRole,
  requireEmployeeScope,
  requirePermission,
  ROLE_LEVEL,
} from "../middleware/rbac.middleware.js";
import {
  createEmployee,
  getEmployeeById,
  listEmployees,
  updateEmployee,
  deactivateEmployee,
} from "../services/employee.service.js";
import {
  getEmployeeOverviewForAdmin,
  getEmployeeTasksForAdmin,
} from "../services/hierarchy.service.js";
import { ApiError } from "../utils/ApiError.js";

const createEmployeeSchema = z.object({
  organizationId: z.string().min(1),
  businessId: z.string().min(1),
  departmentId: z.string().min(1).nullable().optional(),
  teamId: z.string().min(1).nullable().optional(),
  roleId: z.string().min(1),
  managerId: z.string().min(1).nullable().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  designation: z.string().nullable().optional(),
});

export const employeesRouter = Router();

employeesRouter.use(authenticate, attachScope);

employeesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const employees = await listEmployees(req.scope?.visibleEmployees ?? []);
    res.json({ data: employees });
  }),
);

employeesRouter.get(
  "/:id",
  requireEmployeeScope("id"),
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeById(String(req.params.id));
    res.json({ data: employee });
  }),
);

// Scope-checked employee overview (task/lead stats + recent activity) for the
// Team member drawer. Reuses the same real-data service the Super-Admin org
// explorer uses; requireEmployeeScope limits it to the caller's own subtree.
employeesRouter.get(
  "/:id/overview",
  requireEmployeeScope("id"),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const overview = await getEmployeeOverviewForAdmin(id);
    if (!overview) throw new ApiError(404, "Employee not found");
    const recent = await getEmployeeTasksForAdmin(id, "monthly");
    res.json({ data: { ...overview, recentActivity: recent.tasks.slice(0, 6) } });
  }),
);

employeesRouter.post(
  "/",
  requireRole(ROLE_LEVEL.HEAD),
  requirePermission("employees:write"),
  validateBody(createEmployeeSchema),
  asyncHandler(async (req, res) => {
    const actorId = req.user?.employeeId;
    const employee = await createEmployee(req.body, actorId);
    res.status(201).json({ data: employee });
  }),
);

employeesRouter.patch(
  "/:id",
  requireRole(ROLE_LEVEL.HEAD),
  requirePermission("employees:write"),
  asyncHandler(async (req, res) => {
    const actorId = req.user?.employeeId;
    const employee = await updateEmployee(String(req.params.id), req.body, actorId);
    res.json({ data: employee });
  }),
);

employeesRouter.delete(
  "/:id",
  requireRole(ROLE_LEVEL.HEAD),
  requirePermission("employees:write"),
  asyncHandler(async (req, res) => {
    const actorId = req.user?.employeeId;
    await deactivateEmployee(String(req.params.id), actorId);
    res.status(204).end();
  }),
);

