import { apiFetch } from "@/lib/apiConfig";

export interface CardType {
  id: string;
  typeName: string;
}

export const getCardTypes = async () => {
  return apiFetch("/card/type", { method: "GET" });
};

export const getCardTypeById = (id: string) => {
  return apiFetch(`/card/type/${id}`, { method: "GET" });
};
