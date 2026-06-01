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
      perspective?: PerspectiveSession | null;
    }
  }

  interface AuthUser {
    id: string;
    employeeId: string;
    roleLevel: number;
    businessId: string | null;
    organizationId: string | null;
  }
}
