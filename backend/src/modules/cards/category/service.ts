import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { ActivityLogService } from "../../activity-log/service";

export class CardCategoryService {
  // Get Card Categories
  static async getCardCategories(programType?: "FWC" | "VOUCHER") {
    const whereClause: any = {
      deletedAt: null,
    };

    if (programType) {
      whereClause.programType = programType;
    }

    const cardCategories = await db.cardCategory.findMany({
      where: whereClause,
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
    userId: string,
    programType: "FWC" | "VOUCHER" = "FWC",
  ) {
    // Check duplication
    const existingCategory = await db.cardCategory.findFirst({
      where: {
        categoryCode,
        programType,
      },
    });

    if (existingCategory) {
      throw new ValidationError(
        `Category Code '${categoryCode}' already exists in program '${programType}'`,
        "CATEGORY_CODE_ALREADY_EXISTS",
      );
    }

    const cardCategory = await db.cardCategory.create({
      data: {
        categoryCode,
        categoryName,
        description,
        programType,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
        deletedAt: null,
        deletedBy: null,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "CREATE_CARD_CATEGORY",
      `Created category ${categoryCode} - ${categoryName} (${programType})`,
    );

    return cardCategory;
  }

  // Edit Card Category
  static async editCardCategory(
    id: string,
    categoryCode: string,
    categoryName: string,
    description: string,
    userId: string,
    programType?: "FWC" | "VOUCHER",
  ) {
    if (programType) {
      // Check duplication (if code or program changed)
      // We check if ANY other category has this new combo
      const existingCategory = await db.cardCategory.findFirst({
        where: {
          categoryCode,
          programType,
          id: {
            not: id,
          },
        },
      });

      if (existingCategory) {
        throw new ValidationError(
          `Category Code '${categoryCode}' already exists in program '${programType}'`,
          "CATEGORY_CODE_ALREADY_EXISTS",
        );
      }
    }

    const cardCategory = await db.cardCategory.update({
      where: {
        id,
      },
      data: {
        categoryCode,
        categoryName,
        description,
        programType,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "EDIT_CARD_CATEGORY",
      `Edited category ${cardCategory.categoryCode} - ${cardCategory.categoryName}`,
    );

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

    await ActivityLogService.createActivityLog(
      userId,
      "DELETE_CARD_CATEGORY",
      `Deleted category ${cardCategory.categoryCode} - ${cardCategory.categoryName}`,
    );

    return cardCategory;
  }

  static async getRecommendedCode(programType: "FWC" | "VOUCHER") {
    const categories = await db.cardCategory.findMany({
      where: {
        programType,
        deletedAt: null,
      },
      select: {
        categoryCode: true,
      },
    });

    let maxCode = 0;
    for (const category of categories) {
      const code = parseInt(category.categoryCode);
      if (!isNaN(code)) {
        if (code > maxCode) {
          maxCode = code;
        }
      }
    }

    const nextCode = maxCode + 1;
    // Pad with leading zero if single digit, e.g., "01", "02" ... "09", "10"
    return nextCode.toString();
  }
}
