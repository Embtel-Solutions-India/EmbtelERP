import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { attachScope } from '../middleware/scope.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDashboardSummary } from '../services/dashboard.service.js';
export const dashboardRouter = Router();
dashboardRouter.use(authenticate, attachScope);
dashboardRouter.get('/summary', asyncHandler(async (req, res) => {
    const summary = await getDashboardSummary(req.scope);
    res.json({ data: summary });
}));
