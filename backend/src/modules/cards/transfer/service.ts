import db from "../../../config/db";
import {
  StockMovementType,
  StockMovementStatus,
  CardStatus,
} from "@prisma/client";
import { AppError } from "../../../utils/errors";

export const TransferService = {
  // 1. Create Transfer (Send Cards)
  createTransfer: async (payload: {
    stationId: string; // From Station
    toStationId: string; // To Station
    categoryId: string;
    typeId: string;
    quantity: number;
    note?: string;
    userId: string;
  }) => {
    const {
      stationId,
      toStationId,
      categoryId,
      typeId,
      quantity,
      note,
      userId,
    } = payload;

    return await db.$transaction(async (tx) => {
      // 1. Validate Source Inventory
      const fromInventory = await tx.cardInventory.findUnique({
        where: {
          unique_category_type_station: {
            categoryId,
            typeId,
            stationId,
          },
        },
      });

      if (!fromInventory || fromInventory.cardBelumTerjual < quantity) {
        throw new AppError("Insufficient stock at source station", 400);
      }

      // 2. Find Available Cards (FIFO to pick cards to transfer)
      // We need to pick specific cards to mark them as IN_TRANSIT
      const cardsToTransfer = await tx.card.findMany({
        where: {
          stationId,
          cardProduct: {
            categoryId,
            typeId,
          },
          status: CardStatus.IN_STATION, // Assuming available stock is IN_STATION
        },
        take: quantity,
        orderBy: {
          serialNumber: "asc", // FIFOish
        },
      });

      if (cardsToTransfer.length < quantity) {
        throw new AppError(
          `Not enough active cards found. Inventory says ${fromInventory.cardBelumTerjual} but found ${cardsToTransfer.length} items.`,
          409
        );
      }

      const serialNumbers = cardsToTransfer.map((c) => c.serialNumber);

      // 3. Create Movement (TRANSFER, PENDING)
      const movement = await tx.cardStockMovement.create({
        data: {
          type: StockMovementType.TRANSFER,
          status: StockMovementStatus.PENDING,
          categoryId,
          typeId,
          stationId, // From
          toStationId, // To
          quantity,
          sentSerialNumbers: serialNumbers,
          note,
          createdBy: userId,
          movementAt: new Date(),
        },
      });

      // 4. Update Cards -> IN_TRANSIT, stationId = null, previousStationId = stationId
      await tx.card.updateMany({
        where: {
          serialNumber: { in: serialNumbers },
        },
        data: {
          status: CardStatus.IN_TRANSIT,
          stationId: null, // Removed from source station context
          previousStationId: stationId, // Track where it came from
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // 5. Update Inventory (Source Station - Decrement)
      await tx.cardInventory.update({
        where: {
          unique_category_type_station: {
            categoryId,
            typeId,
            stationId,
          },
        },
        data: {
          cardBelumTerjual: { decrement: quantity },
          // cardBeredar not modified - cards are IN_TRANSIT (floating stock)
        },
      });

      return movement;
    });
  },

  // 2. See Pending Transfers (Incoming/Outgoing)
  getTransfers: async (params: {
    stationId?: string;
    status?: StockMovementStatus;
  }) => {
    const where: any = { type: StockMovementType.TRANSFER };

    if (params.stationId) {
      // Show transfers where station is either Sender OR Receiver
      where.OR = [
        { stationId: params.stationId },
        { toStationId: params.stationId },
      ];
    }
    if (params.status) {
      where.status = params.status;
    }

    return await db.cardStockMovement.findMany({
      where,
      include: {
        category: true,
        cardType: true,
        station: { select: { stationName: true } }, // From
        toStation: { select: { stationName: true } }, // To
      },
      orderBy: { movementAt: "desc" },
    });
  },

  getTransferById: async (id: string) => {
    return await db.cardStockMovement.findUnique({
      where: { id },
      include: {
        category: true,
        cardType: true,
        station: true,
        toStation: true,
      },
    });
  },

  // 3. Receive Transfer (Generic Accept)
  receiveTransfer: async (movementId: string, userId: string) => {
    return await db.$transaction(async (tx) => {
      const movement = await tx.cardStockMovement.findUnique({
        where: { id: movementId },
      });

      if (!movement) throw new AppError("Transfer not found", 404);
      if (movement.status !== StockMovementStatus.PENDING)
        throw new AppError(`Transfer status is ${movement.status}`, 400);
      if (!movement.toStationId)
        throw new AppError("Target station invalid", 400);

      // 1. Update Movement -> APPROVED
      const updatedMovement = await tx.cardStockMovement.update({
        where: { id: movementId },
        data: {
          status: StockMovementStatus.APPROVED,
          receivedSerialNumbers: movement.sentSerialNumbers, // Auto-accept all for simplicity first
          validatedBy: userId,
          validatedAt: new Date(),
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // 2. Update Cards -> IN_STATION, stationId = toStationId
      await tx.card.updateMany({
        where: {
          serialNumber: { in: movement.sentSerialNumbers },
        },
        data: {
          status: CardStatus.IN_STATION,
          stationId: movement.toStationId,
          // previousStationId remains as is (history)
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // 3. Update Inventory (Destination Station + Increment)
      // Upsert incase inventory record doesn't exist yet
      const existingInv = await tx.cardInventory.findUnique({
        where: {
          unique_category_type_station: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
            stationId: movement.toStationId,
          },
        },
      });

      if (existingInv) {
        await tx.cardInventory.update({
          where: { id: existingInv.id },
          data: {
            cardBelumTerjual: { increment: movement.quantity },
          },
        });
      } else {
        await tx.cardInventory.create({
          data: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
            stationId: movement.toStationId,
            cardBelumTerjual: movement.quantity,
            cardBeredar: 0,
            cardAktif: 0,
            cardNonAktif: 0,
          },
        });
      }

      return updatedMovement;
    });
  },
};
