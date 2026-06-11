import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { requireRole, ROLE_LEVEL } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getImmigrationKpis,
  getVerticals,
  getVerticalDetail,
  getLeads,
  getRevenue,
  getCases,
  getTeam,
  getEmployeeDetail,
  getApprovals,
  processApproval,
  getEscalations,
  getReports,
} from "../services/immigration.service.js";
import { getImmigrationTree } from "../services/immigration.tree.service.js";

export const immigrationRouter = Router();

immigrationRouter.use(authenticate, attachScope, requireRole(ROLE_LEVEL.HEAD));

// GET /immigration/tree — structural vertical→department→employee tree
immigrationRouter.get(
  "/tree",
  asyncHandler(async (req, res) => {
    const viewerLevel = (req.user!.employeeLevel ?? req.user!.roleLevel ?? 0) as number;
    const tree = await getImmigrationTree(req.scope!, viewerLevel);
    res.json({ data: tree });
  }),
);

// GET /immigration/kpis
immigrationRouter.get(
  "/kpis",
  asyncHandler(async (req, res) => {
    const data = await getImmigrationKpis(req.scope!);
    res.json({ data });
  }),
);

// GET /immigration/verticals
immigrationRouter.get(
  "/verticals",
  asyncHandler(async (req, res) => {
    const data = await getVerticals(req.scope!);
    res.json({ data });
  }),
);

// GET /immigration/verticals/:id
immigrationRouter.get(
  "/verticals/:id",
  asyncHandler(async (req, res) => {
    const data = await getVerticalDetail(req.scope!, req.params.id as string);
    if (!data) { res.status(404).json({ error: "Vertical not found" }); return; }
    res.json({ data });
  }),
);

// GET /immigration/leads  ?verticalId= &status= &startDate= &endDate= &page= &limit=
immigrationRouter.get(
  "/leads",
  asyncHandler(async (req, res) => {
    const { verticalId, status, startDate, endDate, page, limit } = req.query;
    const data = await getLeads(req.scope!, {
      verticalId: verticalId as string | undefined,
      status:     status     as string | undefined,
      startDate:  startDate  as string | undefined,
      endDate:    endDate    as string | undefined,
      page:  page  ? Number(page)  : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ data });
  }),
);

// GET /immigration/revenue  ?verticalId= &period=month|quarter|year &startDate= &endDate=
immigrationRouter.get(
  "/revenue",
  asyncHandler(async (req, res) => {
    const { verticalId, period, startDate, endDate } = req.query;
    const data = await getRevenue(req.scope!, {
      verticalId: verticalId as string | undefined,
      period:     period     as "month" | "quarter" | "year" | undefined,
      startDate:  startDate  as string | undefined,
      endDate:    endDate    as string | undefined,
    });
    res.json({ data });
  }),
);

// GET /immigration/cases  ?verticalId= &status= &priority= &page= &limit=
immigrationRouter.get(
  "/cases",
  asyncHandler(async (req, res) => {
    const { verticalId, status, priority, page, limit } = req.query;
    const data = await getCases(req.scope!, {
      verticalId: verticalId as string | undefined,
      status:     status     as string | undefined,
      priority:   priority   as string | undefined,
      page:  page  ? Number(page)  : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ data });
  }),
);

// GET /immigration/team  ?verticalId= &departmentId= &teamId= &page= &limit=
immigrationRouter.get(
  "/team",
  asyncHandler(async (req, res) => {
    const { verticalId, departmentId, teamId, page, limit } = req.query;
    const data = await getTeam(req.scope!, {
      verticalId:   verticalId   as string | undefined,
      departmentId: departmentId as string | undefined,
      teamId:       teamId       as string | undefined,
      page:  page  ? Number(page)  : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ data });
  }),
);

// GET /immigration/team/:employeeId
immigrationRouter.get(
  "/team/:employeeId",
  asyncHandler(async (req, res) => {
    const data = await getEmployeeDetail(req.scope!, req.params.employeeId as string);
    if (!data) { res.status(404).json({ error: "Employee not found" }); return; }
    res.json({ data });
  }),
);

// GET /immigration/approvals  ?page= &limit=
immigrationRouter.get(
  "/approvals",
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const data = await getApprovals(req.scope!, {
      page:  page  ? Number(page)  : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ data });
  }),
);

// PATCH /immigration/approvals/:taskId   body: { decision: "approve"|"reject"|"info", reason?: string }
immigrationRouter.patch(
  "/approvals/:taskId",
  asyncHandler(async (req, res) => {
    const { decision, reason } = req.body as { decision: string; reason?: string };
    if (!["approve", "reject", "info"].includes(decision)) {
      res.status(400).json({ error: "decision must be approve | reject | info" }); return;
    }
    const result = await processApproval(
      req.scope!,
      req.params.taskId as string,
      decision as "approve" | "reject" | "info",
      reason,
    );
    if (!result.success) { res.status(404).json({ error: result.error }); return; }
    res.json({ data: { success: true } });
  }),
);

// GET /immigration/escalations  ?verticalId= &page= &limit=
immigrationRouter.get(
  "/escalations",
  asyncHandler(async (req, res) => {
    const { verticalId, page, limit } = req.query;
    const data = await getEscalations(req.scope!, {
      verticalId: verticalId as string | undefined,
      page:  page  ? Number(page)  : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ data });
  }),
);

// GET /immigration/reports  ?type=revenue|leads|team|cases &verticalId= &startDate= &endDate=
immigrationRouter.get(
  "/reports",
  asyncHandler(async (req, res) => {
    const { type, verticalId, startDate, endDate } = req.query;
    const data = await getReports(req.scope!, {
      type:       type       as string | undefined,
      verticalId: verticalId as string | undefined,
      startDate:  startDate  as string | undefined,
      endDate:    endDate    as string | undefined,
    });
    res.json({ data });
  }),
);
