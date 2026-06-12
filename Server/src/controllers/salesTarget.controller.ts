import type { Request, Response } from "express";
import type { SalesTargetContext } from "../services/salesTarget.service.js";
import {
  listTargets,
  getTarget,
  getTargetHistory,
  getTargetSummary,
  getAssignableUsers,
  createTarget,
  updateTarget,
  reassignTarget,
  cancelTarget,
} from "../services/salesTarget.service.js";

function ctxOf(req: Request): SalesTargetContext {
  return {
    viewer:          req.user!,
    scope:           req.scope!,
    effectiveUserId: req.effectiveUser?.id ?? req.user!.employeeId,
  };
}

export async function listTargetsHandler(req: Request, res: Response) {
  res.json({ data: await listTargets(ctxOf(req)) });
}
export async function targetSummaryHandler(req: Request, res: Response) {
  res.json({ data: await getTargetSummary(ctxOf(req)) });
}
export async function assignableUsersHandler(req: Request, res: Response) {
  res.json({ data: await getAssignableUsers(ctxOf(req)) });
}
export async function getTargetHandler(req: Request, res: Response) {
  res.json({ data: await getTarget(ctxOf(req), String(req.params.id)) });
}
export async function targetHistoryHandler(req: Request, res: Response) {
  res.json({ data: await getTargetHistory(ctxOf(req), String(req.params.id)) });
}
export async function createTargetHandler(req: Request, res: Response) {
  res.status(201).json({ data: await createTarget(ctxOf(req), req.body) });
}
export async function updateTargetHandler(req: Request, res: Response) {
  res.json({ data: await updateTarget(ctxOf(req), String(req.params.id), req.body) });
}
export async function reassignTargetHandler(req: Request, res: Response) {
  res.json({ data: await reassignTarget(ctxOf(req), String(req.params.id), String(req.body.assignedToId)) });
}
export async function cancelTargetHandler(req: Request, res: Response) {
  res.json({ data: await cancelTarget(ctxOf(req), String(req.params.id)) });
}
