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
    )

    // Get all menus with permissions for management
    .get(
        "/with-permissions",
        async (context) => {
            const { set } = context as typeof context;
            try {
                const menus = await MenuAccessService.getMenusWithPermissions();

                return {
                    success: true,
                    message: "Menus with permissions retrieved successfully",
                    data: menus,
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
                200: t.Object({
                    success: t.Boolean(),
                    message: t.String(),
                    data: t.Array(
                        t.Object({
                            id: t.String(),
                            label: t.String(),
                            route: t.Nullable(t.String()),
                            icon: t.Nullable(t.String()),
                            ordering: t.Number(),
                            parentId: t.Nullable(t.String()),
                            isVisible: t.Boolean(),
                            permissions: t.Array(
                                t.Object({
                                    id: t.String(),
                                    actionCode: t.String(),
                                    actionName: t.String(),
                                })
                            ),
                        })
                    ),
                }),
                401: MenuAccessModel.errorResponse,
                500: MenuAccessModel.errorResponse,
            },
            detail: {
                tags: ["Menu Access"],
                summary: "Get all menus with permissions",
                description:
                    "Retrieve all menus with their linked permissions for management",
            },
        }
    )

    // Toggle menu visibility
    .post(
        "/:id/toggle-visibility",
        async (context) => {
            const { params, body, set } = context as typeof context & {
                params: { id: string };
                body: { visible: boolean };
            };
            try {
                await MenuAccessService.toggleMenuVisibility(
                    params.id,
                    body.visible
                );

                return {
                    success: true,
                    message: `Menu ${body.visible ? "shown" : "hidden"} successfully`,
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
            body: t.Object({
                visible: t.Boolean(),
            }),
            response: {
                200: t.Object({
                    success: t.Boolean(),
                    message: t.String(),
                }),
                400: MenuAccessModel.errorResponse,
                404: MenuAccessModel.errorResponse,
                500: MenuAccessModel.errorResponse,
            },
            detail: {
                tags: ["Menu Access"],
                summary: "Toggle menu visibility",
                description:
                    "Show or hide a menu in the sidebar by linking/unlinking permissions",
            },
        }
    );
