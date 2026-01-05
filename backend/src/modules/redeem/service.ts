import db from "../../config/db";
import { CardStatus } from "@prisma/client";
import { NotFoundError } from "../../utils/errors";

export class RedeemService {
  /**
   * Check card details by serial number
   * @param serialNumber Serial number of the card
   */
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
      throw new NotFoundError("Card not found");
    }

    // Determine status text
    let statusActive = "Tidak Aktif";

    // Status logic update:
    // SOLD_ACTIVE -> Aktif
    // SOLD_INACTIVE -> Tidak Aktif (but still return data)
    // Others -> Use the raw status string (or map as needed, e.g. "Expired" was previously mapped from SOLD_INACTIVE)

    if (card.status === CardStatus.SOLD_ACTIVE) {
      statusActive = "ACTIVE";
    } else if (card.status === CardStatus.SOLD_INACTIVE) {
      statusActive = "EXPIRED";
    } else {
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
      purchaseDate: card.purchaseDate ? card.purchaseDate.toISOString() : null,
      expiredDate: card.expiredDate ? card.expiredDate.toISOString() : null,
    };
  }
}
