import axios from "@/lib/axios";

/* =========================
   TYPES & INTERFACES
========================= */

export interface StockInItem {
  id: string;
  tanggal: string;
  category: string;
  categoryId: string; // Added for filtering
  type: string;
  stock: number;
  sentSerialNumbers?: string[];
}

export interface StockOutItem {
  id: string;
  movementAt: string;
  status: string;
  quantity: number;
  stationName: string | null;
  note: string | null;
  createdByName: string | null;
  cardCategory: {
    id: string;
    name: string;
    code: string;
  };
  cardType: {
    id: string;
    name: string;
    code: string;
  };
  sentSerialNumbers: string[];
  batchId?: string | null;
  notaDinas?: string | null;
  bast?: string | null;
}

export interface StockInDetail {
  id: string;
  movementAt: string;
  quantity: number;
  cardCategory: {
    name: string;
  };
  cardType: {
    name: string;
  };
  serialItems: {
    serialNumber: string;
    status: string;
  }[];
}

export interface StockOutDetail {
  id: string;
  movementAt: string;
  status: string;
  quantity: number;
  stationName: string;
  note: string;
  createdByName: string;
  cardCategory: {
    name: string;
  };
  cardType: {
    name: string;
  };
  sentSerialNumbers: string[];
  batchId?: string | null;
  notaDinas?: string | null;
  bast?: string | null;
}

export interface StockPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StockInListResponse {
  items: StockInItem[];
  pagination: StockPaginationMeta;
}

export interface StockOutListResponse {
  items: StockOutItem[];
  pagination: StockPaginationMeta;
}

/* =========================
   STOCK SERVICE
========================= */

