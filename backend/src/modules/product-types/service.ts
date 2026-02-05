import db from "../../config/db";
import { NotFoundError, ValidationError } from "../../utils/errors";

export class ProductTypeService {
  static async getProductTypes() {
    const productTypes = await db.productType.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        programId: true,
        description: true,
        abbreviation: true,
        programType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!productTypes || productTypes.length === 0) {
      throw new NotFoundError("Product types not found");
    }

    return productTypes.map((pt) => ({
      ...pt,
      createdAt: pt.createdAt.toISOString(),
    }));
  }

  static async getProductTypeById(id: string) {
    const productType = await db.productType.findUnique({
      where: { id },
      select: {
        id: true,
        programId: true,
        description: true,
        abbreviation: true,
        programType: true,
        createdAt: true,
      },
    });

    if (!productType) {
      throw new NotFoundError("Product type not found");
    }

    return {
      ...productType,
      createdAt: productType.createdAt.toISOString(),
    };
  }

  static async getProductTypesByProgram(programType: "FWC" | "VOUCHER") {
    const productTypes = await db.productType.findMany({
      where: { 
        programType,
        deletedAt: null,
      },
      select: {
        id: true,
        programId: true,
        description: true,
        abbreviation: true,
        programType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!productTypes || productTypes.length === 0) {
      throw new NotFoundError(`Product types for ${programType} not found`);
    }

    return productTypes.map((pt) => ({
      ...pt,
      createdAt: pt.createdAt.toISOString(),
    }));
  }
}
