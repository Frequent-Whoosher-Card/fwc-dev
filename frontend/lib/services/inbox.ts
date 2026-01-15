// =======================
// TYPES
// =======================

export type InboxStatus = "PENDING" | "COMPLETED" | "ISSUE";

export interface InboxSender {
  fullName: string;
}

export interface InboxItemModel {
  id: string;
  sender: { fullName: string };
  status: InboxStatus;
  title: string;
  message: string;
  date_label: string;
  time_label: string;
  raw: unknown;
}

export interface InboxFilters {
  status: string;
  startDate: string;
  endDate: string;
}

// =======================
// HELPERS
// =======================

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
