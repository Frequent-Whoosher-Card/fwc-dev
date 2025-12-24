import db from "../../../config/db";

export class CardTypeService {
  // Get all card types
  static async getCardTypes() {
    const cardTypes = await db.cardType.findMany({
      where: {
        deletedAt: null,
      },
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
    userId: string
  ) {
    const cardType = await db.cardType.create({
      data: {
        typeCode,
        typeName,
        routeDescription,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
        deletedAt: null,
        deletedBy: null,
      },
    });

    return cardType;
  }

  // Edit card type
  static async editCardType(
    id: string,
    typeCode: string,
    typeName: string,
    routeDescription: string,
    userId: string
  ) {
    const cardType = await db.cardType.update({
      where: {
        id,
      },
      data: {
        typeCode,
        typeName,
        routeDescription,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

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

    return cardType;
  }
}
