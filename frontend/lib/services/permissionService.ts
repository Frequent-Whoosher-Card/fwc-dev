import { apiFetch } from "../apiConfig";

export interface Permission {
    id: string;
    actionCode: string; // e.g., 'user.view'
    actionName: string; // e.g., 'View Users'
}

export interface PermissionGroup {
    module: string; // e.g., 'User Management'
    permissions: Permission[];
}

export const PermissionService = {
    /**
     * Get all permissions grouped by module
     */
    getAllGrouped: async (): Promise<PermissionGroup[]> => {
        const response = await apiFetch("/permissions");
        return response.data;
    },
};
