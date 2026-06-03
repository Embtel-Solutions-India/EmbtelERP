import { z } from "zod";

const nullableDate = z.coerce.date().nullable().optional();
const optionalMoney = z.coerce.number().nonnegative().nullable().optional();

export const marketingCampaignStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
]);

export const marketingTaskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
]);

export const marketingLeadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
]);

export const marketingActivityTypeSchema = z.enum([
  "SOCIAL_MEDIA",
  "LEAD_GENERATION",
  "DAILY_REPORT",
  "TASK_UPDATE",
  "CAMPAIGN_UPDATE",
  "OTHER",
]);

export const marketingKPITypeSchema = z.enum([
  "LEADS_GENERATED",
  "CAMPAIGN_SUCCESS",
  "TASK_COMPLETION",
  "PRODUCTIVITY",
  "BUDGET_UTILIZATION",
  "CUSTOM",
]);

export const createMarketingCampaignSchema = z.object({
  businessId: z.string().min(1),
  teamId: z.string().min(1).nullable().optional(),
  assignedToId: z.string().min(1).nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  channel: z.string().min(1),
  status: marketingCampaignStatusSchema.optional(),
  startDate: nullableDate,
  endDate: nullableDate,
  budget: optionalMoney,
  budgetSpent: optionalMoney,
  targetLeads: z.coerce.number().int().nonnegative().nullable().optional(),
  actualLeads: z.coerce.number().int().nonnegative().optional(),
  successMetric: z.string().nullable().optional(),
});

export const updateMarketingCampaignSchema = createMarketingCampaignSchema
  .omit({ businessId: true })
  .partial();

export const createMarketingTaskSchema = z.object({
  businessId: z.string().min(1),
  teamId: z.string().min(1).nullable().optional(),
  campaignId: z.string().min(1).nullable().optional(),
  assignedToId: z.string().min(1).nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: marketingTaskStatusSchema.optional(),
  priority: z.string().min(1).optional(),
  dueDate: nullableDate,
  completedAt: nullableDate,
});

export const updateMarketingTaskSchema = createMarketingTaskSchema
  .omit({ businessId: true })
  .partial();

export const createMarketingLeadSchema = z.object({
  businessId: z.string().min(1),
  teamId: z.string().min(1).nullable().optional(),
  campaignId: z.string().min(1).nullable().optional(),
  assignedToId: z.string().min(1).nullable().optional(),
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  source: z.string().min(1),
  status: marketingLeadStatusSchema.optional(),
  estimatedValue: optionalMoney,
  notes: z.string().nullable().optional(),
  convertedAt: nullableDate,
});

export const updateMarketingLeadSchema = createMarketingLeadSchema
  .omit({ businessId: true })
  .partial();

export const createMarketingActivitySchema = z.object({
  businessId: z.string().min(1),
  teamId: z.string().min(1).nullable().optional(),
  campaignId: z.string().min(1).nullable().optional(),
  taskId: z.string().min(1).nullable().optional(),
  leadId: z.string().min(1).nullable().optional(),
  type: marketingActivityTypeSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  reportDate: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export const updateMarketingActivitySchema = createMarketingActivitySchema
  .omit({ businessId: true })
  .partial();

export const createMarketingKPISchema = z.object({
  businessId: z.string().min(1),
  teamId: z.string().min(1).nullable().optional(),
  employeeId: z.string().min(1).nullable().optional(),
  campaignId: z.string().min(1).nullable().optional(),
  metricType: marketingKPITypeSchema,
  name: z.string().min(1),
  value: z.coerce.number(),
  target: z.coerce.number().nullable().optional(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

export const updateMarketingKPISchema = createMarketingKPISchema
  .omit({ businessId: true })
  .partial();
