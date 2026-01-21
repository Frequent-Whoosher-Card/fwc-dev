// ✅ BENAR
import { apiFetch } from "@/lib/apiConfig";

/* =========================
   COMMON TYPES
========================= */

export type TransactionType = "fwc" | "voucher";

/* =========================
   CREATE / UPDATE PAYLOAD
========================= */

/**
 * Payload CREATE / UPDATE PURCHASE (FWC)
 */
export interface CreatePurchasePayload {
  cardId: string;
  memberId: string;
  edcReferenceNumber: string;
  purchasedDate: string;
  expiredDate: string;
  shiftDate?: string;

  /** readonly / backend */
  price?: number;
  operatorName?: string;
  stationId?: string;
  notes?: string;
}

/* =========================
   FWC TYPES
========================= */

export interface FWCPurchaseListItem {
  id: string;
  edcReferenceNumber: string;
  purchaseDate: string;
  shiftDate?: string | null;
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
   VOUCHER TYPES
========================= */

export interface VoucherTransactionListItem {
  id: string;
  edcReferenceNumber: string;
  purchaseDate: string;
  shiftDate?: string | null;
  price: number;

  voucher: {
    serialNumber: string;
    voucherProduct: {
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
   DETAIL PURCHASE (FWC)
========================= */

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
   QUERY PARAMS
========================= */

export interface GetPurchasesParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  typeId?: string;
  stationId?: string;

  /** 🔥 INI YANG HILANG KEMARIN */
  transactionType?: TransactionType;
}

/* =========================
   SERVICES
========================= */

/**
 * CREATE FWC PURCHASE
 */
export const createPurchase = (payload: CreatePurchasePayload) => {
  return apiFetch("/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * UPDATE FWC PURCHASE
 */
export const updatePurchase = (
  id: string | number,
  payload: CreatePurchasePayload,
) => {
  return apiFetch(`/purchases/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

/**
 * DELETE PURCHASE (FWC / Voucher)
 */
export const deletePurchase = (id: string | number) => {
  return apiFetch(`/purchases/${id}`, {
    method: "DELETE",
  });
};

/**
 * GET PURCHASE LIST (FWC / VOUCHER)
 */
export const getPurchases = async (params?: GetPurchasesParams) => {
  const query = new URLSearchParams();

  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.search) query.append("search", params.search);
  if (params?.startDate) query.append("startDate", params.startDate);
  if (params?.endDate) query.append("endDate", params.endDate);
  if (params?.categoryId) query.append("categoryId", params.categoryId);
  if (params?.typeId) query.append("typeId", params.typeId);
  if (params?.stationId) query.append("stationId", params.stationId);

  /** 🔥 TAB CONTROLLER */
  if (params?.transactionType) {
    query.append("transactionType", params.transactionType);
  }

  return apiFetch(`/purchases?${query.toString()}`, {
    method: "GET",
  });
};

/**
 * GET PURCHASE BY ID (FWC)
 */
export const getPurchaseById = (id: string | number) => {
  return apiFetch(`/purchases/${id}`, {
    method: "GET",
  });
};
