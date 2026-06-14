import { z } from "zod";

const nullableDate = z.coerce.date().nullable().optional();

export const itBoardColumnSchema = z.enum([
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
]);

export const itPrioritySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

// Single source of truth for create; update derives via .partial().
export const createITTaskSchema = z.object({
  title:       z.string().min(1, "Task title is required"),
  description: z.string().nullable().optional(),
  column:      itBoardColumnSchema.optional(),
  priority:    itPrioritySchema.optional(),
  storyPoints: z.coerce.number().int().min(0).max(100).nullable().optional(),
  assigneeId:  z.string().min(1).nullable().optional(),
  prdRef:      z.string().nullable().optional(),
  dueDate:     nullableDate,
});

export const updateITTaskSchema = createITTaskSchema.partial();

export const createEodSchema = z.object({
  reportDate: z.coerce.date(),
  completed:  z.string().min(1, "Completed tasks are required"),
  pending:    z.string().nullable().optional(),
  blockers:   z.string().nullable().optional(),
  tomorrow:   z.string().nullable().optional(),
});
