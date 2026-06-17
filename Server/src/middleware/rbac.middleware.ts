import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

// 0–6 hierarchy. `MANAGER` (2) is the Team Head tier (Sales Head / Marketing
// Manager / Documentation Manager); the Vertical Manager sits one tier above it
// at level 3. The `MANAGER` name is kept for the team-head floor so existing
// `requireRole(ROLE_LEVEL.MANAGER)` call-sites keep their "team-head and above"
// meaning.
export const ROLE_LEVEL = {
  INTERN: 0,
  EXECUTIVE: 1,
  MANAGER: 2,
  TEAM_HEAD: 2,
  VERTICAL_MANAGER: 3,
  HEAD: 4,
  BUSINESS_OWNER: 5,
  SUPER_ADMIN: 6,
} as const;

/** Reject requests whose roleLevel is below minLevel. */
export function requireRole(minLevel: number) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if ((req.user?.roleLevel ?? -1) < minLevel) {
      next(new ApiError(403, "Insufficient permissions"));
      return;
    }
    next();
  };
}

/** Deny requests whose caller's role does not carry the named permission code. */
export function requirePermission(code: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!(req.user?.permissions ?? []).includes(code)) {
      next(new ApiError(403, "Permission denied"));
      return;
    }
    next();
  };
}

/** Verify that req.params[idParam] is within the caller's visible employees. */
export function requireEmployeeScope(idParam = "id") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const targetId = String(req.params[idParam]);
    if (!req.dataScope?.visibleEmployees.includes(targetId)) {
      next(new ApiError(403, "Employee not in your scope"));
      return;
    }
    next();
  };
}

/** Verify that req.params[idParam] is within the caller's visible businesses. */
export function requireBusinessScope(idParam = "businessId") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const targetId = String(req.params[idParam]);
    if (!req.dataScope?.visibleBusinesses.includes(targetId)) {
      next(new ApiError(403, "Business not in your scope"));
      return;
    }
    next();
  };
}
