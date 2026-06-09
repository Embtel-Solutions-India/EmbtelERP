import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { requireRole, ROLE_LEVEL } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboardOverview, getDashboardPerformance, getDashboardInsights, getDashboardTeam, getRoleWorkspace, } from "../services/dashboard.service.js";
export const dashboardRouter = Router();
dashboardRouter.use(authenticate, attachScope);
// GET /dashboard/overview - Dashboard overview with KPIs based on perspective
dashboardRouter.get("/overview", asyncHandler(async (req, res) => {
    const overview = await getDashboardOverview(req.scope, req.currentPerspective ?? null);
    res.json({ data: overview });
}));
// GET /dashboard/performance - Performance metrics based on perspective
dashboardRouter.get("/performance", asyncHandler(async (req, res) => {
    const performance = await getDashboardPerformance(req.scope, req.currentPerspective ?? null);
    res.json({ data: performance });
}));
// GET /dashboard/insights - AI-like insights generated from real data
dashboardRouter.get("/insights", asyncHandler(async (req, res) => {
    const insights = await getDashboardInsights(req.scope, req.currentPerspective ?? null);
    res.json({ data: insights });
}));
// GET /dashboard/team - Team rankings and performance based on perspective
dashboardRouter.get("/team", requireRole(ROLE_LEVEL.MANAGER), asyncHandler(async (req, res) => {
    const teams = await getDashboardTeam(req.scope, req.currentPerspective ?? null);
    res.json({ data: teams });
}));
// GET /dashboard/workspace - Role-specific dashboard tools and attention areas
dashboardRouter.get("/workspace", asyncHandler(async (req, res) => {
    const workspace = await getRoleWorkspace(req.scope, req.user, req.currentPerspective ?? null);
    res.json({ data: workspace });
}));
// Legacy /dashboard/summary endpoint (kept for backward compatibility)
dashboardRouter.get("/summary", asyncHandler(async (req, res) => {
    const overview = await getDashboardOverview(req.scope, req.currentPerspective ?? null);
    res.json({ data: overview });
}));
