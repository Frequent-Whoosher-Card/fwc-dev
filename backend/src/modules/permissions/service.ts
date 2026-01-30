import db from "../../config/db";

export class PermissionService {
    // Get all permissions grouped by module
    static async getAllGrouped() {
        const permissions = await db.permission.findMany({
            orderBy: {
                actionCode: "asc",
            },
        });

        // Group permissions by module (extracted from actionCode)
        const grouped = permissions.reduce((acc, permission) => {
            // Extract module from actionCode (e.g., "stock.in.view" -> "stock.in")
            const parts = permission.actionCode.split(".");
            const module = parts.length > 2 ? parts.slice(0, 2).join(".") : parts[0];

            if (!acc[module]) {
                acc[module] = [];
            }

            acc[module].push({
                id: permission.id,
                actionCode: permission.actionCode,
                actionName: permission.actionName,
            });

            return acc;
        }, {} as Record<string, Array<{ id: string; actionCode: string; actionName: string }>>);

        // Convert to array format
        return Object.entries(grouped).map(([module, permissions]) => ({
            module,
            permissions,
        }));
    }
}
