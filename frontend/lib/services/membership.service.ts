import { apiFetch } from "../apiConfig";
import axios from "@/lib/axios";
import type { Member } from "@/types/purchase";

/* =========================
   TYPES
========================= */

export interface MemberListItem {
  id: string;
  name: string;
  identityNumber: string;
  nationality: string;
  email: string | null;
  phone: string | null;
  nippKai?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  alamat?: string | null;
  companyName?: string | null;
  operatorName?: string | null;
  createdAt?: string | null;
  updatedAt?: string;
  employeeTypeId?: string | null;
  employeeType?: { id: string; code: string; name: string } | null;
  cityId?: string | null;
  city?: { id: string; name: string } | null;
  deletedAt?: string | null;
  deletedByName?: string | null;
  notes?: string | null;
}

export interface OCRExtractResponse {
  success: boolean;
  data: {
    identityNumber: string | null;
    name: string | null;
    gender: string | null;
    alamat: string | null;
  };
  raw?: {
    text_blocks_count: number;
    combined_text: string;
  };
  message?: string;
}

/* =========================
   MEMBERSHIP SERVICE
========================= */

/**
 * GET ALL MEMBERS
 * BACKEND WAJIB pagination
 */
export const getMembers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  gender?: string;
  startDate?: string;
  endDate?: string;
  cardCategory?: string;
  hasNippKai?: boolean;
  employeeTypeId?: string;
  isDeleted?: boolean;
}) => {
  const query = new URLSearchParams();

  query.append("page", String(params?.page ?? 1));
  query.append("limit", String(params?.limit ?? 50));

  if (params?.search) {
    query.append("search", params.search);
  }

  if (params?.gender) {
    query.append("gender", params.gender);
  }

  if (params?.startDate) {
    query.append("startDate", params.startDate);
  }

  if (params?.endDate) {
    query.append("endDate", params.endDate);
  }

  if (params?.hasNippKai === true) {
    query.append("hasNippKai", "true");
  }

  if (params?.employeeTypeId) {
    query.append("employeeTypeId", params.employeeTypeId);
  }

  if (params?.isDeleted === true) {
    query.append("isDeleted", "true");
  }

  const res = await apiFetch(`/members?${query.toString()}`, { method: "GET" });

  const data = res?.data ?? {};

  return {
    ...res,
    data: {
      ...data,
      items: Array.isArray(data.items)
        ? data.items.map(
            (item: any): MemberListItem => ({
              id: String(item.id),
              name: item.name ?? "",
              identityNumber: item.identityNumber ?? "",
              nationality: item.nationality ?? "",
              email: item.email ?? null,
              phone: item.phone ?? null,
              nippKai: item.nippKai ?? null,
              gender: item.gender ?? null,
              birthDate: item.birthDate ?? null,
              alamat: item.alamat ?? null,
              companyName: item.companyName ?? null,
              operatorName: item.createdByName ?? null,
              createdAt: item.createdAt ?? null,
              updatedAt: item.updatedAt ?? null,
              employeeTypeId: item.employeeTypeId ?? null,
              employeeType: item.employeeType ?? null,
              cityId: item.cityId ?? null,
              city: item.city ?? null,
              deletedAt: item.deletedAt ?? null,
              deletedByName: item.deletedByName ?? null,
              notes: item.notes ?? null,
            }),
          )
        : [],
    },
  };
};

/**
 * GET MEMBER BY ID
 */
export const getMemberById = (id: string | number) => {
  return apiFetch(`/members/${id}`, { method: "GET" });
};

/**
 * CREATE MEMBER
 */
export const createMember = (payload: any) => {
  return apiFetch("/members", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * UPDATE MEMBER
 */
export const updateMember = (id: string | number, payload: any) => {
  return apiFetch(`/members/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

/**
 * DELETE MEMBER
 */
export const deleteMember = (id: string | number, notes: string) => {
  return apiFetch(`/members/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ notes: notes.trim() }),
  });
};

/**
 * GET MEMBER TRANSACTIONS
 */
export const getMemberTransactions = (memberId: string | number) => {
  return apiFetch(`/members/${memberId}/transactions`, { method: "GET" });
};

/**
 * EXTRACT KTP FIELDS USING OCR
 */
export const extractKTPFields = async (
  imageFile: File,
): Promise<OCRExtractResponse> => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const token = localStorage.getItem("fwc_token");
  if (!token) {
    throw new Error("No authentication token found. Please login.");
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const res = await fetch(`${API_BASE_URL}/members/ocr-extract`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        errorData?.message ||
        "OCR extraction failed",
    );
  }

  return res.json();
};

/**
 * FIND OR CREATE MEMBER BY IDENTITY NUMBER
 * Used in purchase flow to resolve/create member
 */
export async function resolveMemberByIdentity(
  identityNumber: string,
  cardCategory: "GOLD" | "SILVER" | "KAI",
): Promise<string> {
  try {
    // Try to find existing member
    const response = await axios.get("/members", {
      params: { identityNumber },
    });

    if (response.data?.data?.items?.length > 0) {
      return response.data.data.items[0].id;
    }

    // Create new member if not found
    const createResponse = await axios.post("/members", {
      identityNumber,
      type: cardCategory === "KAI" ? "KAI" : "PUBLIC",
    });

    return createResponse.data.data.id;
  } catch (error) {
    throw new Error("Gagal resolve member");
  }
}

/**
 * GET MEMBER BY IDENTITY NUMBER
 */
export async function getMemberByIdentity(
  identityNumber: string,
): Promise<Member | null> {
  try {
    const response = await axios.get("/members", {
      params: { identityNumber },
    });

    if (response.data?.data?.items?.length > 0) {
      return response.data.data.items[0];
    }

    return null;
  } catch (error) {
    return null;
  }
}
