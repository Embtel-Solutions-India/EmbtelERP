import type { NextFunction, Request, Response } from "express";
import {
  getDataScope,
  getActivePerspectiveForUser,
} from "../services/scope.service.js";
import { ApiError } from "../utils/ApiError.js";

export async function attachScope(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    next(new ApiError(401, "Unauthenticated request"));
    return;
  }

  req.perspective = await getActivePerspectiveForUser(req.user.employeeId);
  req.scope = await getDataScope(
    req.user.employeeId,
    req.perspective?.currentPerspectiveId ?? null,
  );
  next();
}
