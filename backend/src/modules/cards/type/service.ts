import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { ActivityLogService } from "../../activity-log/service";

export class CardTypeService {
  // Get all card types
  static async getCardTypes(programType?: "FWC" | "VOUCHER") {
    const whereClause: any = {
      deletedAt: null,
    };

    if (programType) {
      whereClause.programType = programType;
    }

    const cardTypes = await db.cardType.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    return cardTypes;
  }

  // Get spesific card type
  static async getCardTypeById(id: string) {
    const cardType = await db.cardType.findUnique({
      where: {
        id,
      },
    });

    return cardType;
  }

  // Create new card type
  static async createCardType(
    typeCode: string,
    typeName: string,
    routeDescription: string,
    userId: string,
    programType: "FWC" | "VOUCHER" = "FWC",
  ) {
    // Check duplication
    const existingType = await db.cardType.findFirst({
      where: {
        typeCode,
        programType,
      },
    });

    if (existingType) {
      throw new ValidationError(
        `Card Type Code '${typeCode}' already exists in program '${programType}'`,
        "TYPE_CODE_ALREADY_EXISTS",
      );
    }

    const cardType = await db.cardType.create({
      data: {
        typeCode,
        typeName,
        routeDescription,
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
      "CREATE_CARD_TYPE",
      `Created type ${typeCode} - ${typeName} (${programType})`,
    );

    return cardType;
  }

  // Edit card type
  static async editCardType(
    id: string,
    typeCode: string,
    typeName: string,
    routeDescription: string,
    userId: string,
    programType?: "FWC" | "VOUCHER",
  ) {
    if (programType) {
      // Check duplication
      const existingType = await db.cardType.findFirst({
        where: {
          typeCode,
          programType,
          id: {
            not: id,
          },
        },
      });

      if (existingType) {
        throw new ValidationError(
          `Card Type Code '${typeCode}' already exists in program '${programType}'`,
          "TYPE_CODE_ALREADY_EXISTS",
        );
      }
    }

    const cardType = await db.cardType.update({
      where: {
        id,
      },
      data: {
        typeCode,
        typeName,
        routeDescription,
        programType,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "EDIT_CARD_TYPE",
      `Edited type ${cardType.typeCode} - ${cardType.typeName}`,
    );

    return cardType;
  }

  // Soft delete card type
  static async deleteCardType(id: string, userId: string) {
    const existingType = await db.cardType.findUnique({
      where: { id },
    });

    if (!existingType) {
      throw new ValidationError("Card Type Not Found", "CARD_TYPE_NOT_FOUND");
    }

    const cardType = await db.cardType.update({
      where: {
        id,
      },
      data: {
        typeCode: `${existingType.typeCode}-deleted-${Date.now()}`,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "DELETE_CARD_TYPE",
      `Deleted type ${cardType.typeCode} - ${cardType.typeName}`,
    );

    return cardType;
  }

  static async getRecommendedCode(programType: "FWC" | "VOUCHER") {
    const types = await db.cardType.findMany({
      where: {
        programType,
        deletedAt: null,
      },
      select: {
        typeCode: true,
      },
    });

    const existingCodes = new Set(
      types
        .map((type) => parseInt(type.typeCode))
        .filter((code) => !isNaN(code)),
    );

    let recommendedInt = 1;
    while (existingCodes.has(recommendedInt)) {
      recommendedInt++;
    }

    // For numeric gaps, e.g., if 01 and 03 exist, returns "02" as string
    return recommendedInt.toString();
  }
}
