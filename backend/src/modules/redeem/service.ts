import db from "../../config/db";
import { CardStatus } from "@prisma/client";

export class RedeemService {
  static async checkSerial(serialNumber: string) {
    const card = await db.card.findUnique({
      where: { serialNumber },
      include: {
        member: true,
        user: true,
        cardProduct: {
          include: {
            category: true,
            type: true,
          },
        },
      },
    });

    if (!card) {
      throw {
        statusCode: 404,
        message: "Card not found",
      };
    }

    // Determine status text
    let statusActive = "Tidak Aktif";
    if (card.status === CardStatus.SOLD_ACTIVE) {
      statusActive = "Aktif";
    } else if (card.status === CardStatus.SOLD_INACTIVE) {
      statusActive = "Expired";
    } else {
      // For other statuses, just use the raw enum or keep "Tidak Aktif"
      // Maybe formatted slightly better?
      statusActive = card.status;
    }

    // Customer Name & NIK
    let customerName = "-";
    let nik = "-";

    if (card.member) {
      customerName = card.member.name;
      nik = card.member.identityNumber;
    } else if (card.user) {
      // Fallback or optional: if internal card assigned to user
      // customerName = card.user.fullName;
    }

    return {
      nik,
      customerName,
      cardCategory: card.cardProduct.category.categoryName,
      cardType: card.cardProduct.type.typeName,
      serialNumber: card.serialNumber,
      quotaRemaining: card.quotaTicket,
      statusActive,
    };
  }
}
