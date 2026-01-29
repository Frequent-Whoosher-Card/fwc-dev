import db from "../../config/db";
import { ValidationError } from "../../utils/errors";
import { ActivityLogService } from "../activity-log/service";

export class InboxService {
  /**
   * Get User Inbox
   */
  static async getUserInbox(userId: string, params: any) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, search, programType } = params;

    // --- 1. SYNC LOGIC (Backfill) ---
    // Check if there are any PENDING stock distributions for this user (Supervisor)
    // that are NOT in the inbox yet.
    // This handles legacy data or missed events.

    // Only run this check for page 1 to save perf
    if (page === 1) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: { select: { roleCode: true } },
          stationId: true,
        },
      });

      if (user?.role?.roleCode === "supervisor" && user.stationId) {
        // Find PENDING MOVEMENT OUT to this station
        const pendingMovements = await db.cardStockMovement.findMany({
          where: {
            movementType: "OUT",
            status: "PENDING",
            stationId: user.stationId,
          },
          include: {
            category: true,
            type: true,
          },
        });

        for (const m of pendingMovements) {
          // Check if inbox exists
          const exists = await db.inbox.findFirst({
            where: {
              sentTo: userId,
              type: "STOCK_DISTRIBUTION",
              payload: {
                path: ["movementId"],
                equals: m.id,
              },
            },
          });

          if (!exists) {
            // Create Inbox Item
            const productName = `${m.category.categoryName} - ${m.type.typeName}`;
            const senderId = m.createdBy;

            // Format dynamic message based on program type
            const title =
              m.category.programType === "VOUCHER"
                ? `Kiriman Voucher: ${productName}`
                : `Kiriman Stock: ${productName}`;

            const message =
              m.category.programType === "VOUCHER"
                ? `Office mengirim ${m.quantity} voucher ${productName} ke stasiun (Synced).`
                : `Office mengirimkan ${m.quantity} kartu ${productName} ke stasiun (Synced). Mohon cek fisik & validasi penerimaan.`;

            await db.inbox.create({
              data: {
                title: title,
                message: message,
                sentTo: userId,
                sentBy: senderId,
                stationId: user.stationId,
                type: "STOCK_DISTRIBUTION",
                programType: m.category.programType,
                payload: {
                  movementId: m.id,
                  status: "PENDING",
                  isSynced: true,
                  cardProductId: "",
                  quantity: m.quantity,
                  serials: m.sentSerialNumbers,
                },
                isRead: false,
                createdAt: m.createdAt,
              },
            });
          }
        }
      }
    }
    // --------------------------------

    // --------------------------------
    // REFACTOR: Use Array Logic for fetching
    // --------------------------------

    // 1. Get User Role & Station
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { roleCode: true } },
        stationId: true,
      },
    });
    const roleCode = user?.role?.roleCode || "";
    const userStationId = user?.stationId || null;

    // 2. Build Where Clause
    // 2. Build Where Clause
    const isAdmin = ["admin", "superadmin"].includes(roleCode);

    const broadcastFilter: any = { targetRoles: { has: roleCode } };

    // Only apply station scope if user is NOT admin/superadmin
    // Admins should see broadcasts from ALL stations
    if (!isAdmin) {
      broadcastFilter.AND = [
        {
          OR: [
            { stationId: null }, // Global Broadcast
            { stationId: userStationId }, // Scoped Broadcast
          ],
        },
      ];
    }

    const where: any = {
      OR: [
        { sentTo: userId }, // Legacy or Direct Message
        broadcastFilter, // Broadcast Message
      ],
    };

    if (status) {
      // Define station scope filter based on role
      const stationScope = isAdmin
        ? {} // Admin sees all stations
        : { OR: [{ stationId: null }, { stationId: userStationId }] }; // Supervisor sees global + own station

      if (status === "UNREAD") {
        where.AND = [
          {
            OR: [
              { sentTo: userId, isRead: false },
              {
                AND: [
                  { targetRoles: { has: roleCode } },
                  stationScope,
                  { NOT: { readByUserIds: { has: userId } } },
                ],
              },
            ],
          },
        ];
      }
      if (status === "READ") {
        where.AND = [
          {
            OR: [
              { sentTo: userId, isRead: true },
              {
                AND: [
                  { targetRoles: { has: roleCode } },
                  stationScope,
                  { readByUserIds: { has: userId } },
                ],
              },
            ],
          },
        ];
      }
    }

    if (programType) {
      where.programType = programType;
    }

    if (search) {
      const searchFilter = {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { message: { contains: search, mode: "insensitive" } },
        ],
      };

      // Merge with existing AND if present
      if (where.AND) {
        where.AND.push(searchFilter);
      } else {
        where.AND = [searchFilter];
      }
    }

    // 3. Execute Query
    const [items, total] = await Promise.all([
      db.inbox.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              role: { select: { roleName: true } },
            },
          },
          recipient: {
            select: { id: true, fullName: true },
          },
          station: { select: { id: true, stationName: true } },
        },
      }),
      db.inbox.count({ where }),
    ]);

    // 4. Calculate Unread Count (Separate Query for accuracy)
    // 4. Calculate Unread Count (Separate Query for accuracy)
    const unreadScope = isAdmin
      ? {}
      : { OR: [{ stationId: null }, { stationId: userStationId }] };

    const unreadWhere = {
      OR: [
        { sentTo: userId, isRead: false },
        {
          AND: [
            { targetRoles: { has: roleCode } },
            unreadScope,
            {
              NOT: { readByUserIds: { has: userId } },
            },
          ],
        },
      ],
    };
    const unreadCount = await db.inbox.count({ where: unreadWhere });

    // 5. Map Items (Computed isRead)
    const mappedItems = items.map((item) => {
      // Determine if read by THIS user
      let isRead = false;
      let readAt = null;

      if (item.sentTo === userId) {
        isRead = item.isRead;
        readAt = item.readAt ? item.readAt.toISOString() : null;
      } else if (item.targetRoles && item.targetRoles.includes(roleCode)) {
        isRead = item.readByUserIds.includes(userId);
        // We don't track individual readAt for broadcasts easily without another map,
        // so we can default to null or last updatedAt if needed.
        // For now null is safe.
        readAt = null;
      }

      return {
        id: item.id,
        title: item.title,
        message: item.message,
        isRead: isRead,
        readAt: readAt,
        sentAt: item.sentAt.toISOString(),
        sender: {
          id: item.sender?.id || "System",
          fullName: item.sender?.fullName || "System",
          role: item.sender?.role?.roleName || "System",
        },
        recipient: {
          id:
            item.recipient?.id || (item.targetRoles?.length ? "Broadcast" : ""),
          fullName:
            item.recipient?.fullName || item.targetRoles?.join(", ") || "",
        },
        station: item.station
          ? { id: item.station.id, stationName: item.station.stationName }
          : null,
        type: item.type,
        programType: item.programType,
        payload: item.payload,
      };
    });

    return {
      items: mappedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  /**
   * Mark as Read (Refactored for Array)
   */
  static async markAsRead(inboxId: string, userId: string) {
    const inbox = await db.inbox.findUnique({
      where: { id: inboxId },
    });

    if (!inbox) throw new ValidationError("Pesan tidak ditemukan");

    // Check if Legacy/Direct
    if (inbox.sentTo === userId) {
      await db.inbox.update({
        where: { id: inboxId },
        data: { isRead: true, readAt: new Date(), updatedAt: new Date() },
      });
      return true;
    }

    // Check if Broadcast
    // We need to know user's role to be theoretically safe,
    // but simplified: if user calls this, we assume they are valid target.
    // We just push their ID to readByUserIds if not already there.

    // Check if already read to avoid DB write
    if (inbox.readByUserIds.includes(userId)) return true;

    await db.inbox.update({
      where: { id: inboxId },
      data: {
        readByUserIds: {
          push: userId,
        },
      },
    });

    return true;
  }

  /**
   * Check Low Stock for a Specific Item (Transactional)
   */
  static async checkItemLowStock(
    categoryId: string,
    typeId: string,
    stationId: string,
    currentStock: number,
    tx: any,
  ) {
    // 1. Get Threshold & Product Info
    // Also fetch programType from category
    const product = await tx.cardProduct.findFirst({
      where: {
        categoryId,
        typeId,
      },
      include: {
        category: { select: { categoryName: true, programType: true } },
        type: { select: { typeName: true, minStockThreshold: true } },
      },
    });

    if (!product) return; // Should not happen

    const threshold = product.type.minStockThreshold || 0;
    const productName = `${product.category.categoryName} - ${product.type.typeName}`;
    const programType = product.category.programType; // "FWC" or "VOUCHER"

    if (currentStock <= threshold) {
      // 2. Check if we already alerted effectively "recently" or if alert is still active
      // Logic: find latest unread LOW_STOCK alert for this product & station
      const admins = await tx.user.findMany({
        where: {
          role: { roleCode: { in: ["admin", "superadmin"] } },
          isActive: true,
        },
        select: { id: true },
      });

      if (admins.length === 0) return;

      // Check existing alerts to avoid spam
      // Simple debounce: Don't alert if there's an UNREAD alert for same item
      const existingAlert = await tx.inbox.findFirst({
        where: {
          type: "LOW_STOCK_ALERT",
          isRead: false,
          stationId,
          payload: {
            path: ["cardProductId"],
            equals: product.id,
          },
        },
      });

      if (!existingAlert) {
        // Create Alert (BROADCAST)
        const station = await tx.station.findUnique({
          where: { id: stationId },
          select: { stationName: true },
        });
        const stationName = station?.stationName || "Unknown Station";

        // Create ONE record for all admins
        await tx.inbox.create({
          data: {
            title: `Low Stock Alert: ${productName}`,
            message: `Stok ${productName} di ${stationName} menipis (${currentStock} tersisa). Threshold: ${threshold}.`,
            targetRoles: ["admin", "superadmin"], // Broadcast Target
            sentTo: null,
            sentBy: "SYSTEM", // Or find system user
            stationId,
            type: "LOW_STOCK_ALERT",
            programType: programType,
            payload: {
              stationId,
              cardProductId: product.id,
              currentStock,
              threshold,
              status: "ALERT",
            },
            isRead: false,
            readByUserIds: [], // Init empty
            createdAt: new Date(),
          },
        });
      }
    }
  }

  /**
   * Check All Low Stock (Global Scan)
   * Triggered by Cron or Manual Button
   */
  static async checkLowStockAndAlert(systemUserId: string) {
    // 1. Scan All Inventories
    const inventories = await db.cardInventory.findMany({
      where: {
        stationId: { not: null }, // Only stations
      },
      select: {
        id: true,
        categoryId: true,
        typeId: true,
        stationId: true,
        cardBeredar: true,
      },
    });

    await db.$transaction(async (tx) => {
      for (const inv of inventories) {
        if (inv.stationId) {
          await InboxService.checkItemLowStock(
            inv.categoryId,
            inv.typeId,
            inv.stationId,
            inv.cardBeredar,
            tx,
          );
        }
      }
    });

    return { stationsChecked: inventories.length };
  }

  /**
   * Get Messages Sent By Supervisors
   */
  static async getMessagesSentBySupervisors(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    programType?: string;
  }) {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      sender: {
        role: {
          roleCode: "supervisor",
        },
      },
    };

    if (params.startDate && params.endDate) {
      where.sentAt = {
        gte: new Date(params.startDate),
        lte: new Date(params.endDate),
      };
    } else if (params.startDate) {
      where.sentAt = { gte: new Date(params.startDate) };
    }

    if (params.status && params.status !== "all") {
      where.type = params.status;
    }

    if (params.programType) {
      where.programType = params.programType;
    }

    const [items, total] = await Promise.all([
      db.inbox.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              role: { select: { roleName: true } },
            },
          },
          recipient: {
            select: { id: true, fullName: true },
          },
          station: {
            select: { id: true, stationName: true },
          },
        },
      }),
      db.inbox.count({ where }),
    ]);

    const mapped = items.map((i) => ({
      id: i.id,
      title: i.title,
      message: i.message,
      sentAt: i.sentAt.toISOString(),
      isRead: i.isRead,
      sender: {
        id: i.sender?.id || "Unknown",
        fullName: i.sender?.fullName || "Unknown Sender",
        role: i.sender?.role?.roleName || "Supervisor",
      },
      recipient: {
        id: i.recipient?.id || (i.targetRoles.length ? "Broadcast" : "Unknown"),
        fullName:
          i.recipient?.fullName ||
          (i.targetRoles.length
            ? `Broadcast (${i.targetRoles.join(", ")})`
            : "Unknown Recipient"),
      },
      station: i.station
        ? { id: i.station.id, stationName: i.station.stationName }
        : null,
      programType: (i as any).programType, // Return programType
      payload: i.payload,
    }));

    return {
      items: mapped,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Process Stock Issue Approval
   */
  static async processStockIssueApproval(
    inboxId: string,
    action: "APPROVE" | "REJECT",
    adminUserId: string,
  ) {
    const inbox = await db.inbox.findUnique({
      where: { id: inboxId },
    });

    if (!inbox) throw new ValidationError("Inbox item not found");
    if (inbox.type !== "STOCK_ISSUE_APPROVAL") {
      throw new ValidationError(
        "Inbox item is not a stock issue approval request",
      );
    }

    // Check if already processed (maybe check isRead or a new status field?)
    // For now we assume if it exists and we act on it, we can mark it "READ" or update title.
    if (inbox.title.includes("[RESOLVED]")) {
      throw new ValidationError("This request has already been processed.");
    }

    const payload = inbox.payload as any;
    if (
      !payload ||
      !payload.lostSerialNumbers ||
      !payload.damagedSerialNumbers
    ) {
      throw new ValidationError("Invalid payload in inbox item");
    }

    const { lostSerialNumbers, damagedSerialNumbers } = payload;

    await db.$transaction(async (tx) => {
      if (action === "APPROVE") {
        // Update LOST cards
        if (Array.isArray(lostSerialNumbers) && lostSerialNumbers.length > 0) {
          await tx.card.updateMany({
            where: { serialNumber: { in: lostSerialNumbers } },
            data: {
              status: "LOST",
              updatedAt: new Date(),
              updatedBy: adminUserId,
            },
          });
        }

        // Update DAMAGED cards
        if (
          Array.isArray(damagedSerialNumbers) &&
          damagedSerialNumbers.length > 0
        ) {
          await tx.card.updateMany({
            where: { serialNumber: { in: damagedSerialNumbers } },
            data: {
              status: "DAMAGED",
              updatedAt: new Date(),
              updatedBy: adminUserId,
            },
          });
        }
      }
      // Mark Inbox as Processed
      await tx.inbox.update({
        where: { id: inboxId },
        data: {
          isRead: true,
          readAt: new Date(),
          title: `[RESOLVED: ${action}] ${inbox.title}`,
          updatedBy: adminUserId,
          updatedAt: new Date(),
        },
      });

      await ActivityLogService.createActivityLog(
        adminUserId,
        "APPROVE_STOCK_ISSUE",
        `Resolved Stock Issue (Inbox ${inboxId}): ${action}. Lost=${lostSerialNumbers?.length || 0}, Damaged=${damagedSerialNumbers?.length || 0}`,
      );
    });

    return { success: true, action };
  }

  /**
   * Get Inbox Detail by ID
   */
  static async getInboxDetail(inboxId: string, userId: string) {
    const inbox = await db.inbox.findUnique({
      where: {
        id: inboxId,
        // Optional: Ensure user can only see their own inbox?
        // Or if admin, can see items sent to them.
        // sentTo: userId, // Enforcing ownership for security
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: {
              select: {
                roleCode: true,
                roleName: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            fullName: true,
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

    if (!inbox) {
      throw new ValidationError("Pesan tidak ditemukan");
    }

    // Convert Date objects
    return {
      id: inbox.id,
      title: inbox.title,
      message: inbox.message,
      isRead: inbox.isRead,
      readAt: inbox.readAt?.toISOString() || null,
      sentAt: inbox.sentAt.toISOString(),
      type: inbox.type,
      payload: inbox.payload,
      sender: {
        id: inbox.sender?.id || "Unknown",
        fullName: inbox.sender?.fullName || "Unknown Sender",
        role: {
          code: inbox.sender?.role?.roleCode || "unknown",
          name: inbox.sender?.role?.roleName || "Unknown Role",
        },
      },
      recipient: {
        id:
          inbox.recipient?.id ||
          (inbox.targetRoles.length ? "Broadcast" : "Unknown"),
        fullName:
          inbox.recipient?.fullName ||
          (inbox.targetRoles.length
            ? `Broadcast (${inbox.targetRoles.join(", ")})`
            : "Unknown Recipient"),
      },
      station: inbox.station
        ? {
            id: inbox.station.id,
            code: inbox.station.stationCode,
            name: inbox.station.stationName,
          }
        : null,
    };
  }
}
