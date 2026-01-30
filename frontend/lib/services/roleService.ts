import { apiFetch } from "../apiConfig";

export interface Role {
    id: string;
    roleCode: string;
    roleName: string;
    description?: string;
    isActive: boolean;
}

export const RoleService = {
    /**
     * Get all roles
     */
    getAll: async (): Promise<Role[]> => {
        const response = await apiFetch("/users/roles");
        return response.data;
    },

    /**
     * Get role by ID
     */
    getById: async (id: string): Promise<Role> => {
        const response = await apiFetch(`/users/roles/${id}`);
        return response.data;
    },

    /**
     * Create new role
     */
    create: async (data: Partial<Role>): Promise<Role> => {
        const response = await apiFetch("/users/roles", {
            method: "POST",
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * Update role
     */
    update: async (id: string, data: Partial<Role>): Promise<Role> => {
        const response = await apiFetch(`/users/roles/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * Delete role
     */
    delete: async (id: string): Promise<void> => {
        await apiFetch(`/users/roles/${id}`, {
            method: "DELETE",
        });
    },

    /**
     * Get permissions assigned to a role
     * Returns array of permission IDs
     */
    getPermissions: async (roleId: string): Promise<string[]> => {
        const response = await apiFetch(`/users/roles/${roleId}/permissions`);
        return response.data.permissions;
    },

    /**
     * Update permissions for a role
     */
    updatePermissions: async (roleId: string, permissionIds: string[]): Promise<void> => {
        await apiFetch(`/users/roles/${roleId}/permissions`, {
            method: "PUT",
            body: JSON.stringify({ permissionIds }),
        });
    },
};
