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
