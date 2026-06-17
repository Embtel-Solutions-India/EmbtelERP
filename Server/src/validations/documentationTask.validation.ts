import { z } from "zod";

const nullableDate = z.coerce.date().nullable().optional();

export const documentationTaskTypeSchema = z.enum([
  "DOCUMENT_COLLECTION",
  "DOCUMENT_VERIFICATION",
  "CASE_FILING",
  "APPLICATION_REVIEW",
  "CLIENT_FOLLOWUP",
  "SUBMISSION",
  "INTERNAL_DISCUSSION",
]);

export const documentationTaskResultSchema = z.enum([
  "IN_REVIEW",
  "DOCUMENTS_RECEIVED",
  "DOCUMENTS_PENDING",
  "VERIFIED",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "ON_HOLD",
]);

export const documentationTaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const documentationTaskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

// Single source of truth for create and update (update derives via .partial()).
export const createDocumentationTaskSchema = z.object({
  teamId:           z.string().min(1).nullable().optional(),
  verticalId:       z.string().min(1).nullable().optional(),
  assigneeId:       z.string().min(1).nullable().optional(),
  title:            z.string().min(1, "Task title is required"),
  taskType:         documentationTaskTypeSchema,
  description:      z.string().nullable().optional(),
  status:           documentationTaskStatusSchema.optional(),
  priority:         documentationTaskPrioritySchema.optional(),
  dueDate:          nullableDate,
  result:           documentationTaskResultSchema.nullable().optional(),
  nextFollowUpDate: nullableDate,
  notes:            z.string().nullable().optional(),
});

export const updateDocumentationTaskSchema = createDocumentationTaskSchema.partial();
