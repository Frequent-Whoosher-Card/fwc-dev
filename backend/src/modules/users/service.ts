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
      throw new ValidationError(`Role with code '${data.roleCode}' already exists`);
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
        `Cannot delete role. There are ${usersCount} user(s) using this role.`
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
    createdBy?: string
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
        isActive: data.isActive ?? true,
        createdBy: createdBy || null,
      },
      include: {
        role: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      nip: user.nip,
      role: {
        id: user.role.id,
        roleCode: user.role.roleCode,
        roleName: user.role.roleName,
      },
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
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
  }) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      roleId, 
      stationId, 
      isActive 
    } = params || {};
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

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
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

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
        station: user.station ? {
          id: user.station.id,
          stationCode: user.station.stationCode,
          stationName: user.station.stationName,
        } : null,
        isActive: user.isActive,
        lastLogin: user.lastLogin?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
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
      station: user.station ? {
        id: user.station.id,
        stationCode: user.station.stationCode,
        stationName: user.station.stationName,
      } : null,
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    data: typeof UserModel.updateUserBody.static,
    updatedBy?: string
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

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        nip: data.nip,
        roleId: data.roleId,
        isActive: data.isActive,
        updatedBy: updatedBy || null,
        updatedAt: new Date(),
      },
      include: {
        role: true,
      },
    });

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      nip: updatedUser.nip,
      role: {
        id: updatedUser.role.id,
        roleCode: updatedUser.role.roleCode,
        roleName: updatedUser.role.roleName,
      },
      isActive: updatedUser.isActive,
      lastLogin: updatedUser.lastLogin?.toISOString() || null,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(userId: string, deletedBy?: string) {
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
    confirmPassword: string
  ) {
    if (newPassword !== confirmPassword) {
      throw new ValidationError("New password and confirm password do not match");
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

    // Verify current password
    const isValid = await Bun.password.verify(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError("Current password is incorrect");
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
}

