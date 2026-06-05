import { vi, describe, it, expect, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import {
  requireRole,
  requireEmployeeScope,
  requireBusinessScope,
  ROLE_LEVEL,
} from "../src/middleware/rbac.middleware.js";
import { ApiError } from "../src/utils/ApiError.js";

function makeReq(overrides: Partial<Request> = {}): Request {
  return overrides as unknown as Request;
}

describe("requireRole", () => {
  it("calls next when roleLevel meets minimum", () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ user: { roleLevel: ROLE_LEVEL.HEAD } as AuthUser });
    requireRole(ROLE_LEVEL.HEAD)(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next with ApiError 403 when roleLevel is too low", () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ user: { roleLevel: ROLE_LEVEL.EXECUTIVE } as AuthUser });
    requireRole(ROLE_LEVEL.BUSINESS_OWNER)(req, {} as Response, next);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
  });

  it("rejects when user is missing", () => {
    const next = vi.fn() as NextFunction;
    requireRole(ROLE_LEVEL.INTERN)(makeReq(), {} as Response, next);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
  });

  it("Super Admin (5) passes any level gate", () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ user: { roleLevel: ROLE_LEVEL.SUPER_ADMIN } as AuthUser });
    requireRole(ROLE_LEVEL.SUPER_ADMIN)(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe("requireEmployeeScope", () => {
  const scope = {
    visibleEmployees: ["emp1", "emp2"],
    visibleBusinesses: [],
    visibleDepartments: [],
    visibleTeams: [],
  };

  it("passes when :id is in visible employees", () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ params: { id: "emp1" }, dataScope: scope });
    requireEmployeeScope("id")(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("returns 403 when :id is not in visible employees", () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ params: { id: "emp_outside" }, dataScope: scope });
    requireEmployeeScope("id")(req, {} as Response, next);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
  });

  it("returns 403 when dataScope is absent", () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ params: { id: "emp1" } });
    requireEmployeeScope("id")(req, {} as Response, next);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
  });
});

describe("requireBusinessScope", () => {
  const scope = {
    visibleEmployees: [],
    visibleBusinesses: ["b1"],
    visibleDepartments: [],
    visibleTeams: [],
  };

  it("passes when businessId is in visible businesses", () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ params: { businessId: "b1" }, dataScope: scope });
    requireBusinessScope("businessId")(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("returns 403 when businessId is not in visible businesses", () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ params: { businessId: "b_outside" }, dataScope: scope });
    requireBusinessScope("businessId")(req, {} as Response, next);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
  });
});
