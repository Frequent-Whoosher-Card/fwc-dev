import { t } from "elysia";

export namespace StockInModel {
  // Stock In Request
  export const stockInBatchBody = t.Object({
    movementAt: t.String({
      format: "date-time",
      description: "Tanggal produksi / stok masuk (ISO date-time)",
    }),

    categoryId: t.String({ format: "uuid" }),
    typeId: t.String({ format: "uuid" }),

    // contoh: "000123" atau "123"
    startSerial: t.String({
      pattern: "^[0-9]+$",
      description:
        "Nomor serial awal (digit). Leading zero akan dipertahankan.",
    }),

    quantity: t.Number({
      minimum: 1,
      maximum: 10000,
      description: "Jumlah kartu yang diproduksi",
    }),

    note: t.Optional(t.String({ maxLength: 500 })),
  });

  // Stock In Response
  export const stockInBatchResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      movementId: t.String(),
      startSerial: t.Integer(),
      endSerial: t.Integer(),
      quantity: t.Integer(),
      // contoh serial full (template + suffix)
      startSerialNumber: t.String(),
      endSerialNumber: t.String(),
    }),
  });

  // Error Response
  export const errorResponse = t.Object({
    success: t.Boolean(),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });
}
