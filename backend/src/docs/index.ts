import { swagger } from "@elysiajs/swagger";

/**
 * API Documentation Configuration
 *
 * This configuration provides interactive API documentation
 * accessible at /docs endpoint
 */

// Get server URL from environment or use relative URL
const getServerUrl = () => {
  // Priority: SWAGGER_SERVER_URL > API_BASE_URL > relative URL
  if (process.env.SWAGGER_SERVER_URL) {
    return process.env.SWAGGER_SERVER_URL;
  }
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  // Use relative URL to match current origin (fixes CSP issues)
  return "";
};

const serverUrl = getServerUrl();

// Build servers array based on environment
const servers = [];
if (serverUrl) {
  // If explicit URL is provided, use it
  servers.push({
    url: serverUrl,
    description:
      process.env.NODE_ENV === "production"
        ? "Production server"
        : "Development server",
  });
} else {
  // Use relative URL (empty string means same origin)
  servers.push({
    url: "/api",
    description: "Current server",
  });
  // Add localhost as fallback for development
  if (process.env.NODE_ENV !== "production") {
    servers.push({
      url: "http://localhost:3001",
      description: "Local development server",
    });
  }
}

export const docsConfig = swagger({
  path: "/docs",
  documentation: {
    info: {
      title: "FWC API Documentation",
      description: "API Documentation for FWC (Frequent Whoosher Card)",
      version: "1.0.0",
      contact: {
        name: "FWC API Support",
      },
    },
    // Redeem endpoints documentation
    paths: {
      "/redeem/check/{serialNumber}": {
        get: {
          tags: ["Redeem"],
          summary: "Check Card by Serial Number",
          description:
            "Get card details, member info, and status by serial number.",
          parameters: [
            {
              name: "serialNumber",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Serial number of the card to check",
            },
            {
              name: "product",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["FWC", "VOUCHER"] },
              description: "Product type for redeem (FWC or VOUCHER)",
            },
          ],
          responses: {
            200: { description: "Card data retrieved successfully" },
            404: { description: "Card not found" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/redeem": {
        post: {
          tags: ["Redeem"],
          summary: "Redeem Card Ticket",
          description:
            "Redeem a ticket from the card. Type: SINGLE (1) or ROUNDTRIP (2)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    serialNumber: { type: "string" },
                    redeemType: {
                      type: "string",
                      enum: ["SINGLE", "ROUNDTRIP"],
                    },
                    product: { type: "string", enum: ["FWC", "VOUCHER"] },
                    notes: { type: "string" },
                  },
                  required: ["serialNumber", "redeemType", "product"],
                },
              },
            },
          },
          responses: {
            200: { description: "Card redeemed successfully" },
            400: { description: "Bad request" },
            500: { description: "Internal server error" },
          },
        },
        get: {
          tags: ["Redeem"],
          summary: "List Redeem Transactions",
          description: "Get list of redeem transactions with filters.",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
            },
            { name: "stationId", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "cardType", in: "query", schema: { type: "string" } },
            { name: "redeemType", in: "query", schema: { type: "string" } },
            { name: "product", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Redeem transactions fetched successfully" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/redeem/{id}": {
        get: {
          tags: ["Redeem"],
          summary: "Get Redeem Detail",
          description: "Get detail of a redeem transaction.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Redeem transaction detail fetched successfully",
            },
            404: { description: "Not found" },
            500: { description: "Internal server error" },
          },
        },
        patch: {
          tags: ["Redeem"],
          summary: "Update Redeem Transaction",
          description: "Update redeem transaction (notes only)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { notes: { type: "string" } },
                },
              },
            },
          },
          responses: {
            200: { description: "Redeem transaction updated successfully" },
            404: { description: "Not found" },
            500: { description: "Internal server error" },
          },
        },
        delete: {
          tags: ["Redeem"],
          summary: "Delete Redeem (restore quota)",
          description: "Soft delete redeem and restore consumed quota to card.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Redeem transaction deleted and quota restored",
            },
            404: { description: "Not found" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/redeem/export": {
        get: {
          tags: ["Redeem"],
          summary: "Export daily redeem report",
          description:
            "Export today's redeem transactions for operator (CSV/XLSX/PDF/JPG)",
          parameters: [
            {
              name: "date",
              in: "query",
              schema: { type: "string", format: "date" },
            },
            {
              name: "format",
              in: "query",
              schema: { type: "string", enum: ["csv", "xlsx", "pdf", "jpg"] },
            },
          ],
          responses: {
            200: { description: "Exported file" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/redeem/{id}/last-doc": {
        post: {
          tags: ["Redeem"],
          summary: "Upload last redeem documentation",
          description:
            "Upload a photo when performing the last redeem (prev quota 1 or 2)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    imageBase64: {
                      type: "string",
                      description: "Base64-encoded image (JPEG/PNG)",
                    },
                    mimeType: {
                      type: "string",
                      description:
                        "Optional mimeType override (image/jpeg or image/png)",
                    },
                  },
                  required: ["imageBase64"],
                },
              },
            },
          },
          responses: {
            200: { description: "Last redeem documentation uploaded" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description:
          "Authentication endpoints for user login, logout, and password management",
      },
      {
        name: "Users & Roles",
        description: "User and role management endpoints",
      },
      {
        name: "Members",
        description: "Member management endpoints",
      },
      {
        name: "Purchases",
        description: "Card purchase transaction endpoints",
      },
      {
        name: "Station",
        description: "Station management endpoints",
      },
      {
        name: "Analysis",
        description: "Analysis endpoints for card analysis data and analytics",
      },
      {
        name: "Sales",
        description: "Sales endpoints for card sales data and analytics",
      },
      {
        name: "Metrics",
        description: "Metrics endpoints for card metrics data and analytics",
      },
      {
        name: "Cards",
        description: "Cards endpoints",
      },
      {
        name: "Card",
        description: "Card management endpoints",
      },
      {
        name: "Card Category",
        description: "Card category management endpoints",
      },
      {
        name: "Card Type",
        description: "Card type management endpoints",
      },
      {
        name: "Card Product",
        description: "Card product management endpoints",
      },
      {
        name: "Generate",
        description: "Generate management endpoints",
      },
      {
        name: "Stock",
        description: "Stock management endpoints for card inventory",
      },
      {
        name: "Inbox",
        description: "Inbox management endpoints for card inventory",
      },
      {
        name: "Stock All & Inventory",
        description:
          "Stock All & Inventory management endpoints for card inventory",
      },
      {
        name: "Stock In",
        description: "Stock in management endpoints for card inventory",
      },
      {
        name: "Stock Out",
        description: "Stock out management endpoints for card inventory",
      },
      {
        name: "Stock Analysis",
        description: "Stock analysis endpoints for card inventory",
      },
      {
        name: "Redeem",
        description: "Redeem management endpoints",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT token authentication. Include token in Authorization header as 'Bearer <token>'",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
          description:
            "Session cookie authentication. Cookie is set automatically after login",
        },
      },
    },
    servers,
  },
});
