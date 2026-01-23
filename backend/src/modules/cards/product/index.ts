import { Elysia, t } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { CardProductService } from "./service";
import { formatErrorResponse } from "../../../utils/errors";
import { CardProductModel } from "./model";
import { rbacMiddleware } from "../../../middleware/rbac";

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
  .get(
    "/",
    async (context) => {
      const { query, set } = context as typeof context;

      try {
        const cardProducts = await CardProductService.getCardProducts(
          query?.search,
          query?.programType,
        );

        return {
          success: true,
          message: "Card products fetched successfully",
          data: cardProducts,
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
      query: CardProductModel.getCardProductsQuery,
      response: {
        200: CardProductModel.getCardProductsResponse,
        400: CardProductModel.errorResponse,
        401: CardProductModel.errorResponse,
        403: CardProductModel.errorResponse,
        500: CardProductModel.errorResponse,
      },
      detail: {
        tags: ["Card Product"],
        summary: "Get all card products",
        description: "This endpoint is used to get all card products",
      },
    },
  )
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context as typeof context;
      try {
        const cardProduct = await CardProductService.getCardProductById(
          params.id,
        );

        return {
          success: true,
          message: "Card product fetched successfully",
          data: cardProduct,
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
      params: t.Object({ id: t.String() }),
      response: {
        200: CardProductModel.getCardProductByIdResponse,
        400: CardProductModel.errorResponse,
        401: CardProductModel.errorResponse,
        403: CardProductModel.errorResponse,
        500: CardProductModel.errorResponse,
      },
      detail: {
        tags: ["Card Product"],
        summary: "Get card product by ID",
        description: "This endpoint is used to get card product by ID",
      },
    },
  );

const adminRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["admin", "superadmin"]))
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const cardProduct = await CardProductService.createCardProduct(
          body.categoryId,
          body.typeId,
          body.programType,
          body.totalQuota,
          body.masaBerlaku,
          body.serialTemplate,
          body.price,
          user.id,
        );

        return {
          success: true,
          message: "Card product created successfully",
          data: cardProduct,
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
      body: CardProductModel.createCardProductRequest,
      response: {
        200: CardProductModel.createCardProductResponse,
        400: CardProductModel.errorResponse,
        401: CardProductModel.errorResponse,
        403: CardProductModel.errorResponse,
        500: CardProductModel.errorResponse,
      },
      detail: {
        tags: ["Card Product"],
        summary: "Create new card product",
        description:
          "This endpoint is used to create new card product (superadmin and admin)",
      },
    },
  )
  .put(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const cardProduct = await CardProductService.updateCardProduct(
          params.id,
          body.categoryId,
          body.typeId,
          body.programType,
          body.totalQuota,
          body.masaBerlaku,
          body.serialTemplate,
          body.price,
          user.id,
        );

        return {
          success: true,
          message: "Card product updated successfully",
          data: cardProduct,
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
      params: t.Object({ id: t.String() }),
      body: CardProductModel.updateCardProductRequest,
      response: {
        200: CardProductModel.updateCardProductResponse,
        400: CardProductModel.errorResponse,
        401: CardProductModel.errorResponse,
        403: CardProductModel.errorResponse,
        500: CardProductModel.errorResponse,
      },
      detail: {
        tags: ["Card Product"],
        summary: "Update card product",
        description:
          "This endpoint is used to update card product (superadmin and admin)",
      },
    },
  );

const superadminRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin"]))
  .delete(
    "/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const cardProduct = await CardProductService.deleteCardProduct(
          params.id,
          user.id,
        );

        return {
          success: true,
          message: "Card product deleted successfully",
          data: cardProduct,
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
      params: t.Object({ id: t.String() }),
      response: {
        200: CardProductModel.deleteCardProductResponse,
        400: CardProductModel.errorResponse,
        401: CardProductModel.errorResponse,
        403: CardProductModel.errorResponse,
        500: CardProductModel.errorResponse,
      },
      detail: {
        tags: ["Card Product"],
        summary: "Delete card product",
        description:
          "This endpoint is used to delete card product (superadmin)",
      },
    },
  );

export const cardProducts = new Elysia({ prefix: "/card/product" })
  .use(baseRoutes)
  .use(adminRoutes)
  .use(superadminRoutes);
