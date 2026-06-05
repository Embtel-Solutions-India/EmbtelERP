import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

export const ROLE_LEVEL = {
  INTERN: 0,
  EXECUTIVE: 1,
  MANAGER: 2,
  HEAD: 3,
  BUSINESS_OWNER: 4,
  SUPER_ADMIN: 5,
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
