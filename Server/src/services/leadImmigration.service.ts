import { prisma } from "../config/prisma.js";
import { createSalesLead, type SalesLeadContext } from "./salesLead.service.js";

export interface LeadImmigrationInput {
  whatsapp?: string | null;
  countryOfResidence?: string | null;
  nationality?: string | null;
  visaCategory?: string | null;
  interestedVisa?: string | null;
  currentStatus?: string | null;
  education?: string | null;
  workExperience?: number | null;
  familyImmigrationRequired?: boolean | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  urgencyLevel?: string | null;
  interestedLevel?: string | null;
  consultationRequired?: boolean | null;
  consultationDate?: Date | null;
}

/**
 * Transparent 0–100 lead score derived from real qualification fields.
 * Interested Level (Hot 30 / Warm 15 / Cold 5) + Urgency (High 20 / Med 10 / Low 5)
 * + Budget present (20) + Consultation booked (15) + Family immigration (10).
 */
export function computeLeadScore(im: LeadImmigrationInput | undefined): number {
  if (!im) return 0;
  let score = 0;
  const level = (im.interestedLevel ?? "").toLowerCase();
  if (level === "hot") score += 30;
  else if (level === "warm") score += 15;
  else if (level === "cold") score += 5;

  const urgency = (im.urgencyLevel ?? "").toLowerCase();
  if (urgency === "high") score += 20;
  else if (urgency === "medium") score += 10;
  else if (urgency === "low") score += 5;

  if (im.budgetMax != null && Number(im.budgetMax) > 0) score += 20;
  if (im.consultationDate) score += 15;
  if (im.familyImmigrationRequired) score += 10;

  return Math.max(0, Math.min(100, score));
}

function hasAnyValue(im: LeadImmigrationInput): boolean {
  return Object.values(im).some((v) => v !== null && v !== undefined && v !== "");
}

/**
 * Creates a sales lead (reusing the existing scoped/RBAC-enforced createSalesLead)
 * and, when immigration fields are supplied, an attached LeadImmigrationProfile
 * with a computed lead score. Returns the lead with its profile included.
 */
export async function createLeadWithImmigration(
  ctx: SalesLeadContext,
  body: Record<string, unknown>,
) {
  const { immigration, ...leadCore } = body as {
    immigration?: LeadImmigrationInput;
  } & Record<string, unknown>;

  const lead = await createSalesLead(ctx, leadCore);

  if (immigration && hasAnyValue(immigration)) {
    await prisma.leadImmigrationProfile.create({
      data: {
        leadId: lead.id,
        whatsapp:                  immigration.whatsapp ?? null,
        countryOfResidence:        immigration.countryOfResidence ?? null,
        nationality:               immigration.nationality ?? null,
        visaCategory:              immigration.visaCategory ?? null,
        interestedVisa:            immigration.interestedVisa ?? null,
        currentStatus:             immigration.currentStatus ?? null,
        education:                 immigration.education ?? null,
        workExperience:            immigration.workExperience ?? null,
        familyImmigrationRequired: immigration.familyImmigrationRequired ?? null,
        budgetMin:                 immigration.budgetMin ?? null,
        budgetMax:                 immigration.budgetMax ?? null,
        urgencyLevel:              immigration.urgencyLevel ?? null,
        interestedLevel:           immigration.interestedLevel ?? null,
        consultationRequired:      immigration.consultationRequired ?? null,
        consultationDate:          immigration.consultationDate ?? null,
        leadScore:                 computeLeadScore(immigration),
      },
    });
  }

  return prisma.salesLead.findUnique({
    where: { id: lead.id },
    include: {
      immigrationProfile: true,
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      createdBy:  { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}
