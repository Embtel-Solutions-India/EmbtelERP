import { prisma } from "../config/prisma.js";
export class ActivityRepository {
    list(args) {
        return prisma.activity.findMany(args);
    }
    create(data) {
        return prisma.activity.create({ data });
    }
}
