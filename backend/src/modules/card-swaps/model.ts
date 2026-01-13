import { t } from "elysia";

export namespace CardSwapModel {
  // --- Data Shapes ---
  export const swapRequestData = t.Object({
    id: t.String({ format: "uuid" }),
    purchaseId: t.String({ format: "uuid" }),
    originalCardId: t.String({ format: "uuid" }),
    replacementCardId: t.Union([t.String({ format: "uuid" }), t.Null()]),
    sourceStationId: t.String({ format: "uuid" }),
    targetStationId: t.String({ format: "uuid" }),
    expectedProductId: t.String({ format: "uuid" }),
    status: t.String(),
    reason: t.String(),
    notes: t.Union([t.String(), t.Null()]),
    rejectionReason: t.Union([t.String(), t.Null()]),
    requestedAt: t.String({ format: "date-time" }),
    approvedAt: t.Union([t.String({ format: "date-time" }), t.Null()]),
    executedAt: t.Union([t.String({ format: "date-time" }), t.Null()]),
    rejectedAt: t.Union([t.String({ format: "date-time" }), t.Null()]),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
    // Relations
    purchase: t.Object({
      id: t.String({ format: "uuid" }),
      edcReferenceNumber: t.String(),
      purchaseDate: t.String({ format: "date-time" }),
      price: t.Number(),
      member: t.Union([
        t.Object({
          id: t.String({ format: "uuid" }),
          name: t.String(),
          identityNumber: t.String(),
        }),
        t.Null(),
      ]),
      card: t.Object({
        id: t.String({ format: "uuid" }),
        serialNumber: t.String(),
        status: t.String(),
        cardProduct: t.Object({
          id: t.String({ format: "uuid" }),
          totalQuota: t.Number(),
          masaBerlaku: t.Number(),
          category: t.Object({
            id: t.String({ format: "uuid" }),
            categoryName: t.String(),
          }),
          type: t.Object({
            id: t.String({ format: "uuid" }),
            typeName: t.String(),
          }),
        }),
      }),
    }),
    originalCard: t.Object({
      id: t.String({ format: "uuid" }),
      serialNumber: t.String(),
      status: t.String(),
      cardProduct: t.Object({
        id: t.String({ format: "uuid" }),
        category: t.Object({
          id: t.String({ format: "uuid" }),
          categoryName: t.String(),
        }),
        type: t.Object({
          id: t.String({ format: "uuid" }),
          typeName: t.String(),
        }),
      }),
    }),
    replacementCard: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        serialNumber: t.String(),
        status: t.String(),
        cardProduct: t.Object({
          id: t.String({ format: "uuid" }),
          category: t.Object({
            id: t.String({ format: "uuid" }),
            categoryName: t.String(),
          }),
          type: t.Object({
            id: t.String({ format: "uuid" }),
            typeName: t.String(),
          }),
        }),
      }),
      t.Null(),
    ]),
    sourceStation: t.Object({
      id: t.String({ format: "uuid" }),
      stationCode: t.String(),
      stationName: t.String(),
    }),
    targetStation: t.Object({
      id: t.String({ format: "uuid" }),
      stationCode: t.String(),
      stationName: t.String(),
    }),
    expectedProduct: t.Object({
      id: t.String({ format: "uuid" }),
      totalQuota: t.Number(),
      masaBerlaku: t.Number(),
      category: t.Object({
        id: t.String({ format: "uuid" }),
        categoryName: t.String(),
      }),
      type: t.Object({
        id: t.String({ format: "uuid" }),
        typeName: t.String(),
      }),
    }),
    requester: t.Object({
      id: t.String({ format: "uuid" }),
      fullName: t.String(),
      username: t.String(),
    }),
    approver: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        fullName: t.String(),
        username: t.String(),
      }),
      t.Null(),
    ]),
    executor: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        fullName: t.String(),
        username: t.String(),
      }),
      t.Null(),
    ]),
    rejecter: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        fullName: t.String(),
        username: t.String(),
      }),
      t.Null(),
    ]),
  });

  // --- Request Bodies ---
  export const createSwapRequestBody = t.Object({
    purchaseId: t.String({
      format: "uuid",
      description: "ID purchase yang akan di-swap kartunya",
      examples: ["123e4567-e89b-12d3-a456-426614174000"],
    }),
    targetStationId: t.String({
      format: "uuid",
      description: "ID stasiun tujuan dimana kartu akan diganti",
      examples: ["123e4567-e89b-12d3-a456-426614174001"],
    }),
    expectedProductId: t.String({
      format: "uuid",
      description: "ID produk kartu yang seharusnya (untuk validasi)",
      examples: ["123e4567-e89b-12d3-a456-426614174002"],
    }),
    reason: t.String({
      minLength: 10,
      maxLength: 1000,
      description: "Alasan swap (wajib diisi, min 10 karakter)",
      examples: [
        "Salah memberikan kartu. Seharusnya Jaban Gold, tapi diberikan Jaka Gold",
        "Customer menerima kartu yang salah kategori",
      ],
    }),
    notes: t.Optional(
      t.String({
        maxLength: 1000,
        description: "Catatan tambahan (opsional)",
        examples: ["Customer akan mengambil kartu pengganti di Stasiun Karawang"],
      })
    ),
  });

  export const approveSwapRequestBody = t.Object({
    notes: t.Optional(
      t.String({
        maxLength: 500,
        description: "Catatan approval (opsional)",
      })
    ),
  });

  export const rejectSwapRequestBody = t.Object({
    rejectionReason: t.String({
      minLength: 10,
      maxLength: 1000,
      description: "Alasan penolakan (wajib diisi)",
      examples: [
        "Stok kartu di stasiun tujuan tidak mencukupi",
        "Data tidak valid, mohon cek kembali",
      ],
    }),
  });

  export const executeSwapBody = t.Object({
    replacementCardId: t.String({
      format: "uuid",
      description: "ID kartu pengganti yang akan diberikan ke customer",
      examples: ["123e4567-e89b-12d3-a456-426614174003"],
    }),
  });

  export const getSwapRequestsQuery = t.Object({
    status: t.Optional(
      t.String({
        description:
          "Filter berdasarkan status: PENDING_APPROVAL, APPROVED, COMPLETED, REJECTED, CANCELLED",
        examples: ["PENDING_APPROVAL", "APPROVED"],
      })
    ),
    sourceStationId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter berdasarkan stasiun asal",
      })
    ),
    targetStationId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter berdasarkan stasiun tujuan",
      })
    ),
    requestedBy: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter berdasarkan pembuat request",
      })
    ),
    page: t.Optional(
      t.Numeric({
        minimum: 1,
        description: "Page number (default: 1)",
        examples: [1, 2, 3],
      })
    ),
    limit: t.Optional(
      t.Numeric({
        minimum: 1,
        maximum: 100,
        description: "Items per page (default: 10, max: 100)",
        examples: [10, 20, 50],
      })
    ),
  });

  // --- Responses ---
  export const swapRequestResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: swapRequestData,
  });

  export const swapRequestsListResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      items: t.Array(swapRequestData),
      pagination: t.Object({
        page: t.Number(),
        limit: t.Number(),
        total: t.Number(),
        totalPages: t.Number(),
      }),
    }),
  });

  export const swapHistoryData = t.Object({
    id: t.String({ format: "uuid" }),
    swapRequestId: t.String({ format: "uuid" }),
    purchaseId: t.String({ format: "uuid" }),
    beforeCardId: t.String({ format: "uuid" }),
    beforeStationId: t.String({ format: "uuid" }),
    beforeCardStatus: t.String(),
    afterCardId: t.String({ format: "uuid" }),
    afterStationId: t.String({ format: "uuid" }),
    afterCardStatus: t.String(),
    inventoryChanges: t.Any(),
    executedAt: t.String({ format: "date-time" }),
    swapRequest: t.Object({
      sourceStation: t.Object({
        id: t.String({ format: "uuid" }),
        stationName: t.String(),
      }),
      targetStation: t.Object({
        id: t.String({ format: "uuid" }),
        stationName: t.String(),
      }),
      requester: t.Object({
        id: t.String({ format: "uuid" }),
        fullName: t.String(),
      }),
      approver: t.Union([
        t.Object({
          id: t.String({ format: "uuid" }),
          fullName: t.String(),
        }),
        t.Null(),
      ]),
      executor: t.Union([
        t.Object({
          id: t.String({ format: "uuid" }),
          fullName: t.String(),
        }),
        t.Null(),
      ]),
    }),
  });

  export const swapHistoryResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(swapHistoryData),
  });

  export const errorResponse = t.Object({
    success: t.Boolean(),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });
}
