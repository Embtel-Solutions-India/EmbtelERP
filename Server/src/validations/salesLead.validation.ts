import { z } from "zod";

const optionalMoney = z.coerce.number().nonnegative().nullable().optional();
const nullableDate = z.coerce.date().nullable().optional();
const optionalInt = z.coerce.number().int().nonnegative().nullable().optional();

export const salesLeadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "CONSULTATION_SCHEDULED",
  "DOCUMENTS_REQUESTED",
  "QUALIFIED",
  "CONVERTED",
  "TRANSFERRED",
  "LOST",
]);

export const salesLeadPaymentStatusSchema = z.enum([
  "INITIATED",
  "IN_PROGRESS",
  "DONE",
  "PARTIALLY_DONE",
]);

export const visaCategorySchema = z.enum([
  "H1B",
  "L1A",
  "L1B",
  "O1",
  "TN",
  "E3",
  "EB1",
  "EB2_NIW",
  "FAMILY_GREEN_CARD",
  "MARRIAGE_BASED",
  "BUSINESS_VISA",
  "VISITOR_VISA",
  "PERMANENT_RESIDENCY",
]);

export const priorityLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const leadCurrentStatusSchema = z.enum(["STUDENT", "WORKER", "BUSINESS_OWNER"]);
export const interestedLevelSchema = z.enum(["hot", "warm", "cold"]);

// Single source of truth for both create and update. `leadCode` and `leadScore`
// are intentionally omitted here — the server generates/derives them.
export const createSalesLeadSchema = z.object({
  businessId:     z.string().min(1),
  teamId:         z.string().min(1).nullable().optional(),
  verticalId:     z.string().min(1).nullable().optional(),
  assignedToId:   z.string().min(1).nullable().optional(),
  // Section 1: Lead Information
  name:               z.string().min(1, "Lead name is required"),
  company:            z.string().nullable().optional(),
  email:              z.string().email("Enter a valid email").nullable().optional(),
  phone:              z.string().min(1, "Phone number is required"),
  whatsappNumber:     z.string().nullable().optional(),
  countryOfResidence: z.string().nullable().optional(),
  nationality:        z.string().nullable().optional(),
  visaCategory:       visaCategorySchema.nullable().optional(),
  source:             z.string().min(1, "Lead source is required"),
  priorityLevel:      priorityLevelSchema.optional(),
  // Section 2: Immigration Requirement
  interestedVisa:            visaCategorySchema.nullable().optional(),
  currentStatus:             leadCurrentStatusSchema.nullable().optional(),
  education:                 z.string().nullable().optional(),
  workExperienceYears:       optionalInt,
  familyImmigrationRequired: z.coerce.boolean().optional(),
  budgetAvailable:           optionalMoney,
  urgencyLevel:              priorityLevelSchema.optional(),
  // Section 3: Lead Qualification (leadScore auto-computed server-side)
  priority:             interestedLevelSchema.optional(),   // Interested Level
  expectedInvestment:   optionalMoney,
  consultationRequired: z.coerce.boolean().optional(),
  consultationDate:     nullableDate,
  notes:                z.string().nullable().optional(),    // Remarks
  // Section 4: Payment
  paymentStatus:  salesLeadPaymentStatusSchema.optional(),
  paymentAmount:  optionalMoney,
  // Section 5: Status
  status:         salesLeadStatusSchema.optional(),
  estimatedValue: optionalMoney,
  convertedAt:    nullableDate,
  transferredAt:  nullableDate,
});

// Update derives from create → any field added above automatically applies to
// update too (the spec's "future fields appear in Update Lead" requirement).
export const updateSalesLeadSchema = createSalesLeadSchema
  .omit({ businessId: true })
  .partial();
