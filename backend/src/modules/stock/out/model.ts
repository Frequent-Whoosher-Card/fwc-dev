import { t } from "elysia";

export namespace StockOutModel {
  // Stock Out Request
  export const stockOutRequest = t.Object({
    movementAt: t.String({ format: "date-time", description: "Waktu pindah" }),
    categoryId: t.String({ format: "uuid", description: "ID kategori" }),
    typeId: t.String({ format: "uuid", description: "ID jenis" }),
    stationId: t.String({ format: "uuid", description: "ID stasiun" }),

    // Admin memilih kartu fisik yang dikirim: list serialNumber (full string)
    serialNumbers: t.Array(t.String({ minLength: 1 }), {
      minItems: 1,
      maxItems: 5000,
      description: "List serial number",
    }),

    note: t.Optional(t.String({ maxLength: 500, description: "Catatan" })),
  });

  // Stock Out Response
  export const stockOutResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      movementId: t.String(),
      status: t.String(),
      sentCount: t.Number(),
    }),
  });

  // Stock Out Validate Request
  export const stockOutValidateRequest = t.Object({
    receivedQty: t.Integer({ minimum: 0 }),
    // Opsional jika Anda ingin petugas menyertakan list serial hilang di note:
    lostSerials: t.Optional(t.Array(t.String({ minLength: 1 }))),
    note: t.Optional(t.String({ maxLength: 500 })),
  });

  // Stock Out Validate Response
  export const stockOutValidateResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      movementId: t.String(),
      status: t.String(),
      receivedCount: t.Integer(),
      lostCount: t.Integer(),
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
