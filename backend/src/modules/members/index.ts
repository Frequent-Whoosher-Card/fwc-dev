import { Elysia, t } from "elysia";
import { MemberModel } from "./model";
import { MemberService } from "./service";
import { rbacMiddleware } from "../../middleware/rbac";
import { formatErrorResponse } from "../../utils/errors";

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

// Base routes (Read) - All authenticated users
// Note: rbacMiddleware automatically includes authMiddleware
const baseRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .get(
    "/",
    async (context) => {
      const { query, set } = context;
      try {
        const result = await MemberService.getAll({
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          search: query.search,
        });
        return {
          success: true,
          data: result,
          message: "Members retrieved successfully",
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: MemberModel.getMembersQuery,
      response: {
        200: MemberModel.getListMemberResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Get all members",
        description: "Retrieve all members with pagination and search",
      },
    }
  )
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await MemberService.getById(params.id);
        return {
          success: true,
          data: result,
          message: "Member retrieved successfully",
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
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: MemberModel.getDetailMemberResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        404: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Get member by ID",
        description: "Retrieve a specific member by ID",
      },
    }
  );

// Write routes (Create, Update) - petugas, supervisor, admin, superadmin
const writeRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await MemberService.create(body, user.id);
        return {
          success: true,
          message: "Member created successfully",
          data: result,
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
      body: MemberModel.createMemberBody,
      response: {
        200: MemberModel.createMemberResponse,
        400: MemberModel.errorResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Create new member",
        description:
          "Create a new member (petugas, supervisor, admin, superadmin)",
      },
    }
  )
  .put(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const result = await MemberService.update(params.id, body, user.id);
        return {
          success: true,
          message: "Member updated successfully",
          data: result,
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
      params: t.Object({
        id: t.String(),
      }),
      body: MemberModel.updateMemberBody,
      response: {
        200: MemberModel.createMemberResponse,
        400: MemberModel.errorResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        404: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Update member",
        description:
          "Update a member (petugas, supervisor, admin, superadmin)",
      },
    }
  );

// Delete routes - admin and superadmin only
const deleteRoutes = new Elysia()
  .use(rbacMiddleware(["admin", "superadmin"]))
  .delete(
    "/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await MemberService.delete(params.id, user.id);
        return result;
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: MemberModel.genericResponse,
        400: MemberModel.errorResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        404: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Delete member (Soft Delete)",
        description: "Soft delete a member (admin, superadmin only)",
      },
    }
  );

// Combine all routes
export const members = new Elysia({ prefix: "/members" })
  .use(baseRoutes)
  .use(writeRoutes)
  .use(deleteRoutes);
