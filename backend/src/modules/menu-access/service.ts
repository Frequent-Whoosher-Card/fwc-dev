import db from "../../config/db";

export class MenuAccessService {
    // Get menu tree structure
    static async getMenuTree() {
        const allMenus = await db.menuAccess.findMany({
            orderBy: {
                ordering: "asc",
            },
        });

        // Build hierarchical structure
        const buildTree = (parentId: string | null): any[] => {
            return allMenus
                .filter((menu) => menu.parentId === parentId)
                .map((menu) => ({
                    id: menu.id,
                    label: menu.label,
                    route: menu.route,
                    icon: menu.icon,
                    ordering: menu.ordering,
                    children: buildTree(menu.id),
                }));
        };

        return buildTree(null);
    }

    // Get menu for specific user based on their permissions
    static async getUserMenu(userId: string) {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return [];
        }

        // Get all menus with their linked permissions
        const allMenus = await db.menuAccess.findMany({
            include: {
                permissions: true
            },
            orderBy: {
                ordering: "asc",
            },
        });

        // Get user's permission codes
        const userActionCodes = new Set(
            user.role.permissions.map((rp) => rp.permission.actionCode)
        );

        // Filter menus based on permissions
        const accessibleMenus = allMenus.filter((menu) => {
            // If menu has specific permissions linked, user must have at least one
            if (menu.permissions && menu.permissions.length > 0) {
                return menu.permissions.some((p) => userActionCodes.has(p.actionCode));
            }

            // If menu has no permissions linked (e.g. parent "Stock Kartu"), 
            // we tentatively include it. It will be pruned in buildTree if it ends up with no children.
            return true;
        });

        // Build hierarchical structure
        const buildTree = (parentId: string | null): any[] => {
            return accessibleMenus
                .filter((menu) => menu.parentId === parentId)
                .map((menu) => {
                    const children = buildTree(menu.id);
                    return {
                        label: menu.label,
                        route: menu.route,
                        icon: menu.icon,
                        ...(children.length > 0 && { children }),
                    };
                })
                .filter((menu) => menu.route || (menu.children && menu.children.length > 0)); // Only show parents that have children
        };

        return buildTree(null);
    }
}
