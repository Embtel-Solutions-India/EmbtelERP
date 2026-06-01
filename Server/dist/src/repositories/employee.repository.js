import { prisma } from "../config/prisma.js";
export class EmployeeRepository {
    findById(id) {
        return prisma.employee.findUnique({ where: { id } });
    }
    findByEmail(email) {
        return prisma.employee.findUnique({ where: { email } });
    }
    list(args) {
        return prisma.employee.findMany(args);
    }
    create(data) {
        return prisma.employee.create({ data });
    }
    update(id, data) {
        return prisma.employee.update({ where: { id }, data });
    }
}
