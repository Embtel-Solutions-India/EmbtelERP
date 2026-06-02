import type { Prisma, Employee } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export class EmployeeRepository {
  findById(id: string): Promise<Employee | null> {
    return prisma.employee.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<Employee | null> {
    return prisma.employee.findUnique({ where: { email } });
  }

  list(args: Prisma.EmployeeFindManyArgs): Promise<Employee[]> {
    return prisma.employee.findMany(args);
  }

  create(data: Prisma.EmployeeCreateInput): Promise<Employee> {
    return prisma.employee.create({ data });
  }

  update(id: string, data: Prisma.EmployeeUpdateInput): Promise<Employee> {
    return prisma.employee.update({ where: { id }, data });
  }
}
