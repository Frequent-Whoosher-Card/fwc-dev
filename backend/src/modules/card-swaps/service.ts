import db from "../../config/db";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from "../../utils/errors";

// Helper functions to transform database objects to API response format
function transformSwapRequestData(swapRequest: any) {
  return {
    ...swapRequest,
    createdAt: swapRequest.createdAt.toISOString(),
    updatedAt: swapRequest.updatedAt.toISOString(),
    requestedAt: swapRequest.requestedAt.toISOString(),
    approvedAt: swapRequest.approvedAt?.toISOString() || null,
    executedAt: swapRequest.executedAt?.toISOString() || null,
    rejectedAt: swapRequest.rejectedAt?.toISOString() || null,
    purchase: swapRequest.purchase
      ? {
          ...swapRequest.purchase,
          purchaseDate: swapRequest.purchase.purchaseDate.toISOString(),
          createdAt: swapRequest.purchase.createdAt.toISOString(),
          updatedAt: swapRequest.purchase.updatedAt.toISOString(),
          deletedAt: swapRequest.purchase.deletedAt?.toISOString() || null,
          member: swapRequest.purchase.member
            ? {
                ...swapRequest.purchase.member,
                createdAt: swapRequest.purchase.member.createdAt.toISOString(),
                updatedAt: swapRequest.purchase.member.updatedAt.toISOString(),
              }
            : null,
          card: {
            ...swapRequest.purchase.card,
            createdAt: swapRequest.purchase.card.createdAt.toISOString(),
            updatedAt: swapRequest.purchase.card.updatedAt.toISOString(),
            deletedAt:
              swapRequest.purchase.card.deletedAt?.toISOString() || null,
            cardProduct: {
              ...swapRequest.purchase.card.cardProduct,
              createdAt:
                swapRequest.purchase.card.cardProduct.createdAt.toISOString(),
              updatedAt:
                swapRequest.purchase.card.cardProduct.updatedAt.toISOString(),
              deletedAt:
                swapRequest.purchase.card.cardProduct.deletedAt?.toISOString() ||
                null,
              category: {
                ...swapRequest.purchase.card.cardProduct.category,
                createdAt:
                  swapRequest.purchase.card.cardProduct.category.createdAt.toISOString(),
                updatedAt:
                  swapRequest.purchase.card.cardProduct.category.updatedAt.toISOString(),
              },
              type: {
                ...swapRequest.purchase.card.cardProduct.type,
                createdAt:
                  swapRequest.purchase.card.cardProduct.type.createdAt.toISOString(),
                updatedAt:
                  swapRequest.purchase.card.cardProduct.type.updatedAt.toISOString(),
              },
            },
          },
        }
      : null,
    originalCard: swapRequest.originalCard
      ? {
          ...swapRequest.originalCard,
          createdAt: swapRequest.originalCard.createdAt.toISOString(),
          updatedAt: swapRequest.originalCard.updatedAt.toISOString(),
          deletedAt: swapRequest.originalCard.deletedAt?.toISOString() || null,
          cardProduct: {
            ...swapRequest.originalCard.cardProduct,
            createdAt:
              swapRequest.originalCard.cardProduct.createdAt.toISOString(),
            updatedAt:
              swapRequest.originalCard.cardProduct.updatedAt.toISOString(),
            deletedAt:
              swapRequest.originalCard.cardProduct.deletedAt?.toISOString() ||
              null,
            category: {
              ...swapRequest.originalCard.cardProduct.category,
              createdAt:
                swapRequest.originalCard.cardProduct.category.createdAt.toISOString(),
              updatedAt:
                swapRequest.originalCard.cardProduct.category.updatedAt.toISOString(),
            },
            type: {
              ...swapRequest.originalCard.cardProduct.type,
              createdAt:
                swapRequest.originalCard.cardProduct.type.createdAt.toISOString(),
              updatedAt:
                swapRequest.originalCard.cardProduct.type.updatedAt.toISOString(),
            },
          },
        }
      : null,
    replacementCard: swapRequest.replacementCard
      ? {
          ...swapRequest.replacementCard,
          createdAt: swapRequest.replacementCard.createdAt.toISOString(),
          updatedAt: swapRequest.replacementCard.updatedAt.toISOString(),
          deletedAt:
            swapRequest.replacementCard.deletedAt?.toISOString() || null,
          cardProduct: {
            ...swapRequest.replacementCard.cardProduct,
            createdAt:
              swapRequest.replacementCard.cardProduct.createdAt.toISOString(),
            updatedAt:
              swapRequest.replacementCard.cardProduct.updatedAt.toISOString(),
            deletedAt:
              swapRequest.replacementCard.cardProduct.deletedAt?.toISOString() ||
              null,
            category: {
              ...swapRequest.replacementCard.cardProduct.category,
              createdAt:
                swapRequest.replacementCard.cardProduct.category.createdAt.toISOString(),
              updatedAt:
                swapRequest.replacementCard.cardProduct.category.updatedAt.toISOString(),
            },
            type: {
              ...swapRequest.replacementCard.cardProduct.type,
              createdAt:
                swapRequest.replacementCard.cardProduct.type.createdAt.toISOString(),
              updatedAt:
                swapRequest.replacementCard.cardProduct.type.updatedAt.toISOString(),
            },
          },
        }
      : null,
    sourceStation: swapRequest.sourceStation
      ? {
          ...swapRequest.sourceStation,
          createdAt: swapRequest.sourceStation.createdAt.toISOString(),
          updatedAt: swapRequest.sourceStation.updatedAt.toISOString(),
          deletedAt: swapRequest.sourceStation.deletedAt?.toISOString() || null,
        }
      : null,
    targetStation: swapRequest.targetStation
      ? {
          ...swapRequest.targetStation,
          createdAt: swapRequest.targetStation.createdAt.toISOString(),
          updatedAt: swapRequest.targetStation.updatedAt.toISOString(),
          deletedAt: swapRequest.targetStation.deletedAt?.toISOString() || null,
        }
      : null,
    expectedProduct: swapRequest.expectedProduct
      ? {
          ...swapRequest.expectedProduct,
          createdAt: swapRequest.expectedProduct.createdAt.toISOString(),
          updatedAt: swapRequest.expectedProduct.updatedAt.toISOString(),
          deletedAt:
            swapRequest.expectedProduct.deletedAt?.toISOString() || null,
          category: {
            ...swapRequest.expectedProduct.category,
            createdAt:
              swapRequest.expectedProduct.category.createdAt.toISOString(),
            updatedAt:
              swapRequest.expectedProduct.category.updatedAt.toISOString(),
          },
          type: {
            ...swapRequest.expectedProduct.type,
            createdAt: swapRequest.expectedProduct.type.createdAt.toISOString(),
            updatedAt: swapRequest.expectedProduct.type.updatedAt.toISOString(),
          },
        }
      : null,
    requester: swapRequest.requester
      ? {
          ...swapRequest.requester,
          createdAt: swapRequest.requester.createdAt.toISOString(),
          updatedAt: swapRequest.requester.updatedAt.toISOString(),
          lastLogin: swapRequest.requester.lastLogin?.toISOString() || null,
        }
      : null,
    approver: swapRequest.approver
      ? {
          ...swapRequest.approver,
          createdAt: swapRequest.approver.createdAt.toISOString(),
          updatedAt: swapRequest.approver.updatedAt.toISOString(),
          lastLogin: swapRequest.approver.lastLogin?.toISOString() || null,
        }
      : null,
    executor: swapRequest.executor
      ? {
          ...swapRequest.executor,
          createdAt: swapRequest.executor.createdAt.toISOString(),
          updatedAt: swapRequest.executor.updatedAt.toISOString(),
          lastLogin: swapRequest.executor.lastLogin?.toISOString() || null,
        }
      : null,
    rejecter: swapRequest.rejecter
      ? {
          ...swapRequest.rejecter,
          createdAt: swapRequest.rejecter.createdAt.toISOString(),
          updatedAt: swapRequest.rejecter.updatedAt.toISOString(),
          lastLogin: swapRequest.rejecter.lastLogin?.toISOString() || null,
        }
      : null,
  };
}

