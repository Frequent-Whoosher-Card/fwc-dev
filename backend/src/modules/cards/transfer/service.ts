import db from "../../../config/db";
import {
  StockMovementType,
  StockMovementStatus,
  CardStatus,
} from "@prisma/client";
import { AppError } from "../../../utils/errors";
import { ActivityLogService } from "../../activity-log/service";
import { LowStockService } from "../../../services/lowStockService";

export class TransferService {
  // 1. Create Transfer (Send Cards)
  static async createTransfer(payload: {
    stationId: string; // From Station
    toStationId: string; // To Station
    categoryId: string;
    typeId: string;
    cardIds: string[]; // Specific cards to transfer
    note?: string;
    userId: string;
  }) {
    const {
      stationId,
      toStationId,
      categoryId,
      typeId,
      cardIds,
      note,
      userId,
    } = payload;

    const result = await db.$transaction(async (tx) => {
      const quantity = cardIds.length;

      // 1. Validate Source Inventory exists
      // 1. Validate Source Inventory: REMOVED (Deprecated)
      /* 
      const fromInventory = await tx.cardInventory.findUnique(...) 
      if (!fromInventory) ...
      */

      // 2. Validate Specific Cards
      // Must exist, be at stationId, be IN_STATION, match category/type
      const cards = await tx.card.findMany({
        where: {
          id: { in: cardIds },
          stationId,
          cardProduct: {
            categoryId,
            typeId,
          },
          status: CardStatus.IN_STATION,
        },
        select: {
          id: true,
          serialNumber: true,
        },
      });

      if (cards.length !== quantity) {
        // Find which ones are missing or invalid
        const foundIds = cards.map((c) => c.id);
        const invalidIds = cardIds.filter((id) => !foundIds.includes(id));
        throw new AppError(
          `Some cards are invalid or not available for transfer: ${invalidIds.join(
            ", ",
          )}`,
          400,
        );
      }

      const serialNumbers = cards.map((c) => c.serialNumber);

      // 3. Create Movement (TRANSFER, PENDING)
      const movement = await tx.cardStockMovement.create({
        data: {
          movementType: StockMovementType.TRANSFER,
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
          id: { in: cardIds },
        },
        data: {
          status: CardStatus.ON_TRANSFER,
          stationId: toStationId, // Assign to destination station immediately (as Incoming)
          previousStationId: stationId, // Track where it came from
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // 5. Update Inventory (Source Station): REMOVED (Deprecated)
      /* 
      await tx.cardInventory.update(...)
      */

      // 6. Log Activity
      const category = await tx.cardCategory.findUnique({
        where: { id: categoryId },
        select: { programType: true },
      });
      const programLabel = category?.programType || "FWC";

      await ActivityLogService.createActivityLog(
        userId,
        `CREATE_TRANSFER_${programLabel}`,
        `Created transfer of ${quantity} cards to station ${toStationId} with note: ${
          note || "-"
        }`,
      );

      return movement;
    });
    // End Transaction

    // --- POST-TRANSACTION TRIGGER ---
    // Check Source Station Stock
    const currentStock = await db.card.count({
      where: {
        stationId: stationId,
        status: CardStatus.IN_STATION,
        cardProduct: {
          categoryId: categoryId,
          typeId: typeId,
        },
      },
    });

    await LowStockService.checkStock(
      categoryId,
      typeId,
      stationId,
      currentStock,
    );
    // --------------------------------

    return result;
  }

  // 2. See Pending Transfers (Incoming/Outgoing)
  static async getTransfers(params: {
    stationId?: string;
    status?: StockMovementStatus;
    search?: string;
    page: number;
    limit: number;
    programType?: "FWC" | "VOUCHER";
  }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      movementType: StockMovementType.TRANSFER,
      deletedAt: null,
    };

    if (params.programType) {
      where.category = {
        programType: params.programType,
      };
    }

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

    if (params.search) {
      const search = params.search;
      const searchCondition = [
        { note: { contains: search, mode: "insensitive" } },
        { station: { stationName: { contains: search, mode: "insensitive" } } },
        {
          toStation: {
            stationName: { contains: search, mode: "insensitive" },
          },
        },
        {
          category: {
            categoryName: { contains: search, mode: "insensitive" },
          },
        },
        {
          type: { typeName: { contains: search, mode: "insensitive" } },
        },
      ];

      // Combine with existing OR if stationId is present (stationId AND search)
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR; // Move stationId check into AND group
      } else {
        where.OR = searchCondition;
      }
    }

    const [items, total] = await Promise.all([
      db.cardStockMovement.findMany({
        where,
        include: {
          category: true,
          type: true,
          station: { select: { stationName: true } }, // From
          toStation: { select: { stationName: true } }, // To
        },
        orderBy: { movementAt: "desc" },
        skip,
        take: limit,
      }),
      db.cardStockMovement.count({ where }),
    ]);

    // Manual fetch for users (since relations are not defined in schema)
    const userIds = new Set<string>();
    items.forEach((item) => {
      if (item.createdBy) userIds.add(item.createdBy);
      if (item.validatedBy) userIds.add(item.validatedBy);
    });

    const users = await db.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, fullName: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedItems = items.map((item) => ({
      id: item.id,
      movementAt: item.movementAt.toISOString(),
      type: item.movementType, // Schema expects "type" as string (TRANSFER)
      status: item.status,
      quantity: item.quantity,
      note: item.note,
      station: item.station ? { stationName: item.station.stationName } : null,
      toStation: item.toStation
        ? { stationName: item.toStation.stationName }
        : null,
      category: {
        id: item.category.id,
        categoryName: item.category.categoryName,
      },
      cardType: {
        id: item.type.id,
        typeName: item.type.typeName,
      },
      programType: item.category.programType || undefined,
      sentSerialNumbers: item.sentSerialNumbers,
      receivedSerialNumbers: item.receivedSerialNumbers,
      createdByUser:
        item.createdBy && userMap.has(item.createdBy)
          ? {
              id: item.createdBy,
              fullName: userMap.get(item.createdBy)!.fullName,
            }
          : { id: "", fullName: "Unknown" },
      validatedByUser:
        item.validatedBy && userMap.has(item.validatedBy)
          ? {
              id: item.validatedBy,
              fullName: userMap.get(item.validatedBy)!.fullName,
            }
          : null,
    }));

    return {
      items: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTransferById(id: string) {
    const transfer = await db.cardStockMovement.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        type: true,
        station: true,
        toStation: true,
      },
    });

    if (!transfer) return null;

    // Manual fetch users
    const userIds = new Set<string>();
    if (transfer.createdBy) userIds.add(transfer.createdBy);
    if (transfer.validatedBy) userIds.add(transfer.validatedBy);

    const users = await db.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      id: transfer.id,
      movementAt: transfer.movementAt.toISOString(),
      type: transfer.movementType, // Schema expects "type" as string (TRANSFER)
      status: transfer.status,
      quantity: transfer.quantity,
      note: transfer.note,
      station: transfer.station
        ? { stationName: transfer.station.stationName }
        : null,
      toStation: transfer.toStation
        ? { stationName: transfer.toStation.stationName }
        : null,
      category: {
        id: transfer.category.id,
        categoryName: transfer.category.categoryName,
      },
      cardType: {
        id: transfer.type.id,
        typeName: transfer.type.typeName,
      },
      programType: transfer.category.programType || undefined,
      sentSerialNumbers: transfer.sentSerialNumbers,
      receivedSerialNumbers: transfer.receivedSerialNumbers,
      createdByUser:
        transfer.createdBy && userMap.has(transfer.createdBy)
          ? {
              id: transfer.createdBy,
              fullName: userMap.get(transfer.createdBy)!.fullName,
            }
          : { id: "", fullName: "Unknown" },
      validatedByUser:
        transfer.validatedBy && userMap.has(transfer.validatedBy)
          ? {
              id: transfer.validatedBy,
              fullName: userMap.get(transfer.validatedBy)!.fullName,
            }
          : null,
    };
  }

  // 3. Receive Transfer (Generic Accept)
  static async receiveTransfer(movementId: string, userId: string) {
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

      // 4. Log Activity
      const movementWithCategory = await tx.cardStockMovement.findUnique({
        where: { id: movementId },
        include: { category: true },
      });
      const programLabel = movementWithCategory?.category.programType || "FWC";

      await ActivityLogService.createActivityLog(
        userId,
        `RECEIVE_TRANSFER_${programLabel}`,
        `Received transfer ${movement.id} with ${movement.quantity} cards`,
      );

      return updatedMovement;
    });
  }

  // 4. Delete Transfer (Cancel PENDING Transfer)
  static async deleteTransfer(id: string, userId: string) {
    return await db.$transaction(async (tx) => {
      const movement = await tx.cardStockMovement.findUnique({
        where: { id },
      });

      if (!movement) throw new AppError("Transfer not found", 404);
      if (movement.status !== StockMovementStatus.PENDING) {
        throw new AppError(
          "Cannot delete transfer. Only PENDING transfers can be deleted.",
          400,
        );
      }

      // 1. Revert Cards -> IN_STATION at Source Station
      // movement.stationId is the Source Station
      if (!movement.stationId) {
        throw new AppError("Transfer source station is missing", 500);
      }

      await tx.card.updateMany({
        where: {
          serialNumber: { in: movement.sentSerialNumbers },
        },
        data: {
          status: CardStatus.IN_STATION,
          stationId: movement.stationId, // Revert to source
          // previousStationId: Keep history or revert?
          // Decision: Keep history (previousStationId) as is, or maybe set to null?
          // Logic: If it was never transferred, maybe revert previousStationId?
          // But previousStationId tracks where it came from BEFORE this transfer potentially.
          // Better to leave previousStationId alone, it tracks the station BEFORE the current stationId.
          // Since we are reverting stationId to source, previousStationId should functionally reflect where it was before source.
          // Current logic: Create Transfer sets previousStationId = source.
          // Revert: We want card to be back at source.
          // Check createTransfer logic:
          // stationId: toStationId
          // previousStationId: stationId (source)
          // So if we revert, stationId = source.
          // What about previousStationId? If we don't change it, it says "Previous: Source".
          // If Card is at Source, Previous: Source is weird but harmless.
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // 2. Soft Delete Movement
      const deletedMovement = await tx.cardStockMovement.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
        },
      });

      // 3. Log Activity
      const deletedMovementWithCategory = await tx.cardStockMovement.findUnique(
        {
          where: { id },
          include: { category: true },
        },
      );
      const programLabel =
        deletedMovementWithCategory?.category.programType || "FWC";

      await ActivityLogService.createActivityLog(
        userId,
        `DELETE_TRANSFER_${programLabel}`,
        `Deleted (Cancelled) transfer ${id}. Cards reverted to ${movement.stationId}.`,
      );

      return deletedMovement;
    });
  }
}
