import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
const SESSION_DAYS = 7;
function getAccessLevel(employee) {
    return employee.level ?? employee.role.level;
}
function getEmployeeTitle(employee) {
    return employee.title ?? employee.designation ?? employee.role.name;
}
export async function login(email, password) {
    const employee = await prisma.employee.findUnique({
        where: { email },
        include: { role: true },
    });
    if (!employee || !employee.isActive) {
        throw new ApiError(401, "Invalid credentials");
    }
    const valid = await bcrypt.compare(password, employee.passwordHash);
    if (!valid) {
        throw new ApiError(401, "Invalid credentials");
    }
    const session = await prisma.session.create({
        data: {
            id: randomUUID(),
            userId: employee.id,
            expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
        },
    });
    const payload = {
        id: employee.id,
        employeeId: employee.id,
        roleLevel: getAccessLevel(employee),
        sessionId: session.id,
        businessId: employee.businessId,
        organizationId: employee.organizationId,
    };
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: "8h",
    });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
    await prisma.session.update({
        where: { id: session.id },
        data: {
            refreshTokenHash: await bcrypt.hash(refreshToken, 12),
        },
    });
    return {
        employee: {
            id: employee.id,
            name: employee.fullName ?? `${employee.firstName} ${employee.lastName}`,
            email: employee.email,
            roleLevel: getAccessLevel(employee),
            title: getEmployeeTitle(employee),
            businessId: employee.businessId,
        },
        accessToken,
        refreshToken,
    };
}
export async function logout(sessionId) {
    const revokedAt = new Date();
    await Promise.all([
        prisma.session.updateMany({
            where: { id: sessionId, revokedAt: null },
            data: { revokedAt },
        }),
        prisma.perspectiveSession.updateMany({
            where: { sessionId, revokedAt: null },
            data: { revokedAt },
        }),
    ]);
}
