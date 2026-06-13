import type { NextFunction, Request, RequestHandler, Response } from "express";

export function asyncHandler(
  // Handlers may early-return `res.status().json()` (a Response) from guard
  // clauses; the wrapper discards the value via `void fn(...)`, so accepting
  // `void | Response` is purely a type widening with no runtime effect.
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}
