import { getDataScope, getActivePerspectiveForUser, } from "../services/scope.service.js";
import { ApiError } from "../utils/ApiError.js";
export async function attachScope(req, _res, next) {
    if (!req.user) {
        next(new ApiError(401, "Unauthenticated request"));
        return;
    }
    // viewer: the authenticated user (employee record may be fetched by services)
    req.viewer = req.user;
    // active perspective session (if any) and effective data scope
    req.perspective = await getActivePerspectiveForUser(req.user.employeeId);
    // effectiveUserId: if perspective exists use that id, otherwise viewer's employeeId
    const effectiveId = req.perspective?.currentPerspectiveId ?? req.user.employeeId;
    req.effectiveUser = { id: effectiveId };
    // dataScope for the effective user as seen by the viewer
    req.dataScope = await getDataScope(req.user.employeeId, req.perspective?.currentPerspectiveId ?? null);
    // keep legacy alias `scope` for existing code
    req.scope = req.dataScope;
    next();
}
