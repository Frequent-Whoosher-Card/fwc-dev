import axios from "../axios";

export interface SwapRequest {
  id: string;
  purchaseId: string;
  originalCardId: string;
  replacementCardId: string | null;
  sourceStationId: string;
  targetStationId: string;
  expectedProductId: string;
  status:
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "COMPLETED"
    | "REJECTED"
    | "CANCELLED";
  reason: string;
  notes: string | null;
  rejectionReason: string | null;
  requestedAt: string;
  approvedAt: string | null;
  executedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  purchase: {
    id: string;
    edcReferenceNumber: string;
    purchaseDate: string;
    member: {
      id: string;
      name: string;
      identityNumber: string;
    } | null;
    card: {
      id: string;
      serialNumber: string;
      status: string;
      cardProduct: {
        id: string;
        totalQuota: number;
        masaBerlaku: number;
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
  };
  sourceStation: {
    id: string;
    stationCode: string;
    stationName: string;
  };
  targetStation: {
    id: string;
    stationCode: string;
    stationName: string;
  };
  expectedProduct: {
    id: string;
    category: {
      id: string;
      categoryName: string;
    };
    type: {
      id: string;
      typeName: string;
    };
  };
  requester?: {
    id: string;
    fullName: string;
    username: string;
  };
  approver?: {
    id: string;
    fullName: string;
    username: string;
  } | null;
  executor?: {
    id: string;
    fullName: string;
    username: string;
  } | null;
}

export interface SwapHistory {
  id: string;
  purchaseId: string;
  executedAt: string;
  swapRequestId: string;
  beforeCardId: string;
  beforeStationId: string;
  beforeCardStatus: string;
  afterCardId: string;
  afterStationId: string;
  afterCardStatus: string;
  inventoryChanges: any;
  swapRequest: Partial<SwapRequest>;
}

export interface CreateSwapRequestPayload {
  purchaseId: string;
  targetStationId: string;
  expectedProductId: string;
  reason: string;
  notes?: string;
}

export interface GetSwapRequestsParams {
  status?: string;
  targetStationId?: string;
  sourceStationId?: string;
  requestedBy?: string;
  page?: number;
  limit?: number;
}

export class CardSwapService {
  /**
   * Create a new swap request
   */
  static async createSwapRequest(data: CreateSwapRequestPayload) {
    const response = await axios.post("/card-swaps", data);
    return response.data;
  }

  /**
   * Get list of swap requests with filters
   */
  static async getSwapRequests(params?: GetSwapRequestsParams) {
    const response = await axios.get("/card-swaps", { params });
    return response.data;
  }

  /**
   * Get swap request by ID
   */
  static async getSwapRequestById(id: string) {
    const response = await axios.get(`/card-swaps/${id}`);
    return response.data;
  }

  /**
   * Cancel swap request
   */
  static async cancelSwapRequest(id: string) {
    const response = await axios.delete(`/card-swaps/${id}`);
    return response.data;
  }

  /**
   * Approve swap request (HO/Supervisor only)
   */
  static async approveSwapRequest(id: string, notes?: string) {
    const response = await axios.post(`/card-swaps/${id}/approve`, { notes });
    return response.data;
  }

  /**
   * Reject swap request (HO/Supervisor only)
   */
  static async rejectSwapRequest(id: string, rejectionReason: string) {
    const response = await axios.post(`/card-swaps/${id}/reject`, {
      rejectionReason,
    });
    return response.data;
  }

  /**
   * Execute swap with replacement card
   */
  static async executeSwap(id: string, replacementCardId: string) {
    const response = await axios.post(`/card-swaps/${id}/execute`, {
      replacementCardId,
    });
    return response.data;
  }

  /**
   * Get swap history for a purchase
   */
  static async getSwapHistory(purchaseId: string) {
    const response = await axios.get(
      `/card-swaps/purchase/${purchaseId}/history`
    );
    return response.data;
  }
}
