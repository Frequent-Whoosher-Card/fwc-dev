<<<<<<< HEAD
import { Elysia, t } from "elysia";
import { rbacMiddleware } from "../../../middleware/rbac";
import { formatErrorResponse } from "../../../utils/errors";
import { CardGenerateService } from "./service";
import { CardGenerateModel } from "./model";

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

export const cardGenerateRoutes = new Elysia({ prefix: "/cards/generate" })
  .use(rbacMiddleware(["superadmin", "admin"])) // Asumsi hanya admin/superadmin yang boleh generate
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;

      try {
        const result = await CardGenerateService.generate({
          cardProductId: body.cardProductId,
          startSerial: body.startSerial,
          endSerial: body.endSerial,
          userId: user.id || "00000000-0000-0000-0000-000000000000",
        });

        return {
          status: "success",
          message: "Cards generated successfully",
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
      body: CardGenerateModel.generateBody,
      response: {
        200: CardGenerateModel.generateResponse,
        // Add error responses as needed in model or generic error format
      },
      detail: {
        tags: ["Cards Generate"],
        summary: "Generate Cards",
        description: "Generate cards and barcode images.",
      },
    }
  );
=======
import { Elysia, t } from "elysia";
import { rbacMiddleware } from "../../../middleware/rbac";
import { formatErrorResponse } from "../../../utils/errors";
import { CardGenerateService } from "./service";
import { CardGenerateModel } from "./model";

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

export const cardGenerateRoutes = new Elysia({ prefix: "/cards/generate" })
  .use(rbacMiddleware(["superadmin", "admin"])) // Asumsi hanya admin/superadmin yang boleh generate
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;

      try {
        const result = await CardGenerateService.generate({
          cardProductId: body.cardProductId,
          startSerial: body.startSerial,
          endSerial: body.endSerial,
          userId: user.id || "00000000-0000-0000-0000-000000000000",
        });

        return {
          status: "success",
          message: "Cards generated successfully",
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
      body: CardGenerateModel.generateBody,
      response: {
        200: CardGenerateModel.generateResponse,
        400: CardGenerateModel.errorResponse,
        401: CardGenerateModel.errorResponse,
        403: CardGenerateModel.errorResponse,
        404: CardGenerateModel.errorResponse,
        409: CardGenerateModel.errorResponse,
        422: CardGenerateModel.errorResponse,
        500: CardGenerateModel.errorResponse,
      },
      detail: {
        tags: ["Cards Generate"],
        summary: "Generate Cards",
        description: "Generate cards and barcode images.",
      },
    }
  )
  .get(
    "/history",
    async (context) => {
      const { query, set } = context;
      try {
        const result = await CardGenerateService.getHistory(query);
        return {
          success: true,
          message: "History retrieved successfully",
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
      query: CardGenerateModel.getHistoryQuery,
      response: {
        200: CardGenerateModel.getHistoryResponse,
        400: CardGenerateModel.errorResponse,
        401: CardGenerateModel.errorResponse,
        403: CardGenerateModel.errorResponse,
        404: CardGenerateModel.errorResponse,
        422: CardGenerateModel.errorResponse,
        500: CardGenerateModel.errorResponse,
      },
      detail: {
        tags: ["Cards Generate"],
        summary: "Get History",
        description: "Get history of card generation.",
      },
    }
  )
  .get(
    "/history/:id",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await CardGenerateService.getHistoryDetail(params.id);
        return {
          success: true,
          message: "History detail retrieved successfully",
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
        id: t.String({ format: "uuid" }),
      }),
      response: {
        200: CardGenerateModel.getHistoryDetailResponse,
        400: CardGenerateModel.errorResponse,
        401: CardGenerateModel.errorResponse,
        403: CardGenerateModel.errorResponse,
        404: CardGenerateModel.errorResponse,
        500: CardGenerateModel.errorResponse,
      },
      detail: {
        tags: ["Cards Generate"],
        summary: "Get History Detail",
        description:
          "Get detailed history of a specific card generation batch.",
      },
    }
  );
>>>>>>> da9ad286010c29f3d8e17c72ef368bf0864559eb
