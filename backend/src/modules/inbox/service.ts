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
    const { status, search, programType, startDate, endDate, isRead, type } =
      params;

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
          // Check if ANY inbox notification exists for this movement
          // (Either Direct to User OR Broadcast to Station/Supervisor)
          const exists = await db.inbox.findFirst({
            where: {
              type: "STOCK_DISTRIBUTION",
              payload: {
                path: ["movementId"],
                equals: m.id,
              },
              OR: [
                { sentTo: userId }, // Sent directly to me
                {
                  // OR Sent as broadcast to my station & role
                  stationId: user.stationId,
                  targetRoles: { has: user.role?.roleCode || "supervisor" },
                },
              ],
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
    const isAdmin = ["admin", "superadmin"].includes(roleCode);
    const broadcastFilter: any = { targetRoles: { has: roleCode } };

    if (!isAdmin) {
      broadcastFilter.AND = [
        {
          OR: [{ stationId: null }, { stationId: userStationId }],
        },
      ];
    }

    const where: any = {
      AND: [
        {
          OR: [{ sentTo: userId }, broadcastFilter],
        },
        { type: { not: "LOW_STOCK_ALERT" } }, // Systematically exclude hidden alerts
      ],
    };

    // --- Apply Filters to AND array ---

    if (status) {
      const stationScope = isAdmin
        ? {}
        : { OR: [{ stationId: null }, { stationId: userStationId }] };

      if (status === "UNREAD") {
        where.AND.push({
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
        });
      } else if (status === "READ") {
        where.AND.push({
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
        });
      } else if (status === "PENDING_VALIDATION") {
        where.AND.push({
          OR: [
            {
              type: "STOCK_DISTRIBUTION",
              payload: { path: ["status"], equals: "PENDING" },
            },
            {
              type: "STOCK_ISSUE_REPORT",
              payload: { path: ["status"], equals: "PENDING_APPROVAL" },
            },
          ],
        });
      } else if (status === "ACCEPTED") {
        where.AND.push({
          OR: [
            {
              type: "STOCK_DISTRIBUTION",
              payload: { path: ["status"], equals: "COMPLETED" },
            },
            {
              type: "STOCK_ISSUE_REPORT",
              payload: { path: ["status"], equals: "RESOLVED" },
            },
            {
              type: "STOCK_DISTRIBUTION_SUCCESS",
              payload: { path: ["status"], equals: "COMPLETED" },
            },
            // Fallback for messaging based status (Legacy or specific format)
            { message: { contains: "diterima", mode: "insensitive" } },
            { message: { contains: "menerima", mode: "insensitive" } },
          ],
        });
      } else if (status === "CARD_MISSING") {
        where.AND.push({
          // Search for any item with lost cards > 0 (count) OR non-empty lostSerialNumbers string/array
          OR: [
            { payload: { path: ["validationResult", "lost"], gt: 0 } },
            // Fallback for array length check if 'lost' count is missing (Prisma raw Json filter is tricky)
            // We use string contains as a heuristic for now since 'not: []' is unreliable in Prisma Json
            {
              payload: {
                path: ["validationResult", "lostSerialNumbers"],
                string_contains: "0", // Rough check if serials exist (start with 0 usually) - Risky
              },
            },
            // Better: Just check if the path exists and is not empty array?
            // Let's assume the 'lost' count property is maintained in payload for filtering efficiency.
            // If the user says "Walau selesai ada rusak", it implies the COMPLETED item HAS the data.
            // We remove the TYPE constraint so it searches ALL types.
          ],
        });
      } else if (status === "CARD_DAMAGED") {
        where.AND.push({
          OR: [
            { payload: { path: ["validationResult", "damaged"], gt: 0 } },
          ],
        });
      }
    }

    if (isRead !== undefined) {
      where.AND.push({ isRead });
    }

    if (type) {
      where.AND.push({ type });
    }

    if (programType) {
      where.AND.push({ programType });
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.AND.push({ sentAt: dateFilter });
    }

    const cleanSearch = search?.trim();
    if (cleanSearch) {
      where.AND.push({
        OR: [
          { title: { contains: cleanSearch, mode: "insensitive" } },
          { message: { contains: cleanSearch, mode: "insensitive" } },
          {
            sender: {
              fullName: { contains: cleanSearch, mode: "insensitive" },
            },
          },
        ],
      });
    }

    // 3. Execute Query
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

    const unreadWhere: any = {
      AND: [
        {
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
        },
        { type: { not: "LOW_STOCK_ALERT" } }, // Sync unread count with filtered list
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
      } else {
        // Broadcast or Role-based: Check if user ID is in the read list
        // This ensures Superadmin seeing 'Supervisor' messages sees them as read if they clicked it.
        isRead = item.readByUserIds.includes(userId);
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

  static async getUnreadCounts(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { roleCode: true } },
        stationId: true,
      },
    });

    if (!user) return { total: 0, fwc: 0, voucher: 0 };

    const roleCode = user.role?.roleCode || "";
    const userStationId = user.stationId || null;
    const isAdmin = ["admin", "superadmin"].includes(roleCode);

    const broadcastFilter: any = { targetRoles: { has: roleCode } };
    if (!isAdmin) {
      broadcastFilter.AND = [
        { OR: [{ stationId: null }, { stationId: userStationId }] },
      ];
    }

    const whereBase: any = {
      type: { not: "LOW_STOCK_ALERT" }, // Exclude Hidden Low Stock Alerts from Badge
      OR: [
        { sentTo: userId, isRead: false },
        {
          AND: [
            broadcastFilter,
            { NOT: { readByUserIds: { has: userId } } }, // Broadcast specific read check
          ],
        },
      ],
    };

    const [fwc, voucher] = await Promise.all([
      db.inbox.count({
        where: {
          ...whereBase,
          programType: "FWC",
        },
      }),
      db.inbox.count({
        where: {
          ...whereBase,
          programType: "VOUCHER",
        },
      }),
    ]);

    return {
      total: fwc + voucher,
      fwc,
      voucher,
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

    // Broadcast: Atomic update to push userId if not already present
    // We use updateMany to include the "NOT: { has: userId }" condition
    await db.inbox.updateMany({
      where: {
        id: inboxId,
        NOT: { readByUserIds: { has: userId } },
      },
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
        return true; // Alert sent
      }
    }
    return false; // No alert sent
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

    let alertsSent = 0;
    await db.$transaction(async (tx) => {
      for (const inv of inventories) {
        if (inv.stationId) {
          const result = await InboxService.checkItemLowStock(
            inv.categoryId,
            inv.typeId,
            inv.stationId,
            inv.cardBeredar,
            tx,
          );
          if (result) alertsSent++;
        }
      }
    });

    return { alertsSent, stationsChecked: inventories.length };
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
    search?: string;
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

    if (params.startDate || params.endDate) {
      const dateFilter: any = {};
      if (params.startDate) {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start;
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.sentAt = dateFilter;
    }

    if (params.status && params.status !== "all") {
      where.type = params.status;
    }

    if (params.programType) {
      where.programType = params.programType;
    }

    const cleanSearch = params.search?.trim();
    if (cleanSearch) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { message: { contains: params.search, mode: "insensitive" } },
            {
              sender: {
                fullName: { contains: params.search, mode: "insensitive" },
              },
            },
          ],
        },
      ];
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
   * Get Supervisor Noted History (Global View for Superadmin)
   */
  static async getSupervisorNotedHistory(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    programType?: string;
    search?: string;
    stationId?: string; // Additional filter
  }) {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      type: "STOCK_DISTRIBUTION",
      targetRoles: { has: "supervisor" },
      NOT: { type: "LOW_STOCK_ALERT" }, // Double safety
    };

    if (params.stationId) {
      where.stationId = params.stationId;
    }

    if (params.startDate || params.endDate) {
      const dateFilter: any = {};
      if (params.startDate) {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start;
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.sentAt = dateFilter;
    }

    // Status filter logic (mapped from frontend values)
    if (params.status) {
      if (params.status === "PENDING_VALIDATION") {
        where.payload = { path: ["status"], equals: "PENDING" };
      } else if (params.status === "ACCEPTED") {
        where.payload = { path: ["status"], equals: "COMPLETED" };
      }
      // Add more status mappings if needed (e.g. issues from payload)
    }

    if (params.programType) {
      where.programType = params.programType;
    }

    const cleanSearch = params.search?.trim();
    if (cleanSearch) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { message: { contains: params.search, mode: "insensitive" } },
            {
              sender: {
                fullName: { contains: params.search, mode: "insensitive" },
              },
            },
            {
              station: {
                stationName: { contains: params.search, mode: "insensitive" },
              },
            },
          ],
        },
      ];
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
      isRead: i.isRead, // Read status in this context might refer to if ANY supervisor read it, or just raw value
      sender: {
        id: i.sender?.id || "Unknown",
        fullName: i.sender?.fullName || "Unknown Sender",
        role: i.sender?.role?.roleName || "System",
      },
      recipient: {
        id: i.recipient?.id || "Broadcast",
        fullName:
          i.recipient?.fullName ||
          `Supervisors @ ${i.station?.stationName || "Unknown"}`,
      },
      station: i.station
        ? { id: i.station.id, stationName: i.station.stationName }
        : null,
      programType: (i as any).programType,
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
          payload: {
            ...payload,
            status: "RESOLVED",
            resolution: action,
            resolvedAt: new Date(),
          },
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
