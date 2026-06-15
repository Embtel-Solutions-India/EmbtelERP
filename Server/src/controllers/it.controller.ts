import type { Request, Response } from "express";
import type { ITContext } from "../services/it.service.js";
import {
  getITOverview,
  getITSprint,
  createITTask,
  updateITTask,
  submitEod,
  listMyEod,
  listITProjects,
  getITTeamLoad,
  assignITTask,
  listMyITTasks,
  createMySelfTask,
  updateMySelfTask,
  deleteMySelfTask,
} from "../services/it.service.js";

function itCtx(req: Request): ITContext {
  return {
    viewer:          req.user!,
    scope:           req.scope!,
    effectiveUserId: req.effectiveUser?.id ?? req.user!.employeeId,
  };
}

function firstParam(v: unknown): string | undefined {
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : undefined;
  return typeof v === "string" ? v : undefined;
}

export async function overview(req: Request, res: Response) {
  res.json({ data: await getITOverview(itCtx(req)) });
}

export async function sprint(req: Request, res: Response) {
  res.json({ data: await getITSprint(itCtx(req), { projectId: firstParam(req.query.projectId) }) });
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

export async function projects(req: Request, res: Response) {
  res.json({ data: await listITProjects(itCtx(req)) });
}

export async function teamLoad(req: Request, res: Response) {
  res.json({ data: await getITTeamLoad(itCtx(req)) });
}

export async function assignTask(req: Request, res: Response) {
  const task = await assignITTask(itCtx(req), String(req.params.id), req.body.assigneeId);
  res.json({ data: task });
}

export async function myTasks(req: Request, res: Response) {
  const filter = firstParam(req.query.filter);
  const valid = filter === "assigned" || filter === "self" ? filter : "all";
  res.json({ data: await listMyITTasks(itCtx(req), valid) });
}

export async function createSelfTask(req: Request, res: Response) {
  const task = await createMySelfTask(itCtx(req), req.body);
  res.status(201).json({ data: task });
}

export async function updateSelfTask(req: Request, res: Response) {
  const task = await updateMySelfTask(itCtx(req), String(req.params.id), req.body);
  res.json({ data: task });
}

export async function deleteSelfTask(req: Request, res: Response) {
  res.json({ data: await deleteMySelfTask(itCtx(req), String(req.params.id)) });
}
