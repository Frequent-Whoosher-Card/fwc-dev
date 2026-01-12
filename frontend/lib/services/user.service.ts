import { apiFetch } from "../apiConfig";

/* =========================
   TYPES (FE CONTRACT)
========================= */

/* ---------- ROLE ---------- */
export interface RoleItem {
  id: string;
  roleCode: string;
  roleName: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/* ---------- USER ---------- */
export interface UserListItem {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  nip: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDetail extends UserListItem {}

/* =========================
   ROLE SERVICE
========================= */

/**
 * GET ALL ROLES
 */
export const getRoles = async () => {
  const res = await apiFetch("/users/roles", {
    method: "GET",
  });

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

/* =========================
   USER SERVICE
========================= */

/**
 * GET ALL USERS (pagination)
 */
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  roleCode?: string;
  stationId?: string;
}) => {
  const query = new URLSearchParams();

  query.append("page", String(params?.page ?? 1));
  query.append("limit", String(params?.limit ?? 10));

  if (params?.search) {
    query.append("search", params.search);
  }

  if (params?.roleCode) {
    query.append("roleCode", params.roleCode);
  }

  const res = await apiFetch(`/users?${query.toString()}`, { method: "GET" });

  const data = res?.data ?? {};

  return {
    ...res,
    data: {
      items: Array.isArray(data)
        ? data.map(
            (item: any): UserListItem => ({
              id: String(item.id),
              username: item.username ?? "",
              fullName: item.fullName ?? "",
              email: item.email ?? null,
              phone: item.phone ?? null,
              nip: item.nip ?? "",
              roleId: item.role?.id ?? "",
              roleCode: item.role?.roleCode ?? "",
              roleName: item.role?.roleName ?? "",
              isActive: Boolean(item.isActive),
              lastLogin: item.lastLogin ?? null,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            })
          )
        : [],
      pagination: res?.pagination,
    },
  };
};

/**
 * GET USER BY ID
 */
export const getUserById = async (id: string | number) => {
  const res = await apiFetch(`/users/${id}`, { method: "GET" });
  const item = res?.data ?? {};

  return {
    ...res,
    data: {
      id: String(item.id),
      username: item.username ?? "",
      fullName: item.fullName ?? "",
      email: item.email ?? null,
      phone: item.phone ?? null,
      nip: item.nip ?? "",
      roleId: item.role?.id ?? "",
      roleCode: item.role?.roleCode ?? "",
      roleName: item.role?.roleName ?? "",
      isActive: Boolean(item.isActive),
      lastLogin: item.lastLogin ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    } as UserDetail,
  };
};

/**
 * CREATE USER
 */
export const createUser = (payload: {
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  nip: string;
  roleId: string;
  password: string;
}) => {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * UPDATE USER
 */
export const updateUser = (
  id: string | number,
  payload: {
    username?: string;
    fullName?: string;
    email?: string | null;
    phone?: string | null;
    nip?: string;
    roleId?: string;
    stationId?: string; // ✅ TAMBAHAN FIELD

    isActive?: boolean;
  }
) => {
  return apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

/**
 * DELETE USER
 */
export const deleteUser = (id: string | number) => {
  return apiFetch(`/users/${id}`, {
    method: "DELETE",
  });
};
