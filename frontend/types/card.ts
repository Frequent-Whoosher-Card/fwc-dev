// types/card.ts

/* ======================
   ENTITY (FROM BACKEND)
====================== */
export type CardStatus =
  | "ON_REQUEST"
  | "IN_OFFICE"
  | "IN_TRANSIT"
  | "IN_STATION"
  | "LOST"
  | "DAMAGED"
  | "SOLD_ACTIVE"
  | "SOLD_INACTIVE";

export interface Card {
  id: string;
  serialNumber: string;
  status: CardStatus;
  cardTypeId: string;
  cardType?: {
    id: string;
    typeName: string;
    typeCode?: string;
  };
  stationId?: string;
  notes?: string;
}

export interface CardProduct {
  id: string;
  categoryId: string;
  typeId: string;
  totalQuota: number;
  masaBerlaku: number;
  price: number;
  serialTemplate: string;
  isActive: boolean;
  maxQuantity?: number;
  isDiscount?: boolean;
  hasGeneratedCards?: boolean;
  createdAt: string;

  category?: {
    id: string;
    categoryName: string;
    categoryCode?: string;
  };

  type?: {
    id: string;
    typeName: string;
    typeCode?: string;
  };
}

/* ======================
   OPTIONS (FORM)
====================== */
export interface CategoryOption {
  id: string;
  categoryName: string;
  categoryCode: string;
}

export interface TypeOption {
  id: string;
  typeName: string;
  typeCode: string;
}

/* ======================
   DTO (REQUEST)
====================== */
export interface CreateCardProductPayload {
  categoryId: string;
  typeId: string;
  totalQuota: number;
  masaBerlaku: number;
  price: number;
  serialTemplate: string;
  maxQuantity?: number;
}

export interface UpdateCardProductPayload {
  totalQuota: number;
  masaBerlaku: number;
  price: number;
}
