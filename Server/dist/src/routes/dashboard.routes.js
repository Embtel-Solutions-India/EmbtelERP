import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { ROLE_LEVEL } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/prisma.js";
import { defaultDashboardConfigs } from "../config/defaultDashboardConfig.js";
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
dashboardRouter.get("/team", asyncHandler(async (req, res) => {
    if ((req.user?.roleLevel ?? -1) < ROLE_LEVEL.MANAGER) {
        return res.json({ data: [] });
    }
    const teams = await getDashboardTeam(req.scope, req.currentPerspective ?? null);
    res.json({ data: teams });
}));
// GET /dashboard/workspace - Role-specific dashboard tools and attention areas
dashboardRouter.get("/workspace", asyncHandler(async (req, res) => {
    const workspace = await getRoleWorkspace(req.scope, req.user, req.currentPerspective ?? null);
    res.json({ data: workspace });
}));
// GET /dashboard/layout/:role - Fetch layout configuration for a role
dashboardRouter.get("/layout/:role", asyncHandler(async (req, res) => {
    const { role } = req.params;
    let configs = await prisma.dashboardConfig.findMany({
        where: { role },
        orderBy: { position: "asc" }
    });
    if (!configs.length && defaultDashboardConfigs[role]) {
        // Seed default configs to database
        const defaults = defaultDashboardConfigs[role];
        await prisma.dashboardConfig.createMany({
            data: defaults.map(d => ({
                role,
                widget: d.widget,
                position: d.position,
                priority: d.priority,
                colSpan: d.colSpan,
                height: d.height
            }))
        });
        configs = await prisma.dashboardConfig.findMany({
            where: { role },
            orderBy: { position: "asc" }
        });
    }
    res.json({ data: configs });
}));
// POST /dashboard/layout/:role - Save layout configuration for a role
dashboardRouter.post("/layout/:role", asyncHandler(async (req, res) => {
    const { role } = req.params;
    const { widgets } = req.body;
    if (!Array.isArray(widgets)) {
        return res.status(400).json({ error: "Invalid widgets array" });
    }
    // Delete existing and bulk create new ones
    await prisma.dashboardConfig.deleteMany({ where: { role } });
    await prisma.dashboardConfig.createMany({
        data: widgets.map((w, index) => ({
            role,
            widget: w.widget,
            position: index + 1,
            priority: w.priority || "medium",
            colSpan: w.colSpan,
            height: w.height || "auto"
        }))
    });
    const updated = await prisma.dashboardConfig.findMany({
        where: { role },
        orderBy: { position: "asc" }
    });
    res.json({ data: updated });
}));
// Legacy /dashboard/summary endpoint (kept for backward compatibility)
dashboardRouter.get("/summary", asyncHandler(async (req, res) => {
    const overview = await getDashboardOverview(req.scope, req.currentPerspective ?? null);
    res.json({ data: overview });
}));
