import { Elysia, t } from "elysia";
import { UserService } from "./service";
import { UserModel } from "./model";
import { formatErrorResponse } from "../../utils/errors";
import { authMiddleware } from "../../middleware/auth";
import { rbacMiddleware } from "../../middleware/rbac";

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
    async ({ query, set }) => {
      try {
        const page = query?.page ? parseInt(query.page, 10) : 1;
        const limit = 10; // Fixed at 10 per page as requested

        // Validate page number
        if (isNaN(page) || page < 1) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Page must be a positive integer")
          );
        }

        const result = await UserService.getUsers(page, limit);

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
      query: t.Optional(
        t.Object({
          page: t.Optional(
            t.String({ description: "Page number (default: 1)" })
          ),
        })
      ),
      response: {
        200: UserModel.userListResponse,
        400: UserModel.errorResponse,
        401: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Get all users",
        description: "Retrieve all active users with pagination (10 per page)",
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
          body.confirmPassword
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
  );

// Admin routes (superadmin and admin only)
const adminRoutes = new Elysia()
  .use(rbacMiddleware(["superadmin", "admin"]))
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
  .use(rbacMiddleware(["superadmin"]))
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
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        await UserService.deleteUser(params.id, user.id);

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
      response: {
        200: UserModel.successResponse,
        403: UserModel.errorResponse,
        404: UserModel.errorResponse,
        500: UserModel.errorResponse,
      },
      detail: {
        tags: ["Users & Roles"],
        summary: "Delete user",
        description: "Soft delete a user (superadmin only)",
      },
    }
  );

// Combine all routes
export const users = new Elysia({ prefix: "/users" })
  .use(authMiddleware)
  .use(baseRoutes)
  .use(adminRoutes)
  .use(superadminRoutes);
