import { Elysia } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { rbacMiddleware } from "../../middleware/rbac";
import { formatErrorResponse } from "../../utils/errors";
import { BulkDiscountService } from "./service";
import { BulkDiscountModel } from "./model";

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

export const bulkDiscount = new Elysia({ prefix: "/discounts" })
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin"])) // Only admins can manage discounts
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const discounts = await BulkDiscountService.getAll(query.search);
        return {
          success: true,
          data: discounts,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: BulkDiscountModel.listBulkDiscountQuery,
      response: {
        200: BulkDiscountModel.listBulkDiscountResponse,
        500: BulkDiscountModel.errorResponse,
      },
      detail: {
        tags: ["Bulk Discount"],
        summary: "List Bulk Discounts",
        description: "Get all bulk discount rules.",
      },
    },
  )
  .post(
    "/",
    async (context) => {
      const { body, user, set } = context as typeof context & AuthContextUser;
      try {
        const discount = await BulkDiscountService.create(body, user.id);
        return {
          success: true,
          data: discount,
        };
      } catch (error) {
        set.status = 400;
        return formatErrorResponse(error);
      }
    },
    {
      body: BulkDiscountModel.createBulkDiscountBody,
      response: {
        200: BulkDiscountModel.singleBulkDiscountResponse,
        400: BulkDiscountModel.errorResponse,
        500: BulkDiscountModel.errorResponse,
      },
      detail: {
        tags: ["Bulk Discount"],
        summary: "Create Bulk Discount",
        description: "Create a new bulk discount rule.",
      },
    },
  )
  .patch(
    "/:id",
    async (context) => {
      const { params, body, user, set } = context as typeof context &
        AuthContextUser;
      try {
        const id = parseInt(params.id);
        const discount = await BulkDiscountService.update(id, body, user.id);
        return {
          success: true,
          data: discount,
        };
      } catch (error) {
        set.status = 400;
        return formatErrorResponse(error);
      }
    },
    {
      body: BulkDiscountModel.updateBulkDiscountBody,
      response: {
        200: BulkDiscountModel.singleBulkDiscountResponse,
        400: BulkDiscountModel.errorResponse,
        500: BulkDiscountModel.errorResponse,
      },
      detail: {
        tags: ["Bulk Discount"],
        summary: "Update Bulk Discount",
        description: "Update an existing bulk discount rule.",
      },
    },
  )
  .delete(
    "/:id",
    async (context) => {
      const { params, user, set } = context as typeof context & AuthContextUser;
      try {
        const id = parseInt(params.id);
        const result = await BulkDiscountService.delete(id, user.id);
        return result;
      } catch (error) {
        set.status = 400;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: BulkDiscountModel.errorResponse, // { success, message }
        400: BulkDiscountModel.errorResponse,
        500: BulkDiscountModel.errorResponse,
      },
      detail: {
        tags: ["Bulk Discount"],
        summary: "Delete Bulk Discount",
        description: "Delete a bulk discount rule.",
      },
    },
  );
