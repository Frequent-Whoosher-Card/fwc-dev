import { Elysia, t } from "elysia";
import { UserService } from "./service";
import { UserModel } from "./model";
import { formatErrorResponse } from "../../utils/errors";
import { authMiddleware } from "../../middleware/auth";
import { permissionMiddleware } from "../../middleware/permission";

type AuthContextUser = {
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    role: {
      id: string;
      roleCode: string;
      roleName: string;
    };
  };
};

// Base routes with authentication
const baseRoutes = new Elysia()
  // Get All Roles - All authenticated users
  .get(
    "/roles",
    async ({ set }) => {
      try {
        const roles = await UserService.getRoles();

        return {
          success: true,
          data: roles,
          message: "Roles retrieved successfully",
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: UserModel.roleListResponse,
        401: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Get all roles",
        description: "Retrieve all active roles",
      },
    }
  )
  // Get Role by ID - All authenticated users
  .get(
    "/roles/:id",
    async ({ params, set }) => {
      try {
        const role = await UserService.getRoleById(params.id);

        return {
          success: true,
          data: role,
          message: "Role retrieved successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: UserModel.singleRoleResponse,
        401: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Get role by ID",
        description: "Retrieve a specific role by ID",
      },
    }
  )
  // Get All Users - All authenticated users
  .get(
    "",
    async (context) => {
      const { query, set } = context;
      try {
        const { page, limit, search, roleId, stationId, isActive } = query;

        const result = await UserService.getUsers({
          page: page ? parseInt(page) : undefined,
          limit: limit ? parseInt(limit) : undefined,
          search,
          roleId,
          stationId,
          isActive: isActive ? isActive === "true" : undefined,
          isDeleted: query.isDeleted ? query.isDeleted === "true" : undefined,
        });

        return {
          success: true,
          data: result.data,
          pagination: result.pagination,
          message: "Users retrieved successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: UserModel.getUsersQuery,
      response: {
        200: UserModel.userListResponse,
        400: UserModel.errorResponse,
        401: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Get all users",
        description: `Retrieve all active users with pagination, filters, and search.

**Filters:**
- **search**: Search across username, full name, email, NIP, or phone (case-insensitive partial match)
- **roleId**: Filter by role ID (UUID)
- **stationId**: Filter by station ID (UUID)
- **isActive**: Filter by active status (true/false)

**Pagination:**
- **page**: Page number (default: 1)
- **limit**: Items per page (default: 10)

**Examples:**
- Search: \`?search=john\`
- Filter by role: \`?roleId=uuid\`
- Filter active users: \`?isActive=true\`
- Combined: \`?search=admin&roleId=uuid&isActive=true&page=1&limit=20\``,
      },
    }
  )
  // Get User by ID - All authenticated users
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context;
      try {
        const user = await UserService.getUserById(params.id);

        return {
          success: true,
          data: user,
          message: "User retrieved successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: UserModel.singleUserResponse,
        401: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Get user by ID",
        description: "Retrieve a specific user by ID",
      },
    }
  )
  // Change Password - User can change their own password
  .post(
    "/:id/change-password",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        // User can only change their own password unless they are superadmin/admin
        const targetUserId = params.id;
        const isOwnAccount = user.id === targetUserId;
        const isAdmin =
          user.role?.roleCode === "superadmin" ||
          user.role?.roleCode === "admin";

        if (!isOwnAccount && !isAdmin) {
          set.status = 403;
          return formatErrorResponse(
            new Error("You can only change your own password")
          );
        }

        await UserService.changePassword(
          targetUserId,
          body.currentPassword,
          body.newPassword,
          body.confirmPassword,
          isAdmin // ignoreCurrentPassword if admin
        );

        return {
          success: true,
          message: "Password changed successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: UserModel.changePasswordBody,
      response: {
        200: UserModel.successResponse,
        400: UserModel.errorResponse,
        403: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Change user password",
        description: "Change password for a user",
      },
    }
  )
  // Get Current User's Menu
  .get(
    "/me/menu",
    async (context) => {
      const { user, set } = context as typeof context & AuthContextUser;
      try {
        const { MenuAccessService } = await import("../menu-access/service");
        const menu = await MenuAccessService.getUserMenu(user.id);

        return {
          success: true,
          message: "User menu fetched successfully",
          data: menu,
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: UserModel.userMenuResponse,
        401: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Get current user's menu",
        description: "Get menu items accessible to current user based on their permissions",
      },
    }
  );

// Admin routes (superadmin and admin only)
const adminRoutes = new Elysia()
  .use(permissionMiddleware("user.manage"))
  // Create Role
  .post(
    "/roles",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const role = await UserService.createRole(body);

        return {
          success: true,
          data: role,
          message: "Role created successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: UserModel.createRoleBody,
      response: {
        200: UserModel.singleRoleResponse,
        400: UserModel.errorResponse,
        403: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Create a new role",
        description: "Create a new role (superadmin/admin only)",
      },
    }
  )
  // Update Role
  .put(
    "/roles/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const role = await UserService.updateRole(params.id, body, user.id);

        return {
          success: true,
          data: role,
          message: "Role updated successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: UserModel.updateRoleBody,
      response: {
        200: UserModel.singleRoleResponse,
        400: UserModel.errorResponse,
        403: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Update role",
        description: "Update a role (superadmin/admin only)",
      },
    }
  )
  // Get Role Permissions
  .get(
    "/roles/:id/permissions",
    async (context) => {
      const { params, set } = context as typeof context & AuthContextUser;
      try {
        const permissions = await UserService.getRolePermissions(params.id);

        return {
          success: true,
          message: "Role permissions fetched successfully",
          data: permissions,
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: UserModel.rolePermissionsResponse,
        400: UserModel.errorResponse,
        403: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Get role permissions",
        description: "Get all permissions assigned to a specific role",
      },
    }
  )
  // Update Role Permissions
  .put(
    "/roles/:id/permissions",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        await UserService.updateRolePermissions(
          params.id,
          body.permissionIds,
          user.id
        );

        return {
          success: true,
          message: "Role permissions updated successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: UserModel.updateRolePermissionsBody,
      response: {
        200: UserModel.successResponse,
        400: UserModel.errorResponse,
        403: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Update role permissions",
        description: "Update permissions assigned to a specific role",
      },
    }
  )
  // Create User
  .post(
    "",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const newUser = await UserService.createUser(body, user.id);

        return {
          success: true,
          data: newUser,
          message: "User created successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: UserModel.createUserBody,
      response: {
        200: UserModel.singleUserResponse,
        400: UserModel.errorResponse,
        403: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Create a new user",
        description: "Create a new user (superadmin/admin only)",
      },
    }
  )
  // Update User
  .put(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const updatedUser = await UserService.updateUser(
          params.id,
          body,
          user.id
        );

        return {
          success: true,
          data: updatedUser,
          message: "User updated successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: UserModel.updateUserBody,
      response: {
        200: UserModel.singleUserResponse,
        400: UserModel.errorResponse,
        403: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Update user",
        description: "Update a user (superadmin/admin only)",
      },
    }
  );

// Superadmin routes (superadmin only)
const superadminRoutes = new Elysia()
  .use(permissionMiddleware("role.manage"))
  // Delete Role
  .delete(
    "/roles/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        await UserService.deleteRole(params.id, user.id);

        return {
          success: true,
          message: "Role deleted successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: UserModel.successResponse,
        400: UserModel.errorResponse,
        403: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Delete role",
        description: "Soft delete a role (superadmin only)",
      },
    }
  )
  // Delete User
  .delete(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        await UserService.deleteUser(params.id, user.id, body.reason);

        return {
          success: true,
          message: "User deleted successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: UserModel.deleteUserBody,
      response: {
        200: UserModel.successResponse,
        400: UserModel.errorResponse,
        403: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Delete user",
        description: "Soft delete a user with a reason (superadmin only)",
      },
    }
  );

// Combine all routes
export const users = new Elysia({ prefix: "/users" })
  .use(authMiddleware)
  .use(baseRoutes)
  .use(adminRoutes)
  .use(superadminRoutes);
