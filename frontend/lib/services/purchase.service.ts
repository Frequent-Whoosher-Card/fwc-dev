import { apiFetch } from "@/lib/apiConfig";
import axios from "@/lib/axios";
import type { Purchase } from "@/types/purchase";

export type TransactionType = "fwc" | "voucher";

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
}

export const updatePurchase = (id: string | number, payload: any) => {
  return apiFetch(`/purchases/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const deletePurchase = (id: string | number) => {
  return apiFetch(`/purchases/${id}`, {
    method: "DELETE",
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

  return apiFetch(`/purchases?${query.toString()}`, {
    method: "GET",
  });
};

export const getPurchaseById = (id: string | number) => {
  return apiFetch(`/purchases/${id}`, {
    method: "GET",
  });
};

export async function createPurchase(payload: any): Promise<Purchase> {
  const response = await axios.post("/purchases", payload);
  return response.data.data;
}
