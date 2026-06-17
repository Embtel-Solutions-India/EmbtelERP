import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { recordAudit } from "./activity-writer.service.js";

export async function login(email: string, password: string) {
  // Email is matched case-insensitively so "User@Example.com" logs in the same
  // account as "user@example.com" regardless of how it was stored/typed.
  const employee = await prisma.employee.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: {
      role: {
        include: { permissions: { include: { permission: true } } },
      },
      team:       { select: { name: true } },
      vertical:   { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  if (!employee || !employee.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const valid = await bcrypt.compare(password, employee.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const payload: AuthUser = {
    id: employee.id,
    employeeId: employee.id,
    roleLevel: employee.role.level,
    employeeLevel: employee.level ?? employee.role.level,
    businessId: employee.businessId,
    organizationId: employee.organizationId,
    permissions: employee.role.permissions.map((rp) => rp.permission.code),
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: "8h",
  });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  await recordAudit({
    actorId:    employee.id,
    businessId: employee.businessId,
    action:     "LOGIN",
    entityType: "Employee",
    entityName: `${employee.firstName} ${employee.lastName}`,
    entityId:   employee.id,
  });

  return {
    employee: {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      roleLevel: employee.role.level,
      employeeLevel: employee.level ?? employee.role.level,
      businessId: employee.businessId,
      organizationId: employee.organizationId,
      designation: employee.designation,
      teamId: employee.teamId,
      verticalId: employee.verticalId,
      departmentId: employee.departmentId,
      // Names let the client resolve the correct department dashboard
      // (e.g. a "Social Media Executive" on the Marketing Team → Marketing).
      teamName: employee.team?.name ?? null,
      verticalName: employee.vertical?.name ?? null,
      departmentName: employee.department?.name ?? null,
    },
    accessToken,
    refreshToken,
  };
}
