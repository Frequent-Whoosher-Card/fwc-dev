import axios from "@/lib/axios";

export type ProgramType = "FWC" | "VOUCHER";

export const createCardService = (programType: ProgramType) => {
  return {
    /* ======================
       PRODUCT
    ====================== */

    getProducts: async () => {
      const res = await axios.get("/card/product", {
        params: { programType },
      });
      return res.data?.data || [];
    },

    getProductById: async (id: string) => {
      const res = await axios.get(`/card/product/${id}`);
      return res.data?.data;
    },

    createProduct: async (payload: {
      categoryId: string;
      typeId: string;
      totalQuota: number;
      masaBerlaku: number;
      price: number;
      serialTemplate: string;
    }) => {
      return axios.post("/card/product", {
        ...payload,
        programType, // ✅ hanya di CREATE
      });
    },

    getInventorySummaryForCheck: async () => {
      const res = await axios.get("/inventory/category-type-summary", {
        params: { programType },
      });
      return res.data?.data || [];
    },

    updateProduct: async (
      id: string,
      payload: {
        categoryId?: string;
        typeId?: string;
        programType?: ProgramType;
        serialTemplate?: string;
        totalQuota: number;
        masaBerlaku: number;
        price: number;
      },
    ) => {
      const res = await axios.put(`/card/product/${id}`, payload);
      return res.data?.data;
    },

    deleteProduct: async (id: string) => {
      return axios.delete(`/card/product/${id}`);
    },

    /* ======================
       CATEGORY
    ====================== */

    getCategories: async () => {
      const res = await axios.get("/card/category", {
        params: { programType },
      });
      return res.data?.data || [];
    },

    createCategory: async (payload: {
      categoryCode: string;
      categoryName: string;
      description?: string;
    }) => {
      return axios.post("/card/category", {
        ...payload,
        programType,
      });
    },

    updateCategory: async (
      id: string,
      payload: {
        categoryCode: string;
        categoryName: string;
        description?: string;
      },
    ) => {
      return axios.put(`/card/category/${id}`, {
        ...payload,
        programType,
      });
    },

    deleteCategory: async (id: string) => {
      return axios.delete(`/card/category/${id}`);
    },

    getCategoryRecommend: async () => {
      const res = await axios.get("/card/category/recommend", {
        params: { programType },
      });
      return res.data?.data?.recommendedCode;
    },

    /* ======================
       TYPE
    ====================== */

    getTypes: async () => {
      const res = await axios.get("/card/types", {
        params: { programType },
      });
      return res.data?.data || [];
    },

    createType: async (payload: {
      typeCode: string;
      typeName: string;
      routeDescription?: string;
    }) => {
      return axios.post("/card/types", {
        ...payload,
        programType,
      });
    },

    updateType: async (
      id: string,
      payload: {
        typeCode: string;
        typeName: string;
        routeDescription?: string;
      },
    ) => {
      return axios.put(`/card/types/${id}`, {
        ...payload,
        programType,
      });
    },

    deleteType: async (id: string) => {
      return axios.delete(`/card/types/${id}`);
    },

    getTypeRecommend: async () => {
      const res = await axios.get("/card/types/recommend", {
        params: { programType },
      });
      return res.data?.data?.recommendedCode;
    },

    toggleActiveStatus: async (id: string, isActive: boolean) => {
      const res = await axios.patch(`/card/product/${id}/active-status`, {
        isActive,
      });
      return res.data?.data;
    },
  };
};
