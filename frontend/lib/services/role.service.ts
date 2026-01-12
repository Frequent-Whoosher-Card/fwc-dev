import { apiFetch } from "@/lib/apiConfig";

/* ======================
   TYPES (FOLLOW BE)
====================== */
export interface RoleItem {
  id: string;           // UUID
  roleCode: string;     // admin | petugas | supervisor
  roleName: string;     // Admin | Petugas | Supervisor
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/* ======================
   GET ROLES
====================== */
export const getRoles = async () => {
  const res = await apiFetch("/users/roles", { method: "GET" });
  const data = res?.data ?? [];

  return {
    ...res,
    data: Array.isArray(data)
      ? data.map(
          (item: any): RoleItem => ({
            id: String(item.id),
            roleCode: item.roleCode ?? "",
            roleName: item.roleName ?? "",
            description: item.description ?? null,
            isActive: Boolean(item.isActive),
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })
        )
      : [],
  };
};
