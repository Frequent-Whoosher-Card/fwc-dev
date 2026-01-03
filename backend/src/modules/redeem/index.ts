import { Elysia } from "elysia";
import { RedeemService } from "./service";
import { RedeemModel } from "./model";

export const redeem = new Elysia({ prefix: "/redeem" }).get(
  "/check/:serialNumber",
  async ({ params: { serialNumber } }) => {
    const data = await RedeemService.checkSerial(serialNumber);
    return {
      success: true,
      message: "Card data retrieved successfully",
      data,
    };
  },
  {
    detail: {
      summary: "Check Card by Serial Number",
      tags: ["Redeem"],
    },
  }
);
