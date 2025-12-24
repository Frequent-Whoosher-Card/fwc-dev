import { Elysia } from "elysia";
import { AuthorizationError } from "../utils/errors";

/**
 * RBAC Middleware - Role-Based Access Control
 * 
 * Usage:
 * .use(rbacMiddleware(["superadmin", "admin"]))
 * 
 * This middleware checks if the authenticated user has one of the allowed roles.
 * Must be used after authMiddleware.
 */
export const rbacMiddleware = (allowedRoles: string[]) => {
  return new Elysia({ name: "rbacMiddleware" }).derive((context) => {
    const user = (context as any).user;

    if (!user) {
      throw new AuthorizationError("User not authenticated");
    }

    const userRole = user.role?.roleCode;

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(", ")}`
      );
    }

    return {};
  });
};

