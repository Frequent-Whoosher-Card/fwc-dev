import db from "../config/db";
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { cookie } from "@elysiajs/cookie";
import { AuthenticationError } from "../utils/errors";
import { jwtConfig } from "../config/jwt";

export const authMiddleware = (app: Elysia) =>
  app
    .use(
      jwt({
        name: "jwt",
        secret: jwtConfig.secret,
      })
    )
    .use(cookie())
    .derive(async ({ jwt, cookie: { session }, set }) => {
      // Check if session cookie exists
      const token = session.value;
      if (!token || typeof token !== "string") {
        set.status = 401;
        throw new AuthenticationError("No session found. Please login.");
      }

      try {
        // Verify JWT token
        const payload = await jwt.verify(token);

        if (!payload || typeof payload !== "object") {
          set.status = 401;
          throw new AuthenticationError("Invalid session token");
        }

        const userId = (payload as { userId?: string }).userId;

        if (!userId) {
          set.status = 401;
          throw new AuthenticationError("Invalid session token");
        }

        // Verify user still exists and is active
        const user = await db.user.findFirst({
          where: {
            id: userId,
            deletedAt: null,
            isActive: true,
          },
          include: {
            role: true,
          },
        });

        if (!user) {
          set.status = 401;
          throw new AuthenticationError("User not found or inactive");
        }

        // Attach user to context
        return {
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: {
              id: user.role.id,
              roleCode: user.role.roleCode,
              roleName: user.role.roleName,
            },
          },
        };
      } catch (error) {
        // If JWT verification fails
        if (error instanceof AuthenticationError) {
          throw error;
        }
        set.status = 401;
        throw new AuthenticationError("Invalid or expired session");
      }
    });
