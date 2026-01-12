import { apiFetch } from "@/lib/apiConfig";

/* ======================
   TYPES
====================== */
export interface Role {
  id: string;     // UUID
  name: string;   // Admin / Petugas / Supervisor
  code: string;   // ADMIN / PETUGAS / SPV
}

/* ======================
   GET ROLES
====================== */
export const getRoles = async (): Promise<Role[]> => {
  const res = await apiFetch("/roles");
  return res.data; // ⬅️ karena apiFetch sudah return JSON
};
