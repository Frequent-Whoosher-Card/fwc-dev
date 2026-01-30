import axios from "@/lib/axios";
import {
  createCardService,
  ProgramType,
} from "@/lib/services/card.base.service";

export interface CardProduct {
  id: string;
  serialTemplate: string;
  category: {
    categoryName: string;
  };
  type: {
    typeName: string;
  };
  maxQuantity?: number;
  generatedCount?: number;
  isDiscount: boolean;
}

export interface GenerateHistoryItem {
  id: string;
  movementAt: string;
  quantity: number;
  category: {
    name: string;
  };
  type: {
    name: string;
  };
  serialNumbers: string[];
  createdByName?: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HistoryResponse {
  items: GenerateHistoryItem[];
  pagination: Pagination;
}

const CardGenerateService = {
  getProducts: async (programType?: string) => {
    if (!programType) {
      const res = await axios.get("/card/product");
      return res.data?.data || [];
    }

    const baseService = createCardService(
      programType.toUpperCase() as ProgramType,
    );
    return baseService.getProducts();
  },

  getHistory: async (params: {
    page: number;
    limit: number;
    programType?: string;
  }) => {
    const res = await axios.get("/cards/generate/history", { params });
    return res.data?.data;
  },

  getNextSerial: async (cardProductId: string) => {
    const res = await axios.get("/cards/generate/next-serial", {
      params: { cardProductId },
    });
    return (
      res.data?.data?.nextSerial ||
      res.data?.data?.serial ||
      res.data?.data ||
      ""
    );
  },

  getHistoryDetail: async (id: string) => {
    const res = await axios.get(`/cards/generate/history/${id}`);
    return res.data?.data;
  },

  generateVoucher: async (payload: {
    cardProductId: string;
    quantity: number;
  }) => {
    const res = await axios.post("/cards/generate/voucher", payload);
    return res.data;
  },

  generateFWC: async (payload: {
    cardProductId: string;
    startSerial: string;
    endSerial: string;
  }) => {
    const res = await axios.post("/cards/generate", payload);
    return res.data;
  },

  generate: async (payload: {
    cardProductId: string;
    startSerial: string;
    endSerial: string;
    programType?: string;
    quantity?: number;
  }) => {
    if (payload.programType === "VOUCHER") {
      return CardGenerateService.generateVoucher({
        cardProductId: payload.cardProductId,
        quantity: payload.quantity || 0,
      });
    }
    return CardGenerateService.generateFWC({
      cardProductId: payload.cardProductId,
      startSerial: payload.startSerial,
      endSerial: payload.endSerial,
    });
  },

  downloadZip: async (id: string) => {
    const res = await axios.get(`/cards/generate/history/${id}/download-zip`, {
      responseType: "blob",
    });
    // Extract filename from content-disposition if available, or default
    const contentDisposition = res.headers["content-disposition"];
    let filename = `barcode-batch-${id}.zip`;
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2)
        filename = fileNameMatch[1];
    }
    return { blob: res.data, filename };
  },

  uploadDocument: async (payload: {
    batchId: string;
    file: File;
    userId?: string;
  }) => {
    const formData = new FormData();
    formData.append("file", payload.file);

    const res = await axios.post(
      `/cards/generate/history/${payload.batchId}/document`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data;
  },

  viewDocument: async (batchId: string) => {
    const res = await axios.get(`/cards/generate/history/${batchId}/document`, {
      responseType: "blob",
    });
    // Try to get filename
    const contentDisposition = res.headers["content-disposition"];
    let filename = `document-${batchId}.pdf`;
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2)
        filename = fileNameMatch[1];
    }
    return { blob: res.data, filename };
  },

  delete: async (id: string) => {
    const res = await axios.delete(`/cards/generate/history/${id}`);
    return res.data;
  },
};

export default CardGenerateService;
