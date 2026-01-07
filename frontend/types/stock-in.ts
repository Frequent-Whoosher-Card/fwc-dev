export type StockInDetail = {
  id: string;
  movementAt: string;
  quantity: number;
  startSerial?: string | null;
  endSerial?: string | null;
};

export type UpdateStockInPayload = {
  movementAt: string;
  note?: string;
  startSerial?: string;
  endSerial?: string;
};
