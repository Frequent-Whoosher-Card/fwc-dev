import db from "../../config/db";
import { ValidationError } from "../../utils/errors";

export class InboxService {
  /**
   * Get User Inbox
   */
  static async getUserInbox(
    userId: string,
    params: { page?: number; limit?: number; isRead?: boolean }
  ) {
    const { page = 1, limit = 10, isRead } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      sentTo: userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [items, total, unreadCount] = await Promise.all([
      db.inbox.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: "desc" },
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      }),
      db.inbox.count({ where }),
      db.inbox.count({ where: { sentTo: userId, isRead: false } }),
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
      },
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
   * Broadcast to Admins & Superadmins
   */
  static async broadcastToAdmins(
    title: string,
    message: string,
    senderId: string, // System ID or Operator ID
    stationId?: string,
    type?: string,
    payload?: any
  ) {
    // 1. Find all admins/superadmins
    const roles = await db.role.findMany({
      where: { roleCode: { in: ["admin", "superadmin"] } },
      select: { id: true },
    });
    const roleIds = roles.map((r) => r.id);

    const admins = await db.user.findMany({
      where: { roleId: { in: roleIds }, isActive: true },
      select: { id: true },
    });

    if (admins.length === 0) return 0;

    // 2. Create Inbox entries
    const data = admins.map((admin) => ({
      title,
      message,
      sentTo: admin.id,
      sentBy: senderId,
      stationId: stationId ?? null,
      type: type ?? "NOTIFICATION",
      payload: payload ?? {},
      isRead: false,
      createdAt: new Date(),
    }));

    await db.inbox.createMany({ data });

    return data.length;
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
        },
      });

      if (!existing) {
        await this.broadcastToAdmins(
          title,
          message,
          systemUserId,
          inv.stationId || undefined,
          "LOW_STOCK",
          {
            inventoryId: inv.id,
            currentStock: inv.cardBeredar,
          }
        );
        alertsSent++;
      }
    }

    return { alertsSent, stationsChecked: inventories.length };
  }
}
