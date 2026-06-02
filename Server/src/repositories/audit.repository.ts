import type { AuditLog, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export class AuditRepository {
  list(args: Prisma.AuditLogFindManyArgs): Promise<AuditLog[]> {
    return prisma.auditLog.findMany(args);
  }

  create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return prisma.auditLog.create({ data });
  }
}
