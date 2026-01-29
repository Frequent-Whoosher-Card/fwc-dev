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
  stationId?: string;
  stationName: string;
  note: string;
  createdByName: string;
  cardCategory: {
    id?: string;
    name: string;
  };
  cardType: {
    id?: string;
    name: string;
  };
  sentSerialNumbers: string[];
  receivedSerialNumbers: string[];
  lostSerialNumbers: string[];
  damagedSerialNumbers: string[];
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
    categoryName?: string;
    typeName?: string;
  }): Promise<StockInListResponse> => {
    const { programType = "fwc", page = 1, limit = 10, ...rest } = params;
    const isVoucher = programType.toLowerCase() === "voucher";
    const endpoint = isVoucher
      ? "/stock/in/voucher/"
      : `/stock/in/${programType.toLowerCase()}/`;

    if (isVoucher) {
      const res = await axios.get(endpoint, {
        params: { ...rest, page, limit },
      });
      const { items, pagination } = res.data.data;
      return {
        items: items.map((item: any) => ({
          id: item.id,
          tanggal: item.movementAt,
          category: item.category?.name || item.cardCategory?.name || "-",
          categoryId: item.category?.id || item.cardCategory?.id || "",
          type: item.type?.name || item.cardType?.name || "-",
          stock: item.quantity,
          sentSerialNumbers:
            item.sentSerialNumbers && item.sentSerialNumbers.length > 0
              ? item.sentSerialNumbers
              : (item.receivedSerialNumbers ?? []),
        })),
        pagination: {
          total: pagination.totalItems ?? pagination.total ?? 0,
          page: pagination.currentPage ?? pagination.page ?? 1,
          limit: limit,
          totalPages: pagination.totalPages ?? 0,
        },
      };
    }

    // FWC Logic: fetch a larger set to allow full pages after filtering mixed backend result
    const backendParams = {
      ...rest,
      page: 1,
      limit: 1000,
    };

    const [res, catsRes] = await Promise.all([
      axios.get(endpoint, { params: backendParams }),
      axios.get("/card/category", { params: { programType: "FWC" } }),
    ]);

    const { items } = res.data.data;
    const categories = catsRes.data?.data || [];
    const validCategoryIds = categories.map((c: any) => c.id);

    const filteredItems = items.filter((item: any) => {
      const cid = item.cardCategory?.id || item.category?.id;
      return !cid || validCategoryIds.includes(cid);
    });

    const totalFiltered = filteredItems.length;
    const totalPages = Math.ceil(totalFiltered / limit);

    const startIdx = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(startIdx, startIdx + limit);

    return {
      items: paginatedItems.map((item: any) => ({
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
        total: totalFiltered,
        page: page,
        limit: limit,
        totalPages: totalPages,
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
    const isVoucher = programType.toLowerCase() === "voucher";
    const endpoint = isVoucher
      ? `/stock/in/voucher/${id}`
      : `/stock/in/${programType.toLowerCase()}/${id}`;

    const res = await axios.get(endpoint);
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
    status?: string, // Add status field
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
    categoryName?: string;
    typeName?: string;
    stationName?: string;
    stationId?: string;
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
      stationId: item.stationId ?? item.station?.id ?? "",
      stationName: item.stationName ?? item.station?.name ?? "-",
      note: item.note || "-",
      createdByName: item.createdByName ?? "-",
      cardCategory: {
        id: item.cardCategory?.id ?? "",
        name: item.cardCategory?.name ?? "-",
      },
      cardType: {
        id: item.cardType?.id ?? "",
        name: item.cardType?.name ?? "-",
      },
      sentSerialNumbers: Array.isArray(item.sentSerialNumbers)
        ? item.sentSerialNumbers
        : [],
      receivedSerialNumbers: Array.isArray(item.receivedSerialNumbers)
        ? item.receivedSerialNumbers
        : [],
      lostSerialNumbers: Array.isArray(item.lostSerialNumbers)
        ? item.lostSerialNumbers
        : [],
      damagedSerialNumbers: Array.isArray(item.damagedSerialNumbers)
        ? item.damagedSerialNumbers
        : [],
      batchId: item.batchId,
      notaDinas: item.notaDinas,
      bast: item.bast,
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
