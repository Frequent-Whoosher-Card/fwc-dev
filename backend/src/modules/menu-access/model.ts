import { t } from "elysia";

export namespace MenuAccessModel {
    // Menu Item
    export const menuItem: any = t.Object({
        id: t.String(),
        label: t.String(),
        route: t.Nullable(t.String()),
        icon: t.Nullable(t.String()),
        ordering: t.Number(),
        children: t.Array(t.Any()), // Recursive type
    });

    // Menu Tree Response
    export const menuTreeResponse = t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Array(t.Any()), // Array of menuItem (recursive)
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
