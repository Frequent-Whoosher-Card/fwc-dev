import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./modules/auth";
import { stock } from "./modules/stock";
import { openapi } from "@elysiajs/openapi";
import { users } from "./modules/users";

const app = new Elysia()
  .use(
    openapi({
      path: "/docs",
      documentation: {
        info: {
          title: "FWC API",
          version: "1.0.0",
        },
        servers: [{ url: "http://localhost:3000" }],
      },
    })
  )
  .use(cors())
  .get("/", () => ({
    success: true,
    message: "FWC API is running",
    version: "1.0.0",
  }))
  // Routes
  .use(auth)
  .use(stock)
  .use(users)
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
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
