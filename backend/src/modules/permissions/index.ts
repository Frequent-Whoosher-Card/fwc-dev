import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { permissionMiddleware } from "../../middleware/permission";
import { formatErrorResponse } from "../../utils/errors";
import { PermissionService } from "./service";
import { PermissionModel } from "./model";

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

export const permissions = new Elysia({ prefix: "/permissions" })
    .use(authMiddleware)
    .use(permissionMiddleware("role.manage")) // Only superadmin can manage permissions

    // Get All Permissions (Grouped by Module)
    .get(
        "/",
        async (context) => {
            const { set } = context as typeof context;
            try {
                const groupedPermissions = await PermissionService.getAllGrouped();

                return {
                    success: true,
                    message: "Permissions fetched successfully",
                    data: groupedPermissions,
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
                200: PermissionModel.getAllPermissionsResponse,
                401: PermissionModel.errorResponse,
                403: PermissionModel.errorResponse,
                500: PermissionModel.errorResponse,
            },
            detail: {
                tags: ["Permissions"],
                summary: "Get All Permissions Grouped by Module",
                description:
                    "Retrieve all available permissions grouped by module for permission matrix display",
            },
        }
    );