function transformSwapHistoryData(history: any) {
  return {
    ...history,
    executedAt: history.executedAt.toISOString(),
    swapRequest: history.swapRequest
      ? {
          ...history.swapRequest,
          createdAt: history.swapRequest.createdAt.toISOString(),
          updatedAt: history.swapRequest.updatedAt.toISOString(),
          requestedAt: history.swapRequest.requestedAt.toISOString(),
          approvedAt: history.swapRequest.approvedAt?.toISOString() || null,
          executedAt: history.swapRequest.executedAt?.toISOString() || null,
          rejectedAt: history.swapRequest.rejectedAt?.toISOString() || null,
          sourceStation: {
            ...history.swapRequest.sourceStation,
            createdAt:
              history.swapRequest.sourceStation.createdAt.toISOString(),
            updatedAt:
              history.swapRequest.sourceStation.updatedAt.toISOString(),
            deletedAt:
              history.swapRequest.sourceStation.deletedAt?.toISOString() ||
              null,
          },
          targetStation: {
            ...history.swapRequest.targetStation,
            createdAt:
              history.swapRequest.targetStation.createdAt.toISOString(),
            updatedAt:
              history.swapRequest.targetStation.updatedAt.toISOString(),
            deletedAt:
              history.swapRequest.targetStation.deletedAt?.toISOString() ||
              null,
          },
          requester: {
            ...history.swapRequest.requester,
            createdAt: history.swapRequest.requester.createdAt.toISOString(),
            updatedAt: history.swapRequest.requester.updatedAt.toISOString(),
            lastLogin:
              history.swapRequest.requester.lastLogin?.toISOString() || null,
          },
          approver: history.swapRequest.approver
            ? {
                ...history.swapRequest.approver,
                createdAt: history.swapRequest.approver.createdAt.toISOString(),
                updatedAt: history.swapRequest.approver.updatedAt.toISOString(),
                lastLogin:
                  history.swapRequest.approver.lastLogin?.toISOString() || null,
              }
            : null,
          executor: history.swapRequest.executor
            ? {
                ...history.swapRequest.executor,
                createdAt: history.swapRequest.executor.createdAt.toISOString(),
                updatedAt: history.swapRequest.executor.updatedAt.toISOString(),
                lastLogin:
                  history.swapRequest.executor.lastLogin?.toISOString() || null,
              }
            : null,
        }
      : null,
  };
}

