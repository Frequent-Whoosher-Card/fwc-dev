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
            return { menu: [], permissions: [] };
        }

        // Get user's role code for route replacement
        const userRoleCode = user.role.roleCode;

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

            // If menu has no permissions linked:
            // - Parent menus (no route) are tentatively included, will be pruned if no children
            // - Leaf menus (with route) are EXCLUDED if they have no permissions
            if (!menu.route) {
                // Parent menu - include tentatively, will be filtered by buildTree
                return true;
            }
            
            // Leaf menu without permissions - HIDE
            return false;
        });

        // Build hierarchical structure
        const buildTree = (parentId: string | null): any[] => {
            return accessibleMenus
                .filter((menu) => menu.parentId === parentId)
                .map((menu) => {
                    const children = buildTree(menu.id);
                    
                    // Replace :role placeholder with actual user role
                    const route = menu.route 
                        ? menu.route.replace(':role', userRoleCode)
                        : null;
                    
                    return {
                        label: menu.label,
                        route: route,
                        icon: menu.icon,
                        ...(children.length > 0 && { children }),
                    };
                })
                .filter((menu) => menu.route || (menu.children && menu.children.length > 0)); // Only show parents that have children
        };

        const menuTree = buildTree(null);
        const permissionCodes = Array.from(userActionCodes);

        return { menu: menuTree, permissions: permissionCodes };
    }

    // Get all menus with permissions for management
    static async getMenusWithPermissions() {
        const menus = await db.menuAccess.findMany({
            include: {
                permissions: {
                    orderBy: {
                        actionCode: "asc",
                    },
                },
            },
            orderBy: {
                ordering: "asc",
            },
        });

        return menus.map((menu) => ({
            id: menu.id,
            label: menu.label,
            route: menu.route,
            icon: menu.icon,
            ordering: menu.ordering,
            parentId: menu.parentId,
            isVisible: menu.permissions.length > 0, // Visible if has permissions
            permissions: menu.permissions.map((p) => ({
                id: p.id,
                actionCode: p.actionCode,
                actionName: p.actionName,
            })),
        }));
    }

    // Toggle menu visibility by linking/unlinking all permissions
    static async toggleMenuVisibility(menuId: string, visible: boolean) {
        const menu = await db.menuAccess.findUnique({
            where: { id: menuId },
            include: { permissions: true },
        });

        if (!menu) {
            throw new Error("Menu not found");
        }

        if (visible) {
            // Show menu: Find unlinked permissions that match this menu's module
            // Strategy: Look for permissions without menuAccessId that match our module prefix
            const permissions = menu.permissions;
            
            if (permissions.length > 0) {
                // Get module from first permission
                const modulePrefix = permissions[0].actionCode.split('.')[0];
                
                // Find orphaned permissions for this module
                await db.permission.updateMany({
                    where: {
                        actionCode: { startsWith: `${modulePrefix}.` },
                        menuAccessId: null,
                    },
                    data: { menuAccessId: menuId },
                });
            }
        } else {
            // Hide menu: Unlink all permissions from this menu
            await db.permission.updateMany({
                where: { menuAccessId: menuId },
                data: { menuAccessId: null },
            });
        }

        return { success: true };
    }
}
