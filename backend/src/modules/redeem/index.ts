import { Elysia } from "elysia";
import { RedeemService } from "./service";
import { RedeemModel } from "./model";
import { formatErrorResponse } from "../../utils/errors";
import { authMiddleware } from "src/middleware/auth";

const baseRoutes = new Elysia().use(authMiddleware).get(
  "/check/:serialNumber",
  async ({ params: { serialNumber }, set }) => {
    try {
      const data = await RedeemService.checkSerial(serialNumber);
      return {
        success: true,
        message: "Card data retrieved successfully",
        data,
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
    params: RedeemModel.checkSerialParams,
    response: {
      200: RedeemModel.checkSerialResponse,
      404: RedeemModel.errorResponse,
      500: RedeemModel.errorResponse,
    },
    detail: {
      summary: "Check Card by Serial Number",
      tags: ["Redeem"],
      description: "Get card details, member info, and status by serial number",
    },
  }
);

export const redeem = new Elysia({ prefix: "/redeem" }).use(baseRoutes);
