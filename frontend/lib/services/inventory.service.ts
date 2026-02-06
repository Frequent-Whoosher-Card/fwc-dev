import { apiFetch } from "../apiConfig";

export interface InventorySummary {
  categoryId: string;
  categoryName: string;
  typeId: string;
  typeName: string;
  totalStock: number;
  totalOffice: number;
  totalBeredar: number;
  totalAktif: number;
  totalNonAktif: number;
  totalBelumTerjual: number;
  totalInTransit: number;
  totalLost: number;
  totalDamaged: number;
  totalOther: number;
}

export interface CombinedSummaryResponse {
  totalSummary: {
    totalStock: number;
    totalInOffice: number;
    totalInStation: number;
    totalInTransfer: number;
    totalSold: number;
    totalDamaged: number;
  };
  categoryTypeSummary: InventorySummary[];
}

export interface InventoryParams {
  stationId?: string;
  categoryId?: string;
  typeId?: string;
  startDate?: string;
  endDate?: string;
  categoryName?: string;
  typeName?: string;
  stationName?: string;
  search?: string;
  programType?: "FWC" | "VOUCHER";
}

/**
 * Get Combined Summary
 */
export const getCombinedSummary = (params: InventoryParams) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else {
        query.append(key, String(value));
      }
    }
  });

  return apiFetch(`/inventory/combined-summary?${query.toString()}`, {
    method: "GET",
  });
};
