// ✅ BENAR
import { apiFetch } from '@/lib/apiConfig';

/* =========================
   TYPES
========================= */

/**
 * Payload CREATE / UPDATE PURCHASE
 * (backend menggunakan payload yang sama)
 */
export interface CreatePurchasePayload {
  /** KARTU YANG DIBELI */
  cardId: string;

  /** MEMBER PEMILIK */
  memberId: string;

  /** NOMOR REFERENSI EDC */
  edcReferenceNumber: string;

  /** TANGGAL PEMBELIAN (WAJIB) */
  purchasedDate: string;

  /** TANGGAL KADALUARSA (WAJIB) */
  expiredDate: string;

  /** SHIFT OPSIONAL */
  shiftDate?: string;

  /** HARGA (READONLY, DITENTUKAN BACKEND) */
  price?: number;

  /** OPERATOR (AUTO DARI AUTH) */
  operatorName?: string;

  /** STASIUN (AUTO DARI AUTH / ME) */
  stationId?: string;

  /** CATATAN (EDIT ONLY) */
  notes?: string;
}

/**
 * ITEM LIST PURCHASE (TABLE)
 */
export interface PurchaseListItem {
  id: string;
  edcReferenceNumber: string;
  purchaseDate: string;
  price: number;
  card: {
    id: string;
    serialNumber: string;
    cardProduct: {
      category: {
        categoryName: string;
      };
      type: {
        typeName: string;
      };
    };
  };
  member: {
    id: string;
    name: string;
    identityNumber: string;
  } | null;
  operator: {
    fullName: string;
  };
  station: {
    stationName: string;
  };
}

/**
 * DETAIL PURCHASE (GET BY ID)
 */
export interface PurchaseDetail {
  id: string;
  edcReferenceNumber: string;
  purchaseDate: string;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  updatedByName: string;

  card: {
    id: string;
    serialNumber: string;
    expiredDate: string;
    cardProduct: {
      category: {
        id: string;
        categoryName: string;
      };
      type: {
        id: string;
        typeName: string;
      };
    };
  };

  member: {
    id: string;
    name: string;
    identityNumber: string;
  };

  operator: {
    id: string;
    fullName: string;
    username: string;
  };

  station: {
    id: string;
    stationCode: string;
    stationName: string;
  };
}

/* =========================
   PURCHASE SERVICE
========================= */

/**
 * CREATE PURCHASE
 */
export const createPurchase = (payload: CreatePurchasePayload) => {
  return apiFetch('/purchases', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * UPDATE PURCHASE
 */
export const updatePurchase = (
  id: string | number,
  payload: CreatePurchasePayload,
) => {
  return apiFetch(`/purchases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

/**
 * DELETE PURCHASE
 */
export const deletePurchase = (id: string | number) => {
  return apiFetch(`/purchases/${id}`, {
    method: 'DELETE',
  });
};

/**
 * GET ALL PURCHASES (LIST + FILTER)
 */
export const getPurchases = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  typeId?: string;
  stationId?: string;
}) => {
  const query = new URLSearchParams();

  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.search) query.append('search', params.search);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  if (params?.categoryId) query.append('categoryId', params.categoryId);
  if (params?.typeId) query.append('typeId', params.typeId);
  if (params?.stationId) query.append('stationId', params.stationId);

  return apiFetch(`/purchases?${query.toString()}`, {
    method: 'GET',
  });
};

/**
 * GET PURCHASE BY ID
 */
export const getPurchaseById = (id: string | number) => {
  return apiFetch(`/purchases/${id}`, {
    method: 'GET',
  });
};
