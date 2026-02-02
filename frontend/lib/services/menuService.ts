import { apiFetch } from "../apiConfig";

export interface MenuItem {
    label: string;
    route: string | null;
    icon: string | null;
    children?: MenuItem[];
    ordering: number;
}

export const MenuService = {
    /**
     * Get menu for current user based on permissions
     */
    getUserMenu: async (): Promise<MenuItem[]> => {
        const response = await apiFetch("/users/me/menu");
        // Sort logic usually handled by backend, but safe to sort here too if needed
        // Assuming backend returns tree structure
        return response.data;
    },
};
