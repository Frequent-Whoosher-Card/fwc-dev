import { Elysia, t } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { permissionMiddleware } from "../../../middleware/permission";
import { formatErrorResponse } from "../../../utils/errors";
import { ProductTypeService } from "./service";
import { ProductTypeModel } from "./model";
import { ProgramType } from "../../../../prisma/generated/client/client";

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
  .get(
    "/",
    async (context) => {
      const { set, query } = context as typeof context & {
        query: { programType?: ProgramType };
      };
      try {
        const data = await ProductTypeService.getProductTypes(
          query.programType,
        );
        return {
          success: true,
          data,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: t.Object({
        programType: t.Optional(
          t.Union([t.Literal("FWC"), t.Literal("VOUCHER")], {
            description: "Tipe Program (FWC/VOUCHER)",
          }),
        ),
      }),
      response: {
        200: ProductTypeModel.getProductTypesResponse,
        500: ProductTypeModel.errorResponse,
      },
      detail: {
        tags: ["Product Type"],
        summary: "Get all product types",
      },
    },
  )
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context;
      try {
        const data = await ProductTypeService.getProductTypeById(params.id);
        return {
          success: true,
          data,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: ProductTypeModel.getProductTypeByIdResponse,
        500: ProductTypeModel.errorResponse,
      },
      detail: {
        tags: ["Product Type"],
        summary: "Get product type by ID",
      },
    },
  );

const manageRoutes = new Elysia()
  .use(permissionMiddleware("product.type.manage")) // Reusing manage permission
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const data = await ProductTypeService.createProductType(
          body as any,
          user.id,
        );
        return {
          success: true,
          message: "Product type created successfully",
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
      body: ProductTypeModel.createProductTypeRequest,
      response: {
        200: ProductTypeModel.createProductTypeResponse,
        500: ProductTypeModel.errorResponse,
      },
      detail: {
        tags: ["Product Type"],
        summary: "Create new product type",
      },
    },
  )
  .put(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const data = await ProductTypeService.editProductType(
          params.id,
          body as any,
          user.id,
        );
        return {
          success: true,
          message: "Product type updated successfully",
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
      params: t.Object({ id: t.String() }),
      body: ProductTypeModel.editProductTypeRequest,
      response: {
        200: ProductTypeModel.editProductTypeResponse,
        500: ProductTypeModel.errorResponse,
      },
      detail: {
        tags: ["Product Type"],
        summary: "Update product type",
      },
    },
  )
  .delete(
    "/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const data = await ProductTypeService.deleteProductType(
          params.id,
          user.id,
        );
        return {
          success: true,
          message: "Product type deleted successfully",
          data,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: ProductTypeModel.deleteProductTypeResponse,
        500: ProductTypeModel.errorResponse,
      },
      detail: {
        tags: ["Product Type"],
        summary: "Delete product type",
      },
    },
  );

export const productTypeRoutes = new Elysia({ prefix: "/product-type" })
  .use(baseRoutes)
  .use(manageRoutes);
