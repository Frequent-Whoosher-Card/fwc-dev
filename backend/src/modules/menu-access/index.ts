import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { formatErrorResponse } from "../../utils/errors";
import { MenuAccessService } from "./service";
import { MenuAccessModel } from "./model";

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

import { permissionMiddleware } from "../../middleware/permission";

export const menuAccess = new Elysia({ prefix: "/menu-access" })
    .use(authMiddleware)
    .use(permissionMiddleware("menu.view"))

    // Get All Menu Access (Hierarchical Structure)
    .get(
        "/",
        async (context) => {
            const { set } = context as typeof context;
            try {
                const menuTree = await MenuAccessService.getMenuTree();

                return {
                    success: true,
                    message: "Menu structure fetched successfully",
                    data: menuTree,
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
                200: MenuAccessModel.menuTreeResponse,
                401: MenuAccessModel.errorResponse,
                500: MenuAccessModel.errorResponse,
            },
            detail: {
                tags: ["Menu Access"],
                summary: "Get Menu Structure",
                description:
                    "Retrieve hierarchical menu structure for administration purposes",
            },
        }
    );
