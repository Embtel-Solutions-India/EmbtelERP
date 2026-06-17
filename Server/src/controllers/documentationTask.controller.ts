import type { Request, Response } from "express";
import type { DocumentationTaskContext } from "../services/documentationTask.service.js";
import {
  createDocumentationTask,
  deleteDocumentationTask,
  listDocumentationTasks,
  updateDocumentationTask,
} from "../services/documentationTask.service.js";

function documentationTaskCtx(req: Request): DocumentationTaskContext {
  return {
    viewer:          req.user!,
    scope:           req.scope!,
    effectiveUserId: req.effectiveUser?.id ?? req.user!.employeeId,
  };
}

export async function listTasks(req: Request, res: Response) {
  res.json({ data: await listDocumentationTasks(documentationTaskCtx(req)) });
}

export async function createTask(req: Request, res: Response) {
  const task = await createDocumentationTask(documentationTaskCtx(req), req.body);
  res.status(201).json({ data: task });
}

export async function updateTask(req: Request, res: Response) {
  const task = await updateDocumentationTask(documentationTaskCtx(req), String(req.params.id), req.body);
  res.json({ data: task });
}

export async function deleteTask(req: Request, res: Response) {
  await deleteDocumentationTask(documentationTaskCtx(req), String(req.params.id));
  res.status(204).end();
}
