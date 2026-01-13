import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";

export class CardProductService {
  // Get All Card Product
  static async getCardProducts(search?: string) {
    const where: any = {
      deletedAt: null,
    };

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
          },
        },
      },
    });

    return cardProducts.map((product) => ({
      ...product,
      price: product.price.toString(),
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
    totalQuota: number,
    masaBerlaku: number,
    serialTemplate: string,
    price: number,
    userId: string
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
        "CARD_CATEGORY_NOT_FOUND"
      );
    }

    if (!cardType) {
      throw new ValidationError("Card Type Not Found", "CARD_TYPE_NOT_FOUND");
    }

    const createCardProduct = await db.cardProduct.create({
      data: {
        categoryId,
        typeId,
        totalQuota,
        masaBerlaku,
        price,
        serialTemplate: serialTemplate.toString(),
        isActive: true,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

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
    totalQuota: number,
    masaBerlaku: number,
    serialTemplate: string,
    price: number,
    userId: string
  ) {
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
        serialTemplate: serialTemplate.toString(),
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    return {
      ...updateCardProduct,
      price: updateCardProduct.price.toString(),
      serialTemplate: updateCardProduct.serialTemplate.toString(),
    };
  }

  // Soft delete card product
  static async deleteCardProduct(id: string, userId: string) {
    const deleteCardProduct = await db.cardProduct.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return {
      ...deleteCardProduct,
      price: deleteCardProduct.price.toString(),
    };
  }
}
