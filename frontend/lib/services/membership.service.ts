import { apiFetch } from '../apiConfig';

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
  gender?: string | null;
  alamat?: string | null;
  operatorName?: string | null;
  createdAt?: string | null;
  updatedAt?: string;
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
}) => {
  const query = new URLSearchParams();

  query.append('page', String(params?.page ?? 1));
  query.append('limit', String(params?.limit ?? 50));

  if (params?.search) {
    query.append('search', params.search);
  }

  if (params?.gender) {
    query.append('gender', params.gender);
  }

  if (params?.startDate) {
    query.append('startDate', params.startDate);
  }

  if (params?.endDate) {
    query.append('endDate', params.endDate);
  }

  const res = await apiFetch(
    `/members?${query.toString()}`,
    { method: 'GET' }
  );

  const data = res?.data ?? {};

  return {
    ...res,
    data: {
      ...data,
      items: Array.isArray(data.items)
        ? data.items.map((item: any): MemberListItem => ({
            id: String(item.id),
            name: item.name ?? '',
            identityNumber: item.identityNumber ?? '',
            nationality: item.nationality ?? '',
            email: item.email ?? null,
            phone: item.phone ?? null,
            gender: item.gender ?? null,
            alamat: item.alamat ?? null,
            operatorName: item.createdByName ?? null,
            createdAt: item.createdAt ?? null, 
            updatedAt: item.updatedAt ?? null,
          }))
        : [],
    },
  };
};

/**
 * GET MEMBER BY ID
 */
export const getMemberById = (id: string | number) => {
  return apiFetch(`/members/${id}`, { method: 'GET' });
};

/**
 * CREATE MEMBER
 */
export const createMember = (payload: any) => {
  return apiFetch('/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * UPDATE MEMBER
 */
export const updateMember = (
  id: string | number,
  payload: any
) => {
  return apiFetch(`/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

/**
 * DELETE MEMBER
 */
export const deleteMember = (id: string | number) => {
  return apiFetch(`/members/${id}`, {
    method: 'DELETE',
  });
};

/**
 * GET MEMBER TRANSACTIONS
 */
export const getMemberTransactions = (
  memberId: string | number
) => {
  return apiFetch(
    `/members/${memberId}/transactions`,
    { method: 'GET' }
  );
};
