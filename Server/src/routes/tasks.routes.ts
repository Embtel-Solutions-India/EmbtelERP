import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/prisma.js";

export const tasksRouter = Router();

tasksRouter.use(authenticate, attachScope);

tasksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const scope = req.scope!;
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: { in: scope.visibleEmployees } },
          { businessId: { in: scope.visibleBusinesses } }
        ]
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: { dueDate: "asc" }
    });
    res.json({ data: tasks });
  })
);

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const {
      title, description, status, priority, dueDate, assigneeId,
      leadId, taskType, dueTime, taskResult, nextFollowUpDate, outcomeNotes,
    } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;
    if (leadId !== undefined) data.leadId = leadId || null;
    if (taskType !== undefined) data.taskType = taskType;
    if (dueTime !== undefined) data.dueTime = dueTime;
    if (taskResult !== undefined) data.taskResult = taskResult;
    if (nextFollowUpDate !== undefined) data.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
    if (outcomeNotes !== undefined) data.outcomeNotes = outcomeNotes;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
    res.json({ data: task });
  })
);

tasksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const {
      title, priority, status, dueDate, assigneeId, teamId, verticalId, departmentId, description,
      leadId, taskType, dueTime, taskResult, nextFollowUpDate, outcomeNotes,
    } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { id: user.employeeId },
      select: { businessId: true, teamId: true, verticalId: true, departmentId: true }
    });
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const task = await prisma.task.create({
      data: {
        businessId: employee.businessId,
        title,
        priority: priority ?? "medium",
        status: status ?? "todo",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId ?? user.employeeId,
        createdById: user.employeeId,
        teamId: teamId ?? employee.teamId,
        verticalId: verticalId ?? employee.verticalId,
        departmentId: departmentId ?? employee.departmentId,
        description,
        // Sales Executive task fields (all optional)
        leadId: leadId || null,
        taskType: taskType ?? null,
        dueTime: dueTime ?? null,
        taskResult: taskResult ?? null,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        outcomeNotes: outcomeNotes ?? null,
      },
    });
    res.status(201).json({ data: task });
  })
);

tasksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await prisma.task.delete({
      where: { id },
    });
    res.status(204).end();
  })
);
