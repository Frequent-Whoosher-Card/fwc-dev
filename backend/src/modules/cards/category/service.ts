import db from "../../../config/db";

export class CardCategoryService {
  // Get Card Categories
  static async getCardCategories() {
    const cardCategories = await db.cardCategory.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return cardCategories;
  }

  // Get spesific card category
  static async getCardCategoryById(id: string) {
    const cardCategory = await db.cardCategory.findUnique({
      where: {
        id,
      },
    });

    return cardCategory;
  }

  // Create Card Category
  static async createCardCategory(
    categoryCode: string,
    categoryName: string,
    description: string,
    userId: string
  ) {
    const cardCategory = await db.cardCategory.create({
      data: {
        categoryCode,
        categoryName,
        description,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
        deletedAt: null,
        deletedBy: null,
      },
    });

    return cardCategory;
  }

  // Edit Card Category
  static async editCardCategory(
    id: string,
    categoryCode: string,
    categoryName: string,
    description: string,
    userId: string
  ) {
    const cardCategory = await db.cardCategory.update({
      where: {
        id,
      },
      data: {
        categoryCode,
        categoryName,
        description,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    return cardCategory;
  }

  // Soft delete Card Category
  static async deleteCardCategory(id: string, userId: string) {
    const cardCategory = await db.cardCategory.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return cardCategory;
  }
}
