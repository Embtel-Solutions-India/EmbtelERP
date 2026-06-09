import { getDataScope } from "../services/scope.service.js";
import { getActivePerspectiveForUser } from "../services/perspective.service.js";
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
    // Read-only enforcer for impersonation
    if (req.perspective && req.perspective.perspectiveTargetId !== req.user.employeeId) {
        const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
        if (isMutating) {
            next(new ApiError(403, "Data modification is not allowed while impersonating (read-only mode)"));
            return;
        }
    }
    // currentPerspective for dashboard queries - centralized filter logic
    if (req.perspective) {
        req.currentPerspective = {
            type: req.perspective.perspectiveType,
            targetId: req.perspective.perspectiveTargetId,
        };
    }
    else {
        req.currentPerspective = null;
    }
    // effectiveUserId: if perspective exists use that id, otherwise viewer's employeeId
    const effectiveId = req.perspective?.perspectiveTargetId ?? req.user.employeeId;
    req.effectiveUser = { id: effectiveId };
    // dataScope for the effective user as seen by the viewer
    req.dataScope = await getDataScope(req.user.employeeId, req.perspective?.perspectiveTargetId ?? null);
    // keep legacy alias `scope` for existing code
    req.scope = req.dataScope;
    next();
}
