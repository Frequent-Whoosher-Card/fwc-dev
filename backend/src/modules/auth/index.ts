import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { cookie } from "@elysiajs/cookie";
import { AuthService } from "./service";
import { AuthModel } from "./model";
import { jwtConfig } from "../../config/jwt";
import { formatErrorResponse } from "../../utils/errors";
import { authMiddleware } from "../../middleware/auth";

// Protected routes (require authentication)
const protectedAuthRoutes = new Elysia()
  .use(authMiddleware)
  .get(
    "/me",
    async (context) => {
      const { user, set } = context as typeof context & {
        user: {
          id: string;
          username: string;
          fullName: string;
          email: string | null;
          role: { id: string; roleCode: string; roleName: string };
        };
      };
      try {
        const profile = await AuthService.getUserProfile(user.id);

        return {
          success: true,
          data: profile,
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
      response: {
        200: AuthModel.meResponse,
        401: AuthModel.errorResponse,
        404: AuthModel.errorResponse,
        500: AuthModel.errorResponse,
      },
      detail: {
        tags: ["Authentication"],
        summary: "Get current user profile",
        description: "Returns authenticated user information",
      },
    }
  );

// Combine public and protected routes
export const auth = new Elysia({ prefix: "/auth" })
  // Setup JWT and Cookie plugins
  .use(
    jwt({
      name: "jwt",
      secret: jwtConfig.secret,
      exp: jwtConfig.expiresIn,
    })
  )
  .use(cookie())
  // Public routes
  .post(
    "/login",
    async ({ body, jwt, cookie: { session }, set }) => {
      try {
        const { username, password } = body;

        // Authenticate user
        const { user } = await AuthService.login(username, password);

        // Generate JWT token
        const token = await jwt.sign({
          userId: user.id,
          username: user.username,
          role: user.role.roleCode,
        });

        // Set session cookie
        session.set({
          value: token,
          ...jwtConfig.cookieOptions,
        });

        return {
          success: true,
          data: {
            user,
            token,
          },
          message: "Login successful",
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
      body: AuthModel.loginBody,
      response: {
        200: AuthModel.loginResponse,
        400: AuthModel.errorResponse,
        401: AuthModel.errorResponse,
        500: AuthModel.errorResponse,
      },
      detail: {
        tags: ["Authentication"],
        summary: "Login with username/email and password",
        description: "Authenticate user and create session",
      },
    }
  )
  // Logout endpoint
  .post(
    "/logout",
    async ({ cookie: { session }, set }) => {
      try {
        // Remove session cookie
        session.remove();

        return {
          success: true,
          message: "Logged out successfully",
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: AuthModel.logoutResponse,
        500: AuthModel.errorResponse,
      },
      detail: {
        tags: ["Authentication"],
        summary: "Logout from system",
        description: "Invalidate current session",
      },
    }
  )
  // Forgot password endpoint
  .post(
    "/forgot-password",
    async ({ body, set }) => {
      try {
        const { email } = body;
        const result = await AuthService.forgotPassword(email);

        return {
          success: true,
          message: result.message,
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
      body: AuthModel.forgotPasswordBody,
      response: {
        200: AuthModel.forgotPasswordResponse,
        400: AuthModel.errorResponse,
        500: AuthModel.errorResponse,
      },
      detail: {
        tags: ["Authentication"],
        summary: "Request password reset",
        description: "Send password reset token to email",
      },
    }
  )
  // Reset password endpoint
  .post(
    "/reset-password",
    async ({ body, set }) => {
      try {
        const { token, newPassword, confirmPassword } = body;
        const result = await AuthService.resetPassword(
          token,
          newPassword,
          confirmPassword
        );

        return {
          success: true,
          message: result.message,
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
      body: AuthModel.resetPasswordBody,
      response: {
        200: AuthModel.resetPasswordResponse,
        400: AuthModel.errorResponse,
        404: AuthModel.errorResponse,
        500: AuthModel.errorResponse,
      },
      detail: {
        tags: ["Authentication"],
        summary: "Reset password with token",
        description: "Update password using reset token",
      },
    }
  )
  // Protected routes
  .use(protectedAuthRoutes);
