// ✅ BENAR
import { apiFetch } from "@/lib/apiConfig";

/* =========================
   TYPES
========================= */

export interface CreatePurchasePayload {
  cardId: string;
  memberId: string;
  edcReferenceNumber: string;

  /** TANGGAL PEMBELIAN (WAJIB) */
  purchasedDate: string;

  /** TANGGAL KADALUARSA (WAJIB) */
  expiredDate: string;

  /** SHIFT OPSIONAL */
  shiftDate?: string;

  /** HARGA (READONLY DARI CARD PRODUCT) */
  price?: number;

  /** OPERATOR YANG MELAYANI */
  operatorName?: string;

  /** STASIUN (DARI AUTH / ME) */
  stationId?: string;

  /** CATATAN OPSIONAL */
  notes?: string;
}

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

/* =========================
   PURCHASE SERVICE
========================= */

/**
 * CREATE PURCHASE
 */
export const createPurchase = (payload: CreatePurchasePayload) => {
  return apiFetch("/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * GET ALL PURCHASES
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

  if (params?.page) {
    query.append("page", String(params.page));
  }
  if (params?.limit) {
    query.append("limit", String(params.limit));
  }
  if (params?.search) {
    query.append("search", params.search);
  }
  if (params?.startDate) {
    query.append("startDate", params.startDate);
  }
  if (params?.endDate) {
    query.append("endDate", params.endDate);
  }
  if (params?.categoryId) {
    query.append("categoryId", params.categoryId);
  }
  if (params?.typeId) {
    query.append("typeId", params.typeId);
  }
  if (params?.stationId) {
    query.append("stationId", params.stationId);
  }

  const res = await apiFetch(`/purchases?${query.toString()}`, {
    method: "GET",
  });

  return res;
};

/**
 * GET PURCHASE BY ID
 */
export const getPurchaseById = (id: string | number) => {
  return apiFetch(`/purchases/${id}`, { method: "GET" });
};

/* =========================
   TWO-STEP ACTIVATION
========================= */

/**
 * ACTIVATE CARD (Step 2)
 */
export const activateCard = (
  purchaseId: string,
  physicalCardSerialNumber: string
) => {
  return apiFetch(`/purchases/${purchaseId}/activate`, {
    method: "POST",
    body: JSON.stringify({ physicalCardSerialNumber }),
  });
};

/**
 * SWAP CARD (Before activation)
 */
export const swapCard = (
  purchaseId: string,
  correctCardSerialNumber: string,
  reason?: string
) => {
  return apiFetch(`/purchases/${purchaseId}/swap-card`, {
    method: "POST",
    body: JSON.stringify({ correctCardSerialNumber, reason }),
  });
};

/**
 * CANCEL PURCHASE
 */
export const cancelPurchase = (purchaseId: string, reason?: string) => {
  return apiFetch(`/purchases/${purchaseId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
};

/**
 * GET ACTIVATION STATUS
 */
export const getActivationStatus = (purchaseId: string) => {
  return apiFetch(`/purchases/${purchaseId}/activation-status`, {
    method: "GET",
  });
};

/**
 * GET PENDING ACTIVATIONS
 */
export const getPendingActivations = (stationId?: string) => {
  const query = new URLSearchParams();
  if (stationId) {
    query.append("stationId", stationId);
  }
  return apiFetch(`/purchases/pending-activations?${query.toString()}`, {
    method: "GET",
  });
};
