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
]);

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
});

export const updateSalesLeadSchema = createSalesLeadSchema
  .omit({ businessId: true })
  .partial();
