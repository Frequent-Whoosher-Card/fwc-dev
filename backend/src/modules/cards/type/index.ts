import { Elysia, t } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { rbacMiddleware } from "../../../middleware/rbac";
import { formatErrorResponse } from "../../../utils/errors";
import { CardTypeService } from "./service";
import { CardTypeModel } from "./model";

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
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .get(
    "/",
    async (context) => {
      const { set } = context;
      try {
        const cardTypes = await CardTypeService.getCardTypes();

        return {
          success: true,
          message: "Card types fetched successfully",
          data: cardTypes,
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
      body: CardTypeModel.getCardTypesResponse,
      response: {
        200: CardTypeModel.getCardTypesResponse,
        400: CardTypeModel.errorResponse,
        401: CardTypeModel.errorResponse,
        403: CardTypeModel.errorResponse,
        500: CardTypeModel.errorResponse,
      },
      detail: {
        tags: ["Card Type"],
        summary: "Get all card types",
        description: "This endpoint is used to get all card types",
      },
    }
  )
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context as typeof context & AuthContextUser;
      try {
        const cardType = await CardTypeService.getCardTypeById(params.id);

        return {
          success: true,
          message: "Card type fetched successfully",
          data: cardType,
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
        200: CardTypeModel.getCardTypeByIdResponse,
        400: CardTypeModel.errorResponse,
        401: CardTypeModel.errorResponse,
        403: CardTypeModel.errorResponse,
        500: CardTypeModel.errorResponse,
      },
      detail: {
        tags: ["Card Type"],
        summary: "Get card type by ID",
        description: "This endpoint is used to get card type by ID",
      },
    }
  );

const adminRoutes = new Elysia()
  .use(rbacMiddleware(["admin", "superadmin"]))
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const cardType = await CardTypeService.createCardType(
          body.typeCode,
          body.typeName,
          body.routeDescription,
          user.id
        );

        return {
          success: true,
          message: "Card type created successfully",
          data: cardType,
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
      body: CardTypeModel.createCardTypeRequest,
      response: {
        200: CardTypeModel.createCardTypeResponse,
        400: CardTypeModel.errorResponse,
        401: CardTypeModel.errorResponse,
        403: CardTypeModel.errorResponse,
        500: CardTypeModel.errorResponse,
      },
      detail: {
        tags: ["Card Type"],
        summary: "Create new card type",
        description:
          "This endpoint is used to create new card type (superadmin and admin)",
      },
    }
  )
  .put(
    ":id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const cardType = await CardTypeService.editCardType(
          params.id,
          body.typeCode,
          body.typeName,
          body.routeDescription,
          user.id
        );

        return {
          success: true,
          message: "Card type updated successfully",
          data: cardType,
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
      body: CardTypeModel.editCardTypeRequest,
      response: {
        200: CardTypeModel.editCardTypeResponse,
        400: CardTypeModel.errorResponse,
        401: CardTypeModel.errorResponse,
        403: CardTypeModel.errorResponse,
        500: CardTypeModel.errorResponse,
      },
      detail: {
        tags: ["Card Type"],
        summary: "Edit card type",
        description:
          "This endpoint is used to edit card type (superadmin and admin)",
      },
    }
  );

const superadminRoutes = new Elysia()
  .use(rbacMiddleware(["superadmin"]))
  .delete(
    "/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const cardType = await CardTypeService.deleteCardType(
          params.id,
          user.id
        );

        return {
          success: true,
          message: "Card type deleted successfully",
          data: cardType,
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
        200: CardTypeModel.deleteCardTypeResponse,
        400: CardTypeModel.errorResponse,
        401: CardTypeModel.errorResponse,
        403: CardTypeModel.errorResponse,
        500: CardTypeModel.errorResponse,
      },
      detail: {
        tags: ["Card Type"],
        summary: "Delete card type",
        description: "This endpoint is used to delete card type (superadmin)",
      },
    }
  );

export const cardTypes = new Elysia({ prefix: "/card/types" })
  .use(authMiddleware)
  .use(baseRoutes)
  .use(adminRoutes)
  .use(superadminRoutes);
