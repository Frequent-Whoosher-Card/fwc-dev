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
    },
  )
  .get(
    "/next-serial",
    async (context) => {
      const { query, set } = context;
      try {
        const result = await CardGenerateService.getNextSerial(
          query.cardProductId,
        );
        return {
          success: true,
          message: "Next serial retrieved successfully",
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
      query: CardGenerateModel.getNextSerialQuery,
      response: {
        200: CardGenerateModel.getNextSerialResponse, // Use explicit schema
        400: CardGenerateModel.errorResponse,
        404: CardGenerateModel.errorResponse,
        500: CardGenerateModel.errorResponse,
      },
      detail: {
        tags: ["Cards Generate"],
        summary: "Get Next Serial",
        description:
          "Get the next available serial number suffix for a product.",
      },
    },
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
    },
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
    },
  )
  .get(
    "/history/:id/download-zip",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await CardGenerateService.downloadZip(params.id);

        return new Response(result.stream as any, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${result.filename}"`,
          },
        });
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
      detail: {
        tags: ["Cards Generate"],
        summary: "Download ZIP",
        description:
          "Download all generated barcodes in this batch as a ZIP file.",
      },
    },
  )
  .delete(
    "/history/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await CardGenerateService.delete(params.id, user.id);
        return {
          status: "success",
          message: result.message,
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
        200: t.Object({
          status: t.String(),
          message: t.String(),
          data: t.Object({
            success: t.Boolean(),
            message: t.String(),
          }),
        }),
        400: CardGenerateModel.errorResponse,
        404: CardGenerateModel.errorResponse,
        500: CardGenerateModel.errorResponse,
      },
      detail: {
        tags: ["Cards Generate"],
        summary: "Delete Generated Batch",
        description:
          "Delete a generated batch. Allowed ONLY if cards are still ON_REQUEST (not stocked in).",
      },
    },
  );
