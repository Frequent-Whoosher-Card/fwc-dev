import db from "../../config/db";
import { ValidationError } from "../../utils/errors";
import { ActivityLogService } from "../activity-log/service";

export class InboxService {
  /**
   * Get User Inbox
   */
  static async getUserInbox(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      isRead?: boolean;
      startDate?: string;
      endDate?: string;
      type?: string;
    },
  ) {
    const { page = 1, limit = 10, isRead } = params;
    const skip = (page - 1) * limit;

    // --- SYNC MISSING PENDING TASKS ---
    // Ensure new supervisors see pending stock distributions
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stationId: true,
        role: { select: { roleCode: true } },
      },
    });

    if (user?.role?.roleCode === "supervisor" && user.stationId) {
      const pendingMovements = await db.cardStockMovement.findMany({
        where: {
          movementType: "OUT",
          status: "PENDING",
          stationId: user.stationId,
        },
      });

      for (const m of pendingMovements) {
        // Check if inbox exists for this specific movement & user
        // We use findFirst because payload is JSON, so we can't easily query distinct properties without raw
        // But we can check type, recipient, and ensure we don't duplicate.
        // Efficient check: Get all user's STOCK_DIST inbox items created after movement, check payload in memory?
        // Or simplified: Just check if ANY inbox item for this movement exists for this user.

        // NOTE: Prisma JSON filtering is limited. We'll fetch potential matches.
        const candidates = await db.inbox.findMany({
          where: {
            sentTo: userId,
            type: "STOCK_DISTRIBUTION",
            // Optimization: Only check items created around or after movement
            sentAt: { gte: m.createdAt },
          },
          select: { payload: true },
        });

        const exists = candidates.some(
          (c: any) => c.payload?.movementId === m.id,
        );

        if (!exists) {
          // Determine sender (creator)
          const senderId = m.createdBy;

          // Create missing notification
          await db.inbox.create({
            data: {
              title: `Kiriman Stock (Synced)`,
              message: `WFO mengirimkan stok ke stasiun. Mohon cek fisik & validasi.`,
              sentTo: userId,
              sentBy: senderId,
              stationId: user.stationId,
              type: "STOCK_DISTRIBUTION",
              payload: {
                movementId: m.id,
                status: "PENDING",
                isSynced: true,
              },
              isRead: false,
              sentAt: new Date(), // Now
            },
          });
        }
      }
    }
    // ----------------------------------

    const where: any = {
      sentTo: userId,
      type: { not: "LOW_STOCK" }, // Filter out low stock alerts from main inbox
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (params.startDate && params.endDate) {
      where.sentAt = {
        gte: new Date(params.startDate),
        lte: new Date(params.endDate),
      };
    } else if (params.startDate) {
      where.sentAt = { gte: new Date(params.startDate) };
    }

    if (params.type && params.type !== "all") {
      where.type = params.type;
    }

    const [items, total, unreadCount] = await Promise.all([
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
          recipient: { select: { id: true, fullName: true } },
          station: { select: { id: true, stationName: true } },
        },
      }),
      db.inbox.count({ where }),
      db.inbox.count({
        where: { sentTo: userId, isRead: false, type: { not: "LOW_STOCK" } },
      }),
    ]);

    const mapped = items.map((i) => ({
      id: i.id,
      title: i.title,
      message: i.message,
      isRead: i.isRead,
      readAt: i.readAt ? i.readAt.toISOString() : null,
      sentAt: i.sentAt.toISOString(),
      sender: {
        id: i.sender?.id || "Unknown",
        fullName: i.sender?.fullName || "Unknown Sender",
        role: i.sender?.role?.roleName || "Unknown Role",
      },
      recipient: {
        id: i.recipient?.id || "Unknown",
        fullName: i.recipient?.fullName || "Unknown Recipient",
      },
      station: i.station
        ? { id: i.station.id, stationName: i.station.stationName }
        : null,
      type: i.type,
      payload: i.payload,
    }));

    return {
      items: mapped,
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
   * Mark as Read
   */
  static async markAsRead(inboxId: string, userId: string) {
    const inbox = await db.inbox.findFirst({
      where: { id: inboxId, sentTo: userId },
    });

    if (!inbox) throw new ValidationError("Pesan tidak ditemukan");

    await db.inbox.update({
      where: { id: inboxId },
      data: { isRead: true, readAt: new Date(), updatedAt: new Date() },
    });

    return true;
  }

  /**
   * Check Low Stock & Alert
   * Logic: Iterate all stations, check inventory. If < threshold, alert admins.
   * Threshold hardcoded to 10 for now, or could be product specific.
   */
  static async checkLowStockAndAlert(systemUserId: string) {
    const LOW_STOCK_THRESHOLD = 50; // Example threshold

    // 1. Scan Inventories
    const inventories = await db.cardInventory.findMany({
      where: {
        stationId: { not: null }, // Only stations
        cardBeredar: { lte: LOW_STOCK_THRESHOLD },
      },
      include: {
        station: true,
        category: true,
        type: true,
      },
    });

    let alertsSent = 0;

    // 2. Group by Station to avoid spamming? Or just 1 alert per low item?
    // Let's do 1 alert per low item for now to be specific.
    for (const inv of inventories) {
      if (!inv.station) continue;

      const title = `Low Stock Alert: ${inv.station.stationName}`;
      const message = `Stok untuk ${inv.category.categoryName} - ${inv.type.typeName} di stasiun ${inv.station.stationName} menipis (${inv.cardBeredar} tersisa).`;

      // Check if we recently sent this alert to avoid duplication?
      // For simplicity, we just send. Implementation could be refined to check "last alert" time.
      // To prevent spam, we could check if there is an UNREAD inbox with same title/content today.

      // Simple spam check:
      const existing = await db.inbox.findFirst({
        where: {
          title,
          isRead: false,
          sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // last 24h
          type: "LOW_STOCK",
        },
      });

      if (!existing) {
        // 3. Find Admins
        const roles = await db.role.findMany({
          where: { roleCode: { in: ["admin", "superadmin"] } },
          select: { id: true },
        });
        const roleIds = roles.map((r) => r.id);
        const admins = await db.user.findMany({
          where: { roleId: { in: roleIds }, isActive: true },
          select: { id: true },
        });

        // 4. Create Inbox Entries
        if (admins.length > 0) {
          const inboxData = admins.map((admin) => ({
            title,
            message,
            sentTo: admin.id,
            sentBy: systemUserId,
            stationId: inv.stationId || null,
            type: "LOW_STOCK",
            payload: {
              inventoryId: inv.id,
              currentStock: inv.cardBeredar,
            },
            isRead: false,
            createdAt: new Date(),
          }));
          await db.inbox.createMany({ data: inboxData });
        }

        alertsSent++;
      }
    }

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
      // Assuming 'status' maps to 'title' or 'type' based on design (e.g. 'Accepted' might be the title or type)
      // Since the design shows statuses like "Accepted", "Card Missing", "Card Damaged" which look like Titles or Types.
      // Let's filter by type if it matches, or title.
      // For flexibility let's match type for now as it's cleaner, or assume frontend sends specific type codes.
      // If status acts as "Type" filter:
      where.type = params.status;
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
        id: i.recipient?.id || "Unknown",
        fullName: i.recipient?.fullName || "Unknown Recipient",
      },
      station: i.station
        ? { id: i.station.id, stationName: i.station.stationName }
        : null,
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
    const inbox = await db.inbox.findFirst({
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
        id: inbox.recipient?.id || "Unknown",
        fullName: inbox.recipient?.fullName || "Unknown Recipient",
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
