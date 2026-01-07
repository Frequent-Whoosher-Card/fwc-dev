import { Elysia } from "elysia";
import { AuthorizationError } from "../utils/errors";
import { authMiddleware } from "./auth";

/**
 * RBAC Middleware - Role-Based Access Control
 * 
 * Usage:
 * .use(rbacMiddleware(["superadmin", "admin"]))
 * 
 * This middleware automatically includes authMiddleware and checks if the
 * authenticated user has one of the allowed roles.
 * 
 * Pattern follows BRI project: rolesMiddleware automatically includes authMiddleware
 */
export const rbacMiddleware = (allowedRoles: string[]) => (app: Elysia) =>
  app.use(authMiddleware).derive(({ set, user }) => {
    if (!user || !user.role) {
      set.status = 403;
      throw new AuthorizationError("Forbidden: user role not defined");
    }

    const userRole = user.role.roleCode;

    if (!userRole || !allowedRoles.includes(userRole)) {
      set.status = 403;
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(", ")}`
      );
    }

    return {};
  });

