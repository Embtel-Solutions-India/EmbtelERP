import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listAuditLogs } from "../services/audit.service.js";

export const auditRouter = Router();

auditRouter.use(authenticate, attachScope);

auditRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = req.query;
    const result = await listAuditLogs(req.scope!, {
      page:       q.page ? Number(q.page) : undefined,
      pageSize:   q.pageSize ? Number(q.pageSize) : undefined,
      sort:       q.sort ? String(q.sort) : undefined,
      order:      q.order === "asc" ? "asc" : "desc",
      search:     q.search ? String(q.search) : undefined,
      action:     q.action ? String(q.action) : undefined,
      entityType: q.entityType ? String(q.entityType) : undefined,
      department: q.department ? String(q.department) : undefined,
      dateFrom:   q.dateFrom ? String(q.dateFrom) : undefined,
      dateTo:     q.dateTo ? String(q.dateTo) : undefined,
    });
    res.json(result);
  }),
);
