import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { ActivityLogService } from "../../activity-log/service";

export class CardProductService {
  // Get All Card Product
  static async getCardProducts(
    search?: string,
    programType?: "FWC" | "VOUCHER",
  ) {
    const where: any = {
      deletedAt: null,
    };

    if (programType) {
      where.programType = programType;
    }

    if (search) {
      where.OR = [
        {
          category: {
            categoryName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          type: {
            typeName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          serialTemplate: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const cardProducts = await db.cardProduct.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: {
          select: {
            id: true,
            categoryName: true,
          },
        },
        type: {
          select: {
            id: true,
            typeName: true,
            typeCode: true,
          },
        },
      },
    });

    return cardProducts.map((product) => ({
      ...product,
      price: product.price.toString(),
      type: product.type ? {
        id: product.type.id,
        typeName: product.type.typeName,
        typeCode: product.type.typeCode,
      } : null,
    }));
  }

  // Get Card Product By Id
  static async getCardProductById(id: string) {
    const cardProduct = await db.cardProduct.findUnique({
      where: {
        id,
      },
    });

    if (!cardProduct) return null;

    return {
      ...cardProduct,
      price: cardProduct.price.toString(),
    };
  }

  // Create Card Product
  static async createCardProduct(
    categoryId: string,
    typeId: string,
    programType: "FWC" | "VOUCHER",
    totalQuota: number,
    masaBerlaku: number,
    serialTemplate: string,
    price: number,
    userId: string,
    maxQuantity?: number,
  ) {
    const [cardCategory, cardType] = await Promise.all([
      db.cardCategory.findUnique({
        where: {
          id: categoryId,
        },
      }),
      db.cardType.findUnique({
        where: {
          id: typeId,
        },
      }),
    ]);

    if (!cardCategory) {
      throw new ValidationError(
        "Card Category Not Found",
        "CARD_CATEGORY_NOT_FOUND",
      );
    }

    if (!cardType) {
      throw new ValidationError("Card Type Not Found", "CARD_TYPE_NOT_FOUND");
    }

    // Validate Program Type Consistency
    if (cardCategory.programType !== cardType.programType) {
      throw new ValidationError(
        "Program Type tidak cocok antara Kategori dan Tipe.",
        "PROGRAM_TYPE_MISMATCH",
      );
    }

    // Validate Input Program Type matches Category/Type
    if (programType !== cardCategory.programType) {
      throw new ValidationError(
        `Program Type input (${programType}) tidak sesuai dengan Kategori/Tipe (${cardCategory.programType}).`,
        "PROGRAM_TYPE_INPUT_MISMATCH",
      );
    }

    // Generate Serial Template: Program Code (from serialTemplate arg) + Category Code + Type Code
    const generatedSerialTemplate = `${serialTemplate}${cardCategory.categoryCode}${cardType.typeCode}`;

    // Check if product already exists (including soft deleted)
    const existingProduct = await db.cardProduct.findFirst({
      where: {
        categoryId,
        typeId,
      },
    });

    // Validate Serial Template Uniqueness
    const existingTemplate = await db.cardProduct.findFirst({
      where: {
        serialTemplate: generatedSerialTemplate.toString(),
      },
    });

    if (existingTemplate) {
      if (!existingProduct || existingTemplate.id !== existingProduct.id) {
        throw new ValidationError(
          `Serial Template '${generatedSerialTemplate}' sudah digunakan oleh produk lain.`,
          "SERIAL_TEMPLATE_ALREADY_EXISTS",
        );
      }
    }

    if (existingProduct) {
      if (!existingProduct.deletedAt) {
        throw new ValidationError(
          "Produk dengan Kategori dan Tipe ini sudah ada.",
          "PRODUCT_ALREADY_EXISTS",
        );
      }

      // If soft deleted, restore and update
      const restoredProduct = await db.cardProduct.update({
        where: {
          id: existingProduct.id,
        },
        data: {
          isActive: true,
          deletedAt: null,
          deletedBy: null,
          totalQuota,
          masaBerlaku,
          price,
          serialTemplate: generatedSerialTemplate.toString(),
          programType: programType,
          maxQuantity,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      await ActivityLogService.createActivityLog(
        userId,
        "RESTORE_CARD_PRODUCT",
        `Restored product ${restoredProduct.serialTemplate} (Category: ${cardCategory.categoryName}, Type: ${cardType.typeName})`,
      );

      return {
        ...restoredProduct,
        price: restoredProduct.price.toString(),
      };
    }

    const createCardProduct = await db.cardProduct.create({
      data: {
        categoryId,
        typeId,
        totalQuota,
        masaBerlaku,
        price,
        serialTemplate: generatedSerialTemplate.toString(),
        programType: programType,
        maxQuantity,
        isActive: true,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "CREATE_CARD_PRODUCT",
      `Created product ${createCardProduct.serialTemplate} (Category: ${cardCategory.categoryName}, Type: ${cardType.typeName})`,
    );

    return {
      ...createCardProduct,
      price: createCardProduct.price.toString(),
    };
  }

  // Update Card Product
  static async updateCardProduct(
    id: string,
    categoryId: string,
    typeId: string,
    programType: "FWC" | "VOUCHER",
    totalQuota: number,
    masaBerlaku: number,
    serialTemplate: string,
    price: number,
    userId: string,
    maxQuantity?: number,
  ) {
    const [cardCategory, cardType] = await Promise.all([
      db.cardCategory.findUnique({
        where: {
          id: categoryId,
        },
      }),
      db.cardType.findUnique({
        where: {
          id: typeId,
        },
      }),
    ]);

    if (!cardCategory) {
      throw new ValidationError(
        "Card Category Not Found",
        "CARD_CATEGORY_NOT_FOUND",
      );
    }

    if (!cardType) {
      throw new ValidationError("Card Type Not Found", "CARD_TYPE_NOT_FOUND");
    }

    // Validate Program Type Consistency
    if (cardCategory.programType !== cardType.programType) {
      throw new ValidationError(
        "Program Type tidak cocok antara Kategori dan Tipe.",
        "PROGRAM_TYPE_MISMATCH",
      );
    }

    // Validate Input Program Type matches Category/Type
    if (programType !== cardCategory.programType) {
      throw new ValidationError(
        `Program Type input (${programType}) tidak sesuai dengan Kategori/Tipe (${cardCategory.programType}).`,
        "PROGRAM_TYPE_INPUT_MISMATCH",
      );
    }

    // Generate Serial Template: Program Code (from serialTemplate arg) + Category Code + Type Code
    const generatedSerialTemplate = `${serialTemplate}${cardCategory.categoryCode}${cardType.typeCode}`;

    // Validate Serial Template Uniqueness (exclude current product)
    const existingTemplate = await db.cardProduct.findFirst({
      where: {
        serialTemplate: generatedSerialTemplate.toString(),
        id: {
          not: id,
        },
      },
    });

    if (existingTemplate) {
      throw new ValidationError(
        `Serial Template '${generatedSerialTemplate}' sudah digunakan oleh produk lain.`,
        "SERIAL_TEMPLATE_ALREADY_EXISTS",
      );
    }

    const updateCardProduct = await db.cardProduct.update({
      where: {
        id,
      },
      data: {
        categoryId,
        typeId,
        totalQuota,
        masaBerlaku,
        price,
        serialTemplate: generatedSerialTemplate.toString(),
        programType: programType,
        maxQuantity,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "UPDATE_CARD_PRODUCT",
      `Updated product ${updateCardProduct.serialTemplate} (Category: ${cardCategory.categoryName}, Type: ${cardType.typeName})`,
    );

    return {
      ...updateCardProduct,
      price: updateCardProduct.price.toString(),
      serialTemplate: updateCardProduct.serialTemplate.toString(),
    };
  }

  // Soft delete card product
  static async deleteCardProduct(id: string, userId: string) {
    const existingProduct = await db.cardProduct.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new ValidationError(
        "Card Product Not Found",
        "CARD_PRODUCT_NOT_FOUND",
      );
    }

    const deleteCardProduct = await db.cardProduct.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        serialTemplate: `${existingProduct.serialTemplate}-deleted-${Date.now()}`,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "DELETE_CARD_PRODUCT",
      `Deleted product ${deleteCardProduct.serialTemplate}`,
    );

    return {
      ...deleteCardProduct,
      price: deleteCardProduct.price.toString(),
    };
  }
}
