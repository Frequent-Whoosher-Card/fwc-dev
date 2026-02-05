import db from "../../config/db";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { UserModel } from "./model";

export class UserService {
  // ========== ROLE OPERATIONS ==========

  /**
   * Create a new role
   */
  static async createRole(data: typeof UserModel.createRoleBody.static) {
    // Check if role code already exists
    const existingRole = await db.role.findFirst({
      where: {
        roleCode: data.roleCode,
        deletedAt: null,
      },
    });

    if (existingRole) {
      throw new ValidationError(
        `Role with code '${data.roleCode}' already exists`,
      );
    }

    const role = await db.role.create({
      data: {
        roleCode: data.roleCode,
        roleName: data.roleName,
        description: data.description || null,
        isActive: data.isActive ?? true,
      },
    });

    return {
      id: role.id,
      roleCode: role.roleCode,
      roleName: role.roleName,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  /**
   * Get all roles
   */
  static async getRoles() {
    const roles = await db.role.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return roles.map((role) => ({
      id: role.id,
      roleCode: role.roleCode,
      roleName: role.roleName,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }));
  }

  /**
   * Get role by ID
   */
  static async getRoleById(roleId: string) {
    const role = await db.role.findFirst({
      where: {
        id: roleId,
        deletedAt: null,
      },
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    return {
      id: role.id,
      roleCode: role.roleCode,
      roleName: role.roleName,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  /**
   * Update role
   */
  static async updateRole(
    roleId: string,
    data: typeof UserModel.updateRoleBody.static,
    updatedBy?: string,
  ) {
    const role = await db.role.findFirst({
      where: {
        id: roleId,
        deletedAt: null,
      },
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    const updatedRole = await db.role.update({
      where: { id: roleId },
      data: {
        roleName: data.roleName,
        description: data.description,
        isActive: data.isActive,
        updatedBy: updatedBy || null,
        updatedAt: new Date(),
      },
    });

    return {
      id: updatedRole.id,
      roleCode: updatedRole.roleCode,
      roleName: updatedRole.roleName,
      description: updatedRole.description,
      isActive: updatedRole.isActive,
      createdAt: updatedRole.createdAt.toISOString(),
      updatedAt: updatedRole.updatedAt.toISOString(),
    };
  }

  /**
   * Delete role (soft delete)
   */
  static async deleteRole(roleId: string, deletedBy?: string) {
    const role = await db.role.findFirst({
      where: {
        id: roleId,
        deletedAt: null,
      },
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    // Check if role is being used by any user
    const usersCount = await db.user.count({
      where: {
        roleId: roleId,
        deletedAt: null,
      },
    });

    if (usersCount > 0) {
      throw new ValidationError(
        `Cannot delete role. There are ${usersCount} user(s) using this role.`,
      );
    }

    await db.role.update({
      where: { id: roleId },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
      },
    });

    return { message: "Role deleted successfully" };
  }

  // ========== USER OPERATIONS ==========

  /**
   * Create a new user
   */
  static async createUser(
    data: typeof UserModel.createUserBody.static,
    createdBy?: string,
  ) {
    // Check if username already exists
    const existingUser = await db.user.findFirst({
      where: {
        username: data.username,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ValidationError(`Username '${data.username}' already exists`);
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await db.user.findFirst({
        where: {
          email: data.email,
          deletedAt: null,
        },
      });

      if (existingEmail) {
        throw new ValidationError(`Email '${data.email}' already exists`);
      }
    }

    // Check if NIP already exists (if provided)
    if (data.nip) {
      const existingNip = await db.user.findFirst({
        where: {
          nip: data.nip,
          deletedAt: null,
        },
      });

      if (existingNip) {
        throw new ValidationError(`NIP '${data.nip}' already exists`);
      }
    }

    // Check if Phone already exists (if provided)
    if (data.phone) {
      const existingPhone = await db.user.findFirst({
        where: {
          phone: data.phone,
          deletedAt: null,
        },
      });

      if (existingPhone) {
        throw new ValidationError(`Phone '${data.phone}' already exists`);
      }
    }

    // Verify role exists
    const role = await db.role.findFirst({
      where: {
        id: data.roleId,
        deletedAt: null,
      },
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    // Verify station exists (if provided)
    if (data.stationId) {
      const station = await db.station.findFirst({
        where: {
          id: data.stationId,
          deletedAt: null,
        },
      });

      if (!station) {
        throw new NotFoundError("Station not found");
      }
    }

    // Hash password
    const passwordHash = await Bun.password.hash(data.password);

    // Create user
    const user = await db.user.create({
      data: {
        username: data.username,
        passwordHash: passwordHash,
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        nip: data.nip || null,
        roleId: data.roleId,
        stationId: data.stationId || null,
        isActive: data.isActive ?? true,
        createdBy: createdBy || null,
      },
      include: {
        role: true,
        station: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      nip: user.nip,
      stationId: user.stationId,
      role: {
        id: user.role.id,
        roleCode: user.role.roleCode,
        roleName: user.role.roleName,
      },
      station: user.station
        ? {
          id: user.station.id,
          stationCode: user.station.stationCode,
          stationName: user.station.stationName,
          location: user.station.location,
        }
        : null,
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      notes: null,
      deletedAt: null,
      deletedBy: null,
      deletedByName: null,
    };
  }

  /**
   * Get all users with pagination, filters, and search
   */
  static async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    stationId?: string;
    isActive?: boolean;
    isDeleted?: boolean;
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      roleId,
      stationId,
      isActive,
      isDeleted,
    } = params || {};

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Deleted filter
    if (isDeleted) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    // Role filter
    if (roleId) {
      where.roleId = roleId;
    }

    // Station filter
    if (stationId) {
      where.stationId = stationId;
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Search filter
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { nip: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await db.user.count({ where });

    // Get paginated users
    const users = await db.user.findMany({
      where,
      include: {
        role: true,
        station: {
          select: {
            id: true,
            stationCode: true,
            stationName: true,
          },
        },
      },
      orderBy: isDeleted ? { deletedAt: "desc" } : { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const deletedByIds = Array.from(
      new Set(users.map((u) => u.deletedBy).filter((id): id is string => !!id))
    );

    const deletedByUsers =
      deletedByIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: deletedByIds } },
            select: { id: true, fullName: true },
          })
        : [];

    const deletedByMap = new Map(deletedByUsers.map((u) => [u.id, u.fullName]));

    return {
      data: users.map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        nip: user.nip,
        stationId: user.stationId,
        role: {
          id: user.role.id,
          roleCode: user.role.roleCode,
          roleName: user.role.roleName,
        },
        station: user.station
          ? {
              id: user.station.id,
              stationCode: user.station.stationCode,
              stationName: user.station.stationName,
            }
          : null,
        isActive: user.isActive,
        notes: user.notes,
        lastLogin: user.lastLogin?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        deletedAt: user.deletedAt?.toISOString() || null,
        deletedBy: user.deletedBy,
        deletedByName: user.deletedBy ? deletedByMap.get(user.deletedBy) || null : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await db.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        role: true,
        station: {
          select: {
            id: true,
            stationCode: true,
            stationName: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      nip: user.nip,
      stationId: user.stationId,
      role: {
        id: user.role.id,
        roleCode: user.role.roleCode,
        roleName: user.role.roleName,
      },
      station: user.station
        ? {
          id: user.station.id,
          stationCode: user.station.stationCode,
          stationName: user.station.stationName,
        }
        : null,
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      notes: null,
      deletedAt: null,
      deletedBy: null,
      deletedByName: null,
    };
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    data: typeof UserModel.updateUserBody.static,
    updatedBy?: string,
  ) {
    const user = await db.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if email already exists (if provided and different)
    if (data.email && data.email !== user.email) {
      const existingEmail = await db.user.findFirst({
        where: {
          email: data.email,
          deletedAt: null,
          id: { not: userId },
        },
      });

      if (existingEmail) {
        throw new ValidationError(`Email '${data.email}' already exists`);
      }
    }

    // Check if NIP already exists (if provided and different)
    if (data.nip && data.nip !== user.nip) {
      const existingNip = await db.user.findFirst({
        where: {
          nip: data.nip,
          deletedAt: null,
          id: { not: userId },
        },
      });

      if (existingNip) {
        throw new ValidationError(`NIP '${data.nip}' already exists`);
      }
    }

    // Check if Phone already exists (if provided and different)
    if (data.phone && data.phone !== user.phone) {
      const existingPhone = await db.user.findFirst({
        where: {
          phone: data.phone,
          deletedAt: null,
          id: { not: userId },
        },
      });

      if (existingPhone) {
        throw new ValidationError(`Phone '${data.phone}' already exists`);
      }
    }

    // Verify role exists (if provided)
    if (data.roleId) {
      const role = await db.role.findFirst({
        where: {
          id: data.roleId,
          deletedAt: null,
        },
      });

      if (!role) {
        throw new NotFoundError("Role not found");
      }
    }

    // Verify station exists (if provided)
    if (data.stationId) {
      const station = await db.station.findFirst({
        where: {
          id: data.stationId,
          deletedAt: null,
        },
      });

      if (!station) {
        throw new NotFoundError("Station not found");
      }
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        nip: data.nip,
        roleId: data.roleId,
        stationId: data.stationId,
        isActive: data.isActive,
        updatedBy: updatedBy || null,
        updatedAt: new Date(),
      },
      include: {
        role: true,
        station: true,
      },
    });

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      nip: updatedUser.nip,
      stationId: updatedUser.stationId,
      role: {
        id: updatedUser.role.id,
        roleCode: updatedUser.role.roleCode,
        roleName: updatedUser.role.roleName,
      },
      station: updatedUser.station
        ? {
          id: updatedUser.station.id,
          stationCode: updatedUser.station.stationCode,
          stationName: updatedUser.station.stationName,
          location: updatedUser.station.location,
        }
        : null,
      isActive: updatedUser.isActive,
      lastLogin: updatedUser.lastLogin?.toISOString() || null,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
      notes: updatedUser.notes,
      deletedAt: updatedUser.deletedAt?.toISOString() || null,
      deletedBy: updatedUser.deletedBy,
      deletedByName: null,
    };
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(userId: string, deletedBy?: string, reason?: string) {
    const user = await db.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    await db.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
        notes: reason || null,
      },
    });

    return { message: "User deleted successfully" };
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    ignoreCurrentPassword = false,
  ) {
    if (newPassword !== confirmPassword) {
      throw new ValidationError(
        "New password and confirm password do not match",
      );
    }

    const user = await db.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current password only if not ignored
    if (!ignoreCurrentPassword) {
      const isValid = await Bun.password.verify(
        currentPassword,
        user.passwordHash,
      );
      if (!isValid) {
        throw new ValidationError("Current password is incorrect");
      }
    }

    // Hash new password
    const passwordHash = await Bun.password.hash(newPassword);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash: passwordHash,
        updatedAt: new Date(),
      },
    });

    return { message: "Password changed successfully" };
  }

  // ========== ROLE PERMISSION OPERATIONS ==========

  /**
   * Get permissions for a role
   */
  static async getRolePermissions(roleId: string) {
    const role = await db.role.findFirst({
      where: {
        id: roleId,
        deletedAt: null,
      },
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    const rolePermissions = await db.rolePermission.findMany({
      where: {
        roleId: roleId,
      },
      include: {
        permission: true,
      },
    });

    return {
      roleId: role.id,
      roleName: role.roleName,
      permissions: rolePermissions.map((rp) => rp.permission.id),
    };
  }

  /**
   * Update permissions for a role
   */
  static async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
    updatedBy?: string
  ) {
    const role = await db.role.findFirst({
      where: {
        id: roleId,
        deletedAt: null,
      },
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    // Verify all permissions exist
    const permissions = await db.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new ValidationError("One or more invalid permission IDs");
    }

    // Delete existing role permissions
    await db.rolePermission.deleteMany({
      where: {
        roleId: roleId,
      },
    });

    // Create new role permissions
    if (permissionIds.length > 0) {
      await db.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: roleId,
          permissionId: permissionId,
        })),
      });
    }

    return { message: "Role permissions updated successfully" };
  }
}
