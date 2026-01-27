import axios from "@/lib/axios";

export interface DiscountRule {
  id: number;
  minQuantity: number;
  maxQuantity: number | null;
  discount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountDto {
  minQuantity: number;
  maxQuantity?: number | null;
  discount: number;
}

export interface UpdateDiscountDto {
  minQuantity?: number;
  maxQuantity?: number | null;
  discount?: number;
}

const discountService = {
  getAll: async (search?: string) => {
    const params = search ? { search } : {};
    const res = await axios.get("/discounts", { params });
    // Assuming backend returns { success: true, data: [...] }
    return res.data?.data ?? [];
  },

  create: async (data: CreateDiscountDto) => {
    const res = await axios.post("/discounts", data);
    return res.data?.data;
  },

  update: async (id: number, data: UpdateDiscountDto) => {
    const res = await axios.patch(`/discounts/${id}`, data);
    return res.data?.data;
  },

  delete: async (id: number) => {
    const res = await axios.delete(`/discounts/${id}`);
    return res.data;
  },
};

export default discountService;
