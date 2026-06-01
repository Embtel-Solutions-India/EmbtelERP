import { getDataScope, getActivePerspectiveForUser, } from "../services/scope.service.js";
import { ApiError } from "../utils/ApiError.js";
export async function attachScope(req, _res, next) {
    if (!req.user) {
        next(new ApiError(401, "Unauthenticated request"));
        return;
    }
    req.perspective = await getActivePerspectiveForUser(req.user.employeeId, req.user.sessionId);
    req.scope = await getDataScope(req.user.employeeId, req.perspective?.currentPerspectiveId ?? null);
    next();
}
