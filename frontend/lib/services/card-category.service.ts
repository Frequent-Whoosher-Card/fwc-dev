import { apiFetch } from "@/lib/apiConfig";

export interface CardCategory {
  id: string;
  categoryName: string;
}

export const getCardCategories = async () => {
  return apiFetch("/card/category", { method: "GET" });
};

export const getCardCategoryById = (id: string) => {
  return apiFetch(`/card/category/${id}`, { method: "GET" });
};
