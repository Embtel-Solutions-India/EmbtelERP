import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createSalesLeadSchema,
  updateSalesLeadSchema,
} from "../validations/salesLead.validation.js";
import {
  createLead,
  deleteLead,
  listLeads,
  updateLead,
} from "../controllers/salesLead.controller.js";

export const salesRouter = Router();

salesRouter.use(authenticate, attachScope);

salesRouter.get(   "/leads",     asyncHandler(listLeads));
salesRouter.post(  "/leads",     validateBody(createSalesLeadSchema), asyncHandler(createLead));
salesRouter.patch( "/leads/:id", validateBody(updateSalesLeadSchema), asyncHandler(updateLead));
salesRouter.delete("/leads/:id", asyncHandler(deleteLead));
