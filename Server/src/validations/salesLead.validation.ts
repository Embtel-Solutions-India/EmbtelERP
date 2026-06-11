import { z } from "zod";

const optionalMoney = z.coerce.number().nonnegative().nullable().optional();
const nullableDate = z.coerce.date().nullable().optional();

export const salesLeadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
  "CONSULTATION_SCHEDULED",
  "DOCUMENTS_REQUESTED",
  "CONVERTED",
  "TRANSFERRED_TO_DOCUMENTATION",
]);

// Optional immigration profile sent by the Sales Executive Add Lead form.
// Every field optional so the core lead create is unaffected when omitted.
export const leadImmigrationSchema = z.object({
  whatsapp:                  z.string().nullable().optional(),
  countryOfResidence:        z.string().nullable().optional(),
  nationality:               z.string().nullable().optional(),
  visaCategory:              z.string().nullable().optional(),
  interestedVisa:            z.string().nullable().optional(),
  currentStatus:             z.string().nullable().optional(),
  education:                 z.string().nullable().optional(),
  workExperience:            z.coerce.number().int().nonnegative().nullable().optional(),
  familyImmigrationRequired: z.coerce.boolean().nullable().optional(),
  budgetMin:                 optionalMoney,
  budgetMax:                 optionalMoney,
  urgencyLevel:              z.string().nullable().optional(),
  interestedLevel:           z.string().nullable().optional(),
  consultationRequired:      z.coerce.boolean().nullable().optional(),
  consultationDate:          nullableDate,
});

export const createSalesLeadSchema = z.object({
  businessId:     z.string().min(1),
  teamId:         z.string().min(1).nullable().optional(),
  verticalId:     z.string().min(1).nullable().optional(),
  assignedToId:   z.string().min(1).nullable().optional(),
  name:           z.string().min(1),
  company:        z.string().nullable().optional(),
  email:          z.string().email().nullable().optional(),
  phone:          z.string().nullable().optional(),
  source:         z.string().min(1),
  status:         salesLeadStatusSchema.optional(),
  priority:       z.enum(["hot", "warm", "cold"]).optional(),
  estimatedValue: optionalMoney,
  notes:          z.string().nullable().optional(),
  convertedAt:    nullableDate,
  immigration:    leadImmigrationSchema.optional(),
});

export const updateSalesLeadSchema = createSalesLeadSchema
  .omit({ businessId: true })
  .partial();