export class CardSwapService {
  /**
   * Create a new card swap request
   * Called by petugas at source station when they realize a card was given incorrectly
   */
  static async createSwapRequest(
    data: {
      purchaseId: string;
      targetStationId: string;
      expectedProductId: string;
      reason: string;
      notes?: string;
    },
    requestedBy: string,
  ) {
    // 1. Get purchase with all related data
    const purchase = await db.cardPurchase.findUnique({
      where: { id: data.purchaseId },
      include: {
        card: {
          include: {
            cardProduct: {
              include: {
                category: true,
                type: true,
              },
            },
          },
        },
        member: true,
        station: true,
      },
    });

    if (!purchase) {
      throw new NotFoundError("Purchase tidak ditemukan");
    }

    // 2. Validate card status - must be SOLD_ACTIVE
    if (purchase.card.status !== "SOLD_ACTIVE") {
      throw new ValidationError(
        `Kartu harus berstatus SOLD_ACTIVE untuk di-swap. Status saat ini: ${purchase.card.status}`,
      );
    }

    // 3. Check if there's already a pending swap request for this purchase
    const existingSwap = await db.cardSwapRequest.findFirst({
      where: {
        purchaseId: data.purchaseId,
        status: {
          in: ["PENDING_APPROVAL", "APPROVED"],
        },
      },
    });

    if (existingSwap) {
      throw new ValidationError(
        "Sudah ada swap request yang sedang diproses untuk purchase ini",
      );
    }

    // 4. Validate target station exists
    const targetStation = await db.station.findUnique({
      where: { id: data.targetStationId },
    });

    if (!targetStation) {
      throw new NotFoundError("Stasiun tujuan tidak ditemukan");
    }

    // 5. Validate expected product exists
    const expectedProduct = await db.cardProduct.findUnique({
      where: { id: data.expectedProductId },
      include: {
        category: true,
        type: true,
      },
    });

    if (!expectedProduct) {
      throw new NotFoundError("Produk kartu yang diharapkan tidak ditemukan");
    }

    // 6. Check if target station has available cards for the expected product
    const availableCardsCount = await db.card.count({
      where: {
        cardProductId: data.expectedProductId,
        status: "IN_STATION",
        deletedAt: null,
      },
    });

    if (availableCardsCount === 0) {
      throw new ValidationError(
        `Tidak ada kartu tersedia di ${targetStation.stationName} untuk produk ${expectedProduct.category.categoryName} - ${expectedProduct.type.typeName}`,
      );
    }

    // 7. Create swap request
    const swapRequest = await db.cardSwapRequest.create({
      data: {
        purchaseId: data.purchaseId,
        originalCardId: purchase.cardId,
        sourceStationId: purchase.stationId,
        targetStationId: data.targetStationId,
        expectedProductId: data.expectedProductId,
        reason: data.reason,
        notes: data.notes || null,
        requestedBy: requestedBy,
        status: "PENDING_APPROVAL",
      },
      include: {
        purchase: {
          include: {
            member: true,
            card: {
              include: {
                cardProduct: {
                  include: {
                    category: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
        sourceStation: true,
        targetStation: true,
        expectedProduct: {
          include: {
            category: true,
            type: true,
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    // TODO: Send notification to HO/Supervisor
    // await NotificationService.notifySwapRequestPending(swapRequest.id);

    return transformSwapRequestData(swapRequest);
  }

  /**
   * Approve a swap request
   * Called by HO/Supervisor
   */
  static async approveSwapRequest(swapRequestId: string, approvedBy: string) {
    // 1. Get swap request
    const swapRequest = await db.cardSwapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        targetStation: true,
        expectedProduct: {
          include: {
            category: true,
            type: true,
          },
        },
        purchase: {
          include: {
            card: true,
          },
        },
      },
    });

    if (!swapRequest) {
      throw new NotFoundError("Swap request tidak ditemukan");
    }

    // 2. Validate status
    if (swapRequest.status !== "PENDING_APPROVAL") {
      throw new ValidationError(
        `Swap request tidak dalam status PENDING_APPROVAL. Status saat ini: ${swapRequest.status}`,
      );
    }

    // 3. Validate card is still SOLD_ACTIVE
    if (swapRequest.purchase.card.status !== "SOLD_ACTIVE") {
      throw new ValidationError(
        `Kartu tidak lagi berstatus SOLD_ACTIVE. Status: ${swapRequest.purchase.card.status}`,
      );
    }

    // 4. Re-check availability of cards at target station
    const availableCards = await db.card.count({
      where: {
        cardProductId: swapRequest.expectedProductId,
        status: "IN_STATION",
        deletedAt: null,
      },
    });

    if (availableCards === 0) {
      throw new ValidationError(
        `Tidak ada kartu tersedia di ${swapRequest.targetStation.stationName} untuk produk ${swapRequest.expectedProduct.category.categoryName} - ${swapRequest.expectedProduct.type.typeName}`,
      );
    }

    // 5. Update swap request status
    const updated = await db.cardSwapRequest.update({
      where: { id: swapRequestId },
      data: {
        status: "APPROVED",
        approvedBy: approvedBy,
        approvedAt: new Date(),
      },
      include: {
        purchase: {
          include: {
            member: true,
            card: {
              include: {
                cardProduct: {
                  include: {
                    category: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
        sourceStation: true,
        targetStation: true,
        expectedProduct: {
          include: {
            category: true,
            type: true,
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    // TODO: Send notification to target station
    // await NotificationService.notifySwapRequestApproved(swapRequest.id);

    return transformSwapRequestData(updated);
  }

  /**
   * Reject a swap request
   * Called by HO/Supervisor
   */
  static async rejectSwapRequest(
    swapRequestId: string,
    rejectedBy: string,
    rejectionReason: string,
  ) {
    // 1. Get swap request
    const swapRequest = await db.cardSwapRequest.findUnique({
      where: { id: swapRequestId },
    });

    if (!swapRequest) {
      throw new NotFoundError("Swap request tidak ditemukan");
    }

    // 2. Validate status
    if (swapRequest.status !== "PENDING_APPROVAL") {
      throw new ValidationError(
        `Swap request tidak dalam status PENDING_APPROVAL. Status saat ini: ${swapRequest.status}`,
      );
    }

    // 3. Update swap request status
    const updated = await db.cardSwapRequest.update({
      where: { id: swapRequestId },
      data: {
        status: "REJECTED",
        rejectedBy: rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason,
      },
      include: {
        purchase: {
          include: {
            member: true,
            card: {
              include: {
                cardProduct: {
                  include: {
                    category: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
        sourceStation: true,
        targetStation: true,
        requester: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        rejecter: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    // TODO: Send notification to requester
    // await NotificationService.notifySwapRequestRejected(swapRequest.id);

    return transformSwapRequestData(updated);
  }

  /**
   * Execute card swap
   * Called by petugas at target station
   * This is the critical operation that performs the actual swap
   */
  static async executeSwap(
    swapRequestId: string,
    replacementCardId: string,
    executedBy: string,
  ) {
    return await db.$transaction(async (tx) => {
      // 1. Get swap request with all necessary data
      const swapRequest = await tx.cardSwapRequest.findUnique({
        where: { id: swapRequestId },
        include: {
          purchase: {
            include: {
              card: {
                include: {
                  cardProduct: {
                    include: {
                      category: true,
                      type: true,
                    },
                  },
                },
              },
              member: true,
            },
          },
          originalCard: {
            include: {
              cardProduct: {
                include: {
                  category: true,
                  type: true,
                },
              },
            },
          },
          expectedProduct: {
            include: {
              category: true,
              type: true,
            },
          },
          sourceStation: true,
          targetStation: true,
        },
      });

      if (!swapRequest) {
        throw new NotFoundError("Swap request tidak ditemukan");
      }

      // 2. Validate swap request status
      if (swapRequest.status !== "APPROVED") {
        throw new ValidationError(
          `Swap request harus di-approve terlebih dahulu. Status saat ini: ${swapRequest.status}`,
        );
      }

      // 3. Get and validate replacement card
      const replacementCard = await tx.card.findUnique({
        where: { id: replacementCardId },
        include: {
          cardProduct: {
            include: {
              category: true,
              type: true,
            },
          },
        },
      });

      if (!replacementCard) {
        throw new NotFoundError("Kartu pengganti tidak ditemukan");
      }

      // 4. Validate replacement card status
      if (replacementCard.status !== "IN_STATION") {
        throw new ValidationError(
          `Kartu pengganti harus berstatus IN_STATION. Status: ${replacementCard.status}`,
        );
      }

      // 5. Validate replacement card product matches expected
      if (replacementCard.cardProductId !== swapRequest.expectedProductId) {
        throw new ValidationError(
          `Produk kartu pengganti tidak sesuai. Diharapkan: ${swapRequest.expectedProduct.category.categoryName} - ${swapRequest.expectedProduct.type.typeName}, Diberikan: ${replacementCard.cardProduct.category.categoryName} - ${replacementCard.cardProduct.type.typeName}`,
        );
      }

      // 6. Snapshot before state for history
      const beforeSnapshot = {
        cardId: swapRequest.originalCardId,
        stationId: swapRequest.sourceStationId,
        cardStatus: swapRequest.originalCard.status,
        cardSerialNumber: swapRequest.originalCard.serialNumber,
      };

      // 7. RESTORE original card (return to inventory)
      await tx.card.update({
        where: { id: swapRequest.originalCardId },
        data: {
          status: "IN_STATION",
          memberId: null,
          purchaseDate: null,
          expiredDate: null,
          quotaTicket: 0,
          updatedBy: executedBy,
        },
      });

      // 8. UPDATE purchase record to point to new card and new station
      const purchase = swapRequest.purchase;
      const swapNote = `[SWAP] SN:${beforeSnapshot.cardSerialNumber} → SN:${replacementCard.serialNumber} | ${swapRequest.sourceStation.stationName} → ${swapRequest.targetStation.stationName}`;

      await tx.cardPurchase.update({
        where: { id: purchase.id },
        data: {
          cardId: replacementCardId,
          stationId: swapRequest.targetStationId,
          notes: purchase.notes ? `${purchase.notes}\n${swapNote}` : swapNote,
          updatedBy: executedBy,
        },
      });

      // 9. ACTIVATE replacement card
      const expiredDate = new Date();
      expiredDate.setDate(
        expiredDate.getDate() + replacementCard.cardProduct.masaBerlaku,
      );

      await tx.card.update({
        where: { id: replacementCardId },
        data: {
          status: "SOLD_ACTIVE",
          memberId: purchase.memberId,
          purchaseDate: new Date(),
          expiredDate: expiredDate,
          quotaTicket: replacementCard.cardProduct.totalQuota,
          updatedBy: executedBy,
        },
      });

      // 10. UPDATE source station inventory: REMOVED (Deprecated)
      /*
      const sourceInventory = await tx.cardInventory.findFirst(...)
      ...
      */

      const sourceInventoryChanges = {
        before: null,
        after: null,
      };

      // 11. UPDATE target station inventory: REMOVED (Deprecated)
      /*
      const targetInventory = await tx.cardInventory.findFirst(...)
      ...
      */

      const targetInventoryChanges = {
        before: null,
        after: null,
      };

      // 12. UPDATE swap request status
      await tx.cardSwapRequest.update({
        where: { id: swapRequestId },
        data: {
          status: "COMPLETED",
          replacementCardId: replacementCardId,
          executedBy: executedBy,
          executedAt: new Date(),
        },
      });

      // 13. CREATE history/audit trail
      await tx.cardSwapHistory.create({
        data: {
          swapRequestId: swapRequestId,
          purchaseId: purchase.id,
          beforeCardId: beforeSnapshot.cardId,
          beforeStationId: beforeSnapshot.stationId,
          beforeCardStatus: beforeSnapshot.cardStatus,
          afterCardId: replacementCardId,
          afterStationId: swapRequest.targetStationId,
          afterCardStatus: "SOLD_ACTIVE",
          inventoryChanges: {
            source: {
              stationId: swapRequest.sourceStationId,
              stationName: swapRequest.sourceStation.stationName,
              ...sourceInventoryChanges,
            },
            target: {
              stationId: swapRequest.targetStationId,
              stationName: swapRequest.targetStation.stationName,
              ...targetInventoryChanges,
            },
          },
          executedBy: executedBy,
        },
      });

      // Return complete swap request with updated relations
      const completedSwap = await tx.cardSwapRequest.findUnique({
        where: { id: swapRequestId },
        include: {
          purchase: {
            include: {
              member: true,
              card: {
                include: {
                  cardProduct: {
                    include: {
                      category: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
          originalCard: {
            include: {
              cardProduct: {
                include: {
                  category: true,
                  type: true,
                },
              },
            },
          },
          replacementCard: {
            include: {
              cardProduct: {
                include: {
                  category: true,
                  type: true,
                },
              },
            },
          },
          sourceStation: true,
          targetStation: true,
          requester: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          approver: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          executor: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      return transformSwapRequestData(completedSwap);
    });
  }

  /**
   * Get swap request by ID
   */
  static async getSwapRequestById(id: string) {
    const swapRequest = await db.cardSwapRequest.findUnique({
      where: { id },
      include: {
        purchase: {
          include: {
            member: true,
            card: {
              include: {
                cardProduct: {
                  include: {
                    category: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
        originalCard: {
          include: {
            cardProduct: {
              include: {
                category: true,
                type: true,
              },
            },
          },
        },
        replacementCard: {
          include: {
            cardProduct: {
              include: {
                category: true,
                type: true,
              },
            },
          },
        },
        sourceStation: true,
        targetStation: true,
        expectedProduct: {
          include: {
            category: true,
            type: true,
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        executor: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        rejecter: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!swapRequest) {
      throw new NotFoundError("Swap request tidak ditemukan");
    }

    return transformSwapRequestData(swapRequest);
  }

  /**
   * Get swap requests with filters
   */
  static async getSwapRequests(filters: {
    status?: string;
    sourceStationId?: string;
    targetStationId?: string;
    requestedBy?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.sourceStationId) {
      where.sourceStationId = filters.sourceStationId;
    }

    if (filters.targetStationId) {
      where.targetStationId = filters.targetStationId;
    }

    if (filters.requestedBy) {
      where.requestedBy = filters.requestedBy;
    }

    const [items, total] = await Promise.all([
      db.cardSwapRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          purchase: {
            include: {
              member: true,
              card: {
                include: {
                  cardProduct: {
                    include: {
                      category: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
          originalCard: {
            include: {
              cardProduct: {
                include: {
                  category: true,
                  type: true,
                },
              },
            },
          },
          replacementCard: {
            include: {
              cardProduct: {
                include: {
                  category: true,
                  type: true,
                },
              },
            },
          },
          sourceStation: true,
          targetStation: true,
          expectedProduct: {
            include: {
              category: true,
              type: true,
            },
          },
          requester: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          approver: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          executor: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      }),
      db.cardSwapRequest.count({ where }),
    ]);

    return {
      items: items.map(transformSwapRequestData),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get swap history for a purchase
   */
  static async getSwapHistory(purchaseId: string) {
    const history = await db.cardSwapHistory.findMany({
      where: { purchaseId },
      orderBy: {
        executedAt: "desc",
      },
      include: {
        swapRequest: {
          include: {
            sourceStation: true,
            targetStation: true,
            requester: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
            approver: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
            executor: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return history.map(transformSwapHistoryData);
  }

  /**
   * Cancel swap request
   * Can only be cancelled by requester if status is PENDING_APPROVAL
   */
  static async cancelSwapRequest(swapRequestId: string, userId: string) {
    const swapRequest = await db.cardSwapRequest.findUnique({
      where: { id: swapRequestId },
    });

    if (!swapRequest) {
      throw new NotFoundError("Swap request tidak ditemukan");
    }

    // Validate requester
    if (swapRequest.requestedBy !== userId) {
      throw new AuthorizationError(
        "Hanya pembuat request yang dapat membatalkan request",
      );
    }

    // Validate status
    if (swapRequest.status !== "PENDING_APPROVAL") {
      throw new ValidationError(
        "Hanya request dengan status PENDING_APPROVAL yang dapat dibatalkan",
      );
    }

    const cancelled = await db.cardSwapRequest.update({
      where: { id: swapRequestId },
      data: {
        status: "CANCELLED",
      },
      include: {
        purchase: {
          include: {
            member: true,
            card: {
              include: {
                cardProduct: {
                  include: {
                    category: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
        sourceStation: true,
        targetStation: true,
        requester: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return transformSwapRequestData(cancelled);
  }
}
