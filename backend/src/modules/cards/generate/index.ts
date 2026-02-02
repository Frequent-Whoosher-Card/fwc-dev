import { Elysia, t } from "elysia";
import { permissionMiddleware } from "../../../middleware/permission";
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
  .use(permissionMiddleware("card.generate")) // Asumsi hanya admin/superadmin yang boleh generate
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;

      try {
        const result = await CardGenerateService.generate({
          cardProductId: body.cardProductId,
          startSerial: body.startSerial as string,
          endSerial: body.endSerial as string,
          quantity: body.quantity,
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
        tags: ["Generate"],
        summary: "Generate Cards",
        description: "Generate cards and barcode images.",
      },
    },
  )
  .post(
    "/voucher",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;

      try {
        const result = await CardGenerateService.generateVoucher({
          cardProductId: body.cardProductId,
          startSerial: body.startSerial as string,
          endSerial: body.endSerial as string,
          quantity: body.quantity,
          userId: user.id || "00000000-0000-0000-0000-000000000000",
        });

        return {
          status: "success",
          message: "Vouchers generated successfully",
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
      body: CardGenerateModel.generateVoucherBody,
      response: {
        200: CardGenerateModel.generateVoucherResponse,
        400: CardGenerateModel.errorResponse,
        401: CardGenerateModel.errorResponse,
        403: CardGenerateModel.errorResponse,
        404: CardGenerateModel.errorResponse,
        409: CardGenerateModel.errorResponse,
        422: CardGenerateModel.errorResponse,
        500: CardGenerateModel.errorResponse,
      },
      detail: {
        tags: ["Generate"],
        summary: "Generate Vouchers",
        description: "Generate separate voucher cards with date-based serials.",
      },
    },
  )
  .get(
    "/next-serial",
    async (context) => {
      const { query, set } = context as typeof context;
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
        tags: ["Generate"],
        summary: "Get Next Serial",
        description:
          "Get the next available serial number suffix for a product.",
      },
    },
  )
  .get(
    "/history",
    async (context) => {
      const { query, set } = context as typeof context;
      try {
        const result = await CardGenerateService.getHistory({
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
          categoryId: query.categoryId,
          typeId: query.typeId,
          programType: query.programType,
        });
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
        tags: ["Generate"],
        summary: "Get History",
        description: "Get history of card generation.",
      },
    },
  )
  .get(
    "/history/:id",
    async (context) => {
      const { params, set } = context as typeof context;
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
        tags: ["Generate"],
        summary: "Get History Detail",
        description:
          "Get detailed history of a specific card generation batch.",
      },
    },
  )
  .get(
    "/history/:id/download-zip",
    async (context) => {
      const { params, set } = context as typeof context;
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
        tags: ["Generate"],
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
        tags: ["Generate"],
        summary: "Delete Generated Batch",
        description:
          "Delete a generated batch. Allowed ONLY if cards are still ON_REQUEST (not stocked in).",
      },
    },
  )
  .post(
    "/history/:id/document",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const result = await CardGenerateService.uploadDocument({
          batchId: params.id,
          file: body.file,
          userId: user.id,
        });
        return {
          success: true,
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
      body: CardGenerateModel.uploadDocumentBody,
      response: {
        200: CardGenerateModel.uploadDocumentResponse,
        400: CardGenerateModel.errorResponse,
        404: CardGenerateModel.errorResponse,
        500: CardGenerateModel.errorResponse,
      },
      detail: {
        tags: ["Generate"],
        summary: "Upload Generation Document",
        description:
          "Upload PDF document (Berita Acara/BAST) for a generation batch. Response will include the document URL immediately.",
      },
    },
  )
  .get(
    "/history/:id/document",
    async (context) => {
      const { params, set } = context as typeof context;
      try {
        const result = await CardGenerateService.getDocument(params.id);

        return new Response(result.buffer, {
          headers: {
            "Content-Type": result.mimeType,
            "Content-Disposition": "inline", // Inline so browser opens it
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
        tags: ["Generate"],
        summary: "Get Generation Document",
        description:
          "Get uploaded PDF document. Returns inline content (not attachment).",
      },
    },
  );
