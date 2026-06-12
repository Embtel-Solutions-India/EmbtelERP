import type { Request, Response } from "express";
import type { SalesLeadContext } from "../services/salesLead.service.js";
import {
  createSalesLead,
  deleteSalesLead,
  listSalesLeads,
  updateSalesLead,
  convertSalesLead,
  transferSalesLead,
} from "../services/salesLead.service.js";

function salesCtx(req: Request): SalesLeadContext {
  return {
    viewer:          req.user!,
    scope:           req.scope!,
    effectiveUserId: req.effectiveUser?.id ?? req.user!.employeeId,
  };
}

export async function listLeads(req: Request, res: Response) {
  res.json({ data: await listSalesLeads(salesCtx(req)) });
}

export async function createLead(req: Request, res: Response) {
  const lead = await createSalesLead(salesCtx(req), req.body);
  res.status(201).json({ data: lead });
}

export async function updateLead(req: Request, res: Response) {
  const lead = await updateSalesLead(salesCtx(req), String(req.params.id), req.body);
  res.json({ data: lead });
}

export async function deleteLead(req: Request, res: Response) {
  await deleteSalesLead(salesCtx(req), String(req.params.id));
  res.status(204).end();
}

export async function convertLead(req: Request, res: Response) {
  const lead = await convertSalesLead(salesCtx(req), String(req.params.id));
  res.json({ data: lead });
}

export async function transferLead(req: Request, res: Response) {
  const lead = await transferSalesLead(salesCtx(req), String(req.params.id));
  res.json({ data: lead });
}
