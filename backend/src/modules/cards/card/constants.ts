import { CardStatus } from "@prisma/client";

export const CARD_STATUS_MAPPING: Record<CardStatus, string> = {
  [CardStatus.ON_REQUEST]: "Sedang Diajukan",
  [CardStatus.IN_OFFICE]: "Office",
  [CardStatus.IN_TRANSIT]: "Dalam Pengiriman",
  [CardStatus.IN_STATION]: "Stasiun",
  [CardStatus.LOST]: "Hilang",
  [CardStatus.DAMAGED]: "Rusak",
  [CardStatus.SOLD_ACTIVE]: "Aktif",
  [CardStatus.SOLD_INACTIVE]: "Non-Aktif",
  [CardStatus.BLOCKED]: "Diblokir",
  [CardStatus.DELETED]: "Dihapus",
};

export const REVERSE_CARD_STATUS_MAPPING: Record<string, CardStatus> =
  Object.entries(CARD_STATUS_MAPPING).reduce(
    (acc, [key, value]) => {
      acc[value] = key as CardStatus;
      return acc;
    },
    {} as Record<string, CardStatus>
  );

export const getFriendlyStatus = (status: string | CardStatus): string => {
  return CARD_STATUS_MAPPING[status as CardStatus] || status;
};

export const getEnumStatus = (
  friendlyStatus: string
): CardStatus | undefined => {
  return REVERSE_CARD_STATUS_MAPPING[friendlyStatus];
};
