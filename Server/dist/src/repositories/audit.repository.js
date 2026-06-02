import { prisma } from "../config/prisma.js";
export class AuditRepository {
    list(args) {
        return prisma.auditLog.findMany(args);
    }
    create(data) {
        return prisma.auditLog.create({ data });
    }
}
