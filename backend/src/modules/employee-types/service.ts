import db from "../../config/db";
import { ValidationError, NotFoundError } from "../../utils/errors";

export class EmployeeTypeService {
  /**
   * Get all employee types (for admin - includes soft deleted)
   */
  static async getAll() {
    const employeeTypes = await db.employeeType.findMany({
      where: {
        deletedAt: null, // Exclude soft deleted
      },
      orderBy: {
        name: "asc",
      },
    });

    return employeeTypes;
  }

  /**
   * Get employee type by ID
   */
  static async getById(id: string) {
    const employeeType = await db.employeeType.findUnique({
      where: { id },
    });

    if (!employeeType || employeeType.deletedAt) {
      throw new NotFoundError("Employee type tidak ditemukan");
    }

    return employeeType;
  }

  /**
   * Create new employee type
   */
  static async create(
    data: { code: string; name: string; description?: string },
    userId: string,
  ) {
    // Check if code already exists
    const existing = await db.employeeType.findUnique({
      where: { code: data.code },
    });

    if (existing && !existing.deletedAt) {
      throw new ValidationError(
        `Employee type dengan code '${data.code}' sudah ada`,
      );
    }

    const employeeType = await db.employeeType.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return employeeType;
  }

  /**
   * Update employee type
   */
  static async update(
    id: string,
    data: { code?: string; name?: string; description?: string | null },
    userId: string,
  ) {
    // Check if exists
    const employeeType = await db.employeeType.findUnique({
      where: { id },
    });

    if (!employeeType || employeeType.deletedAt) {
      throw new NotFoundError("Employee type tidak ditemukan");
    }

    // Check code uniqueness if code is being updated
    if (data.code && data.code !== employeeType.code) {
      const existing = await db.employeeType.findUnique({
        where: { code: data.code },
      });

      if (existing && !existing.deletedAt) {
        throw new ValidationError(
          `Employee type dengan code '${data.code}' sudah ada`,
        );
      }
    }

    const updated = await db.employeeType.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        updatedBy: userId,
      },
    });

    return updated;
  }

  /**
   * Soft delete employee type
   */
  static async delete(id: string, userId: string) {
    // Check if exists
    const employeeType = await db.employeeType.findUnique({
      where: { id },
      include: {
        members: {
          where: { deletedAt: null },
          take: 1,
        },
      },
    });

    if (!employeeType || employeeType.deletedAt) {
      throw new NotFoundError("Employee type tidak ditemukan");
    }

    // Check if any members are using this type
    if (employeeType.members.length > 0) {
      throw new ValidationError(
        "Tidak dapat menghapus employee type yang masih digunakan oleh member",
      );
    }

    await db.employeeType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { message: "Employee type berhasil dihapus" };
  }
}
