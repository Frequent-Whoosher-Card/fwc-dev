import { t } from "elysia";

export namespace TransferModel {
  export const createTransferBody = t.Object({
    stationId: t.String(),
    toStationId: t.String(),
    categoryId: t.String(),
    typeId: t.String(),
    quantity: t.Number(),
    note: t.Optional(t.String()),
  });

  export const getTransfersQuery = t.Object({
    stationId: t.Optional(t.String()),
    status: t.Optional(t.String()),
  });

  export const transferParams = t.Object({
    id: t.String(),
  });
}
