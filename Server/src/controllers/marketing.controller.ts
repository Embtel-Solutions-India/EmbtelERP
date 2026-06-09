import type { Request, Response } from "express";
import type { MarketingRequestContext } from "../services/marketing.service.js";
import {
  createMarketingActivity,
  createMarketingCampaign,
  createMarketingKPI,
  createMarketingLead,
  createMarketingTask,
  getMarketingCampaign,
  getMarketingExecutiveDashboard,
  getMarketingInternDashboard,
  getMarketingManagerDashboard,
  getMarketingTask,
  listMarketingActivities,
  listMarketingCampaigns,
  listMarketingKPIs,
  listMarketingLeads,
  listMarketingTasks,
  updateMarketingActivity,
  updateMarketingCampaign,
  updateMarketingKPI,
  updateMarketingLead,
  updateMarketingTask,
  deleteMarketingCampaign,
  deleteMarketingTask,
  deleteMarketingLead,
} from "../services/marketing.service.js";

function marketingContext(req: Request): MarketingRequestContext {
  return {
    viewer: req.user!,
    scope: req.scope!,
    effectiveUserId: req.effectiveUser?.id ?? req.user!.employeeId,
  };
}

export async function listCampaigns(req: Request, res: Response) {
  res.json({ data: await listMarketingCampaigns(marketingContext(req)) });
}

export async function getCampaign(req: Request, res: Response) {
  res.json({ data: await getMarketingCampaign(marketingContext(req), String(req.params.id)) });
}

export async function createCampaign(req: Request, res: Response) {
  const data = await createMarketingCampaign(marketingContext(req), req.body);
  res.status(201).json({ data });
}

export async function updateCampaign(req: Request, res: Response) {
  res.json({ data: await updateMarketingCampaign(marketingContext(req), String(req.params.id), req.body) });
}

export async function listTasks(req: Request, res: Response) {
  res.json({ data: await listMarketingTasks(marketingContext(req)) });
}

export async function getTask(req: Request, res: Response) {
  res.json({ data: await getMarketingTask(marketingContext(req), String(req.params.id)) });
}

export async function createTask(req: Request, res: Response) {
  const data = await createMarketingTask(marketingContext(req), req.body);
  res.status(201).json({ data });
}

export async function updateTask(req: Request, res: Response) {
  res.json({ data: await updateMarketingTask(marketingContext(req), String(req.params.id), req.body) });
}

export async function listLeads(req: Request, res: Response) {
  res.json({ data: await listMarketingLeads(marketingContext(req)) });
}

export async function createLead(req: Request, res: Response) {
  const data = await createMarketingLead(marketingContext(req), req.body);
  res.status(201).json({ data });
}

export async function updateLead(req: Request, res: Response) {
  res.json({ data: await updateMarketingLead(marketingContext(req), String(req.params.id), req.body) });
}

export async function listActivities(req: Request, res: Response) {
  res.json({ data: await listMarketingActivities(marketingContext(req)) });
}

export async function createActivity(req: Request, res: Response) {
  const data = await createMarketingActivity(marketingContext(req), req.body);
  res.status(201).json({ data });
}

export async function updateActivity(req: Request, res: Response) {
  res.json({ data: await updateMarketingActivity(marketingContext(req), String(req.params.id), req.body) });
}

export async function listKPIs(req: Request, res: Response) {
  res.json({ data: await listMarketingKPIs(marketingContext(req)) });
}

export async function createKPI(req: Request, res: Response) {
  const data = await createMarketingKPI(marketingContext(req), req.body);
  res.status(201).json({ data });
}

export async function updateKPI(req: Request, res: Response) {
  res.json({ data: await updateMarketingKPI(marketingContext(req), String(req.params.id), req.body) });
}

export async function managerDashboard(req: Request, res: Response) {
  res.json({ data: await getMarketingManagerDashboard(marketingContext(req)) });
}

export async function executiveDashboard(req: Request, res: Response) {
  res.json({ data: await getMarketingExecutiveDashboard(marketingContext(req)) });
}

export async function internDashboard(req: Request, res: Response) {
  res.json({ data: await getMarketingInternDashboard(marketingContext(req)) });
}

export async function deleteCampaign(req: Request, res: Response) {
  await deleteMarketingCampaign(marketingContext(req), String(req.params.id));
  res.status(204).end();
}

export async function deleteTask(req: Request, res: Response) {
  await deleteMarketingTask(marketingContext(req), String(req.params.id));
  res.status(204).end();
}

export async function deleteLead(req: Request, res: Response) {
  await deleteMarketingLead(marketingContext(req), String(req.params.id));
  res.status(204).end();
}

