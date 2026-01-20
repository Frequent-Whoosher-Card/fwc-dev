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
    url: "/",
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
        name: "Cards Generate",
        description: "Cards generate management endpoints",
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
