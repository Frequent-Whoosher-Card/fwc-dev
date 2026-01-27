//API Contract

export type InboxStatus =
  | "COMPLETED"
  | "ISSUE"
  | "UNKNOWN"
  | "CARD_DAMAGED"
  | "CARD_MISSING";


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

  sentAt: Date;
  dateLabel: string;
  timeLabel: string;

  payload?: {
    serials?: string[];
  };
}
