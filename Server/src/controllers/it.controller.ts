import type { Request, Response } from "express";
import type { ITContext } from "../services/it.service.js";
import {
  getITOverview,
  getITSprint,
  createITTask,
  updateITTask,
  submitEod,
  listMyEod,
} from "../services/it.service.js";

function itCtx(req: Request): ITContext {
  return {
    viewer:          req.user!,
    scope:           req.scope!,
    effectiveUserId: req.effectiveUser?.id ?? req.user!.employeeId,
  };
}

export async function overview(req: Request, res: Response) {
  res.json({ data: await getITOverview(itCtx(req)) });
}

export async function sprint(req: Request, res: Response) {
  res.json({ data: await getITSprint(itCtx(req)) });
}

export async function createTask(req: Request, res: Response) {
  const task = await createITTask(itCtx(req), req.body);
  res.status(201).json({ data: task });
}

export async function updateTask(req: Request, res: Response) {
  const task = await updateITTask(itCtx(req), String(req.params.id), req.body);
  res.json({ data: task });
}

export async function createEod(req: Request, res: Response) {
  const report = await submitEod(itCtx(req), req.body);
  res.status(201).json({ data: report });
}

export async function listEod(req: Request, res: Response) {
  res.json({ data: await listMyEod(itCtx(req)) });
}
