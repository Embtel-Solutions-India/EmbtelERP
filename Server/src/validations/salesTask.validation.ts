import { z } from "zod";

const nullableDate = z.coerce.date().nullable().optional();

export const salesTaskTypeSchema = z.enum([
  "CALL",
  "WHATSAPP_FOLLOWUP",
  "EMAIL_FOLLOWUP",
  "CONSULTATION_MEETING",
  "DOCUMENT_COLLECTION",
  "PAYMENT_FOLLOWUP",
  "VISA_ELIGIBILITY_DISCUSSION",
  "LEAD_NURTURING",
  "CLIENT_MEETING",
  "INTERNAL_DISCUSSION",
]);

export const salesTaskResultSchema = z.enum([
  "CONNECTED",
  "NO_RESPONSE",
  "INTERESTED",
  "NOT_INTERESTED",
  "CALL_BACK_LATER",
  "CONSULTATION_BOOKED",
  "DOCUMENTS_RECEIVED",
  "PAYMENT_RECEIVED",
  "CONVERTED",
  "LOST_LEAD",
]);

export const salesTaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const salesTaskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

// Single source of truth for create and update (update derives via .partial()).
export const createSalesTaskSchema = z.object({
  teamId:           z.string().min(1).nullable().optional(),
  verticalId:       z.string().min(1).nullable().optional(),
  leadId:           z.string().min(1).nullable().optional(),   // Related Lead
  assigneeId:       z.string().min(1).nullable().optional(),
  title:            z.string().min(1, "Task title is required"),
  taskType:         salesTaskTypeSchema,
  description:      z.string().nullable().optional(),
  status:           salesTaskStatusSchema.optional(),
  priority:         salesTaskPrioritySchema.optional(),
  dueDate:          nullableDate,                              // date + time combined
  result:           salesTaskResultSchema.nullable().optional(),
  nextFollowUpDate: nullableDate,
  notes:            z.string().nullable().optional(),
});

export const updateSalesTaskSchema = createSalesTaskSchema.partial();
