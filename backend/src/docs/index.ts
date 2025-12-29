import { swagger } from "@elysiajs/swagger";

/**
 * API Documentation Configuration
 *
 * This configuration provides interactive API documentation
 * accessible at /docs endpoint
 */
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
        name: "Cards",
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
        name: "Stock",
        description: "Stock management endpoints for card inventory",
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
        name: "Sales",
        description: "Sales endpoints for card sales data and analytics",
      },
      {
        name: "Metrics",
        description: "Metrics endpoints for card metrics data and analytics",
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
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
      {
        url: "https://api.fwc.example.com",
        description: "Production server",
      },
    ],
  },
});
