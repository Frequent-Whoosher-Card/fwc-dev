import { API_BASE_URL } from '../../apiConfig';

export interface RedeemCheckResponse {
  nik: string;
  customerName: string;
  cardCategory: string;
  cardType: string;
  serialNumber: string;
  quotaRemaining: number;
  statusActive: string;
  purchaseDate: string | null;
  expiredDate: string | null;
  route?: { origin: string; destination: string } | null;
  cardProduct?: {
    totalQuota?: number;
  };
}

export interface RedeemCreateRequest {
  serialNumber: string;
  redeemType: 'SINGLE' | 'ROUNDTRIP';
  product: 'FWC' | 'VOUCHER';
  passengerNik?: string;
  passengerName?: string;
  notes?: string;
}

export interface RedeemCreateResponse {
  id: string;
  transactionNumber: string;
  remainingQuota: number;
  quotaUsed: number;
  redeemType: string;
}

export interface RedeemItem {
  id: string;
  transactionNumber: string;
  cardId: string;
  operatorId: string;
  stationId: string;
  shiftDate: string;
  status: string;
  redeemType: string;
  quotaUsed: number;
  remainingQuota: number;
  nominal?: number; // Calculated field
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  station: { id: string; stationName: string; name?: string; city?: string };
  operator: { id: string; fullName: string };
  card: {
    id: string;
    serialNumber: string;
    quotaTicket?: number;
    isActive?: boolean;
    category?: string;
    cardType?: string;
    member?: { id: string; identityNumber: string; name: string };
    cardProduct?: {
      category: { categoryName: string };
      type: { typeName: string };
    };
  };
  fileObject?: {
    id: string;
    path: string;
    mimeType: string;
    createdAt: string;
  };
  usageLogs?: Array<{ quotaUsed: number }>;
  passengers?: Array<{
    id: string;
    nik: string;
    passengerName: string;
  }>;
}

export interface RedeemListResponse {
  data: RedeemItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}

export interface RedeemFilterParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  stationId?: string;
  search?: string;
  category?: string;
  cardType?: string;
  redeemType?: string;
  product?: 'FWC' | 'VOUCHER';
  isDeleted?: boolean;
}

export interface LastDocUploadRequest {
  imageBase64: string;
  mimeType?: string;
}

export interface ProductType {
  id: string;
  programId: string;
  description?: string;
  abbreviation?: string;
  programType: 'FWC' | 'VOUCHER';
  createdAt: string;
}

export const redeemService = {
  /**
   * Get all product types
   */
  getProductTypes: async (): Promise<ProductType[]> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fwc_token') : null;
    const response = await fetch(`${API_BASE_URL}/product-type`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch product types');
    const body = await response.json();
    return body.data || [];
  },

  /**
   * Check card details by serial number
   */
  checkSerial: async (serialNumber: string, product?: 'FWC' | 'VOUCHER'): Promise<RedeemCheckResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fwc_token') : null;
    const url = product
      ? `${API_BASE_URL}/redeem/check/${serialNumber}?product=${product}`
      : `${API_BASE_URL}/redeem/check/${serialNumber}`;
    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      try {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.message || 'Terjadi kesalahan saat mengambil data kartu';
        throw new Error(errorMessage);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message) {
          throw parseError;
        }
        throw new Error('Terjadi kesalahan saat mengambil data kartu');
      }
    }
    const body = await response.json();
    return body.data || body;
  },

  /**
   * Create new redeem transaction
   */
  createRedeem: async (
    req: RedeemCreateRequest
  ): Promise<RedeemCreateResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fwc_token') : null;
    const response = await fetch(`${API_BASE_URL}/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
    });
    if (!response.ok) {
      try {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.message || 'Terjadi kesalahan saat melakukan redeem';
        throw new Error(errorMessage);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message) {
          throw parseError;
        }
        throw new Error('Terjadi kesalahan saat melakukan redeem');
      }
    }
    const body = await response.json();
    return body.data || body;
  },

  /**
   * List redeems with filters and pagination
   */
  listRedeems: async (params: RedeemFilterParams): Promise<RedeemListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.stationId) queryParams.append('stationId', params.stationId);
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.cardType) queryParams.append('cardType', params.cardType);
    if (params.redeemType) queryParams.append('redeemType', params.redeemType);
    if (params.product) queryParams.append('product', params.product);
    if (params.isDeleted) queryParams.append('isDeleted', 'true');


    const token = typeof window !== 'undefined' ? localStorage.getItem('fwc_token') : null;
    const response = await fetch(`${API_BASE_URL}/redeem?${queryParams.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error(await response.text());
    const body = await response.json();
    // Handle response format: { success, message, data: { items, pagination } }
    const responseData = body.data || body;
    return {
      data: responseData.items || [],
      pagination: responseData.pagination || { total: 0, page: 1, limit: 10 },
    };
  },

  /**
   * Get redeem detail by ID
   */
  getRedeemDetail: async (id: string): Promise<RedeemItem> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fwc_token') : null;
    const response = await fetch(`${API_BASE_URL}/redeem/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  /**
   * Update redeem notes
   */
  updateRedeemNotes: async (id: string, notes: string): Promise<RedeemItem> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fwc_token') : null;
    const response = await fetch(`${API_BASE_URL}/redeem/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  /**
   * Delete (soft delete) redeem and restore quota
   */
  deleteRedeem: async (id: string, notes?: string): Promise<{ id: string; restoredQuota: number }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fwc_token') : null;
    const response = await fetch(`${API_BASE_URL}/redeem/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error(await response.text());
    const body = await response.json();
    return body.data || body;
  },

  /**
   * Upload last redeem documentation (photo)
   */
  uploadLastDoc: async (
    redeemId: string,
    req: LastDocUploadRequest
  ): Promise<{ id: string; fileObjectId: string; path: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fwc_token') : null;
    const response = await fetch(`${API_BASE_URL}/redeem/${redeemId}/last-doc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  /**
   * Export daily redeem report
   * @param date YYYY-MM-DD format (default: today)
   * @param format CSV | XLSX | PDF | JPG (will be converted to lowercase for API)
   */
  exportReport: async (
    date?: string,
    format: 'CSV' | 'XLSX' | 'PDF' | 'JPG' = 'CSV'
  ): Promise<Blob> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fwc_token') : null;
    const apiFormat = format.toLowerCase();
    const queryString = `date=${date || new Date().toISOString().split('T')[0]}&format=${apiFormat}`;
    const url = `${API_BASE_URL}/redeem/export?${queryString}`;

    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Download exported file
   */
  downloadFile: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
