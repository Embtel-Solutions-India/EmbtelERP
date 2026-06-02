import type { Activity, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export class ActivityRepository {
  list(args: Prisma.ActivityFindManyArgs): Promise<Activity[]> {
    return prisma.activity.findMany(args);
  }

  create(data: Prisma.ActivityCreateInput): Promise<Activity> {
    return prisma.activity.create({ data });
  }
}
