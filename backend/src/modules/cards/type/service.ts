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
    const cardType = await db.cardType.update({
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

    let maxCode = 0;
    for (const type of types) {
      const code = parseInt(type.typeCode);
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
