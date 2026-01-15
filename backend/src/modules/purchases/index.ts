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
    "/serial/:serialNumber",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await PurchaseService.getByCardSerial(
          params.serialNumber
        );
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
        serialNumber: t.String(),
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
        summary: "Get purchase by Card Serial Number",
        description: `Search for a purchase transaction by its Card Serial Number.

**Use Case:**
Used for Card Swap feature - find the original purchase to create a swap request.

**Search:**
Case-insensitive exact match on card.serialNumber field.

**Response:**
Returns full purchase details including card, member, operator, and station information.`,
      },
    }
  )
  .get(
    "/",
    async (context) => {
      const { query, set, user } = context as typeof context & AuthContextUser;
      try {
        // Helper function to filter out "undefined" string values
        const cleanParam = (value: any) => {
          if (
            value === "undefined" ||
            value === undefined ||
            value === null ||
            value === ""
          ) {
            return undefined;
          }
          return value;
        };

        // Helper to safely parse integer
        const safeParseInt = (value: any) => {
          const cleaned = cleanParam(value);
          if (cleaned === undefined) return undefined;
          const parsed = parseInt(cleaned);
          return isNaN(parsed) ? undefined : parsed;
        };

        const result = await PurchaseService.getAll({
          page: safeParseInt(query.page),
          limit: safeParseInt(query.limit),
          startDate: cleanParam(query.startDate),
          endDate: cleanParam(query.endDate),
          stationId: cleanParam(query.stationId),
          categoryId: cleanParam(query.categoryId),
          typeId: cleanParam(query.typeId),
          operatorId: cleanParam(query.operatorId),
          search: cleanParam(query.search),
          // Pass user context for role-based filtering
          userRole: user.role.roleCode,
          userId: user.id,
          userStationId: user.stationId,
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
        description: `Retrieve all purchase transactions with pagination, filters, and search.

**Role-Based Automatic Filtering:**
- **petugas**: Automatically filters to show only today's transactions created by the authenticated petugas user. Manual date/operator filters are ignored.
- **supervisor**: Automatically filters to show all transactions in the supervisor's assigned station. Manual stationId filter is ignored.
- **admin/superadmin**: No automatic filtering. Can use all manual filters.

**Manual Filters (for admin/superadmin):**
- **startDate/endDate**: Filter by purchase date range (YYYY-MM-DD format)
- **stationId**: Filter by station UUID
- **categoryId**: Filter by card category UUID
- **typeId**: Filter by card type UUID
- **operatorId**: Filter by operator/user UUID

**Search:**
Supports searching by:
- EDC Reference Number
- Card Serial Number
- Customer Name (member name)
- Customer Identity Number (NIK)
- Operator Name

**Pagination:**
- **page**: Page number (default: 1)
- **limit**: Items per page (default: 10)`,
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
        description: `Retrieve a specific purchase transaction by its UUID.

**Access Control:**
- All authenticated users with roles: petugas, supervisor, admin, superadmin can access this endpoint.
- Role-based filtering does NOT apply to this endpoint (you can view any purchase if you know the ID).

**Response includes:**
- Purchase details (EDC reference, price, dates, notes)
- Card information (serial number, card product, category, type)
- Member information (name, identity number)
- Operator information (full name, username)
- Station information (code, name)`,
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
        description: `Create a new card purchase transaction.

**Requirements:**
- User must have a station assigned (stationId). If not, returns 400 error.
- Member ID is required - every transaction must have a member.
- Card must exist and have status "IN_STATION" to be purchased.
- Card must not already have a purchase record (each card can only be purchased once).
- EDC Reference Number must be provided by user and must be unique.

**Automatic Fields:**
- **operatorId**: Automatically set from authenticated user's ID
- **stationId**: Automatically set from authenticated user's stationId
- **purchaseDate**: Automatically set to current date/time
- **price**: If not provided, automatically uses cardProduct.price. Can be overridden for discounts/promos.

**Card Status Update:**
After successful purchase, the card status is automatically updated to "SOLD_ACTIVE".

**Card Expired Date:**
Automatically calculated based on purchaseDate + cardProduct.masaBerlaku (in days).

**Access Control:**
- Roles allowed: petugas, supervisor, admin, superadmin
- User must have stationId assigned`,
      },
    }
  );

// Combine all routes
export const purchases = new Elysia({ prefix: "/purchases" })
  .use(baseRoutes)
  .use(writeRoutes);
