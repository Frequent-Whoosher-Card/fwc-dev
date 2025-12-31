import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { docsConfig } from "./docs";
import { auth } from "./modules/auth";
import { users } from "./modules/users";
import { cardCategory } from "./modules/cards/category";
import { cardTypes } from "./modules/cards/type";
import { sales } from "./modules/sales";
import { metrics } from "./modules/metrics";
import { stock } from "./modules/stock";
import { cardProducts } from "./modules/cards/product";
import { station } from "./modules/station";
import { cardInventory } from "./modules/stock/inventory";
import { members } from "./modules/members";
import { AuthenticationError, AuthorizationError } from "./utils/errors";

const app = new Elysia()
  .use(docsConfig)
  .use(cors())
  .get("/", () => ({
    success: true,
    message: "FWC API is running",
    version: "1.0.0",
  }))
  .use(auth)
  .use(users)
  .use(members)
  .use(cardCategory)
  .use(cardTypes)
  .use(cardProducts)
  .use(station)
  .use(cardInventory)
  .use(stock)
  .use(sales)
  .use(metrics)
  .onError(({ code, error, set }) => {
    // Global error handler
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        error: {
          message: error.message,
          code: "VALIDATION_ERROR",
          statusCode: 400,
        },
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        error: {
          message: "Route not found",
          code: "NOT_FOUND",
          statusCode: 404,
        },
      };
    }

    // Handle AuthorizationError
    if (error instanceof AuthorizationError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || "AUTHORIZATION_ERROR",
          statusCode: error.statusCode,
        },
      };
    }

    // Handle AuthenticationError
    if (error instanceof AuthenticationError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || "AUTH_ERROR",
          statusCode: error.statusCode,
        },
      };
    }

    set.status = 500;
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
        statusCode: 500,
      },
    };
  })
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
