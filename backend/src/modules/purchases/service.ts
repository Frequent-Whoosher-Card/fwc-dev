import db from "../../config/db";
import { ValidationError, NotFoundError } from "../../utils/errors";
import { PurchaseModel } from "./model";

export class PurchaseService {
  /**
   * Generate transaction number for purchase
   * Format: PUR-YYYYMMDD-XXX
   */
  private static generateTransactionNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    return `PUR-${dateStr}-${Date.now().toString().slice(-6)}`;
  }

  /**
   * Create new purchase transaction
   */
  static async createPurchase(
    data: typeof PurchaseModel.createPurchaseBody.static,
    operatorId: string,
    stationId: string,
    userId: string,
  ) {
    // Use database transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // 1. Validate card exists and is available for purchase
      const card = await tx.card.findUnique({
        where: { id: data.cardId },
        include: {
          cardProduct: {
            select: {
              id: true,
              totalQuota: true,
              masaBerlaku: true,
              price: true,
              categoryId: true,
              typeId: true,
            },
          },
        },
      });

      if (!card || card.deletedAt) {
        throw new NotFoundError("Kartu tidak ditemukan");
      }

      // 2. Validate card status - must be IN_STATION to be purchased
      if (card.status !== "IN_STATION") {
        throw new ValidationError(
          `Kartu tidak dapat dibeli. Status kartu saat ini: ${card.status}. Kartu harus berstatus IN_STATION untuk dapat dibeli.`,
        );
      }

      // 3. Check if card already has a purchase record
      const existingPurchase = await tx.cardPurchase.findFirst({
        where: {
          cardId: data.cardId,
          deletedAt: null,
        },
      });

      if (existingPurchase) {
        throw new ValidationError(
          "Kartu ini sudah pernah dibeli. Setiap kartu hanya dapat dibeli sekali.",
        );
      }

      // 4. Validate member (required)
      if (!data.memberId) {
        throw new ValidationError(
          "Member ID wajib diisi. Setiap transaksi harus memiliki member.",
        );
      }

      const member = await tx.member.findUnique({
        where: { id: data.memberId },
      });

      if (!member || member.deletedAt) {
        throw new NotFoundError("Member tidak ditemukan");
      }

      // 5. Validate operator exists
      const operator = await tx.user.findUnique({
        where: { id: operatorId },
      });

      if (!operator || operator.deletedAt) {
        throw new NotFoundError("Operator tidak ditemukan");
      }

      // 6. Validate station exists
      const station = await tx.station.findUnique({
        where: { id: stationId },
      });

      if (!station || station.deletedAt) {
        throw new NotFoundError("Stasiun tidak ditemukan");
      }

      // 7. Validate EDC reference number (ensure uniqueness)
      const edcReferenceNumber = data.edcReferenceNumber.trim();

      if (!edcReferenceNumber) {
        throw new ValidationError("No. Reference EDC tidak boleh kosong");
      }

      // Check if EDC reference number already exists
      const existingEdcRef = await tx.cardPurchase.findUnique({
        where: { edcReferenceNumber },
      });

      if (existingEdcRef) {
        throw new ValidationError(
          `No. Reference EDC '${edcReferenceNumber}' sudah digunakan. Silakan gunakan nomor lain.`,
        );
      }

      // 8. Calculate expired date based on masaBerlaku
      const purchaseDate = new Date();
      purchaseDate.setHours(0, 0, 0, 0); // Set to start of day

      const masaBerlaku = card.cardProduct.masaBerlaku;
      const expiredDate = new Date(purchaseDate);
      expiredDate.setDate(expiredDate.getDate() + masaBerlaku);

      // 8.5. Determine final price: use input price or default to cardProduct.price
      const finalPrice =
        data.price !== undefined && data.price !== null
          ? data.price
          : Number(card.cardProduct.price);

      // 9. Create purchase record
      const purchase = await tx.cardPurchase.create({
        data: {
          cardId: data.cardId,
          memberId: data.memberId,
          operatorId: operatorId,
          stationId: stationId,
          edcReferenceNumber: edcReferenceNumber,
          purchaseDate: purchaseDate,
          price: finalPrice,
          notes: data.notes || null,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 10. Update card: set status to SOLD_ACTIVE
      await tx.card.update({
        where: { id: data.cardId },
        data: {
          status: "SOLD_ACTIVE",
          purchaseDate: purchaseDate,
          memberId: data.memberId,
          expiredDate: expiredDate,
          quotaTicket: card.cardProduct.totalQuota, // Initialize quota from product
          updatedBy: userId,
        },
      });

      // 11. Update inventory: REMOVED (Deprecated)
      /*
      const inventory = await tx.cardInventory.findFirst(...)
      if (inventory) { ... }
      */

      return purchase;
    });

    // Fetch complete purchase data with relations
    return await this.getById(result.id);
  }

  /**
   * Get All Purchases (Paginated)
   */
  static async getAll(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    stationId?: string;
    categoryId?: string;
    typeId?: string;
    operatorId?: string;
    search?: string;
    userRole?: string;
    userId?: string;
    userStationId?: string | null;
  }) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      stationId,
      categoryId,
      typeId,
      operatorId,
      search,
      userRole,
      userId,
      userStationId,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Soft delete filter
    };

    // Role-based automatic filtering
    if (userRole === "petugas" && userId) {
      // Petugas: hanya transaksi hari ini yang di-handle oleh petugas tersebut
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      where.operatorId = userId; // Hanya transaksi yang dibuat oleh petugas ini
      where.purchaseDate = {
        gte: today,
        lte: todayEnd,
      };
    } else if (userRole === "supervisor" && userStationId) {
      // Supervisor: semua transaksi di stasiun tempat supervisor bertugas
      where.stationId = userStationId;
      // Tidak ada filter tanggal - semua data di stasiun tersebut
    }
    // admin dan superadmin: tidak ada filter otomatis, bisa filter manual via query params

    // Date range filter (only apply if not already set by role-based filter)
    if (!where.purchaseDate && (startDate || endDate)) {
      where.purchaseDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.purchaseDate.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.purchaseDate.lte = end;
      }
    }

    // Station filter (only apply if not already set by role-based filter)
    if (!where.stationId && stationId) {
      where.stationId = stationId;
    }

    // Card Category and Type filter (nested in card.cardProduct)
    if (categoryId || typeId) {
      where.card = {
        cardProduct: {},
      };
      if (categoryId) {
        where.card.cardProduct.categoryId = categoryId;
      }
      if (typeId) {
        where.card.cardProduct.typeId = typeId;
      }
    }

    // Operator filter (only apply if not already set by role-based filter)
    if (!where.operatorId && operatorId) {
      where.operatorId = operatorId;
    }

    // Search filter
    if (search) {
      where.OR = [
        { edcReferenceNumber: { contains: search, mode: "insensitive" } },
        {
          card: {
            serialNumber: { contains: search, mode: "insensitive" },
          },
        },
        {
          member: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          member: {
            identityNumber: { contains: search, mode: "insensitive" },
          },
        },
        {
          operator: {
            fullName: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      db.cardPurchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchaseDate: "desc" },
        include: {
          card: {
            select: {
              id: true,
              serialNumber: true,
              status: true,
              expiredDate: true,
              quotaTicket: true,
              cardProduct: {
                select: {
                  id: true,
                  totalQuota: true,
                  masaBerlaku: true,
                  category: {
                    select: {
                      id: true,
                      categoryCode: true,
                      categoryName: true,
                    },
                  },
                  type: {
                    select: {
                      id: true,
                      typeCode: true,
                      typeName: true,
                    },
                  },
                },
              },
            },
          },
          member: {
            select: {
              id: true,
              name: true,
              identityNumber: true,
            },
          },
          operator: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          station: {
            select: {
              id: true,
              stationCode: true,
              stationName: true,
            },
          },
        },
      }),
      db.cardPurchase.count({ where }),
    ]);

    // Fetch user names for createdBy/updatedBy
    const userIds = new Set<string>();
    items.forEach((i) => {
      if (i.createdBy) userIds.add(i.createdBy);
      if (i.updatedBy) userIds.add(i.updatedBy);
    });

    const users = await db.user.findMany({
      where: { id: { in: [...userIds] } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const mappedItems = items.map((item: any) => ({
      id: item.id,
      cardId: item.cardId,
      memberId: item.memberId,
      operatorId: item.operatorId,
      stationId: item.stationId,
      edcReferenceNumber: item.edcReferenceNumber,
      purchaseDate: item.purchaseDate.toISOString(),
      price: Number(item.price),
      notes: item.notes,
      activationStatus: item.activationStatus,
      activatedAt: item.activatedAt ? item.activatedAt.toISOString() : null,
      activatedBy: item.activatedBy,
      physicalCardSerialNumber: item.physicalCardSerialNumber,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      createdByName: item.createdBy
        ? userMap.get(item.createdBy) || null
        : null,
      updatedByName: item.updatedBy
        ? userMap.get(item.updatedBy) || null
        : null,
      card: {
        ...item.card,
        expiredDate: item.card.expiredDate
          ? item.card.expiredDate.toISOString()
          : null,
        cardProduct: {
          ...item.card.cardProduct,
          totalQuota: item.card.cardProduct.totalQuota,
          masaBerlaku: item.card.cardProduct.masaBerlaku,
        },
      },
      member: item.member,
      operator: item.operator,
      station: item.station,
    }));

    return {
      items: mappedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Detail Purchase
   */
  static async getById(id: string) {
    const purchase = await db.cardPurchase.findUnique({
      where: { id },
      include: {
        card: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
            expiredDate: true,
            quotaTicket: true,
            cardProduct: {
              select: {
                id: true,
                totalQuota: true,
                masaBerlaku: true,
                category: {
                  select: {
                    id: true,
                    categoryCode: true,
                    categoryName: true,
                  },
                },
                type: {
                  select: {
                    id: true,
                    typeCode: true,
                    typeName: true,
                  },
                },
              },
            },
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            identityNumber: true,
          },
        },
        operator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        station: {
          select: {
            id: true,
            stationCode: true,
            stationName: true,
          },
        },
      },
    });

    if (!purchase || purchase.deletedAt) {
      throw new NotFoundError("Transaksi pembelian tidak ditemukan");
    }

    const [creator, updater] = await Promise.all([
      purchase.createdBy
        ? db.user.findUnique({
            where: { id: purchase.createdBy },
            select: { fullName: true },
          })
        : null,
      purchase.updatedBy
        ? db.user.findUnique({
            where: { id: purchase.updatedBy },
            select: { fullName: true },
          })
        : null,
    ]);

    return {
      id: purchase.id,
      cardId: purchase.cardId,
      memberId: purchase.memberId,
      operatorId: purchase.operatorId,
      stationId: purchase.stationId,
      edcReferenceNumber: purchase.edcReferenceNumber,
      purchaseDate: purchase.purchaseDate.toISOString(),
      price: Number(purchase.price),
      notes: purchase.notes,
      activationStatus: purchase.activation_status,
      activatedAt: purchase.activated_at
        ? purchase.activated_at.toISOString()
        : null,
      activatedBy: purchase.activated_by,
      physicalCardSerialNumber: purchase.physical_card_serial_number,
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString(),
      createdByName: creator?.fullName || null,
      updatedByName: updater?.fullName || null,
      card: {
        ...purchase.card,
        expiredDate: purchase.card.expiredDate
          ? purchase.card.expiredDate.toISOString()
          : null,
        cardProduct: {
          ...purchase.card.cardProduct,
          totalQuota: purchase.card.cardProduct.totalQuota,
          masaBerlaku: purchase.card.cardProduct.masaBerlaku,
        },
      },
      member: purchase.member,
      operator: purchase.operator,
      station: purchase.station,
    };
  }
}
