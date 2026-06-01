import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  createEmployee,
  getEmployeeById,
  listEmployees,
} from "../services/employee.service.js";

const createEmployeeSchema = z.object({
  organizationId: z.string().min(1),
  businessId: z.string().min(1),
  departmentId: z.string().min(1).nullable().optional(),
  teamId: z.string().min(1).nullable().optional(),
  roleId: z.string().min(1),
  reportsToId: z.string().min(1).nullable().optional(),
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
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeById(String(req.params.id));
    res.json({ data: employee });
  }),
);

employeesRouter.post(
  "/",
  validateBody(createEmployeeSchema),
  asyncHandler(async (req, res) => {
    const actorId = req.user?.employeeId;
    const employee = await createEmployee(req.body, actorId);
    res.status(201).json({ data: employee });
  }),
);
