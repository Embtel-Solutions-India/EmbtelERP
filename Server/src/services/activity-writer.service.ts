import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
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
