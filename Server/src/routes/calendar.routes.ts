import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/prisma.js";

export const calendarRouter = Router();

calendarRouter.use(authenticate, attachScope);

// GET /calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns all calendar events visible to the current user within a date range
calendarRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const scope = req.scope!;
    const user = req.user!;

    const { startDate, endDate } = req.query;

    // Default to current month if no range given
    const now = new Date();
    const start = startDate
      ? new Date(String(startDate))
      : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = endDate
      ? new Date(String(endDate))
      : new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

    // Calendar is strictly personal — each user only sees events they created
    // or were explicitly assigned to. No manager visibility of team events.
    const events = await prisma.calendarEvent.findMany({
      where: {
        date: { gte: start, lte: end },
        OR: [
          { createdById: user.employeeId },
          { assignedToId: user.employeeId },
        ],
      },
      orderBy: { date: "asc" },
    });

    res.json({ data: events });
  })
);

// POST /calendar — Create a new calendar event
calendarRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const {
      title,
      description,
      eventType,
      status,
      priority,
      date,
      startTime,
      endTime,
      assignedToId,
      relatedLeadId,
      relatedTaskId,
      relatedEmployeeId,
      relatedCampaignId,
      relatedModule,
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: "title and date are required" });
    }

    // Resolve employee business
    const employee = await prisma.employee.findUnique({
      where: { id: user.employeeId },
      select: { businessId: true, organizationId: true },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        eventType: eventType || "OTHER",
        status: status || "SCHEDULED",
        priority: priority || "MEDIUM",
        date: new Date(date),
        startTime,
        endTime,
        organizationId: employee.organizationId,
        businessId: employee.businessId,
        createdById: user.employeeId,
        assignedToId: assignedToId || null,
        relatedLeadId: relatedLeadId || null,
        relatedTaskId: relatedTaskId || null,
        relatedEmployeeId: relatedEmployeeId || null,
        relatedCampaignId: relatedCampaignId || null,
        relatedModule: relatedModule || null,
      },
    });

    res.status(201).json({ data: event });
  })
);

// PATCH /calendar/:id — Update an event
calendarRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const id = String(req.params.id);

    // Find the event first for RBAC check
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Calendars are strictly personal: only the event's own member (creator or
    // assignee) may edit it. Managers/Head cannot touch another member's events.
    const isOwner =
      existing.createdById === user.employeeId ||
      existing.assignedToId === user.employeeId;

    if (!isOwner) {
      return res.status(403).json({ error: "You can only modify your own calendar events" });
    }

    const {
      title,
      description,
      eventType,
      status,
      priority,
      date,
      startTime,
      endTime,
      assignedToId,
      relatedLeadId,
      relatedTaskId,
      relatedEmployeeId,
      relatedCampaignId,
      relatedModule,
    } = req.body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (eventType !== undefined) data.eventType = eventType;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (date !== undefined) data.date = new Date(date);
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (assignedToId !== undefined) data.assignedToId = assignedToId;
    if (relatedLeadId !== undefined) data.relatedLeadId = relatedLeadId;
    if (relatedTaskId !== undefined) data.relatedTaskId = relatedTaskId;
    if (relatedEmployeeId !== undefined) data.relatedEmployeeId = relatedEmployeeId;
    if (relatedCampaignId !== undefined) data.relatedCampaignId = relatedCampaignId;
    if (relatedModule !== undefined) data.relatedModule = relatedModule;

    const updated = await prisma.calendarEvent.update({ where: { id }, data });
    res.json({ data: updated });
  })
);

// DELETE /calendar/:id — Delete an event (owner or manager only)
calendarRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const id = String(req.params.id);

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Strictly personal: only the event's creator may delete it.
    const isOwner = existing.createdById === user.employeeId;

    if (!isOwner) {
      return res.status(403).json({ error: "You can only delete your own calendar events" });
    }

    await prisma.calendarEvent.delete({ where: { id } });
    res.status(204).end();
  })
);
