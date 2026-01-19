//API Contract

export type InboxType =
  | "STOCK_ISSUE_APPROVAL"
  | "STOCK_OUT_REPORT"
  | "PENDING"
  | "LOW_STOCK";

export type InboxStatus = "PENDING" | "ISSUE" | "COMPLETED";

export interface Sender {
  fullName: string;
  station?: string;
  batch_card?: string;
  card_category?: string;
  card_type?: string;
  amount_card?: string;
}

export interface Inbox {
  id: string;
  title: string;
  message: string;
  sender: Sender;
  status: InboxStatus;
  dateLabel: string;
  timeLabel: string;
}
