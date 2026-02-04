import { CardStatus } from "../../../../prisma/generated/client/client";

export class CardStatusService {
  static getAllStatuses() {
    return Object.values(CardStatus);
  }

  static getEditableStatuses() {
    const excludedStatuses = ["ON_REQUEST", "IN_TRANSIT", "ON_TRANSFER"];

    return Object.values(CardStatus).filter(
      (status) => !excludedStatuses.includes(status),
    );
  }
}
