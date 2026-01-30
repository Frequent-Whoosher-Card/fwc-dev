import { t } from "elysia";

export namespace MemberModel {
  // --- Data Shape ---
  export const memberData = t.Object({
    id: t.String({ format: "uuid" }),
    name: t.String(),
    identityNumber: t.String(),
    nationality: t.String(),
    email: t.Union([t.String(), t.Null()]),
    phone: t.Union([t.String(), t.Null()]),
    nippKai: t.Union([t.String(), t.Null()]),
    gender: t.Union([t.Literal("L"), t.Literal("P"), t.Null()]),
    alamat: t.Union([t.String(), t.Null()]),
    notes: t.Union([t.String(), t.Null()]),
    employeeTypeId: t.Union([t.String({ format: "uuid" }), t.Null()]),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
    createdByName: t.Union([t.String(), t.Null()]),
    updatedByName: t.Union([t.String(), t.Null()]),
  });

  // --- Requests ---
  export const createMemberBody = t.Object({
    name: t.String({
      minLength: 1,
      maxLength: 200,
      description: "Member name",
    }),
    identityNumber: t.String({
      minLength: 1,
      maxLength: 50,
      description: "Identity number (unique)",
    }),
    nationality: t.Optional(
      t.String({
        maxLength: 100,
        description: "Nationality (default: INDONESIA)",
      })
    ),
    email: t.Optional(
      t.String({
        format: "email",
        maxLength: 255,
        description: "Email address",
      })
    ),
    phone: t.Optional(
      t.String({
        maxLength: 20,
        description: "Phone number",
      })
    ),
    nippKai: t.Optional(
      t.String({
        maxLength: 50,
        description: "NIPP KAI",
      })
    ),
    gender: t.Optional(
      t.Union([
        t.Literal("L"),
        t.Literal("P"),
      ], {
        description: "Gender: L (Laki-laki) or P (Perempuan)",
      })
    ),
    alamat: t.Optional(
      t.String({
        maxLength: 500,
        description: "Address",
      })
    ),
    notes: t.Optional(
      t.String({
        maxLength: 1000,
        description: "Notes or additional information",
      })
    ),
    employeeTypeId: t.Optional(
      t.Union([
        t.String({ format: "uuid", description: "Employee type ID" }),
        t.Null(),
      ], {
        description: "Employee type ID (e.g. tipe karyawan). Optional.",
      })
    ),
  });

  export const updateMemberBody = t.Object({
    name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 200,
        description: "Member name",
      })
    ),
    identityNumber: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 50,
        description: "Identity number (unique)",
      })
    ),
    nationality: t.Optional(
      t.String({
        maxLength: 100,
        description: "Nationality",
      })
    ),
    email: t.Optional(
      t.String({
        format: "email",
        maxLength: 255,
        description: "Email address",
      })
    ),
    phone: t.Optional(
      t.String({
        maxLength: 20,
        description: "Phone number",
      })
    ),
    nippKai: t.Optional(
      t.String({
        maxLength: 50,
        description: "NIPP KAI",
      })
    ),
    gender: t.Optional(
      t.Union([
        t.Literal("L"),
        t.Literal("P"),
      ], {
        description: "Gender: L (Laki-laki) or P (Perempuan)",
      })
    ),
    alamat: t.Optional(
      t.String({
        maxLength: 500,
        description: "Address",
      })
    ),
    notes: t.Optional(
      t.String({
        maxLength: 1000,
        description: "Notes or additional information",
      })
    ),
    employeeTypeId: t.Optional(
      t.Union([
        t.String({ format: "uuid", description: "Employee type ID" }),
        t.Null(),
      ], {
        description: "Update employee type ID. Pass null to clear.",
      })
    ),
  });

  export const getMembersQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    search: t.Optional(
      t.String({ 
        description: "Search across all member fields: Customer Name, Identity Number, Nationality, Gender (L/P/Laki-laki/Perempuan), Email, Phone, Address, Membership Date (YYYY-MM-DD/DD/MM/YYYY/DD-MM-YYYY), Last Updated (YYYY-MM-DD/DD/MM/YYYY/DD-MM-YYYY), and Last Updated By (user name). Supports partial matching." 
      })
    ),
    startDate: t.Optional(
      t.String({ 
        format: "date",
        description: "Start date for membership date filter (YYYY-MM-DD)" 
      })
    ),
    endDate: t.Optional(
      t.String({ 
        format: "date",
        description: "End date for membership date filter (YYYY-MM-DD)" 
      })
    ),
    gender: t.Optional(
      t.Union([
        t.Literal("L"),
        t.Literal("P"),
      ], {
        description: "Filter by gender: L (Laki-laki) or P (Perempuan)" 
      })
    ),
    hasNippKai: t.Optional(
      t.String({ 
        description: "Filter members that have NIPKAI. Set to 'true' to filter only members with NIPKAI" 
      })
    ),
  });

  // --- Responses ---
  export const genericResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  });

  export const createMemberResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: memberData,
  });

  export const getListMemberResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      items: t.Array(memberData),
      pagination: t.Object({
        total: t.Number(),
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        totalPages: t.Optional(t.Number()),
      }),
    }),
    message: t.Optional(t.String()),
  });

  export const getDetailMemberResponse = t.Object({
    success: t.Boolean(),
    data: memberData,
    message: t.Optional(t.String()),
  });

  export const errorResponse = t.Object({
    success: t.Boolean(),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });

  // --- OCR Response ---
  export const ocrExtractResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      identityNumber: t.Union([t.String(), t.Null()]),
      name: t.Union([t.String(), t.Null()]),
      gender: t.Union([t.String(), t.Null()]),
      alamat: t.Union([t.String(), t.Null()]),
    }),
    raw: t.Optional(
      t.Object({
        text_blocks_count: t.Number(),
        combined_text: t.String(),
      })
    ),
    message: t.Optional(t.String()),
  });

  // --- KTP Detection Response ---
  export const ktpDetectionResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      sessionId: t.String({ description: "Session ID for retrieving cropped image(s) later" }),
      cropped_image: t.Optional(t.String({ description: "Base64 encoded cropped KTP image (single detection)" })),
      cropped_images: t.Optional(t.Array(t.Object({
        cropped_image: t.String({ description: "Base64 encoded cropped KTP image" }),
        bbox: t.Array(t.Number(), { minItems: 4, maxItems: 4, description: "Bounding box [x1, y1, x2, y2]" }),
        confidence: t.Number({ description: "Detection confidence score" }),
      }), { description: "Multiple detections (if return_multiple=true)" })),
      bbox: t.Optional(t.Array(t.Number(), { minItems: 4, maxItems: 4, description: "Bounding box [x1, y1, x2, y2] (single detection)" })),
      original_size: t.Array(t.Number(), { minItems: 2, maxItems: 2, description: "Original image size [width, height]" }),
      confidence: t.Optional(t.Number({ description: "Detection confidence score (single detection)" })),
    }),
    message: t.Optional(t.String()),
  });
}

