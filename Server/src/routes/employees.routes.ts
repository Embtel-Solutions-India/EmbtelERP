import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
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

// Update is a strict, all-optional subset — `.strict()` rejects unexpected
// fields so a caller can't smuggle in columns the form never offers.
const updateEmployeeSchema = z
  .object({
    organizationId: z.string().min(1).optional(),
    businessId: z.string().min(1).optional(),
    departmentId: z.string().min(1).nullable().optional(),
    teamId: z.string().min(1).nullable().optional(),
    roleId: z.string().min(1).optional(),
    managerId: z.string().min(1).nullable().optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    designation: z.string().nullable().optional(),
    level: z.number().int().min(0).max(5).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

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
  requireEmployeeScope("id"),
  validateBody(updateEmployeeSchema),
  asyncHandler(async (req, res) => {
    const actorId = req.user?.employeeId;
    const actorLevel = req.user?.roleLevel ?? 0;
    const body = req.body as Record<string, unknown>;

    // Anti-escalation: only a Super Admin may move an employee between
    // businesses/orgs or grant a level/role at or above their own.
    if (actorLevel < ROLE_LEVEL.SUPER_ADMIN) {
      if (body.organizationId !== undefined || body.businessId !== undefined) {
        throw new ApiError(403, "Only a Super Admin can move an employee between businesses");
      }
      if (typeof body.level === "number" && body.level > actorLevel) {
        throw new ApiError(403, "Cannot set an employee level above your own");
      }
      if (typeof body.roleId === "string") {
        const role = await prisma.role.findUnique({
          where: { id: body.roleId },
          select: { level: true },
        });
        if (role && role.level > actorLevel) {
          throw new ApiError(403, "Cannot assign a role above your own level");
        }
      }
    }

    const employee = await updateEmployee(String(req.params.id), req.body, actorId);
    res.json({ data: employee });
  }),
);

employeesRouter.delete(
  "/:id",
  requireRole(ROLE_LEVEL.HEAD),
  requirePermission("employees:write"),
  requireEmployeeScope("id"),
  asyncHandler(async (req, res) => {
    const actorId = req.user?.employeeId;
    await deactivateEmployee(String(req.params.id), actorId);
    res.status(204).end();
  }),
);

