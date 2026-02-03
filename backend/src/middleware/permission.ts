import { Elysia } from "elysia";
import { AuthorizationError } from "../utils/errors";
import { authMiddleware } from "./auth";
import db from "../config/db";

/**
 * Permission-Based Access Control Middleware
 *
 * Usage:
 * .use(permissionMiddleware("stock.in.view"))
 * .use(permissionMiddleware(["purchase.create", "purchase.update"]))
 *
 * This middleware checks if the authenticated user has the required permission(s)
 * based on their role's assigned permissions in the database.
 *
 * Automatically includes authMiddleware for authentication.
 */
export const permissionMiddleware =
  (requiredPermissions: string | string[]) => (app: Elysia) =>
    app.use(authMiddleware).derive(async ({ set, user }) => {
      if (!user || !user.role) {
        set.status = 403;
        throw new AuthorizationError("Forbidden: user role not defined");
      }

      // Bypass for Superadmin
      if (user.role.roleCode === "superadmin") {
        return {};
      }

      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      // Fetch user's permissions from database
      const userPermissions = await db.rolePermission.findMany({
        where: {
          roleId: user.role.id,
        },
        include: {
          permission: true,
        },
      });

      const userPermissionCodes = userPermissions.map(
        (rp: { permission: { actionCode: string } }) =>
          rp.permission.actionCode,
      );

      // Check if user has at least one of the required permissions
      const hasPermission = permissions.some((perm) =>
        userPermissionCodes.includes(perm),
      );

      if (!hasPermission) {
        set.status = 403;
        throw new AuthorizationError(
          `Access denied. Required permission(s): ${permissions.join(", ")}`,
        );
      }

      return {};
    });
