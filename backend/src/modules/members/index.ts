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
        const { page, limit, search, startDate, endDate, gender } = query;
        
        // Validate dates if provided
        if (startDate && isNaN(new Date(startDate).getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid startDate format. Please use YYYY-MM-DD.")
          );
        }
        if (endDate && isNaN(new Date(endDate).getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid endDate format. Please use YYYY-MM-DD.")
          );
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Start date cannot be after end date.")
          );
        }

        const result = await MemberService.getAll({
          page: page ? parseInt(page) : undefined,
          limit: limit ? parseInt(limit) : undefined,
          search,
          startDate,
          endDate,
          gender,
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
        description: "Retrieve all members with pagination, search, membership date filter, and gender filter. Search supports: name, identity number, email, phone, and updated by (user name). Optional startDate, endDate, and gender parameters can be used to filter members.",
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

// Write routes (Create) - petugas, supervisor, admin, superadmin
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
  );

// Update routes - petugas, supervisor, superadmin only
const updateRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "superadmin"]))
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
          "Update a member (petugas, supervisor, superadmin only)",
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

// OCR Extract routes - petugas, supervisor, admin, superadmin
const ocrRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .post(
    "/ocr-extract",
    async (context) => {
      const { body, set } = context as typeof context & AuthContextUser;
      try {
        // Handle multipart/form-data
        // Elysia automatically parses multipart/form-data
        const formData = body as any;
        const file = formData?.image || formData?.file || formData?.ktp;

        if (!file) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Image file is required. Please upload a KTP image.")
          );
        }

        // Convert to File object if it's not already
        let fileObj: File;
        if (file instanceof File) {
          fileObj = file;
        } else if (file && typeof file === "object" && "data" in file) {
          // Handle case where file might be in different format
          const fileData = file as any;
          fileObj = new File([fileData.data], fileData.name || "ktp.jpg", {
            type: fileData.type || "image/jpeg",
          });
        } else {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid file format. Please upload a valid image file.")
          );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(fileObj.type)) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid file type. Please upload a JPEG, PNG, or WebP image.")
          );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (fileObj.size > maxSize) {
          set.status = 400;
          return formatErrorResponse(
            new Error("File size too large. Maximum size is 10MB.")
          );
        }

        const result = await MemberService.extractKTPFields(fileObj);
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
      body: t.Object({
        image: t.File({
          type: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        }),
      }),
      response: {
        200: MemberModel.ocrExtractResponse,
        400: MemberModel.errorResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Extract KTP fields using OCR",
        description:
          "Extract KTP fields (NIK, name, gender, address, etc.) from uploaded KTP image using OCR (petugas, supervisor, admin, superadmin)",
      },
    }
  );

// Combine all routes
export const members = new Elysia({ prefix: "/members" })
  .use(baseRoutes)
  .use(writeRoutes)
  .use(updateRoutes)
  .use(deleteRoutes)
  .use(ocrRoutes);
