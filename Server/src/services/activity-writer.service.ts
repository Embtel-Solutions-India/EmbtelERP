import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "PAYMENT_STATUS_CHANGE"
  | "ASSIGNMENT_CHANGE"
  | "PERSPECTIVE_SWITCH"
  | "LOGIN"
  | "LOGOUT";

export async function recordActivity(input: {
  actorId?: string;
  businessId: string;
  action: ActivityAction;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return prisma.activity.create({
    data: {
      actorId: input.actorId ?? null,
      businessId: input.businessId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata
        ? (input.metadata as Prisma.InputJsonValue)
        : undefined,
    },
  });
}

// Serialise Prisma records (Decimal, Date, etc.) into plain JSON-safe values
// suitable for AuditLog.before / AuditLog.after snapshots.
function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

// Writes a full audit-trail entry (with before/after state) to AuditLog.
// Best-effort: audit logging must never break the underlying operation.
export async function recordAudit(input: {
  actorId?: string | null;
  businessId?: string | null;
  action: ActivityAction;
  entityType: string;
  entityName?: string | null;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  perspectiveId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        businessId: input.businessId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityName: input.entityName ?? null,
        entityId: input.entityId ?? null,
        before: toJsonValue(input.before),
        after: toJsonValue(input.after),
        perspectiveId: input.perspectiveId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch {
    // Swallow audit failures so they never interrupt the primary action.
    return null;
  }
}
