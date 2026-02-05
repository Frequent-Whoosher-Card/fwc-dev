import { t } from "elysia";

export namespace UserModel {
  // ========== ROLE SCHEMAS ==========

  // Create Role Request
  export const createRoleBody = t.Object({
    roleCode: t.String({
      minLength: 2,
      maxLength: 50,
      description: "Role code (e.g., 'superadmin', 'admin', 'petugas')",
    }),
    roleName: t.String({
      minLength: 2,
      maxLength: 100,
      description: "Role name",
    }),
    description: t.Optional(
      t.String({
        maxLength: 500,
        description: "Role description",
      })
    ),
    isActive: t.Optional(
      t.Boolean({
        default: true,
        description: "Whether role is active",
      })
    ),
  });

  // Update Role Request
  export const updateRoleBody = t.Object({
    roleName: t.Optional(
      t.String({
        minLength: 2,
        maxLength: 100,
        description: "Role name",
      })
    ),
    description: t.Optional(
      t.String({
        maxLength: 500,
        description: "Role description",
      })
    ),
    isActive: t.Optional(
      t.Boolean({
        description: "Whether role is active",
      })
    ),
  });

  // Role Response
  export const roleResponse = t.Object({
    id: t.String(),
    roleCode: t.String(),
    roleName: t.String(),
    description: t.Nullable(t.String()),
    isActive: t.Boolean(),
    createdAt: t.String(),
    updatedAt: t.String(),
  });

  // Role List Response
  export const roleListResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(roleResponse),
    message: t.Optional(t.String()),
  });

  // Single Role Response
  export const singleRoleResponse = t.Object({
    success: t.Boolean(),
    data: roleResponse,
    message: t.Optional(t.String()),
  });

  // ========== USER SCHEMAS ==========

  // Create User Request
  export const createUserBody = t.Object({
    username: t.String({
      minLength: 3,
      maxLength: 100,
      description: "Username (unique)",
    }),
    password: t.String({
      minLength: 6,
      description: "Password (min 6 characters)",
    }),
    fullName: t.String({
      minLength: 2,
      maxLength: 200,
      description: "Full name",
    }),
    email: t.Optional(
      t.String({
        format: "email",
        description: "Email address",
      })
    ),
    phone: t.Optional(
      t.String({
        maxLength: 20,
        description: "Phone number",
      })
    ),
    nip: t.Optional(
      t.String({
        maxLength: 50,
        description: "NIP (Nomor Induk Pegawai)",
      })
    ),
    roleId: t.String({
      description: "Role ID (UUID)",
    }),
    stationId: t.Optional(
      t.String({
        description: "Station ID (UUID) - optional",
      })
    ),
    isActive: t.Optional(
      t.Boolean({
        default: true,
        description: "Whether user is active",
      })
    ),
  });

  // Update User Request
  export const updateUserBody = t.Object({
    fullName: t.Optional(
      t.String({
        minLength: 2,
        maxLength: 200,
        description: "Full name",
      })
    ),
    email: t.Optional(
      t.String({
        format: "email",
        description: "Email address",
      })
    ),
    phone: t.Optional(
      t.String({
        maxLength: 20,
        description: "Phone number",
      })
    ),
    nip: t.Optional(
      t.String({
        maxLength: 50,
        description: "NIP (Nomor Induk Pegawai)",
      })
    ),
    roleId: t.Optional(
      t.String({
        description: "Role ID (UUID)",
      })
    ),
    stationId: t.Optional(
      t.String({
        description: "Station ID (UUID) - optional",
      })
    ),
    isActive: t.Optional(
      t.Boolean({
        description: "Whether user is active",
      })
    ),
  });

  // Change Password Request
  export const changePasswordBody = t.Object({
    currentPassword: t.String({
      description: "Current password",
    }),
    newPassword: t.String({
      minLength: 6,
      description: "New password (min 6 characters)",
    }),
    confirmPassword: t.String({
      description: "Confirm new password",
    }),
  });

  // Delete User Body
  export const deleteUserBody = t.Object({
    reason: t.String({
      description: "Reason for deletion",
      minLength: 1,
    }),
  });

  // Get Users Query Parameters
  export const getUsersQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    search: t.Optional(
      t.String({
        description:
          "Search across username, full name, email, NIP, or phone (case-insensitive)",
      })
    ),
    roleId: t.Optional(
      t.String({
        description: "Filter by role ID (UUID)",
      })
    ),
    stationId: t.Optional(
      t.String({
        description: "Filter by station ID (UUID)",
      })
    ),
    isActive: t.Optional(
      t.String({
        description: "Filter by active status (true/false)",
      })
    ),
    isDeleted: t.Optional(
      t.String({
        description: "Filter by deleted status (true/false)",
      })
    ),
  });

  // User Response
  export const userResponse = t.Object({
    id: t.String(),
    username: t.String(),
    fullName: t.String(),
    email: t.Nullable(t.String()),
    phone: t.Nullable(t.String()),
    nip: t.Nullable(t.String()),
    stationId: t.Nullable(t.String()),
    role: t.Object({
      id: t.String(),
      roleCode: t.String(),
      roleName: t.String(),
    }),
    station: t.Nullable(
      t.Object({
        id: t.String(),
        stationCode: t.String(),
        stationName: t.String(),
      })
    ),
    isActive: t.Boolean(),
    notes: t.Nullable(t.String()),
    lastLogin: t.Nullable(t.String()),
    createdAt: t.String(),
    updatedAt: t.String(),
    deletedAt: t.Nullable(t.String()),
    deletedBy: t.Nullable(t.String()),
    deletedByName: t.Nullable(t.String()),
  });

  // Pagination Metadata
  export const paginationMeta = t.Object({
    page: t.Number(),
    limit: t.Number(),
    total: t.Number(),
    totalPages: t.Number(),
  });

  // User List Response with Pagination
  export const userListResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(userResponse),
    pagination: paginationMeta,
    message: t.Optional(t.String()),
  });

  // Single User Response
  export const singleUserResponse = t.Object({
    success: t.Boolean(),
    data: userResponse,
    message: t.Optional(t.String()),
  });

  // Success Response
  export const successResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  });

  // User Menu Response
  export const userMenuResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Array(t.Any()), // Array of menu items
  });

  // ========== ROLE PERMISSION SCHEMAS ==========

  // Role Permissions Response
  export const rolePermissionsResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      roleId: t.String(),
      roleName: t.String(),
      permissions: t.Array(t.String()),
    }),
  });

  // Update Role Permissions Body
  export const updateRolePermissionsBody = t.Object({
    permissionIds: t.Array(t.String(), {
      description: "Array of permission IDs to assign to the role",
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
