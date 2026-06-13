import { Prisma } from "@prisma/client";

/**
 * Single source of truth for "revenue" across the app (Roadmap P2).
 *
 * Definition:
 *  - A lead contributes revenue once it has been **converted** — i.e.
 *    `convertedAt` is set. This counts converted-then-TRANSFERRED leads (they
 *    keep their `convertedAt`) and correctly excludes leads transferred straight
 *    from QUALIFIED (never converted, so no `convertedAt`).
 *  - The amount is **collected payment** (`paymentAmount`), not the manually
 *    typed `estimatedValue` deal size.
 *  - Revenue is dated by **`convertedAt`**, never `updatedAt`, so editing an old
 *    lead can't re-date its revenue into the current period.
 *
 * Use `REVENUE_WHERE` in Prisma `where` clauses, `leadRevenue()` to sum, and
 * `revenueMonthKey()` for monthly bucketing.
 */

/** Prisma `where` fragment selecting revenue-bearing (converted) leads. */
export const REVENUE_WHERE = { convertedAt: { not: null } } as const;

/** Per-lead revenue contribution = collected payment amount (0 when unrecorded). */
export function leadRevenue(lead: { paymentAmount: Prisma.Decimal | number | null }): number {
  return Number(lead.paymentAmount ?? 0);
}

/** Whether a lead counts toward revenue (was converted at some point). */
export function isRevenueLead(lead: { convertedAt: Date | null }): boolean {
  return lead.convertedAt != null;
}

/** `YYYY-MM` bucket key for a converted lead, by conversion date. */
export function revenueMonthKey(lead: { convertedAt: Date | null }): string | null {
  return lead.convertedAt ? lead.convertedAt.toISOString().slice(0, 7) : null;
}
