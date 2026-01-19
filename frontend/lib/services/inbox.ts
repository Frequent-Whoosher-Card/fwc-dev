// =======================
// TYPES
// =======================

/**
 * Status untuk UI Badge
 */
export type InboxStatus = "PENDING" | "COMPLETED" | "ISSUE";

/**
 * Type asli dari backend
 */
export type InboxType =
  | "STOCK_ISSUE_APPROVAL"
  | "STOCK_OUT_REPORT"
  | "LOW_STOCK";

/**
 * Sender model
 */
export interface InboxSender {
  fullName: string;
}

/**
 * Inbox item model (normalized for UI)
 */
export interface InboxItemModel {
  id: string;

  // backend fields
  type: InboxType;
  isRead: boolean;

  sender: InboxSender;

  // UI fields
  status: InboxStatus;
  title: string;
  message: string;
  date_label: string;
  time_label: string;

  // raw payload (optional debug)
  raw: unknown;
}

/**
 * Filters for inbox list
 */
export interface InboxFilters {
  status: InboxStatus | "ALL";
  startDate: string;
  endDate: string;
}

// =======================
// HELPERS
// =======================

/**
 * Format datetime → label UI
 */
export function formatDateTime(value: string | Date) {
  const date = new Date(value);

  return {
    dateLabel: date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    timeLabel:
      date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB",
  };
}

/**
 * Map backend inbox item → UI status
 */
export function mapInboxStatus(payload: {
  type?: string;
  isRead?: boolean;
}): InboxStatus {
  if (payload.type === "STOCK_ISSUE_APPROVAL") {
    return "ISSUE";
  }

  if (payload.type === "STOCK_OUT_REPORT") {
    return "COMPLETED";
  }

  if (payload.isRead === false) {
    return "PENDING";
  }

  return "PENDING";
}
