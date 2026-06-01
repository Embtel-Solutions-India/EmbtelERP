import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getDescendants, isDescendantOf } from './hierarchy.service.js';
export async function getActivePerspectiveForUser(userId) {
    return prisma.perspective.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });
}
export async function getAvailablePerspectives(userId) {
    const viewer = await prisma.employee.findUnique({ where: { id: userId } });
    if (!viewer) {
        throw new ApiError(404, 'Employee not found');
    }
    const descendants = await getDescendants(userId);
    const entries = [viewer, ...descendants];
    const unique = new Map(entries.map((employee) => [employee.id, employee]));
    return [...unique.values()].map((employee) => ({
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
    }));
}
export async function switchPerspective(userId, targetEmployeeId) {
    const viewer = await prisma.employee.findUnique({ where: { id: userId } });
    const target = await prisma.employee.findUnique({ where: { id: targetEmployeeId } });
    if (!viewer || !target) {
        throw new ApiError(404, 'Employee not found');
    }
    if (viewer.id !== target.id) {
        const allowed = await isDescendantOf(target.id, viewer.id);
        if (!allowed) {
            throw new ApiError(403, 'You can only switch to descendants or self');
        }
    }
    const perspectiveType = viewer.id === target.id ? 'SELF' : 'DESCENDANT';
    return prisma.perspective.upsert({
        where: {
            userId_currentPerspectiveId: {
                userId,
                currentPerspectiveId: targetEmployeeId,
            },
        },
        update: {
            perspectiveType,
        },
        create: {
            userId,
            currentPerspectiveId: targetEmployeeId,
            perspectiveType,
        },
    });
}
