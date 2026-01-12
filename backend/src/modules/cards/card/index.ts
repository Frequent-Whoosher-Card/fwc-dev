import { Elysia, t } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { rbacMiddleware } from "../../../middleware/rbac";
import { formatErrorResponse } from "../../../utils/errors";
import { CardService } from "./service";
import { CardModel } from "./model";

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
  // Get All Cards
  .get(
    "/",
    async (context) => {
      const { query, set } = context as typeof context;

      try {
        const page = query.page ? parseInt(query.page as string) : 1;
        const limit = query.limit ? parseInt(query.limit as string) : 50;

        const result = await CardService.getCards({
          cardProductId: query.cardProductId as string | undefined,
          status: query.status as string | undefined,
          search: query.search as string | undefined,
          categoryId: query.categoryId as string | undefined,
          typeId: query.typeId as string | undefined,
          categoryName: query.categoryName as string | undefined,
          typeName: query.typeName as string | undefined,
          page,
          limit,
        });

        return {
          success: true,
          message: "Cards fetched successfully",
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
      query: CardModel.getCardsQuery,
      response: {
        200: CardModel.getCardsResponse,
        400: CardModel.errorResponse,
        401: CardModel.errorResponse,
        403: CardModel.errorResponse,
        500: CardModel.errorResponse,
      },
      detail: {
        tags: ["Card"],
        summary: "Get all cards",
        description:
          "Get all cards with optional filters. Supports filtering by cardProductId, status (IN_STATION, IN_OFFICE, SOLD_ACTIVE, etc.), and searching by serial number. Includes pagination support.",
      },
    }
  )
  // Get First Available Card
  .get(
    "/first-available",
    async (context) => {
      const { query, set } = context as typeof context;
      try {
        const card = await CardService.getFirstAvailableCard(
          query.cardProductId,
          query.status
        );

        return {
          success: true,
          message: card
            ? "First available card found"
            : "No available card found with the specified criteria",
          data: card,
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
      query: CardModel.getFirstAvailableCardQuery,
      response: {
        200: CardModel.getFirstAvailableCardResponse,
        400: CardModel.errorResponse,
        401: CardModel.errorResponse,
        403: CardModel.errorResponse,
        500: CardModel.errorResponse,
      },
      detail: {
        tags: ["Card"],
        summary: "Get First Available Card Serial",
        description:
          "Get the first matching card based on Category, Type and Status (sorted by Serial Number ASC). status defaults to IN_STATION.",
      },
    }
  )
  // Get Card By ID
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context as typeof context;
      try {
        const card = await CardService.getCardById(params.id);

        return {
          success: true,
          message: "Card fetched successfully",
          data: card,
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
        200: CardModel.getCardByIdResponse,
        400: CardModel.errorResponse,
        401: CardModel.errorResponse,
        403: CardModel.errorResponse,
        500: CardModel.errorResponse,
      },
      detail: {
        tags: ["Card"],
        summary: "Get card by ID",
        description:
          "Get detailed card information by card ID. Returns card data including card product information (category and type), member information (if assigned), and card status.",
      },
    }
  )
  // Get Card By Serial Number
  .get(
    "/serial/:serialNumber",
    async (context) => {
      const { params, set } = context as typeof context;
      try {
        const card = await CardService.getCardBySerialNumber(
          params.serialNumber
        );

        return {
          success: true,
          message: "Card fetched successfully",
          data: card,
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
      params: t.Object({ serialNumber: t.String() }),
      response: {
        200: CardModel.getCardByIdResponse,
        400: CardModel.errorResponse,
        401: CardModel.errorResponse,
        403: CardModel.errorResponse,
        500: CardModel.errorResponse,
      },
      detail: {
        tags: ["Card"],
        summary: "Get card by serial number",
        description:
          "Get detailed card information by serial number. Useful for looking up cards when you only have the serial number. Returns card data including card product information (category and type).",
      },
    }
  )
  // Update Card
  .patch(
    "/:id",
    async (context) => {
      const { params, body, user, set } = context as typeof context &
        AuthContextUser;
      try {
        const updatedCard = await CardService.updateCard(params.id, {
          status: body.status,
          notes: body.notes,
          userId: user.id,
        });

        return {
          success: true,
          message: "Card updated successfully",
          data: updatedCard,
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
      body: CardModel.updateCardBody,
      response: {
        200: CardModel.updateCardResponse,
        400: CardModel.errorResponse,
        401: CardModel.errorResponse,
        403: CardModel.errorResponse,
        500: CardModel.errorResponse,
      },
      detail: {
        tags: ["Card"],
        summary: "Update card status and notes",
        description:
          "Update card status and notes. Only allows status and notes modifications.",
      },
    }
  );

export const cards = new Elysia({ prefix: "/cards" }).use(baseRoutes);
