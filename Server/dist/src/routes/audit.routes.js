import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { attachScope } from '../middleware/scope.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listAuditLogs } from '../services/audit.service.js';
export const auditRouter = Router();
auditRouter.use(authenticate, attachScope);
auditRouter.get('/', asyncHandler(async (req, res) => {
    const auditLogs = await listAuditLogs(req.scope);
    res.json({ data: auditLogs });
}));
