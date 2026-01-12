import { Elysia, t } from "elysia";
import { PurchaseModel } from "./model";
import { PurchaseService } from "./service";
import { ActivationService } from "./activation.service";
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
      const { query, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await PurchaseService.getAll({
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          startDate: query.startDate,
          endDate: query.endDate,
          stationId: query.stationId,
          categoryId: query.categoryId,
          typeId: query.typeId,
          operatorId: query.operatorId,
          search: query.search,
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

// Activation routes - petugas, supervisor, admin, superadmin
const activationRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .post(
    "/:id/activate",
    async (context) => {
      const { params, body, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await ActivationService.activateCard(
          params.id,
          body.physicalCardSerialNumber,
          user.id
        );
        return {
          success: true,
          message: "Card activated successfully",
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
        id: t.String({ format: "uuid", description: "Purchase ID" }),
      }),
      body: PurchaseModel.activateCardBody,
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
          data: t.Any(),
        }),
        400: PurchaseModel.errorResponse,
        401: PurchaseModel.errorResponse,
        403: PurchaseModel.errorResponse,
        404: PurchaseModel.errorResponse,
        500: PurchaseModel.errorResponse,
      },
      detail: {
        tags: ["Purchases - Activation"],
        summary: "Activate card purchase (Step 2 of Two-Step Activation)",
        description: `**Two-Step Activation - Step 2: Activate Card**

This endpoint validates the physical card serial number against the assigned card and activates the purchase.

**Requirements:**
- Purchase must exist and have status PENDING
- Physical card serial number must match the assigned serial number from purchase
- Card status must be ASSIGNED

**Process:**
1. Validate physical card serial number matches assigned serial number
2. Update card status from ASSIGNED to SOLD_ACTIVE
3. Update purchase activation status from PENDING to ACTIVATED
4. Record activation timestamp and user

**Error Cases:**
- 404: Purchase not found
- 400: Purchase already activated or cancelled
- 400: Serial number mismatch (provides details of expected vs provided)
- 400: Card status invalid for activation

**Access Control:**
All authenticated users with roles: petugas, supervisor, admin, superadmin`,
      },
    }
  )
  .post(
    "/:id/swap-card",
    async (context) => {
      const { params, body, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await ActivationService.swapCard(
          params.id,
          body.correctCardSerialNumber,
          user.id,
          body.reason
        );
        return {
          success: true,
          message: "Card swapped successfully",
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
        id: t.String({ format: "uuid", description: "Purchase ID" }),
      }),
      body: PurchaseModel.swapCardBody,
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
          data: t.Any(),
        }),
        400: PurchaseModel.errorResponse,
        401: PurchaseModel.errorResponse,
        403: PurchaseModel.errorResponse,
        404: PurchaseModel.errorResponse,
        500: PurchaseModel.errorResponse,
      },
      detail: {
        tags: ["Purchases - Activation"],
        summary: "Swap card for a purchase (before activation)",
        description: `**Card Swap - Replace Wrong Card**

This endpoint allows swapping the assigned card with a different card before activation, in case the wrong card was selected during purchase creation.

**Requirements:**
- Purchase must exist and have status PENDING (not yet activated)
- New card must exist and have status IN_STATION
- New card must be same category as original purchase
- Original card will be restored to IN_STATION status

**Process:**
1. Restore original card status to IN_STATION
2. Validate new card is available (IN_STATION) and same category
3. Assign new card to purchase with ASSIGNED status
4. Log swap reason in purchase notes

**Use Cases:**
- Wrong card was selected during purchase creation
- Physical card given doesn't match the assigned card
- Need to replace damaged card before activation

**Access Control:**
All authenticated users with roles: petugas, supervisor, admin, superadmin`,
      },
    }
  )
  .post(
    "/:id/cancel",
    async (context) => {
      const { params, body, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await ActivationService.cancelPurchase(
          params.id,
          user.id,
          body.reason
        );
        return {
          success: true,
          message: "Purchase cancelled successfully",
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
        id: t.String({ format: "uuid", description: "Purchase ID" }),
      }),
      body: PurchaseModel.cancelPurchaseBody,
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
          data: t.Any(),
        }),
        400: PurchaseModel.errorResponse,
        401: PurchaseModel.errorResponse,
        403: PurchaseModel.errorResponse,
        404: PurchaseModel.errorResponse,
        500: PurchaseModel.errorResponse,
      },
      detail: {
        tags: ["Purchases - Activation"],
        summary: "Cancel purchase (before activation)",
        description: `**Cancel Purchase - Revert Purchase Transaction**

This endpoint cancels a pending purchase and restores the card to available status.

**Requirements:**
- Purchase must exist and have status PENDING (not yet activated)
- Cannot cancel already activated purchases

**Process:**
1. Update purchase activation status to CANCELLED
2. Restore card status from ASSIGNED back to IN_STATION
3. Clear assigned serial number from card
4. Log cancellation reason in purchase notes

**Use Cases:**
- Customer cancels transaction before receiving card
- Wrong purchase was created and needs to be voided
- Transaction error requires cancellation

**Access Control:**
All authenticated users with roles: petugas, supervisor, admin, superadmin`,
      },
    }
  )
  .get(
    "/:id/activation-status",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await ActivationService.getPurchaseActivationStatus(params.id);
        return {
          success: true,
          data: result,
          message: "Activation status retrieved successfully",
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
        id: t.String({ format: "uuid", description: "Purchase ID" }),
      }),
      response: {
        200: PurchaseModel.activationStatusResponse,
        401: PurchaseModel.errorResponse,
        403: PurchaseModel.errorResponse,
        404: PurchaseModel.errorResponse,
        500: PurchaseModel.errorResponse,
      },
      detail: {
        tags: ["Purchases - Activation"],
        summary: "Get purchase activation status",
        description: `**Check Activation Status**

Get the current activation status and details for a purchase.

**Response includes:**
- Activation status (PENDING, ACTIVATED, CANCELLED)
- Activation timestamp (if activated)
- User who activated (if activated)
- Physical card serial number used (if activated)
- Assigned card information
- Card product category

**Use Cases:**
- Check if purchase needs activation
- Verify which physical card was used
- Audit activation history

**Access Control:**
All authenticated users with roles: petugas, supervisor, admin, superadmin`,
      },
    }
  );

// Combine all routes
export const purchases = new Elysia({ prefix: "/purchases" })
  .use(baseRoutes)
  .use(writeRoutes)
  .use(activationRoutes);

