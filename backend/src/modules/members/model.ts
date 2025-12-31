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
    gender: t.Union([t.String(), t.Null()]),
    alamat: t.Union([t.String(), t.Null()]),
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
      t.String({
        maxLength: 20,
        description: "Gender",
      })
    ),
    alamat: t.Optional(
      t.String({
        maxLength: 500,
        description: "Address",
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
      t.String({
        maxLength: 20,
        description: "Gender",
      })
    ),
    alamat: t.Optional(
      t.String({
        maxLength: 500,
        description: "Address",
      })
    ),
  });

  export const getMembersQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    search: t.Optional(
      t.String({ description: "Search by name, identity number, email, or phone" })
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
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
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
}

