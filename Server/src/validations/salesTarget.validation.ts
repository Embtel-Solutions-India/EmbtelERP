import { z } from "zod";

export const salesTargetCategorySchema = z.enum(["LEAD", "ACTIVITY", "CONVERSION", "REVENUE"]);

export const salesTargetMetricSchema = z.enum([
  "LEADS_CREATED",
  "LEADS_CONTACTED",
  "QUALIFIED_LEADS",
  "CALLS_COMPLETED",
  "WHATSAPP_FOLLOWUPS",
  "EMAIL_FOLLOWUPS",
  "CONSULTATIONS_SCHEDULED",
  "CONVERTED_CLIENTS",
  "CLOSED_LEADS",
  "REVENUE_GENERATED",
  "PAYMENTS_COLLECTED",
]);

export const salesTargetStatusSchema = z.enum(["ACTIVE", "COMPLETED", "OVERDUE", "CANCELLED"]);

export const createSalesTargetSchema = z.object({
  name:           z.string().min(1, "Target name is required"),
  category:       salesTargetCategorySchema,
  metric:         salesTargetMetricSchema,
  targetValue:    z.coerce.number().positive("Target value must be greater than zero"),
  startDate:      z.coerce.date(),
  endDate:        z.coerce.date(),
  assignedToId:   z.string().min(1, "Assignee is required"),
  description:    z.string().nullable().optional(),
  parentTargetId: z.string().min(1).nullable().optional(),
});

// Shared with update via .partial() — future fields propagate automatically.
export const updateSalesTargetSchema = createSalesTargetSchema
  .omit({ assignedToId: true, parentTargetId: true })
  .partial()
  .extend({ status: salesTargetStatusSchema.optional() });

export const reassignSalesTargetSchema = z.object({
  assignedToId: z.string().min(1, "Assignee is required"),
});
