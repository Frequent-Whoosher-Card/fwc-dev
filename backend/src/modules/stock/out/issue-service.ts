import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { ActivityLogService } from "../../activity-log/service";

export class StockIssueService {
  /**
   * Get Detail of a Stock Issue (by Movement ID)
   * Used when Admin clicks on the Inbox Item
   */
  static async getIssueDetail(movementId: string) {
    const movement = await db.cardStockMovement.findUnique({
      where: { id: movementId },
      include: {
        station: { select: { stationName: true } },
        category: { select: { categoryName: true } },
        type: { select: { typeName: true } },
      },
    });

    if (!movement) throw new ValidationError("Movement not found");

    // Check if there are actually issues
    const lostCount = movement.lostSerialNumbers.length;
    const damagedCount = movement.damagedSerialNumbers.length;

    return {
      movementId: movement.id,
      stationName: movement.station?.stationName,
      productName: `${movement.category.categoryName} - ${movement.type.typeName}`,
      movementAt: movement.movementAt,
      sentCount: movement.quantity, // approximate
      lostCount,
      damagedCount,
      lostSerialNumbers: movement.lostSerialNumbers,
      damagedSerialNumbers: movement.damagedSerialNumbers,
      status: movement.status, // Should be APPROVED (by supervisor) but effectively "Pending Admin" for issues
      // Logic check: ValidateStockOut sets status "APPROVED".
      // We might need a sidebar flag or just rely on Card Status not being updated yet.
    };
  }

  /**
   * Resolve Issue (Approve or Reject)
   */
  static async resolveIssue(
    movementId: string,
    adminId: string, // User ID of Admin/Superadmin
    decision: "APPROVE" | "REJECT",
    note?: string,
  ) {
    const movement = await db.cardStockMovement.findUnique({
      where: { id: movementId },
    });

    if (!movement) throw new ValidationError("Movement not found");

    const lostSerials = movement.lostSerialNumbers;
    const damagedSerials = movement.damagedSerialNumbers;

    if (lostSerials.length === 0 && damagedSerials.length === 0) {
      throw new ValidationError("No lost or damaged cards to process.");
    }

    const transaction = await db.$transaction(async (tx) => {
      // 1. APPROVE: Confirm Lost/Damaged Status
      if (decision === "APPROVE") {
        // Update Lost Cards -> LOST
        if (lostSerials.length > 0) {
          await tx.card.updateMany({
            where: { serialNumber: { in: lostSerials } },
            data: {
              status: "LOST", // Global status for LOST
              updatedAt: new Date(),
              updatedBy: adminId,
            },
          });
        }

        // Update Damaged Cards -> DAMAGED
        if (damagedSerials.length > 0) {
          await tx.card.updateMany({
            where: { serialNumber: { in: damagedSerials } },
            data: {
              status: "DAMAGED", // Global status for DAMAGED
              updatedAt: new Date(),
              updatedBy: adminId,
            },
          });
        }

        // Log
        await ActivityLogService.createActivityLog(
          adminId,
          "APPROVE_STOCK_ISSUE",
          `Approved Stock Issue for Movement ${movementId}: ${lostSerials.length} Lost, ${damagedSerials.length} Damaged.`,
        );
      }
      // 2. REJECT: It means Admin says "They are not lost/damaged"
      // Scenario: Admin calls station, finds items are there.
      // Action: Force them to IN_STATION? Or revert to IN_TRANSIT and ask Supervisor to check again?
      // Simplest for MVP: Force IN_STATION (Assumed Found/Okay)
      else if (decision === "REJECT") {
        const allIssues = [...lostSerials, ...damagedSerials];
        if (allIssues.length > 0) {
          await tx.card.updateMany({
            where: { serialNumber: { in: allIssues } },
            data: {
              status: "IN_STATION", // Forced Received
              stationId: movement.stationId, // Ensure station is set
              updatedAt: new Date(),
              updatedBy: adminId,
            },
          });
        }

        // Update Movement Arrays?
        // Strictly speaking, if Rejected, we should ideally move them from lostSerialNumbers to receivedSerialNumbers in the movement record too
        // to keep data consistent.
        await tx.cardStockMovement.update({
          where: { id: movementId },
          data: {
            receivedSerialNumbers: { push: allIssues },
            lostSerialNumbers: [], // Clear
            damagedSerialNumbers: [], // Clear
            note:
              (movement.note || "") +
              ` | Issues Rejected/Reset by Admin ${adminId}: ${note || ""}`,
          },
        });

        await ActivityLogService.createActivityLog(
          adminId,
          "REJECT_STOCK_ISSUE",
          `Rejected Stock Issue for Movement ${movementId}: Forced ${allIssues.length} cards to IN_STATION.`,
        );
      }

      // 3. Mark Admin Inbox as Completed (Optional, or handled by frontend refreshing)
      // Ideally we find the specific inbox item for this admin and mark read.
      // But query might be generic.
      // Let's rely on frontend calling "mark as read" or just leave it.
      // BETTER: Find all PENDING_APPROVAL inbox items for this movement and mark them COMPLETED.

      // 3. Update Admin Inbox Items
      // Fetch all issue reports to ensure we catch them (avoiding strict JSON filter issues)
      const inboxes = await tx.inbox.findMany({
        where: {
          type: "STOCK_ISSUE_REPORT",
          isRead: false, // Only update unread ones, or all? Let's update all to be safe.
        },
      });

      // Filter in JS for safety
      const targetInboxes = inboxes.filter(
        (i) => (i.payload as any)?.movementId === movementId,
      );

      for (const inbox of targetInboxes) {
        const oldPayload = inbox.payload as any;
        const newPayload = {
          ...oldPayload,
          status: decision, // 'APPROVE' | 'REJECT'
          resolvedAt: new Date(),
          resolvedBy: adminId,
        };

        await tx.inbox.update({
          where: { id: inbox.id },
          data: {
            isRead: true,
            readAt: new Date(),
            title: `[${decision === "APPROVE" ? "DISETUJUI" : "DITOLAK"}] ${inbox.title}`,
            message: `${inbox.message} (Status: ${decision})`,
            payload: newPayload,
          },
        });
      }

      return { success: true, decision };
    });

    return transaction;
  }
}