const stockService = {
  // --- MASTER DATA ---
  getCategories: async () => {
    const res = await axios.get("/card/category");
    return res.data?.data ?? [];
  },

  getTypes: async () => {
    const res = await axios.get("/card/types");
    return res.data?.data ?? [];
  },

  getProducts: async (programType?: string) => {
    const res = await axios.get("/card/product", {
      params: { programType },
    });
    return res.data?.data ?? [];
  },

  getStations: async () => {
    const res = await axios.get("/station", {
      params: { page: 1, limit: 1000 },
    });
    return res.data?.data?.items ?? [];
  },

  getAvailableSerials: async (
    cardProductId: string,
    programType: string = "fwc",
  ) => {
    const res = await axios.get(
      `/stock/in/${programType.toLowerCase()}/available-serials`,
      {
        params: { cardProductId },
      },
    );
    return res.data?.data;
  },

  getAvailableSerialsStockOut: async (
    cardProductId: string,
    programType: string = "fwc",
  ) => {
    const res = await axios.get(
      `/stock/out/${programType.toLowerCase()}/available-serials`,
      {
        params: { cardProductId },
      },
    );
    return res.data?.data;
  },

  // --- STOCK IN ---
  getStockInList: async (params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    programType?: string;
  }): Promise<StockInListResponse> => {
    const { programType = "fwc", ...rest } = params;
    const isVoucher = programType.toLowerCase() === "voucher";
    const endpoint = isVoucher
      ? "/stock/in/voucher/history"
      : `/stock/in/${programType.toLowerCase()}`;

    const res = await axios.get(endpoint, {
      params: rest,
    });
    const { items, pagination } = res.data.data;
    return {
      items: items.map((item: any) => ({
        id: item.id,
        tanggal: item.movementAt,
        category:
          item.cardCategory?.name ||
          item.category?.name ||
          item.category ||
          "-",
        categoryId: item.cardCategory?.id || item.category?.id || "",
        type: item.cardType?.name || item.type?.name || item.type || "-",
        stock: item.quantity,
        sentSerialNumbers: item.sentSerialNumbers ?? [],
      })),
      pagination: {
        total: pagination.total ?? pagination.totalItems ?? 0,
        page: pagination.page ?? pagination.currentPage ?? 1,
        limit: pagination.limit ?? pagination.limitNum ?? 10,
        totalPages: pagination.totalPages ?? 0,
      },
    };
  },

  createStockIn: async (payload: {
    movementAt: string;
    cardProductId: string;
    startSerial: string;
    endSerial: string;
    note?: string;
    programType?: string;
    serialDate?: string;
  }) => {
    const { programType = "fwc", ...rest } = payload;
    return axios.post(`/stock/in/${programType.toLowerCase()}`, rest);
  },

  getStockInById: async (
    id: string,
    programType: string = "fwc",
  ): Promise<StockInDetail> => {
    const res = await axios.get(`/stock/in/${programType.toLowerCase()}/${id}`);
    const movement = res.data?.data?.movement || res.data?.data;
    if (!movement) throw new Error("Data tidak ditemukan");

    return {
      id: movement.id ?? "",
      movementAt: movement.movementAt ?? "",
      quantity: movement.quantity ?? 0,
      cardCategory: {
        name: movement.cardCategory?.name ?? "-",
      },
      cardType: {
        name: movement.cardType?.name ?? "-",
      },
      serialItems: Array.isArray(movement.items) ? movement.items : [],
    };
  },

  updateStockIn: async (
    id: string,
    payload: any,
    programType: string = "fwc",
  ) => {
    return axios.patch(`/stock/in/${programType.toLowerCase()}/${id}`, payload);
  },

  deleteStockIn: async (id: string, programType: string = "fwc") => {
    return axios.delete(`/stock/in/${programType.toLowerCase()}/${id}`);
  },

  updateStockInStatusBatch: async (
    id: string,
    updates: { serialNumber: string; status: string }[],
    programType: string = "fwc",
  ) => {
    return axios.put(
      `/stock/in/${programType.toLowerCase()}/${id}/status-batch`,
      {
        updates,
      },
    );
  },

  // --- STOCK OUT ---
  getStockOutList: async (params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    programType?: string;
  }): Promise<StockOutListResponse> => {
    const { programType = "fwc", ...rest } = params;
    const res = await axios.get(`/stock/out/${programType.toLowerCase()}`, {
      params: rest,
    });
    const data = res.data.data;
    return {
      items: data.items,
      pagination: {
        total: data.pagination.total ?? data.pagination.totalItems ?? 0,
        page: data.pagination.page ?? data.pagination.currentPage ?? 1,
        limit: data.pagination.limit ?? data.pagination.limitNum ?? 10,
        totalPages: data.pagination.totalPages ?? 0,
      },
    };
  },

  createStockOut: async (payload: {
    movementAt: string;
    stationId: string;
    cardCategoryId?: string;
    cardTypeId?: string;
    quantity?: number;
    programType?: string;
    note?: string;
  }) => {
    const { programType = "fwc", ...rest } = payload;
    return axios.post(`/stock/out/${programType.toLowerCase()}`, rest);
  },

  getStockOutById: async (
    id: string,
    programType: string = "fwc",
  ): Promise<StockOutDetail> => {
    const res = await axios.get(
      `/stock/out/${programType.toLowerCase()}/${id}`,
    );
    const item = res.data?.data?.movement || res.data?.data;
    if (!item) throw new Error("Data tidak ditemukan");

    return {
      id: item.id ?? "",
      movementAt: item.movementAt ?? "",
      status: item.status ?? "-",
      quantity: item.quantity ?? 0,
      stationName: item.stationName ?? item.station?.name ?? "-",
      note: item.note || "-",
      createdByName: item.createdByName ?? "-",
      cardCategory: {
        name: item.cardCategory?.name ?? "-",
      },
      cardType: {
        name: item.cardType?.name ?? "-",
      },
      sentSerialNumbers: Array.isArray(item.sentSerialNumbers)
        ? item.sentSerialNumbers
        : [],
    };
  },

  updateStockOut: async (
    id: string,
    payload: {
      movementAt?: string;
      stationId?: string;
      startSerial?: string;
      endSerial?: string;
      note?: string;
      programType?: string;
    },
  ) => {
    const { programType = "fwc", ...rest } = payload;
    return axios.patch(`/stock/out/${programType.toLowerCase()}/${id}`, rest);
  },

  deleteStockOut: async (id: string, programType: string = "fwc") => {
    return axios.delete(`/stock/out/${programType.toLowerCase()}/${id}`);
  },
};

export default stockService;
