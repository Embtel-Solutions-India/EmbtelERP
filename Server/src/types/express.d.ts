import type {
  DataScope,
  PerspectiveSession,
} from "../services/scope.service.js";

export {};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      scope?: DataScope;
      dataScope?: DataScope;
      perspective?: PerspectiveSession | null;
      viewer?: AuthUser;
      effectiveUser?: { id: string } | null;
    }
  }

  interface AuthUser {
    id: string;
    employeeId: string;
    roleLevel: number;
    employeeLevel?: number;
    businessId: string | null;
    organizationId: string | null;
  }
}
