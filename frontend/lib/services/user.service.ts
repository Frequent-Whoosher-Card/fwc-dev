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

/* ---------- STATION ---------- */
export interface StationItem {
  id: string;
  stationCode: string;
  stationName: string;
  location?: string | null;
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

  stationId: string;
  stationName: string;

  isActive: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDetail extends UserListItem {}

/* =========================
   ROLE SERVICE
========================= */
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

/* =========================
   STATION SERVICE
========================= */
export const getStations = async () => {
  const res = await apiFetch("/station", { method: "GET" });
  const data = res?.data?.items ?? [];

  return {
    ...res,
    data: Array.isArray(data)
      ? data.map(
          (item: any): StationItem => ({
            id: String(item.id),
            stationCode: item.stationCode ?? "",
            stationName: item.stationName ?? "",
            location: item.location ?? null,
          })
        )
      : [],
  };
};

/* =========================
   USER SERVICE
========================= */

/**
 * GET ALL USERS (pagination + filter)
 */
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  stationId?: string;
}) => {
  const query = new URLSearchParams();

  query.append("page", String(params?.page ?? 1));
  query.append("limit", String(params?.limit ?? 10));

  if (params?.search) query.append("search", params.search);
  if (params?.roleId) query.append("roleId", params.roleId);
  if (params?.stationId) query.append("stationId", params.stationId);

  const res = await apiFetch(`/users?${query.toString()}`, { method: "GET" });
  const data = res?.data ?? [];

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

              stationId: item.station?.id ?? "",
              stationName: item.station?.stationName ?? "",

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

      stationId: item.station?.id ?? "",
      stationName: item.station?.stationName ?? "",

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
  nip: string;
  email?: string | null;
  phone?: string | null;
  roleId: string;
  stationId?: string;
  password: string;
}) => {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
      fullName: payload.fullName,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      nip: payload.nip,              // ⬅️ INI NIH
      roleId: payload.roleId,
      stationId: payload.stationId ?? null,
      isActive: true,                // ⬅️ DAN INI
    }),
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
    stationId?: string;
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
  return apiFetch(`/users/${id}`, { method: "DELETE" });
};

/**
 * CHANGE PASSWORD
 */
export const changePassword = (
  id: string,
  payload: {
    currentPassword?: string; // Optional for admin overrides
    newPassword: string;
    confirmPassword: string;
  }
) => {
  // Backend expects: currentPassword, newPassword, confirmPassword
  // Since superadmin overrides user's password, currentPassword might not be needed
  // depending on backend implementation. Based on investigation,
  // admin override might need a specific endpoint or bypass check.
  // Checking api definition...
  // Based on backend routes: POST /users/:id/change-password
  // Payload: currentPassword, newPassword, confirmPassword.
  // BUT for admins, currentPassword check is skipped in backend logic!
  // So we can send an empty string or dummy for currentPassword if not provided.

  return apiFetch(`/users/${id}/change-password`, {
    method: "POST",
    body: JSON.stringify({
      currentPassword: payload.currentPassword || "", // Admin doesn't need this
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword,
    }),
  });
};
