import type { Request, Response } from "express";
import type { SalesTaskContext } from "../services/salesTask.service.js";
import {
  createSalesTask,
  deleteSalesTask,
  listSalesTasks,
  updateSalesTask,
} from "../services/salesTask.service.js";

function salesTaskCtx(req: Request): SalesTaskContext {
  return {
    viewer:          req.user!,
    scope:           req.scope!,
    effectiveUserId: req.effectiveUser?.id ?? req.user!.employeeId,
  };
}

export async function listTasks(req: Request, res: Response) {
  res.json({ data: await listSalesTasks(salesTaskCtx(req)) });
}

export async function createTask(req: Request, res: Response) {
  const task = await createSalesTask(salesTaskCtx(req), req.body);
  res.status(201).json({ data: task });
}

export async function updateTask(req: Request, res: Response) {
  const task = await updateSalesTask(salesTaskCtx(req), String(req.params.id), req.body);
  res.json({ data: task });
}

export async function deleteTask(req: Request, res: Response) {
  await deleteSalesTask(salesTaskCtx(req), String(req.params.id));
  res.status(204).end();
}
