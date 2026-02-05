import { Elysia, t } from "elysia";
import { ProductTypeService } from "./service";
import { ProductTypeModel } from "./model";
import { formatErrorResponse } from "../../utils/errors";
import { authMiddleware } from "../../middleware/auth";

const errorResponse = t.Union([
  t.Object({
    success: t.Literal(false),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  }),
  t.Object({
    success: t.Literal(false),
    message: t.String(),
  }),
]);

const successResponse = t.Object({
  success: t.Literal(true),
  message: t.String(),
  data: t.Array(ProductTypeModel.productTypeResponse),
});

const readRoutes = new Elysia()
  .use(authMiddleware)
  .get(
    "/",
    async ({ set }) => {
      try {
        const productTypes = await ProductTypeService.getProductTypes();
        return {
          success: true,
          message: "Product types retrieved successfully",
          data: productTypes,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      detail: {
        summary: "Get all product types",
        tags: ["Product Types"],
        description: "Retrieve all active product types (FWC, VOUCHER, etc)",
      },
      response: {
        200: successResponse,
        500: t.Union([errorResponse, t.Any()]),
      },
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        const productType = await ProductTypeService.getProductTypeById(id);
        return {
          success: true,
          message: "Product type retrieved successfully",
          data: productType,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      detail: {
        summary: "Get product type by ID",
        tags: ["Product Types"],
      },
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String(),
          data: ProductTypeModel.productTypeResponse,
        }),
        500: t.Union([errorResponse, t.Any()]),
      },
    }
  )
  .get(
    "/program/:programType",
    async ({ params: { programType }, set }) => {
      try {
        if (programType !== "FWC" && programType !== "VOUCHER") {
          set.status = 400;
          return {
            success: false,
            message: "Invalid program type. Must be FWC or VOUCHER",
          };
        }

        const productTypes = await ProductTypeService.getProductTypesByProgram(
          programType as "FWC" | "VOUCHER"
        );
        return {
          success: true,
          message: `Product types for ${programType} retrieved successfully`,
          data: productTypes,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      detail: {
        summary: "Get product types by program",
        tags: ["Product Types"],
        description: "Retrieve product types filtered by program (FWC or VOUCHER)",
      },
      response: {
        200: successResponse,
        400: t.Union([errorResponse, t.Any()]),
        500: t.Union([errorResponse, t.Any()]),
      },
    }
  );

export const productType = new Elysia({ prefix: "/product-type" }).use(
  readRoutes
);
