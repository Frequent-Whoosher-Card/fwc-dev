export type CardCategory = "GOLD" | "SILVER" | "KAI";
export type CardStatus = "IN_STATION" | "ACTIVE" | "INACTIVE" | "DAMAGED";

export interface Category {
  id: string;
  categoryName: string;
}

export interface CardType {
  id: string;
  typeName: string;
  typeCode?: string;
  categoryId: string;
  category?: Category;
}

export interface Card {
  id: string;
  serialNumber: string;
  status: CardStatus;
  cardTypeId: string;
  cardType?: CardType;
  stationId?: string;
}

export interface Member {
  id: string;
  identityNumber: string;
  name?: string;
  type: "PUBLIC" | "KAI";
  phoneNumber?: string;
  gender?: "MALE" | "FEMALE";
  address?: string;
  notes?: string;
}

export interface PurchaseFormData {
  identityNumber: string;
  cardCategory: CardCategory | "";
  cardTypeId: string;
  cardId: string;
  edcReferenceNumber: string;
  price: number;
  purchaseDate: string;
  shiftDate: string;
}

export interface CreatePurchasePayload {
  memberId: string;
  cardId: string;
  purchaseDate: string;
  shiftDate: string;
  edcReferenceNumber: string;
  price: number;
}

export interface Purchase {
  id: string;
  memberId: string;
  cardId: string;
  purchaseDate: string;
  shiftDate: string;
  edcReferenceNumber: string;
  price: number;
  member?: Member;
  card?: Card;
  createdAt: string;
  updatedAt: string;
}
