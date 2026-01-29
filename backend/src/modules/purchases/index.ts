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
        description: `Retrieve all purchase transactions with pagination, filters, and search. Supports both FWC and VOUCHER program types.

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
- Card Serial Number (for FWC purchases and individual cards in VOUCHER bulk purchases)
- Customer Name (member name)
- Customer Identity Number (NIK)
- Operator Name

**Response Format:**
- Each purchase includes \`programType\` field ("FWC" or "VOUCHER")
- FWC purchases: \`card\` field contains card details, \`bulkPurchaseItems\` is empty array
- VOUCHER purchases: \`card\` field is null, \`bulkPurchaseItems\` contains array of all purchased cards

**Pagination:**
- **page**: Page number (default: 1)
- **limit**: Items per page (default: 10)`,
      },
    },
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
- Purchase details (EDC reference, price, dates, notes, programType)
- Card information (for FWC: single card details; for VOUCHER: null)
- Bulk Purchase Items (for VOUCHER: array of all cards with details; for FWC: empty array)
  - Each item includes: cardId, price, card details (serialNumber, status, cardProduct, etc.)
- Member information (name, identity number)
- Operator information (full name, username)
- Station information (code, name)

**Program Types:**
- **FWC**: \`card\` field contains card details, \`bulkPurchaseItems\` is empty array
- **VOUCHER**: \`card\` field is null, \`bulkPurchaseItems\` contains array of all purchased cards`,
      },
    },
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
          user.id, // userId for audit fields
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
        description: `Create a new card purchase transaction. Supports both FWC (single card) and VOUCHER (bulk purchase) program types.

**Program Types:**
- **FWC**: Single card purchase (default). Requires \`cardId\` field.
- **VOUCHER**: Bulk purchase for multiple vouchers. Requires \`cards\` array with minimum 1 card.

**Requirements:**
- User must have a station assigned (stationId). If not, returns 400 error.
- Member ID is required - every transaction must have a member.
- For FWC: Card must exist and have status "IN_STATION" to be purchased.
- For VOUCHER: All cards in \`cards\` array must exist and have status "IN_STATION".
- Cards must not already have a purchase record (each card can only be purchased once).
- EDC Reference Number must be provided by user and must be unique.

**FWC Purchase (Single Card):**
- Provide \`cardId\` (required)
- \`cards\` array should not be provided or empty
- \`programType\` defaults to "FWC" if not specified
- Single card status updated to "SOLD_ACTIVE"

**VOUCHER Purchase (Bulk):**
- Provide \`cards\` array with minimum 1 card object: \`[{cardId: string, price?: number}]\`
- \`cardId\` should not be provided (will be null for bulk purchases)
- \`programType\` should be "VOUCHER"
- \`bulkDiscountId\` (optional): Apply bulk discount based on quantity
- All cards in array will be updated to "SOLD_ACTIVE"
- Total price calculated from sum of card prices, with bulk discount applied if applicable

**Bulk Discount:**
- Optional \`bulkDiscountId\` can be provided for VOUCHER purchases
- Discount is applied if quantity matches discount rule (minQuantity <= quantity <= maxQuantity)
- Discount amount is subtracted from subtotal

**Automatic Fields:**
- **operatorId**: Automatically set from authenticated user's ID
- **stationId**: Automatically set from authenticated user's stationId
- **purchaseDate**: Automatically set to current date/time
- **price**: 
  - For FWC: If not provided, uses cardProduct.price
  - For VOUCHER: If not provided, calculated from sum of card prices (after bulk discount if applicable)
  - Can be overridden for discounts/promos

**Card Status Update:**
After successful purchase:
- FWC: Single card status updated to "SOLD_ACTIVE"
- VOUCHER: All cards in bulkPurchaseItems updated to "SOLD_ACTIVE"

**Card Expired Date:**
Automatically calculated based on purchaseDate + cardProduct.masaBerlaku (in days) for each card.

**Access Control:**
- Roles allowed: petugas, supervisor, admin, superadmin
- User must have stationId assigned`,
      },
    },
  )
  .patch(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser & { params: { id: string } };
      try {
        const result = await PurchaseService.updatePurchase(
          params.id,
          body,
          user.id, // userId for audit fields
        );
        return {
          success: true,
          message: "Purchase transaction updated successfully",
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
      body: PurchaseModel.updatePurchaseBody,
      response: {
        200: PurchaseModel.updatePurchaseResponse,
        400: PurchaseModel.errorResponse,
        401: PurchaseModel.errorResponse,
        403: PurchaseModel.errorResponse,
        404: PurchaseModel.errorResponse,
        500: PurchaseModel.errorResponse,
      },
      detail: {
        tags: ["Purchases"],
        summary: "Update purchase transaction",
        description: `Update an existing purchase transaction.

**Editable Fields:**
- memberId: Update the member associated with this purchase
- operatorId: Update the operator who handled this transaction
- stationId: Update the station where transaction occurred
- edcReferenceNumber: Update EDC reference number (must be unique)
- price: Update the transaction price
- notes: Update transaction notes
- shiftDate: Update the shift date

**Validations:**
- Purchase must exist and not be deleted
- Member, operator, and station must exist if provided
- EDC reference number must be unique if changed

**Access Control:**
- Roles allowed: petugas, supervisor, admin, superadmin`,
      },
    },
  );

// Correction routes (supervisor, admin, superadmin only)
const correctionRoutes = new Elysia()
  .use(rbacMiddleware(["supervisor", "admin", "superadmin"]))
  .patch(
    "/:id/correct-card-mismatch",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser & { params: { id: string } };
      try {
        const result = await PurchaseService.correctCardMismatch(
          params.id,
          body,
          user.id,
        );
        return {
          success: true,
          message: "Card mismatch corrected successfully",
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
      body: PurchaseModel.correctCardMismatchBody,
      response: {
        200: PurchaseModel.correctCardMismatchResponse,
        400: PurchaseModel.errorResponse,
        401: PurchaseModel.errorResponse,
        403: PurchaseModel.errorResponse,
        404: PurchaseModel.errorResponse,
        500: PurchaseModel.errorResponse,
      },
      detail: {
        tags: ["Purchases"],
        summary: "Correct card mismatch in purchase",
        description: `Correct a card mismatch when wrong card was given to customer.

**Process:**
1. Old card (originally recorded) returns to IN_STATION
2. Wrong card (mistakenly given) marked as DELETED status (permanent)
3. Correct card (should have been given) marked as SOLD_ACTIVE
4. Purchase record updated to point to correct card
5. Price remains unchanged (keep original transaction price)

**Required Fields:**
- wrongCardId: Card that was mistakenly given to customer (must be IN_STATION)
- correctCardId: Card that should have been given (must be IN_STATION)
- notes: Optional explanation for the correction

**Example Scenario:**
- Transaction recorded: Card 40 JaBan Gold
- Mistakenly given: Card 41 JaKa Gold (this becomes DELETED)
- Corrected with: Card 42 JaBan Gold (this becomes SOLD_ACTIVE)
- Card 40 returns to IN_STATION

**Access Control:**
- Roles allowed: supervisor, admin, superadmin
- Can be corrected anytime (no time limit)`,
      },
    },
  );

// Delete routes - Admin and Superadmin only
const deleteRoutes = new Elysia()
  .use(rbacMiddleware(["admin", "superadmin"]))
  .delete(
    "/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await PurchaseService.deletePurchase(params.id, user.id);
        return result;
      } catch (error) {
        set.status = error instanceof Error && error.name === "NotFoundError" ? 404 : 500;
        return formatErrorResponse(error);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
          id: t.String(),
        }),
        401: PurchaseModel.errorResponse,
        403: PurchaseModel.errorResponse,
        404: PurchaseModel.errorResponse,
        500: PurchaseModel.errorResponse,
      },
      detail: {
        tags: ["Purchases"],
        summary: "Delete a purchase transaction (soft delete)",
        description: `Soft delete a purchase transaction and restore card(s) to IN_STATION status.

**Process:**
1. Mark purchase as deleted (set deletedAt timestamp)
2. Card status changed from SOLD_ACTIVE back to IN_STATION:
   - **FWC**: Single card restored to IN_STATION
   - **VOUCHER**: All cards in bulkPurchaseItems restored to IN_STATION
3. Deleted purchases won't appear in purchase lists

**Access Control:**
- Roles allowed: admin, superadmin only

**Note:** This is a soft delete - data is preserved for audit purposes.`,
      },
    },
  );

// Combine all routes
export const purchases = new Elysia({ prefix: "/purchases" })
  .use(baseRoutes)
  .use(writeRoutes)
  .use(correctionRoutes)
  .use(deleteRoutes);

