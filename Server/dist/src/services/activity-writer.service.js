import { prisma } from '../config/prisma.js';
export async function recordActivity(input) {
    return prisma.activity.create({
        data: {
            actorId: input.actorId ?? null,
            businessId: input.businessId,
            action: input.action,
            targetType: input.targetType,
            targetId: input.targetId ?? null,
            metadata: input.metadata ? input.metadata : undefined,
        },
    });
}
