import { Elysia, t } from "elysia";
import { PurchaseModel } from "./model";
import { PurchaseService } from "./service";
import { rbacMiddleware } from "../../middleware/rbac";
import { formatErrorResponse } from "../../utils/errors";

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
    stationId: string | null;
  };
};

// Base routes (Read) - All authenticated users
const baseRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .get(
    "/",
    async (context) => {
      const { query, set } = context;
      try {
        const result = await PurchaseService.getAll({
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          startDate: query.startDate,
          endDate: query.endDate,
          stationId: query.stationId,
          operatorId: query.operatorId,
          search: query.search,
        });
        return {
          success: true,
          data: result,
          message: "Purchases retrieved successfully",
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: PurchaseModel.getPurchasesQuery,
      response: {
        200: PurchaseModel.getListPurchaseResponse,
        401: PurchaseModel.errorResponse,
        403: PurchaseModel.errorResponse,
        500: PurchaseModel.errorResponse,
      },
      detail: {
        tags: ["Purchases"],
        summary: "Get all purchases",
        description:
          "Retrieve all purchase transactions with pagination, filters, and search. Search supports: transaction number, card serial number, customer name, identity number, and operator name.",
      },
    }
  )
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await PurchaseService.getById(params.id);
        return {
          success: true,
          data: result,
          message: "Purchase retrieved successfully",
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
        id: t.String(),
      }),
      response: {
        200: PurchaseModel.getDetailPurchaseResponse,
        401: PurchaseModel.errorResponse,
        403: PurchaseModel.errorResponse,
        404: PurchaseModel.errorResponse,
        500: PurchaseModel.errorResponse,
      },
      detail: {
        tags: ["Purchases"],
        summary: "Get purchase by ID",
        description: "Retrieve a specific purchase transaction by ID",
      },
    }
  );

// Write routes (Create) - petugas, supervisor, admin, superadmin
const writeRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        // Validate user has stationId
        if (!user.stationId) {
          set.status = 400;
          return {
            success: false,
            error: {
              message:
                "User tidak memiliki stasiun. Silakan hubungi administrator untuk menetapkan stasiun.",
              code: "NO_STATION",
              statusCode: 400,
            },
          };
        }

        const result = await PurchaseService.createPurchase(
          body,
          user.id, // operatorId from authenticated user
          user.stationId, // stationId from authenticated user
          user.id // userId for audit fields
        );
        return {
          success: true,
          message: "Purchase transaction created successfully",
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
      body: PurchaseModel.createPurchaseBody,
      response: {
        200: PurchaseModel.createPurchaseResponse,
        400: PurchaseModel.errorResponse,
        401: PurchaseModel.errorResponse,
        403: PurchaseModel.errorResponse,
        500: PurchaseModel.errorResponse,
      },
      detail: {
        tags: ["Purchases"],
        summary: "Create new purchase transaction",
        description:
          "Create a new card purchase transaction. Operator and station are automatically taken from authenticated user context.",
      },
    }
  );

// Combine all routes
export const purchases = new Elysia({ prefix: "/purchases" })
  .use(baseRoutes)
  .use(writeRoutes);

