export interface InboxItemModel {
  id: string;
  title: string;
  message: string;
  sender: {
    fullName: string;
    station?: string;
  };
  isRead: boolean;
  readAt?: string;
  sentAt: Date;
  date_label: string; 
  time_label: string;
  // Payload related fields if needed
  payload?: {
    movementId?: string;
    damagedSerialNumbers?: string[];
    lostSerialNumbers?: string[];
    receivedCount?: number;
  };
}

export interface InboxFilters {
  status: string;
  startDate: string;
  endDate: string;
}

export type InboxStatus = "PENDING" | "COMPLETED" | "ISSUE";

/**
 * Maps the inbox item to a visual status string.
 * Logic derived from payload content or message analysis.
 */
export function mapInboxStatus(item: InboxItemModel): InboxStatus {
  // If it's already read/handled, maybe COMPLETED?
  // Or check specific payload flags.
  
  // For now, let's assume if there are damaged or lost serials, it's an ISSUE.
  const hasIssues = 
    (item.payload?.damagedSerialNumbers?.length ?? 0) > 0 ||
    (item.payload?.lostSerialNumbers?.length ?? 0) > 0;

  if (hasIssues) return "ISSUE";
  
  // If no issues, but not read? or just default to info?
  // Let's rely on isRead for Pending vs Completed if no issues.
  if (item.isRead) return "COMPLETED";

  return "PENDING";
}
