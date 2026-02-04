import axios from "@/lib/axios";

export interface ProductType {
  id: string;
  programId: string;
  description: string | null;
  abbreviation: string | null;
  programType: "FWC" | "VOUCHER" | null;
  createdAt: string;
  updatedAt: string;
}

export const ProductTypeService = {
  getAll: async (): Promise<ProductType[]> => {
    const res = await axios.get("/product-types");
    return res.data?.data || [];
  },
};
