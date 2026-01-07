import { Elysia } from "elysia";
import { StationModel } from "./model";
import { StationService } from "./service";
import { authMiddleware } from "../../middleware/auth";
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
  };
};

export const station = new Elysia({ prefix: "/station" })
  .use(authMiddleware)
  // Protected Routes (Admin/Superadmin only for Write, Read for all auth usually OK but let's restrict Management to Admin+ for now unless specified)
  // Actually, let's allow "Read" for all authenticated users (e.g. for dropdowns), but Write for Admin only.
  // Wait, prompt says "CRUD". Usually Stations are managed by Admins.
  .group("", (app) =>
    app
      .get(
        "/",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await StationService.getAll({
              page: query.page ? parseInt(query.page) : undefined,
              limit: query.limit ? parseInt(query.limit) : undefined,
              search: query.search,
            });
            return {
              success: true,
              data: result,
            };
          } catch (error) {
            set.status = 500;
            return formatErrorResponse(error);
          }
        },
        {
          query: StationModel.getStationsQuery,
          response: {
            200: StationModel.getListStationResponse,
            500: StationModel.errorResponse,
          },
          detail: {
            tags: ["Station"],
            summary: "Get All Stations",
            description: "List Data Stasiun",
          },
        }
      )
      .get(
        "/:id",
        async (context) => {
          const { params, set } = context;
          try {
            const result = await StationService.getById(params.id);
            return {
              success: true,
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
          response: {
            200: StationModel.getDetailStationResponse,
            404: StationModel.errorResponse,
            500: StationModel.errorResponse,
          },
          detail: {
            tags: ["Station"],
            summary: "Get Detail Station",
          },
        }
      )
  )
  // Restricted Writes
  .group("", (app) =>
    app
      .use(rbacMiddleware(["superadmin", "admin"]))
      .post(
        "/",
        async (context) => {
          const { body, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const result = await StationService.create(body, user.id);
            return {
              success: true,
              message: "Stasiun berhasil dibuat",
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
          body: StationModel.createStationBody,
          response: {
            200: StationModel.createStationResponse,
            400: StationModel.errorResponse,
            500: StationModel.errorResponse,
          },
          detail: {
            tags: ["Station"],
            summary: "Create Station",
          },
        }
      )
      .patch(
        "/:id",
        async (context) => {
          const { params, body, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const result = await StationService.update(
              params.id,
              body,
              user.id
            );
            return {
              success: true,
              message: "Stasiun berhasil diupdate",
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
          body: StationModel.updateStationBody,
          response: {
            200: StationModel.createStationResponse, // Reuse similar response structure
            404: StationModel.errorResponse,
            500: StationModel.errorResponse,
          },
          detail: {
            tags: ["Station"],
            summary: "Update Station",
          },
        }
      )
      .delete(
        "/:id",
        async (context) => {
          const { params, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const result = await StationService.delete(params.id, user.id);
            return result;
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
            200: StationModel.genericResponse,
            404: StationModel.errorResponse,
            500: StationModel.errorResponse,
          },
          detail: {
            tags: ["Station"],
            summary: "Delete Station (Soft Delete)",
          },
        }
      )
  );
