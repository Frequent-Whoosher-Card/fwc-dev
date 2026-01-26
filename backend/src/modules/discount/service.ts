import db from "../../config/db";
import { ValidationError } from "../../utils/errors";
import { ActivityLogService } from "../activity-log/service";

export class BulkDiscountService {
  /**
   * Get All Bulk Discounts
   */
  static async getAll(search?: string) {
    const where: any = {};

    if (search) {
      // Basic global search implementation
      // Since fields are numeric, we first check if search is a valid number
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        where.OR = [
          { minQuantity: { equals: searchNum } },
          { maxQuantity: { equals: searchNum } },
          { discount: { equals: searchNum } },
        ];
      } else {
        // If search is not a number, but we have no string fields,
        // strictly speaking we return nothing.
        // Or we could implement a raw query for string-like matching if strictly required.
        // For now, return empty if non-numeric search on numeric-only table.
        // But let's be safe: maybe they want to search "null" for maxQuantity?
        // Let's stick to numeric match.
        // If exact match is too strict, we might consider Raw query later.
      }
    }

    const discounts = await db.bulkDiscount.findMany({
      where,
      orderBy: { minQuantity: "asc" },
    });
    return discounts;
  }

  /**
   * Create Bulk Discount
   */
  static async create(
    data: {
      minQuantity: number;
      maxQuantity?: number;
      discount: number;
    },
    userId: string,
  ) {
    // Validation: max > min
    if (data.maxQuantity && data.maxQuantity < data.minQuantity) {
      throw new ValidationError(
        "Max Quantity must be greater than Min Quantity",
      );
    }

    // Overlap Check?
    // Simplified: Just allow creation for now. Complex overlap checks can be added if needed.

    const discount = await db.bulkDiscount.create({
      data: {
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
        discount: data.discount,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "CREATE_BULK_DISCOUNT",
      `Created bulk discount ID: ${discount.id} (Min: ${discount.minQuantity}, Max: ${discount.maxQuantity}, Disc: ${discount.discount})`,
    );

    return discount;
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
    },
    userId: string,
  ) {
    const existing = await db.bulkDiscount.findUnique({ where: { id } });
    if (!existing) throw new ValidationError("Bulk Discount not found");

    const newMin = data.minQuantity ?? existing.minQuantity;
    const newMax =
      data.maxQuantity !== undefined ? data.maxQuantity : existing.maxQuantity;

    if (newMax !== null && newMin !== null && newMax < newMin) {
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
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "UPDATE_BULK_DISCOUNT",
      `Updated bulk discount ID: ${id}`,
    );

    return updated;
  }

  /**
   * Delete Bulk Discount
   */
  static async delete(id: number, userId: string) {
    const existing = await db.bulkDiscount.findUnique({ where: { id } });
    if (!existing) throw new ValidationError("Bulk Discount not found");

    await db.bulkDiscount.delete({ where: { id } });

    await ActivityLogService.createActivityLog(
      userId,
      "DELETE_BULK_DISCOUNT",
      `Deleted bulk discount ID: ${id}`,
    );

    return { success: true, message: "Bulk Discount deleted" };
  }
}
