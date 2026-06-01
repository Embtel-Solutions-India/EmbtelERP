import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { roleLabel } from "../utils/scope-utils.js";
import { recordActivity } from "./activity-writer.service.js";
export async function listEmployees(scopeEmployeeIds) {
    return prisma.employee.findMany({
        where: { id: { in: scopeEmployeeIds } },
        include: { role: true, department: true, team: true, business: true },
        orderBy: { createdAt: "asc" },
    });
}
export async function getEmployeeById(id) {
    const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
            role: true,
            department: true,
            team: true,
            business: true,
            reportsTo: true,
        },
    });
    if (!employee) {
        throw new ApiError(404, "Employee not found");
    }
    return employee;
}
export async function createEmployee(input, actorId) {
    const existing = await prisma.employee.findUnique({
        where: { email: input.email },
    });
    if (existing) {
        throw new ApiError(409, "Email already exists");
    }
    const role = await prisma.role.findUnique({
        where: { id: input.roleId },
    });
    if (!role) {
        throw new ApiError(404, "Role not found");
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const employee = await prisma.employee.create({
        data: {
            ...input,
            departmentId: input.departmentId ?? null,
            teamId: input.teamId ?? null,
            reportsToId: input.reportsToId ?? null,
            fullName: input.fullName ?? `${input.firstName} ${input.lastName}`,
            title: input.title ?? input.designation ?? role.name,
            level: input.level ?? role.level,
            passwordHash,
        },
    });
    await recordActivity({
        actorId,
        businessId: input.businessId,
        action: "CREATE",
        targetType: "Employee",
        targetId: employee.id,
        metadata: { role: roleLabel(role.level) },
    });
    return employee;
}
