//API Contract

export type InboxStatus =
  | "ACCEPTED"
  | "CARD_MISSING"
  | "CARD_DAMAGED"
  | "UNKNOWN";

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
