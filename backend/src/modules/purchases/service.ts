import db from "../../config/db";
import { ValidationError, NotFoundError } from "../../utils/errors";
import { PurchaseModel } from "./model";
import { EmailService } from "../../services/emailService";

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
   * Supports both FWC (single card) and VOUCHER (bulk purchase)
   */
  static async createPurchase(
    data: typeof PurchaseModel.createPurchaseBody.static,
    operatorId: string,
    stationId: string,
    userId: string,
  ) {
    // Determine purchase type: FWC (single card) or VOUCHER (bulk)
    const programType = data.programType || "FWC";
    const isBulkPurchase = programType === "VOUCHER" && data.cards && data.cards.length > 0;

    // Validate: FWC must have cardId, VOUCHER bulk must have cards array
    if (!isBulkPurchase && !data.cardId) {
      throw new ValidationError(
        "cardId wajib diisi untuk pembelian FWC. Atau gunakan cards[] untuk pembelian voucher bulk.",
      );
    }

    if (isBulkPurchase && data.cardId) {
      throw new ValidationError(
        "cardId harus null untuk pembelian voucher bulk. Gunakan cards[] array.",
      );
    }

    if (isBulkPurchase && (!data.cards || data.cards.length === 0)) {
      throw new ValidationError(
        "cards[] array wajib diisi dengan minimal 1 card untuk pembelian voucher bulk.",
      );
    }

    // Use database transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // 1. Validate member (required)
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

      // 2. Validate operator exists
      const operator = await tx.user.findUnique({
        where: { id: operatorId },
      });

      if (!operator || operator.deletedAt) {
        throw new NotFoundError("Operator tidak ditemukan");
      }

      // 3. Validate station exists
      const station = await tx.station.findUnique({
        where: { id: stationId },
      });

      if (!station || station.deletedAt) {
        throw new NotFoundError("Stasiun tidak ditemukan");
      }

      // 4. Validate EDC reference number (ensure uniqueness)
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

      // 5. Calculate purchase date
      const purchaseDate = new Date();
      purchaseDate.setHours(0, 0, 0, 0); // Set to start of day

      let finalPrice: number;
      let purchaseCardId: string | null = null;

      if (isBulkPurchase) {
        // === BULK PURCHASE (VOUCHER) ===
        const cards = data.cards!;
        const cardIds = cards.map((c) => c.cardId);

        // Check for duplicate card IDs
        const uniqueCardIds = new Set(cardIds);
        if (uniqueCardIds.size !== cardIds.length) {
          throw new ValidationError(
            "Terdapat duplikasi card ID dalam array cards. Setiap card hanya boleh dibeli sekali.",
          );
        }

        // Validate all cards exist and are available
        const cardRecords = await tx.card.findMany({
          where: {
            id: { in: cardIds },
            deletedAt: null,
          },
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

        if (cardRecords.length !== cardIds.length) {
          const foundIds = cardRecords.map((c) => c.id);
          const missingIds = cardIds.filter((id) => !foundIds.includes(id));
          throw new NotFoundError(
            `Kartu tidak ditemukan: ${missingIds.join(", ")}`,
          );
        }

        // Validate all cards are IN_STATION
        const invalidStatusCards = cardRecords.filter(
          (c) => c.status !== "IN_STATION",
        );
        if (invalidStatusCards.length > 0) {
          throw new ValidationError(
            `Kartu tidak dapat dibeli. Status kartu saat ini: ${invalidStatusCards.map((c) => `${c.serialNumber} (${c.status})`).join(", ")}. Semua kartu harus berstatus IN_STATION untuk dapat dibeli.`,
          );
        }

        // Check if any card already has a purchase record
        const existingPurchases = await tx.cardPurchase.findMany({
          where: {
            cardId: { in: cardIds },
            deletedAt: null,
          },
        });

        if (existingPurchases.length > 0) {
          const purchasedCardIds = existingPurchases.map((p) => p.cardId);
          throw new ValidationError(
            `Kartu berikut sudah pernah dibeli: ${purchasedCardIds.join(", ")}. Setiap kartu hanya dapat dibeli sekali.`,
          );
        }

        // Calculate total price for each card
        let totalPrice = 0;
        const bulkPurchaseItemsData: Array<{
          cardId: string;
          price: number;
        }> = [];

        for (const cardInput of cards) {
          const cardRecord = cardRecords.find((c) => c.id === cardInput.cardId);
          if (!cardRecord) continue;

          // Use provided price or default to cardProduct.price
          const itemPrice =
            cardInput.price !== undefined && cardInput.price !== null
              ? cardInput.price
              : Number(cardRecord.cardProduct.price);

          bulkPurchaseItemsData.push({
            cardId: cardRecord.id,
            price: itemPrice,
          });

          totalPrice += itemPrice;
        }

        // Apply bulk discount if provided
        let discountAmount = 0;
        if (data.bulkDiscountId) {
          const bulkDiscount = await tx.bulkDiscount.findUnique({
            where: { id: data.bulkDiscountId },
          });

          if (bulkDiscount && bulkDiscount.discount) {
            // Validate quantity matches discount range
            const quantity = cards.length;
            if (
              (bulkDiscount.minQuantity === null ||
                quantity >= bulkDiscount.minQuantity) &&
              (bulkDiscount.maxQuantity === null ||
                quantity <= bulkDiscount.maxQuantity)
            ) {
              // Discount is stored as percentage (e.g., 10 means 10%)
              const discountPercentage = Number(bulkDiscount.discount);
              discountAmount = (totalPrice * discountPercentage) / 100;
              totalPrice = totalPrice - discountAmount;
              if (totalPrice < 0) totalPrice = 0;
            }
          }
        }

        // Use provided total price or calculated total price
        finalPrice =
          data.price !== undefined && data.price !== null
            ? data.price
            : totalPrice;

        // Create purchase record (cardId is null for bulk purchase)
        const purchase = await tx.cardPurchase.create({
          data: {
            cardId: undefined, // Null for bulk purchase
            memberId: data.memberId,
            operatorId: operatorId,
            stationId: stationId,
            bulkDiscountId: data.bulkDiscountId || null,
            edcReferenceNumber: edcReferenceNumber,
            purchaseDate: purchaseDate,
            price: finalPrice,
            notes: data.notes || null,
            programType: "VOUCHER",
            createdBy: userId,
            updatedBy: userId,
          },
        });

        // Create bulk purchase items
        for (const itemData of bulkPurchaseItemsData) {
          const cardRecord = cardRecords.find((c) => c.id === itemData.cardId);
          if (!cardRecord) continue;

          const masaBerlaku = cardRecord.cardProduct.masaBerlaku;
          const expiredDate = new Date(purchaseDate);
          expiredDate.setDate(expiredDate.getDate() + masaBerlaku);

          // Create bulk purchase item
          await tx.bulkPurchaseItem.create({
            data: {
              purchaseId: purchase.id,
              cardId: itemData.cardId,
              price: itemData.price,
            },
          });

          // Update card: set status to SOLD_ACTIVE
          await tx.card.update({
            where: { id: itemData.cardId },
            data: {
              status: "SOLD_ACTIVE",
              purchaseDate: purchaseDate,
              memberId: data.memberId,
              expiredDate: expiredDate,
              quotaTicket: cardRecord.cardProduct.totalQuota, // Initialize quota from product
              updatedBy: userId,
            },
          });
        }

        return purchase;
      } else {
        // === SINGLE CARD PURCHASE (FWC) ===
        if (!data.cardId) {
          throw new ValidationError("cardId wajib diisi untuk pembelian FWC");
        }

        // Validate card exists and is available for purchase
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

        // Validate card status - must be IN_STATION to be purchased
        if (card.status !== "IN_STATION") {
          throw new ValidationError(
            `Kartu tidak dapat dibeli. Status kartu saat ini: ${card.status}. Kartu harus berstatus IN_STATION untuk dapat dibeli.`,
          );
        }

        // Check if card already has a purchase record
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

        // Calculate expired date based on masaBerlaku
        const masaBerlaku = card.cardProduct.masaBerlaku;
        const expiredDate = new Date(purchaseDate);
        expiredDate.setDate(expiredDate.getDate() + masaBerlaku);

        // Determine final price: use input price or default to cardProduct.price
        finalPrice =
          data.price !== undefined && data.price !== null
            ? data.price
            : Number(card.cardProduct.price);

        purchaseCardId = data.cardId;

        // Create purchase record
        const purchase = await tx.cardPurchase.create({
          data: {
            cardId: purchaseCardId,
            memberId: data.memberId,
            operatorId: operatorId,
            stationId: stationId,
            edcReferenceNumber: edcReferenceNumber,
            purchaseDate: purchaseDate,
            price: finalPrice,
            notes: data.notes || null,
            programType: programType,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        // Update card: set status to SOLD_ACTIVE
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

        return purchase;
      }
    });

    // Fetch complete purchase data with relations
    const purchaseData = await this.getById(result.id);

    // Send email notification (non-blocking)
    try {
      await this.sendPurchaseConfirmationEmail(purchaseData);
    } catch (emailError) {
      // Log error but don't fail transaction
      console.error(
        "⚠️ Failed to send purchase confirmation email:",
        emailError,
      );
    }

    return purchaseData;
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
        orderBy: { createdAt: "desc" },
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
          bulkPurchaseItems: {
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
            },
            orderBy: { createdAt: "asc" },
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
      programType: item.programType,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      createdByName: item.createdBy
        ? userMap.get(item.createdBy) || null
        : null,
      updatedByName: item.updatedBy
        ? userMap.get(item.updatedBy) || null
        : null,
      card: item.card
        ? {
            ...item.card,
            expiredDate: item.card.expiredDate
              ? item.card.expiredDate.toISOString()
              : null,
            cardProduct: {
              ...item.card.cardProduct,
              totalQuota: item.card.cardProduct.totalQuota,
              masaBerlaku: item.card.cardProduct.masaBerlaku,
            },
          }
        : null,
      bulkPurchaseItems: item.bulkPurchaseItems.map((bulkItem: any) => ({
        id: bulkItem.id,
        purchaseId: bulkItem.purchaseId,
        cardId: bulkItem.cardId,
        price: Number(bulkItem.price),
        createdAt: bulkItem.createdAt.toISOString(),
        updatedAt: bulkItem.updatedAt.toISOString(),
        card: {
          ...bulkItem.card,
          expiredDate: bulkItem.card.expiredDate
            ? bulkItem.card.expiredDate.toISOString()
            : null,
          cardProduct: {
            ...bulkItem.card.cardProduct,
            totalQuota: bulkItem.card.cardProduct.totalQuota,
            masaBerlaku: bulkItem.card.cardProduct.masaBerlaku,
          },
        },
      })),
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
        bulkPurchaseItems: {
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
          },
          orderBy: { createdAt: "asc" },
        },
        member: {
          select: {
            id: true,
            name: true,
            identityNumber: true,
            email: true,
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
      programType: purchase.programType,
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString(),
      createdByName: creator?.fullName || null,
      updatedByName: updater?.fullName || null,
      card: purchase.card
        ? {
            ...purchase.card,
            expiredDate: purchase.card.expiredDate
              ? purchase.card.expiredDate.toISOString()
              : null,
            cardProduct: {
              ...purchase.card.cardProduct,
              totalQuota: purchase.card.cardProduct.totalQuota,
              masaBerlaku: purchase.card.cardProduct.masaBerlaku,
            },
          }
        : null,
      bulkPurchaseItems: purchase.bulkPurchaseItems.map((bulkItem: any) => ({
        id: bulkItem.id,
        purchaseId: bulkItem.purchaseId,
        cardId: bulkItem.cardId,
        price: Number(bulkItem.price),
        createdAt: bulkItem.createdAt.toISOString(),
        updatedAt: bulkItem.updatedAt.toISOString(),
        card: {
          ...bulkItem.card,
          expiredDate: bulkItem.card.expiredDate
            ? bulkItem.card.expiredDate.toISOString()
            : null,
          cardProduct: {
            ...bulkItem.card.cardProduct,
            totalQuota: bulkItem.card.cardProduct.totalQuota,
            masaBerlaku: bulkItem.card.cardProduct.masaBerlaku,
          },
        },
      })),
      member: purchase.member,
      operator: purchase.operator,
      station: purchase.station,
    };
  }

  // Update Purchase
  static async updatePurchase(
    id: string,
    data: {
      memberId?: string;
      operatorId?: string;
      stationId?: string;
      edcReferenceNumber?: string;
      price?: number;
      notes?: string;
      shiftDate?: string;
    },
    userId: string,
  ) {
    return await db.$transaction(async (tx) => {
      // 1. Check if purchase exists
      const purchase = await tx.cardPurchase.findUnique({
        where: { id, deletedAt: null },
        include: {
          card: true,
          bulkPurchaseItems: {
            include: {
              card: true,
            },
          },
        },
      });

      if (!purchase) {
        throw new NotFoundError("Transaksi pembelian tidak ditemukan");
      }

      // 2. Validate member if provided
      if (data.memberId) {
        const member = await tx.member.findUnique({
          where: { id: data.memberId, deletedAt: null },
        });
        if (!member) {
          throw new ValidationError("Member tidak ditemukan");
        }
      }

      // 3. Validate operator if provided
      if (data.operatorId) {
        const operator = await tx.user.findUnique({
          where: { id: data.operatorId, deletedAt: null },
        });
        if (!operator) {
          throw new ValidationError("Operator tidak ditemukan");
        }
      }

      // 4. Validate station if provided
      if (data.stationId) {
        const station = await tx.station.findUnique({
          where: { id: data.stationId, deletedAt: null },
        });
        if (!station) {
          throw new ValidationError("Stasiun tidak ditemukan");
        }
      }

      // 5. Check EDC reference uniqueness if provided
      if (
        data.edcReferenceNumber &&
        data.edcReferenceNumber !== purchase.edcReferenceNumber
      ) {
        const existingEdc = await tx.cardPurchase.findFirst({
          where: {
            edcReferenceNumber: data.edcReferenceNumber,
            deletedAt: null,
          },
        });
        if (existingEdc) {
          throw new ValidationError(
            "EDC Reference Number sudah digunakan untuk transaksi lain",
          );
        }
      }

      // 6. Prepare update data
      const updateData: any = {
        updatedBy: userId,
      };

      if (data.memberId !== undefined) updateData.memberId = data.memberId;
      if (data.operatorId !== undefined)
        updateData.operatorId = data.operatorId;
      if (data.stationId !== undefined) updateData.stationId = data.stationId;
      if (data.edcReferenceNumber !== undefined)
        updateData.edcReferenceNumber = data.edcReferenceNumber;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.shiftDate !== undefined)
        updateData.shiftDate = new Date(data.shiftDate);

      // 7. Update purchase
      const updatedPurchase = await tx.cardPurchase.update({
        where: { id },
        data: updateData,
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
          bulkPurchaseItems: {
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
            orderBy: { createdAt: "asc" },
          },
          member: true,
          operator: true,
          station: true,
        },
      });

      // 8. Fetch creator and updater names
      const [creator, updater] = await Promise.all([
        updatedPurchase.createdBy
          ? tx.user.findUnique({
              where: { id: updatedPurchase.createdBy },
              select: { fullName: true },
            })
          : null,
        tx.user.findUnique({
          where: { id: userId },
          select: { fullName: true },
        }),
      ]);

      // 9. Return formatted response
      return {
        id: updatedPurchase.id,
        cardId: updatedPurchase.cardId,
        memberId: updatedPurchase.memberId,
        operatorId: updatedPurchase.operatorId,
        stationId: updatedPurchase.stationId,
        edcReferenceNumber: updatedPurchase.edcReferenceNumber,
        purchaseDate: updatedPurchase.purchaseDate.toISOString(),
        price: Number(updatedPurchase.price),
        notes: updatedPurchase.notes,
        programType: updatedPurchase.programType,
        createdAt: updatedPurchase.createdAt.toISOString(),
        updatedAt: updatedPurchase.updatedAt.toISOString(),
        createdByName: creator?.fullName || null,
        updatedByName: updater?.fullName || null,
        card: updatedPurchase.card
          ? {
              ...updatedPurchase.card,
              expiredDate: updatedPurchase.card.expiredDate
                ? updatedPurchase.card.expiredDate.toISOString()
                : null,
              cardProduct: {
                ...updatedPurchase.card.cardProduct,
                totalQuota: updatedPurchase.card.cardProduct.totalQuota,
                masaBerlaku: updatedPurchase.card.cardProduct.masaBerlaku,
              },
            }
          : null,
        bulkPurchaseItems: updatedPurchase.bulkPurchaseItems.map((bulkItem: any) => ({
          id: bulkItem.id,
          purchaseId: bulkItem.purchaseId,
          cardId: bulkItem.cardId,
          price: Number(bulkItem.price),
          createdAt: bulkItem.createdAt.toISOString(),
          updatedAt: bulkItem.updatedAt.toISOString(),
          card: {
            ...bulkItem.card,
            expiredDate: bulkItem.card.expiredDate
              ? bulkItem.card.expiredDate.toISOString()
              : null,
            cardProduct: {
              ...bulkItem.card.cardProduct,
              totalQuota: bulkItem.card.cardProduct.totalQuota,
              masaBerlaku: bulkItem.card.cardProduct.masaBerlaku,
            },
          },
        })),
        member: updatedPurchase.member,
        operator: updatedPurchase.operator,
        station: updatedPurchase.station,
      };
    });
  }

  // Correct Card Mismatch
  static async correctCardMismatch(
    id: string,
    data: {
      wrongCardId: string;
      correctCardId: string;
      notes?: string;
    },
    userId: string,
  ) {
    return await db.$transaction(async (tx) => {
      // 1. Get purchase
      const purchase = await tx.cardPurchase.findUnique({
        where: { id, deletedAt: null },
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
          operator: true,
          station: true,
        },
      });

      if (!purchase) {
        throw new NotFoundError("Transaksi pembelian tidak ditemukan");
      }

      const oldCardId = purchase.cardId;

      // 2. Validate wrong card
      const wrongCard = await tx.card.findUnique({
        where: { id: data.wrongCardId, deletedAt: null },
      });

      if (!wrongCard) {
        throw new ValidationError("Wrong card tidak ditemukan");
      }

      if (wrongCard.status !== "IN_STATION") {
        throw new ValidationError(
          `Wrong card harus berstatus IN_STATION, saat ini: ${wrongCard.status}`,
        );
      }

      // 3. Validate correct card
      const correctCard = await tx.card.findUnique({
        where: { id: data.correctCardId, deletedAt: null },
        include: {
          cardProduct: {
            include: {
              category: true,
              type: true,
            },
          },
        },
      });

      if (!correctCard) {
        throw new ValidationError("Correct card tidak ditemukan");
      }

      if (correctCard.status !== "IN_STATION") {
        throw new ValidationError(
          `Correct card harus berstatus IN_STATION, saat ini: ${correctCard.status}`,
        );
      }

      // 4. Calculate expiredDate for correct card
      const masaBerlaku = correctCard.cardProduct.masaBerlaku;
      const expiredDate = new Date(purchase.purchaseDate);
      expiredDate.setDate(expiredDate.getDate() + masaBerlaku);

      // 5. Update old card (yang tercatat di transaksi) - return to IN_STATION
      await tx.card.update({
        where: { id: oldCardId },
        data: {
          status: "IN_STATION",
          purchaseDate: null,
          expiredDate: null,
          updatedBy: userId,
        },
      });

      // 6. Update wrong card - set to DELETED status
      await tx.card.update({
        where: { id: data.wrongCardId },
        data: {
          status: "DELETED",
          updatedBy: userId,
        },
      });

      // 7. Update correct card - set to SOLD_ACTIVE
      await tx.card.update({
        where: { id: data.correctCardId },
        data: {
          status: "SOLD_ACTIVE",
          purchaseDate: purchase.purchaseDate,
          expiredDate: expiredDate,
          updatedBy: userId,
        },
      });

      // 8. Update purchase - change cardId to correct card
      const correctionNote = `Card corrected: ${oldCardId} → ${data.correctCardId}, wrong card: ${data.wrongCardId}. ${data.notes || ""}`;

      const updatedPurchase = await tx.cardPurchase.update({
        where: { id },
        data: {
          cardId: data.correctCardId,
          notes: correctionNote,
          updatedBy: userId,
        },
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
          operator: true,
          station: true,
        },
      });

      // 9. Fetch updater name
      const updater = await tx.user.findUnique({
        where: { id: userId },
        select: { fullName: true },
      });

      const creator = updatedPurchase.createdBy
        ? await tx.user.findUnique({
            where: { id: updatedPurchase.createdBy },
            select: { fullName: true },
          })
        : null;

      // 10. Return formatted response
      return {
        id: updatedPurchase.id,
        cardId: updatedPurchase.cardId,
        memberId: updatedPurchase.memberId,
        operatorId: updatedPurchase.operatorId,
        stationId: updatedPurchase.stationId,
        edcReferenceNumber: updatedPurchase.edcReferenceNumber,
        purchaseDate: updatedPurchase.purchaseDate.toISOString(),
        price: Number(updatedPurchase.price),
        notes: updatedPurchase.notes,
        createdAt: updatedPurchase.createdAt.toISOString(),
        updatedAt: updatedPurchase.updatedAt.toISOString(),
        createdByName: creator?.fullName || null,
        updatedByName: updater?.fullName || null,
        card: {
          ...updatedPurchase.card,
          expiredDate: updatedPurchase.card.expiredDate
            ? updatedPurchase.card.expiredDate.toISOString()
            : null,
          cardProduct: {
            ...updatedPurchase.card.cardProduct,
            totalQuota: updatedPurchase.card.cardProduct.totalQuota,
            masaBerlaku: updatedPurchase.card.cardProduct.masaBerlaku,
          },
        },
        member: updatedPurchase.member,
        operator: updatedPurchase.operator,
        station: updatedPurchase.station,
      };
    });
  }

  /**
   * Soft delete purchase transaction
   * Supports both FWC (single card) and VOUCHER (bulk purchase)
   */
  static async deletePurchase(id: string, userId: string) {
    return await db.$transaction(async (tx) => {
      // 1. Validate purchase exists and not already deleted
      const purchase = await tx.cardPurchase.findUnique({
        where: { id },
        include: {
          card: true,
          bulkPurchaseItems: {
            include: {
              card: true,
            },
          },
        },
      });

      if (!purchase || purchase.deletedAt) {
        throw new NotFoundError("Transaksi tidak ditemukan");
      }

      // 2. Soft delete purchase
      const deletedPurchase = await tx.cardPurchase.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
        },
      });

      // 3. Update card(s) status back to IN_STATION
      if (purchase.cardId) {
        // FWC: Single card purchase
        await tx.card.update({
          where: { id: purchase.cardId },
          data: {
            status: "IN_STATION",
            purchaseDate: null,
            expiredDate: null,
            memberId: null,
            updatedBy: userId,
          },
        });
      } else if (purchase.bulkPurchaseItems && purchase.bulkPurchaseItems.length > 0) {
        // VOUCHER: Bulk purchase - update all cards
        const cardIds = purchase.bulkPurchaseItems.map((item: any) => item.cardId);
        
        await tx.card.updateMany({
          where: {
            id: { in: cardIds },
          },
          data: {
            status: "IN_STATION",
            purchaseDate: null,
            expiredDate: null,
            memberId: null,
            updatedBy: userId,
          },
        });
      }

      return {
        success: true,
        message: "Transaksi berhasil dihapus",
        id: deletedPurchase.id,
      };
    });
  }

  /**
   * Send purchase confirmation email to member
   */
  private static async sendPurchaseConfirmationEmail(
    purchaseData: any,
  ): Promise<void> {
    // Check if member has email
    if (!purchaseData.member?.email) {
      console.log("⏭️  Member has no email, skipping notification");
      return;
    }

    // Prepare email data
    const productType = `${purchaseData.card.cardProduct.category.categoryName} - ${purchaseData.card.cardProduct.type.typeName}`;
    const purchaseDate = new Date(purchaseData.purchaseDate).toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    );

    const expiredDate = purchaseData.card.expiredDate
      ? new Date(purchaseData.card.expiredDate).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "N/A";

    await EmailService.sendPurchaseConfirmation({
      memberEmail: purchaseData.member.email,
      memberName: purchaseData.member.name,
      nik: purchaseData.member.identityNumber,
      cardCategory: purchaseData.card.cardProduct.category.categoryName,
      cardType: purchaseData.card.cardProduct.type.typeName,
      serialNumber: purchaseData.card.serialNumber,
      masaBerlaku: expiredDate,
      kuota: purchaseData.card.quotaTicket,
      serialEdc: purchaseData.edcReferenceNumber,
      stasiunPembelian: purchaseData.station.stationName,
      harga: Number(purchaseData.price),
      purchaseDate: purchaseDate,
      productType: productType,
    });
  }
}
