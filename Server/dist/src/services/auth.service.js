import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
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
    const payload = {
        id: employee.id,
        employeeId: employee.id,
        roleLevel: employee.role.level,
        businessId: employee.businessId,
        organizationId: employee.organizationId,
    };
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: "8h",
    });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
    return {
        employee: {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            email: employee.email,
            roleLevel: employee.role.level,
            businessId: employee.businessId,
        },
        accessToken,
        refreshToken,
    };
}
