import { Elysia, t } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { permissionMiddleware } from "../../../middleware/permission";
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
  .group("", (app) =>
    app
      .use(permissionMiddleware("card.view"))
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
              stationId: query.stationId as string | undefined,
              stationName: query.stationName as string | undefined,
              programType: query.programType as "FWC" | "VOUCHER" | undefined,
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
              "Get all cards with optional filters. Supports filtering by cardProductId, status, search, and programType (FWC/VOUCHER).",
          },
        },
      )
      // Get First Available Card
      .get(
        "/first-available",
        async (context) => {
          const { query, set } = context as typeof context;
          try {
            const card = await CardService.getFirstAvailableCard(
              query.cardProductId,
              query.status,
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
        },
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
        },
      )
      // Get Card By Serial Number
      .get(
        "/serial/:serialNumber",
        async (context) => {
          const { params, set } = context as typeof context;
          try {
            const card = await CardService.getCardBySerialNumber(
              params.serialNumber,
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
        },
      )
      // Get Cards By Serial Numbers (Batch)
      .post(
        "/batch-by-serials",
        async (context) => {
          const { body, set } = context as typeof context;
          try {
            const result = await CardService.getCardsBySerialNumbers({
              serialNumbers: body.serialNumbers,
              categoryId: body.categoryId,
              typeId: body.typeId,
              status: body.status,
              stationId: body.stationId,
              programType: body.programType,
            });

            return {
              success: true,
              message: `Found ${result.foundCount} of ${result.requestedCount} requested cards`,
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
          body: CardModel.batchBySerialsRequest,
          response: {
            200: CardModel.batchBySerialsResponse,
            400: CardModel.errorResponse,
            401: CardModel.errorResponse,
            403: CardModel.errorResponse,
            500: CardModel.errorResponse,
          },
          detail: {
            tags: ["Card"],
            summary: "Get cards by serial numbers (batch)",
            description:
              "Get multiple cards by their serial numbers in a single request. Supports up to 10000 serial numbers per request. Returns all matching cards with optional filters (categoryId, typeId, status, stationId, programType).",
          },
        },
      )
      // Get Next Available Cards After Serial Number
      .post(
        "/next-available",
        async (context) => {
          const { body, set } = context as typeof context;
          try {
            const result = await CardService.getNextAvailableCards({
              startSerial: body.startSerial,
              quantity: body.quantity,
              categoryId: body.categoryId,
              typeId: body.typeId,
              status: body.status,
              stationId: body.stationId,
              programType: body.programType,
            });

            return {
              success: true,
              message: `Found ${result.foundCount} of ${result.requestedCount} requested cards`,
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
          body: CardModel.getNextAvailableCardsRequest,
          response: {
            200: CardModel.getNextAvailableCardsResponse,
            400: CardModel.errorResponse,
            401: CardModel.errorResponse,
            403: CardModel.errorResponse,
            500: CardModel.errorResponse,
          },
          detail: {
            tags: ["Card"],
            summary: "Get next available cards after serial number",
            description:
              "Get the next available cards starting from a specific serial number, ordered by serial number ascending. Returns cards that match the filters (categoryId, typeId, status, stationId, programType) and are available after the start serial number.",
          },
        },
      ),
  )
  .group("", (app) =>
    app
      // Update Card
      .use(permissionMiddleware("card.update"))
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
        },
      ),
  );

export const cards = new Elysia({ prefix: "/cards" }).use(baseRoutes);
