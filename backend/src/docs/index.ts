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
  // Use relative URL based on environment
  if (process.env.NODE_ENV === "production") {
    servers.push({
      url: "/api",
      description: "Production server",
    });
  } else {
    // Development environment
    servers.push({
      url: "/",
      description: "Development server (Current Host)",
    });
    // Add localhost as specific fallback
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
            "Get card details, member info, and redemption status by serial number. Returns card validity, quota, member data, and category.",
          parameters: [
            {
              name: "serialNumber",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Serial number of the card to check (e.g., 01112600001)",
              example: "01112600001"
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
            200: { 
              description: "Card data retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          serialNumber: { type: "string" },
                          quota: { type: "number" },
                          isExpired: { type: "boolean" },
                          validUntil: { type: "string", format: "date-time" },
                          canRedeem: { type: "boolean" },
                          category: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              abbreviation: { type: "string" }
                            }
                          },
                          member: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              memberNumber: { type: "string" },
                              fullName: { type: "string" },
                              nik: { type: "string" },
                              email: { type: "string" },
                              phoneNumber: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            404: { description: "Card not found or not activated" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/redeem": {
        post: {
          tags: ["Redeem"],
          summary: "Redeem Card Ticket",
          description:
            "Redeem a ticket from the card. Type: SINGLE (1 quota) or ROUNDTRIP (2 quota). For VOUCHER product, passengerNik and passengerName are required.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    serialNumber: { 
                      type: "string",
                      description: "Serial number of the card to redeem",
                      example: "01112600001"
                    },
                    redeemType: {
                      type: "string",
                      enum: ["SINGLE", "ROUNDTRIP"],
                      description: "Type of redemption: SINGLE (1 quota) or ROUNDTRIP (2 quota)"
                    },
                    product: { 
                      type: "string", 
                      enum: ["FWC", "VOUCHER"],
                      description: "Product type for redeem"
                    },
                    passengerNik: {
                      type: "string",
                      description: "Passenger NIK for VOUCHER redeem (16 digits, required for VOUCHER)",
                      example: "3276123456789012"
                    },
                    passengerName: {
                      type: "string",
                      description: "Passenger name for VOUCHER redeem (required for VOUCHER)",
                      example: "Budi Santoso"
                    },
                    notes: { 
                      type: "string",
                      description: "Optional notes for the redemption"
                    },
                  },
                  required: ["serialNumber", "redeemType", "product"],
                },
              },
            },
          },
          responses: {
            200: { 
              description: "Card redeemed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          id: { 
                            type: "string",
                            format: "uuid",
                            description: "Redeem transaction ID (use this for uploading last doc)"
                          },
                          transactionNumber: { type: "string" },
                          remainingQuota: { type: "number" },
                          quotaUsed: { type: "number" },
                          redeemType: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: { description: "Bad request (validation failed, insufficient quota, etc.)" },
            404: { description: "Card not found" },
            500: { description: "Internal server error" },
          },
        },
        get: {
          tags: ["Redeem"],
          summary: "List Redeem Transactions",
          description: "Get paginated list of redeem transactions with various filters including date range, station, card type, product type, and deleted status.",
          parameters: [
            { 
              name: "page", 
              in: "query", 
              schema: { type: "integer", default: 1 },
              description: "Page number for pagination"
            },
            { 
              name: "limit", 
              in: "query", 
              schema: { type: "integer", default: 10 },
              description: "Number of items per page"
            },
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Filter transactions from this date (YYYY-MM-DD)",
              example: "2024-01-01"
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Filter transactions until this date (YYYY-MM-DD)",
              example: "2024-12-31"
            },
            { 
              name: "stationId", 
              in: "query", 
              schema: { type: "string", format: "uuid" },
              description: "Filter by station ID"
            },
            { 
              name: "search", 
              in: "query", 
              schema: { type: "string" },
              description: "Search by transaction number, serial number, or member name"
            },
            { 
              name: "category", 
              in: "query", 
              schema: { type: "string" },
              description: "Filter by card category"
            },
            { 
              name: "cardType", 
              in: "query", 
              schema: { type: "string" },
              description: "Filter by card type"
            },
            { 
              name: "redeemType", 
              in: "query", 
              schema: { type: "string", enum: ["SINGLE", "ROUNDTRIP"] },
              description: "Filter by redeem type"
            },
            {
              name: "product",
              in: "query",
              schema: { type: "string", enum: ["FWC", "VOUCHER"] },
              description: "Filter by product type"
            },
            {
              name: "isDeleted",
              in: "query",
              schema: { type: "string", enum: ["true", "false"] },
              description: "Filter for deleted transactions (History Delete)",
            },
          ],
          responses: {
            200: { 
              description: "Redeem transactions fetched successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          items: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "string", format: "uuid" },
                                transactionNumber: { type: "string" },
                                serialNumber: { type: "string" },
                                redeemType: { type: "string" },
                                quotaUsed: { type: "number" },
                                product: { type: "string" },
                                notes: { type: "string" },
                                redeemDate: { type: "string", format: "date-time" },
                                memberName: { type: "string" },
                                stationName: { type: "string" },
                                operatorName: { type: "string" }
                              }
                            }
                          },
                          pagination: {
                            type: "object",
                            properties: {
                              total: { type: "number" },
                              page: { type: "number" },
                              limit: { type: "number" },
                              totalPages: { type: "number" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            500: { description: "Internal server error" },
          },
        },
      },
      "/redeem/{id}": {
        get: {
          tags: ["Redeem"],
          summary: "Get Redeem Detail",
          description: "Get comprehensive detail of a specific redeem transaction including passenger information and last documentation.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Redeem transaction ID"
            },
          ],
          responses: {
            200: {
              description: "Redeem transaction detail fetched successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          transactionNumber: { type: "string" },
                          serialNumber: { type: "string" },
                          redeemType: { type: "string" },
                          quotaUsed: { type: "number" },
                          product: { type: "string" },
                          passengerNik: { type: "string" },
                          passengerName: { type: "string" },
                          notes: { type: "string" },
                          lastDoc: { type: "string", description: "URL or path to uploaded last documentation photo" },
                          redeemDate: { type: "string", format: "date-time" },
                          redeemBy: { type: "string" },
                          member: {
                            type: "object",
                            properties: {
                              fullName: { type: "string" },
                              memberNumber: { type: "string" },
                              nik: { type: "string" }
                            }
                          },
                          station: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              code: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            404: { description: "Redeem transaction not found" },
            500: { description: "Internal server error" },
          },
        },
        patch: {
          tags: ["Redeem"],
          summary: "Update Redeem Notes",
          description: "Update notes/remarks for a specific redeem transaction. Only notes field can be updated.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Redeem transaction ID"
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { 
                    notes: { 
                      type: "string",
                      description: "Notes or remarks for this redeem transaction",
                      example: "Penumpang terlambat datang"
                    } 
                  },
                  required: ["notes"],
                },
              },
            },
          },
          responses: {
            200: { 
              description: "Notes updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" }
                    }
                  }
                }
              }
            },
            404: { description: "Redeem transaction not found" },
            500: { description: "Internal server error" },
          },
        },
        delete: {
          tags: ["Redeem"],
          summary: "Delete Redeem (restore quota)",
          description: "Soft delete redeem and restore consumed quota to card. Optionally provide deletion notes.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Redeem transaction ID"
            },
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { 
                    notes: { 
                      type: "string",
                      description: "Optional deletion reason or notes" 
                    } 
                  },
                },
              },
            },
          },
          responses: {
            200: { 
              description: "Redeem deleted and quota restored successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          restoredQuota: { 
                            type: "number",
                            description: "Number of quota restored back to card"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            404: { description: "Redeem not found or already deleted" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/redeem/export": {
        get: {
          tags: ["Redeem"],
          summary: "Export Daily Redeem Report",
          description:
            "Export redeem transactions report for a specific date. Supports multiple formats: CSV, XLSX, PDF, or JPG. Defaults to today's date if not specified.",
          parameters: [
            {
              name: "date",
              in: "query",
              required: false,
              schema: { type: "string", format: "date" },
              description: "Date for report export (YYYY-MM-DD). Defaults to today.",
              example: "2024-01-15"
            },
            {
              name: "format",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["csv", "xlsx", "pdf", "jpg"], default: "xlsx" },
              description: "Export format. Defaults to xlsx."
            },
          ],
          responses: {
            200: { 
              description: "Report file generated and downloaded",
              content: {
                "application/octet-stream": {
                  schema: {
                    type: "string",
                    format: "binary",
                    description: "Report file in requested format"
                  }
                }
              }
            },
            400: { description: "Invalid date or format parameter" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/redeem/{id}/last-doc": {
        post: {
          tags: ["Redeem"],
          summary: "Upload Last Redeem Documentation",
          description:
            "Upload a photo when performing the last redeem (when previous quota is 1 or 2). Photo is saved as Base64-encoded JPEG/PNG.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Redeem transaction ID (from POST /redeem response)"
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
                      description: "Base64-encoded image string (JPEG/PNG)",
                      example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
                    },
                    mimeType: {
                      type: "string",
                      enum: ["image/jpeg", "image/png"],
                      description:
                        "Optional mimeType override. Auto-detected if not provided.",
                      example: "image/jpeg"
                    },
                  },
                  required: ["imageBase64"],
                },
              },
            },
          },
          responses: {
            200: { 
              description: "Last redeem documentation uploaded successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          lastDoc: { 
                            type: "string",
                            description: "URL or path to uploaded documentation"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: { description: "Invalid image format or missing imageBase64" },
            404: { description: "Redeem transaction not found" },
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
        name: "Product Type",
        description: "Product type management endpoints",
      },
      {
        name: "Card Status",
        description: "Card status management endpoints",
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
        name: "Stock In FWC",
        description: "Stock in management endpoints for card inventory",
      },
      {
        name: "Stock In Voucher",
        description: "Stock in management endpoints for voucher inventory",
      },
      {
        name: "Stock Out FWC",
        description: "Stock out management endpoints for card inventory",
      },
      {
        name: "Stock Out Voucher",
        description: "Stock out management endpoints for voucher inventory",
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
