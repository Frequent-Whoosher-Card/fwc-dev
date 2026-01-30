import { t } from "elysia";

export namespace PermissionModel {
    // Permission item
    export const permissionItem = t.Object({
        id: t.String(),
        actionCode: t.String(),
        actionName: t.String(),
    });

    // Grouped permissions
    export const permissionGroup = t.Object({
        module: t.String(),
        permissions: t.Array(permissionItem),
    });

    // Get All Permissions Response
    export const getAllPermissionsResponse = t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Array(permissionGroup),
    });

    // Error Response
    export const errorResponse = t.Object({
        success: t.Boolean(),
        message: t.Optional(t.String()),
        error: t.Object({
            message: t.String(),
            code: t.String(),
            statusCode: t.Number(),
        }),
    });
}
