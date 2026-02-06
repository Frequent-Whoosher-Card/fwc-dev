import { apiFetch } from "../apiConfig";

export interface MenuItem {
    label: string;
    route: string | null;
    icon: string | null;
    children?: MenuItem[];
    ordering?: number;
}

export interface MenuWithPermissions {
    id: string;
    label: string;
    route: string | null;
    icon: string | null;
    ordering: number;
    parentId: string | null;
    isVisible: boolean;
    permissions: {
        id: string;
        actionCode: string;
        actionName: string;
    }[];
}

export const MenuService = {
    /**
     * Get menu for current user based on permissions
     */
    getUserMenu: async (): Promise<MenuItem[]> => {
        const response = await apiFetch("/users/me/menu");
        // Backend now returns { menu: [], permissions: [] }
        // For backward compatibility, return just the menu array
        return response.data.menu || response.data;
    },

    /**
     * Get all menus with their permissions for management
     */
    getMenusWithPermissions: async (): Promise<MenuWithPermissions[]> => {
        const response = await apiFetch("/menu-access/with-permissions");
        return response.data;
    },

    /**
     * Toggle menu visibility (show/hide in sidebar)
     */
    toggleMenuVisibility: async (menuId: string, visible: boolean): Promise<void> => {
        await apiFetch(`/menu-access/${menuId}/toggle-visibility`, {
            method: "POST",
            body: JSON.stringify({ visible }),
        });
    },
};
