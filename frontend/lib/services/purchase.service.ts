import { apiFetch } from "@/lib/apiConfig";
import axios from "@/lib/axios";
import type { Purchase } from "@/types/purchase";

export type TransactionType = "fwc" | "voucher";

export interface FWCPurchaseListItem {
  id: string;
  cardId: string | null;
  edcReferenceNumber: string;
  purchaseDate: string;
  shiftDate?: string | null;
  price: number;
  programType?: "FWC" | "VOUCHER" | null;

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
  } | null;

  bulkPurchaseItems: BulkPurchaseItem[];

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

  employeeTypeId?: string | null;
  employeeType?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface VoucherTransactionListItem {
  id: string;
  cardId: string | null;
  edcReferenceNumber: string;
  purchaseDate: string;
  shiftDate?: string | null;
  price: number;
  programType?: "FWC" | "VOUCHER" | null;

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
  } | null;

  bulkPurchaseItems: BulkPurchaseItem[];

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

  employeeTypeId?: string | null;
  employeeType?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface BulkPurchaseItem {
  id: string;
  purchaseId: string;
  cardId: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  card: {
    id: string;
    serialNumber: string;
    status: string;
    expiredDate: string | null;
    quotaTicket: number;
    cardProduct: {
      id: string;
      totalQuota: number;
      masaBerlaku: number;
      category: {
        id: string;
        categoryCode: string;
        categoryName: string;
      };
      type: {
        id: string;
        typeCode: string;
        typeName: string;
      };
    };
  };
}

export interface PurchaseDetail {
  id: string;
  cardId: string | null;
  memberId: string | null;
  operatorId: string;
  stationId: string;
  edcReferenceNumber: string;
  purchaseDate: string;
  price: number;
  notes?: string | null;
  programType?: "FWC" | "VOUCHER" | null;
  createdAt: string;
  updatedAt: string;
  createdByName: string | null;
  updatedByName: string | null;

  card: {
    id: string;
    serialNumber: string;
    status: string;
    expiredDate: string | null;
    quotaTicket: number;
    cardProduct: {
      id: string;
      totalQuota: number;
      masaBerlaku: number;
      category: {
        id: string;
        categoryCode: string;
        categoryName: string;
      };
      type: {
        id: string;
        typeCode: string;
        typeName: string;
      };
    };
  } | null;

  bulkPurchaseItems: BulkPurchaseItem[];

  member: {
    id: string;
    name: string;
    identityNumber: string;
  } | null;

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

  employeeTypeId?: string | null;
  employeeType?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface GetPurchasesParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  typeId?: string;
  stationId?: string;
  transactionType?: TransactionType;
  employeeTypeId?: string;
  isDeleted?: boolean;
}

export const updatePurchase = (id: string | number, payload: any) => {
  return apiFetch(`/purchases/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const deletePurchase = (id: string | number, notes: string) => {
  return apiFetch(`/purchases/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ notes: notes.trim() }),
  });
};

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
  if (params?.transactionType) {
    query.append("transactionType", params.transactionType);
  }
  if (params?.employeeTypeId) query.append("employeeTypeId", params.employeeTypeId);
  if (params?.isDeleted === true) query.append("isDeleted", "true");

  const response = await apiFetch(`/purchases?${query.toString()}`, {
    method: "GET",
  });

  // Ensure bulkPurchaseItems is always an array in response
  if (response?.data?.items) {
    response.data.items = response.data.items.map((item: any) => ({
      ...item,
      bulkPurchaseItems: Array.isArray(item.bulkPurchaseItems)
        ? item.bulkPurchaseItems
        : [],
      card: item.card || null,
      programType: item.programType || null,
    }));
  }

  return response;
};

export const getPurchaseById = async (id: string | number): Promise<PurchaseDetail> => {
  const response = await apiFetch(`/purchases/${id}`, {
    method: "GET",
  });

  // Ensure bulkPurchaseItems is always an array in response
  if (response?.data) {
    return {
      ...response.data,
      bulkPurchaseItems: Array.isArray(response.data.bulkPurchaseItems)
        ? response.data.bulkPurchaseItems
        : [],
      card: response.data.card || null,
      programType: response.data.programType || null,
    };
  }

  return response.data;
};

export async function createPurchase(payload: any): Promise<Purchase> {
  const response = await axios.post("/purchases", payload);
  return response.data.data;
}

/**
 * CREATE VOUCHER BULK PURCHASE
 * Create purchase transaction for multiple vouchers (bulk purchase)
 */
export interface CreateVoucherPurchasePayload {
  memberId: string;
  cards: Array<{
    cardId: string;
    price?: number;
  }>;
  edcReferenceNumber: string;
  paymentMethodId?: string;
  programType?: "VOUCHER";
  bulkDiscountId?: number;
  price?: number; // Total price (optional, will be calculated if not provided)
  notes?: string;
}

export async function createVoucherPurchase(
  payload: CreateVoucherPurchasePayload
): Promise<PurchaseDetail> {
  const requestPayload = {
    memberId: payload.memberId,
    cards: payload.cards,
    edcReferenceNumber: payload.edcReferenceNumber,
    paymentMethodId: payload.paymentMethodId,
    programType: payload.programType || "VOUCHER",
    bulkDiscountId: payload.bulkDiscountId,
    price: payload.price,
    notes: payload.notes,
  };

  const response = await axios.post("/purchases", requestPayload);
  return response.data.data;
}
