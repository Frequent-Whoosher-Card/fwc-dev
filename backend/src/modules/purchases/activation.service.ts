import db from "../../config/db";
import { ValidationError, NotFoundError } from "../../utils/errors";

export class ActivationService {
  /**
   * Activate card with physical serial number validation
   * Two-Step Activation: Validates physical card matches assigned card
   */
  static async activateCard(
    purchaseId: string,
    physicalCardSerialNumber: string,
    userId: string
  ) {
    // Fetch purchase with related card and product info
    const purchase = await db.cardPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        card: {
          include: {
            cardProduct: {
              include: {
                category: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!purchase || purchase.deletedAt) {
      throw new NotFoundError("Purchase tidak ditemukan");
    }

    // Check if already activated
    if (purchase.activationStatus === "ACTIVATED") {
      throw new ValidationError("Purchase sudah diaktivasi sebelumnya");
    }

    // Check if cancelled
    if (purchase.activationStatus === "CANCELLED") {
      throw new ValidationError(
        "Purchase sudah dibatalkan, tidak dapat diaktivasi"
      );
    }

    // Validate physical card serial number matches assigned serial number
    const assignedSerialNumber =
      purchase.card.assignedSerialNumber || purchase.card.serialNumber;

    if (assignedSerialNumber !== physicalCardSerialNumber) {
      throw new ValidationError(
        `Serial number kartu fisik tidak sesuai.\n` +
          `Kartu yang seharusnya: ${assignedSerialNumber}\n` +
          `Kartu yang diberikan: ${physicalCardSerialNumber}`
      );
    }

    // Validate card status - harus ASSIGNED untuk bisa diaktivasi
    if (purchase.card.status !== "ASSIGNED") {
      throw new ValidationError(
        `Status kartu tidak valid untuk aktivasi (status: ${purchase.card.status}). ` +
          `Kartu harus berstatus ASSIGNED.`
      );
    }

    // Activate card and update purchase status in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update card status to SOLD_ACTIVE
      const updatedCard = await tx.card.update({
        where: { id: purchase.cardId },
        data: {
          status: "SOLD_ACTIVE",
          updatedBy: userId,
          updatedAt: new Date(),
        },
        include: {
          cardProduct: {
            select: {
              categoryId: true,
              typeId: true,
            },
          },
        },
      });

      // Update purchase activation status
      const updatedPurchase = await tx.cardPurchase.update({
        where: { id: purchaseId },
        data: {
          activationStatus: "ACTIVATED",
          activatedAt: new Date(),
          activatedBy: userId,
          physicalCardSerialNumber,
          updatedBy: userId,
          updatedAt: new Date(),
        },
        include: {
          card: {
            include: {
              cardProduct: true,
            },
          },
          member: true,
          operator: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          station: true,
        },
      });

      // Update inventory: increment cardAktif on activation
      const inventory = await tx.cardInventory.findFirst({
        where: {
          categoryId: updatedCard.cardProduct.categoryId,
          typeId: updatedCard.cardProduct.typeId,
          stationId: purchase.stationId,
        },
      });

      if (inventory) {
        await tx.cardInventory.update({
          where: { id: inventory.id },
          data: {
            cardAktif: {
              increment: 1,
            },
            updatedBy: userId,
          },
        });
      }

      return {
        card: updatedCard,
        purchase: updatedPurchase,
      };
    });

    return result;
  }

  /**
   * Swap card for a purchase if wrong card was given
   * Use this when physical card given doesn't match the assigned card
   */
  static async swapCard(
    purchaseId: string,
    correctCardSerialNumber: string,
    userId: string,
    reason?: string
  ) {
    // Fetch purchase with card info
    const purchase = await db.cardPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        card: {
          include: {
            cardProduct: {
              include: {
                category: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!purchase || purchase.deletedAt) {
      throw new NotFoundError("Purchase tidak ditemukan");
    }

    // Cannot swap if already activated
    if (purchase.activationStatus === "ACTIVATED") {
      throw new ValidationError(
        "Purchase sudah diaktivasi, tidak dapat melakukan swap kartu"
      );
    }

    // Cannot swap if cancelled
    if (purchase.activationStatus === "CANCELLED") {
      throw new ValidationError(
        "Purchase sudah dibatalkan, tidak dapat melakukan swap kartu"
      );
    }

    // Find the correct card by serial number
    const correctCard = await db.card.findUnique({
      where: { serialNumber: correctCardSerialNumber },
      include: {
        cardProduct: {
          include: {
            category: true,
            type: true,
          },
        },
      },
    });

    if (!correctCard || correctCard.deletedAt) {
      throw new NotFoundError(
        `Kartu dengan serial number ${correctCardSerialNumber} tidak ditemukan`
      );
    }

    // Validate correct card is available for purchase
    if (correctCard.status !== "IN_STATION") {
      throw new ValidationError(
        `Kartu ${correctCardSerialNumber} tidak tersedia untuk purchase (status: ${correctCard.status}). ` +
          `Kartu harus berstatus IN_STATION.`
      );
    }

    // Validate correct card matches same category as original purchase
    if (
      correctCard.cardProduct.categoryId !==
      purchase.card.cardProduct.categoryId
    ) {
      throw new ValidationError(
        `Kategori kartu tidak sesuai.\n` +
          `Kategori seharusnya: ${purchase.card.cardProduct.category.categoryName}\n` +
          `Kategori kartu yang dipilih: ${correctCard.cardProduct.category.categoryName}`
      );
    }

    // Perform swap in a transaction
    const result = await db.$transaction(async (tx) => {
      // Restore original card status back to IN_STATION
      await tx.card.update({
        where: { id: purchase.cardId },
        data: {
          status: "IN_STATION",
          assignedSerialNumber: null,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // Update new card to ASSIGNED status
      await tx.card.update({
        where: { id: correctCard.id },
        data: {
          status: "ASSIGNED",
          assignedSerialNumber: correctCard.serialNumber,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // Update purchase with new card
      const updatedPurchase = await tx.cardPurchase.update({
        where: { id: purchaseId },
        data: {
          cardId: correctCard.id,
          notes: purchase.notes
            ? `${purchase.notes}\n[SWAP] ${reason || "Kartu diganti"}`
            : `[SWAP] ${reason || "Kartu diganti"}`,
          updatedBy: userId,
          updatedAt: new Date(),
        },
        include: {
          card: {
            include: {
              cardProduct: true,
            },
          },
          member: true,
          operator: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          station: true,
        },
      });

      return updatedPurchase;
    });

    return result;
  }

  /**
   * Cancel purchase activation
   * Use this to mark a purchase as cancelled before activation
   */
  static async cancelPurchase(
    purchaseId: string,
    userId: string,
    reason?: string
  ) {
    // Fetch purchase
    const purchase = await db.cardPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        card: true,
      },
    });

    if (!purchase || purchase.deletedAt) {
      throw new NotFoundError("Purchase tidak ditemukan");
    }

    // Cannot cancel if already activated
    if (purchase.activationStatus === "ACTIVATED") {
      throw new ValidationError(
        "Purchase sudah diaktivasi, tidak dapat dibatalkan"
      );
    }

    // Cancel purchase and restore card status
    const result = await db.$transaction(async (tx) => {
      // Restore card status back to IN_STATION
      const updatedCard = await tx.card.update({
        where: { id: purchase.cardId },
        data: {
          status: "IN_STATION",
          assignedSerialNumber: null,
          purchaseDate: null,
          memberId: null,
          expiredDate: null,
          quotaTicket: 0,
          updatedBy: userId,
          updatedAt: new Date(),
        },
        include: {
          cardProduct: {
            select: {
              categoryId: true,
              typeId: true,
            },
          },
        },
      });

      // Update purchase to cancelled
      const updatedPurchase = await tx.cardPurchase.update({
        where: { id: purchaseId },
        data: {
          activationStatus: "CANCELLED",
          notes: purchase.notes
            ? `${purchase.notes}\n[CANCELLED] ${reason || "Purchase dibatalkan"}`
            : `[CANCELLED] ${reason || "Purchase dibatalkan"}`,
          updatedBy: userId,
          updatedAt: new Date(),
        },
        include: {
          card: {
            include: {
              cardProduct: true,
            },
          },
          member: true,
          operator: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          station: true,
        },
      });

      // Restore inventory: increment cardBelumTerjual
      const inventory = await tx.cardInventory.findFirst({
        where: {
          categoryId: updatedCard.cardProduct.categoryId,
          typeId: updatedCard.cardProduct.typeId,
          stationId: purchase.stationId,
        },
      });

      if (inventory) {
        await tx.cardInventory.update({
          where: { id: inventory.id },
          data: {
            cardBelumTerjual: {
              increment: 1,
            },
            updatedBy: userId,
          },
        });
      }

      return updatedPurchase;
    });

    return result;
  }

  /**
   * Get purchase activation status
   */
  static async getPurchaseActivationStatus(purchaseId: string) {
    const purchase = await db.cardPurchase.findUnique({
      where: { id: purchaseId },
      select: {
        id: true,
        activationStatus: true,
        activatedAt: true,
        activatedBy: true,
        physicalCardSerialNumber: true,
        deletedAt: true,
        card: {
          select: {
            id: true,
            serialNumber: true,
            assignedSerialNumber: true,
            status: true,
            cardProduct: {
              select: {
                id: true,
                category: {
                  select: {
                    categoryName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!purchase || purchase.deletedAt) {
      throw new NotFoundError("Purchase tidak ditemukan");
    }

    return purchase;
  }

  /**
   * Get list of pending activations
   * Useful for monitoring purchases that haven't been activated yet
   */
  static async getPendingActivations(stationId?: string) {
    const where: any = {
      activationStatus: "PENDING",
      deletedAt: null,
    };

    if (stationId) {
      where.stationId = stationId;
    }

    const pendingPurchases = await db.cardPurchase.findMany({
      where,
      include: {
        card: {
          include: {
            cardProduct: {
              include: {
                category: true,
                type: true,
              },
            },
          },
        },
        member: true,
        operator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        station: true,
      },
      orderBy: {
        purchaseDate: "desc",
      },
    });

    return pendingPurchases;
  }
}
