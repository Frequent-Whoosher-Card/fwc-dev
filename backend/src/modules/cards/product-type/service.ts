import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { ActivityLogService } from "../../activity-log/service";
import { ProgramType } from "../../../../prisma/generated/client/client";

export class ProductTypeService {
  // Get all product types
  static async getProductTypes(programType?: ProgramType) {
    const where: any = {
      deletedAt: null,
    };

    if (programType) {
      where.programType = programType;
    }

    return await db.productType.findMany({
      where,
      orderBy: {
        programId: "asc",
      },
    });
  }

  // Get specific product type
  static async getProductTypeById(id: string) {
    return await db.productType.findFirst({
      where: { id, deletedAt: null },
    });
  }

  // Create new product type
  static async createProductType(
    data: {
      programId: string;
      description?: string;
      abbreviation?: string;
      programType?: ProgramType;
    },
    userId: string,
  ) {
    // Check duplication of programId per programType
    const existing = await db.productType.findFirst({
      where: {
        programId: data.programId,
        programType: data.programType || "FWC",
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ValidationError(
        `Program ID '${data.programId}' already exists for program type '${data.programType || "FWC"}'`,
        "PRODUCT_TYPE_EXISTS",
      );
    }

    const productType = await db.productType.create({
      data: {
        ...data,
        programType: data.programType || "FWC",
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "CREATE_PRODUCT_TYPE",
      `Created product type ${data.programId} - ${data.description || ""}`,
    );

    return productType;
  }

  // Edit product type
  static async editProductType(
    id: string,
    data: {
      programId: string;
      description?: string;
      abbreviation?: string;
      programType?: ProgramType;
    },
    userId: string,
  ) {
    // Check duplication for other records
    const existing = await db.productType.findFirst({
      where: {
        programId: data.programId,
        programType: data.programType || "FWC",
        id: { not: id },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ValidationError(
        `Program ID '${data.programId}' already exists for program type '${data.programType || "FWC"}'`,
        "PRODUCT_TYPE_EXISTS",
      );
    }

    const productType = await db.productType.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "EDIT_PRODUCT_TYPE",
      `Edited product type ${productType.programId}`,
    );

    return productType;
  }

  // Soft delete
  static async deleteProductType(id: string, userId: string) {
    const existing = await db.productType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ValidationError(
        "Product Type Not Found",
        "PRODUCT_TYPE_NOT_FOUND",
      );
    }

    const timestamp = Date.now();
    const productType = await db.productType.update({
      where: { id },
      data: {
        programId: `${existing.programId}-deleted-${timestamp}`,
        abbreviation: existing.abbreviation
          ? `${existing.abbreviation}-del-${timestamp}`
          : null,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "DELETE_PRODUCT_TYPE",
      `Deleted product type ${existing.programId}`,
    );

    return productType;
  }
}
