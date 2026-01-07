import { Elysia, t } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { rbacMiddleware } from "../../../middleware/rbac";
import { formatErrorResponse } from "../../../utils/errors";
import { CardCategoryService } from "./service";
import { CardCategoryModel } from "./model";

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

const baseRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  // Get All Card Category
  .get(
    "/",
    async (context) => {
      const { set } = context as typeof context;

      try {
        const cardCategories = await CardCategoryService.getCardCategories();

        return {
          success: true,
          message: "Card categories fetched successfully",
          data: cardCategories,
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
        200: CardCategoryModel.getCardCategoriesResponse,
        400: CardCategoryModel.errorResponse,
        401: CardCategoryModel.errorResponse,
        403: CardCategoryModel.errorResponse,
        500: CardCategoryModel.errorResponse,
      },
      detail: {
        tags: ["Card Category"],
        summary: "Get all card categories",
        description: "This endpoint is used to get all card categories",
      },
    }
  )
  // Get Card Category By Id
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context as typeof context & AuthContextUser;
      try {
        const cardCategory = await CardCategoryService.getCardCategoryById(
          params.id
        );

        return {
          success: true,
          message: "Card category fetched successfully",
          data: cardCategory,
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
        200: CardCategoryModel.getCardCategoryByIdResponse,
        400: CardCategoryModel.errorResponse,
        401: CardCategoryModel.errorResponse,
        403: CardCategoryModel.errorResponse,
        500: CardCategoryModel.errorResponse,
      },
      detail: {
        tags: ["Card Category"],
        summary: "Get card category by ID",
        description: "This endpoint is used to get card category by ID",
      },
    }
  );

const adminRoutes = new Elysia()
  .use(rbacMiddleware(["admin", "superadmin"]))
  // Create Card Category
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const cardCategory = await CardCategoryService.createCardCategory(
          body.categoryCode,
          body.categoryName,
          body.description,
          user.id
        );

        return {
          success: true,
          message: "Card category created successfully",
          data: cardCategory,
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
      body: CardCategoryModel.createCardCategoryRequest,
      response: {
        200: CardCategoryModel.createCardCategoryResponse,
        400: CardCategoryModel.errorResponse,
        401: CardCategoryModel.errorResponse,
        403: CardCategoryModel.errorResponse,
        500: CardCategoryModel.errorResponse,
      },
      detail: {
        tags: ["Card Category"],
        summary: "Create new card category",
        description:
          "This endpoint is used to create new card category (superadmin and admin)",
      },
    }
  )
  // Edit Card Category
  .put(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const cardCategory = await CardCategoryService.editCardCategory(
          params.id,
          body.categoryCode,
          body.categoryName,
          body.description,
          user.id
        );

        return {
          success: true,
          message: "Card category updated successfully",
          data: cardCategory,
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
      body: CardCategoryModel.editCardCategoryRequest,
      response: {
        200: CardCategoryModel.editCardCategoryResponse,
        400: CardCategoryModel.errorResponse,
        401: CardCategoryModel.errorResponse,
        403: CardCategoryModel.errorResponse,
        500: CardCategoryModel.errorResponse,
      },
      detail: {
        tags: ["Card Category"],
        summary: "Update card category",
        description:
          "This endpoint is used to update card category (superadmin and admin)",
      },
    }
  );

// Superadmin only
const superadminRoutes = new Elysia()
  .use(rbacMiddleware(["superadmin"]))
  // Delete Card Category
  .delete(
    "/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const cardCategory = await CardCategoryService.deleteCardCategory(
          params.id,
          user.id
        );

        return {
          success: true,
          message: "Card category deleted successfully",
          data: cardCategory,
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
        200: CardCategoryModel.deleteCardCategoryResponse,
        400: CardCategoryModel.errorResponse,
        401: CardCategoryModel.errorResponse,
        403: CardCategoryModel.errorResponse,
        500: CardCategoryModel.errorResponse,
      },
      detail: {
        tags: ["Card Category"],
        summary: "Delete card category",
        description:
          "This endpoint is used to delete card category (superadmin only)",
      },
    }
  );

export const cardCategory = new Elysia({ prefix: "/card/category" })
  .use(authMiddleware)
  .use(baseRoutes)
  .use(adminRoutes)
  .use(superadminRoutes);
