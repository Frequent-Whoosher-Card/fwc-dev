import db from "../../config/db";
import { ValidationError } from "../../utils/errors";
import { ActivityLogService } from "../activity-log/service";

export class BulkDiscountService {
  /**
   * Get All Bulk Discounts
   */
  static async getAll(search?: string, role?: string) {
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        where.OR = [
          { minQuantity: { equals: searchNum } },
          { maxQuantity: { equals: searchNum } },
          { discount: { equals: searchNum } },
        ];
      }
    }

    if (role) {
      // Logic: Show discount IF roleAccess contains this role OR roleAccess is empty (all allowed)
      where.AND = [
        {
          OR: [
            { roleAccess: { has: role } },
            { roleAccess: { isEmpty: true } }, // Assuming empty means global/all
            // Alternatively, if design requires empty = no access, remove this line.
            // But usually, empty array in RBAC means "public" or "all".
            // Let's assume empty = ALL for backward compatibility or ease of use.
          ],
        },
      ];
    }

    // Always filter active if used by user system (optional, but good practice).
    // But since this is a management API, maybe we want to see inactive ones too?
    // Let's assume list logic shows all, but application logic (calc) checks isActive.
    // We can add "isActive" filter if needed later.

    const discounts = await db.bulkDiscount.findMany({
      where,
      orderBy: { minQuantity: "asc" },
    });

    return discounts.map((d) => ({
      ...d,
      discount: d.discount ? d.discount.toString() : null,
      roleAccess: d.roleAccess || [],
      isActive: d.isActive ?? true,
    }));
  }

  /**
   * Create Bulk Discount
   */
  static async create(
    data: {
      minQuantity: number;
      maxQuantity?: number;
      discount: number;
      roleAccess?: string[];
      isActive?: boolean;
    },
    userId: string,
  ) {
    // Validation: max > min
    if (
      data.maxQuantity !== undefined &&
      data.maxQuantity !== null &&
      data.maxQuantity < data.minQuantity
    ) {
      throw new ValidationError(
        "Max Quantity must be greater than Min Quantity",
      );
    }

    const discount = await db.bulkDiscount.create({
      data: {
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
        discount: data.discount,
        roleAccess: data.roleAccess || [],
        isActive: data.isActive ?? true,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "CREATE_BULK_DISCOUNT",
      `Created bulk discount ID: ${discount.id} (Min: ${
        discount.minQuantity
      }, Max: ${discount.maxQuantity}, Disc: ${discount.discount}, Roles: ${
        discount.roleAccess.join(",") || "ALL"
      })`,
    );

    return {
      ...discount,
      discount: discount.discount ? discount.discount.toString() : null,
      roleAccess: discount.roleAccess || [],
      isActive: discount.isActive ?? true,
    };
  }

  /**
   * Update Bulk Discount
   */
  static async update(
    id: number,
    data: {
      minQuantity?: number;
      maxQuantity?: number;
      discount?: number;
      roleAccess?: string[];
      isActive?: boolean;
    },
    userId: string,
  ) {
    const existing = await db.bulkDiscount.findUnique({ where: { id } });
    if (!existing) throw new ValidationError("Bulk Discount not found");

    const newMin = data.minQuantity ?? existing.minQuantity;
    const newMax =
      data.maxQuantity !== undefined ? data.maxQuantity : existing.maxQuantity;

    if (
      newMax !== null &&
      newMax !== undefined &&
      newMin !== null &&
      newMin !== undefined &&
      newMax < newMin
    ) {
      throw new ValidationError(
        "Max Quantity must be greater than Min Quantity",
      );
    }

    const updated = await db.bulkDiscount.update({
      where: { id },
      data: {
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
        discount: data.discount,
        roleAccess: data.roleAccess,
        isActive: data.isActive,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "UPDATE_BULK_DISCOUNT",
      `Updated bulk discount ID: ${id}`,
    );

    return {
      ...updated,
      discount: updated.discount ? updated.discount.toString() : null,
      roleAccess: updated.roleAccess || [],
      isActive: updated.isActive ?? true,
    };
  }

  /**
   * Delete Bulk Discount
   */
  static async delete(id: number, userId: string) {
    const existing = await db.bulkDiscount.findUnique({ where: { id } });
    if (!existing) throw new ValidationError("Bulk Discount not found");

    // Soft delete if preferred, but schema has deletedAt, so YES soft delete.
    // Previous implementation check: it did hard delete "await db.bulkDiscount.delete".
    // Schema shows deletedAt field, so we SHOULD soft delete.

    await db.bulkDiscount.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false, // Optional: Deactivate on delete
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "DELETE_BULK_DISCOUNT",
      `Deleted bulk discount ID: ${id}`,
    );

    return { success: true, message: "Bulk Discount deleted" };
  }
}
