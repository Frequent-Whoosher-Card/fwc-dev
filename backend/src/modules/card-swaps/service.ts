import db from "../../config/db";
import { ValidationError, NotFoundError, AuthorizationError } from "../../utils/errors";

// Helper to safely convert Date to ISO string
function toISOStringOrNull(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date instanceof Date ? date.toISOString() : String(date);
}

// Helper functions to transform database objects to API response format
function transformSwapRequestData(swapRequest: any) {
  return {
    id: swapRequest.id,
    purchaseId: swapRequest.purchaseId,
    originalCardId: swapRequest.originalCardId,
    replacementCardId: swapRequest.replacementCardId,
    sourceStationId: swapRequest.sourceStationId,
    targetStationId: swapRequest.targetStationId,
    expectedProductId: swapRequest.expectedProductId,
    status: swapRequest.status,
    reason: swapRequest.reason,
    notes: swapRequest.notes,
    requestedBy: swapRequest.requestedBy,
    approvedBy: swapRequest.approvedBy,
    executedBy: swapRequest.executedBy,
    rejectedBy: swapRequest.rejectedBy,
    rejectionReason: swapRequest.rejectionReason,
    createdAt: toISOStringOrNull(swapRequest.createdAt),
    updatedAt: toISOStringOrNull(swapRequest.updatedAt),
    requestedAt: toISOStringOrNull(swapRequest.requestedAt),
    approvedAt: toISOStringOrNull(swapRequest.approvedAt),
    executedAt: toISOStringOrNull(swapRequest.executedAt),
    rejectedAt: toISOStringOrNull(swapRequest.rejectedAt),
    purchase: swapRequest.purchase
      ? {
          id: swapRequest.purchase.id,
          cardId: swapRequest.purchase.cardId,
          memberId: swapRequest.purchase.memberId,
          operatorId: swapRequest.purchase.operatorId,
          stationId: swapRequest.purchase.stationId,
          edcReferenceNumber: swapRequest.purchase.edcReferenceNumber,
          price: swapRequest.purchase.price,
          notes: swapRequest.purchase.notes,
          purchaseDate: toISOStringOrNull(swapRequest.purchase.purchaseDate),
          createdAt: toISOStringOrNull(swapRequest.purchase.createdAt),
          updatedAt: toISOStringOrNull(swapRequest.purchase.updatedAt),
          member: swapRequest.purchase.member
            ? {
                id: swapRequest.purchase.member.id,
                name: swapRequest.purchase.member.name,
                identityNumber: swapRequest.purchase.member.identityNumber,
              }
            : null,
          card: swapRequest.purchase.card
            ? {
                id: swapRequest.purchase.card.id,
                serialNumber: swapRequest.purchase.card.serialNumber,
                status: swapRequest.purchase.card.status,
                cardProduct: swapRequest.purchase.card.cardProduct
                  ? {
                      id: swapRequest.purchase.card.cardProduct.id,
                      totalQuota: swapRequest.purchase.card.cardProduct.totalQuota,
                      masaBerlaku: swapRequest.purchase.card.cardProduct.masaBerlaku,
                      price: swapRequest.purchase.card.cardProduct.price,
                      category: swapRequest.purchase.card.cardProduct.category
                        ? {
                            id: swapRequest.purchase.card.cardProduct.category.id,
                            categoryCode: swapRequest.purchase.card.cardProduct.category.categoryCode,
                            categoryName: swapRequest.purchase.card.cardProduct.category.categoryName,
                          }
                        : null,
                      type: swapRequest.purchase.card.cardProduct.type
                        ? {
                            id: swapRequest.purchase.card.cardProduct.type.id,
                            typeCode: swapRequest.purchase.card.cardProduct.type.typeCode,
                            typeName: swapRequest.purchase.card.cardProduct.type.typeName,
                          }
                        : null,
                    }
                  : null,
              }
            : null,
        }
      : null,
    originalCard: swapRequest.originalCard
      ? {
          id: swapRequest.originalCard.id,
          serialNumber: swapRequest.originalCard.serialNumber,
          status: swapRequest.originalCard.status,
          cardProduct: swapRequest.originalCard.cardProduct
            ? {
                id: swapRequest.originalCard.cardProduct.id,
                totalQuota: swapRequest.originalCard.cardProduct.totalQuota,
                masaBerlaku: swapRequest.originalCard.cardProduct.masaBerlaku,
                price: swapRequest.originalCard.cardProduct.price,
                category: swapRequest.originalCard.cardProduct.category
                  ? {
                      id: swapRequest.originalCard.cardProduct.category.id,
                      categoryCode: swapRequest.originalCard.cardProduct.category.categoryCode,
                      categoryName: swapRequest.originalCard.cardProduct.category.categoryName,
                    }
                  : null,
                type: swapRequest.originalCard.cardProduct.type
                  ? {
                      id: swapRequest.originalCard.cardProduct.type.id,
                      typeCode: swapRequest.originalCard.cardProduct.type.typeCode,
                      typeName: swapRequest.originalCard.cardProduct.type.typeName,
                    }
                  : null,
              }
            : null,
        }
      : null,
    replacementCard: swapRequest.replacementCard
      ? {
          id: swapRequest.replacementCard.id,
          serialNumber: swapRequest.replacementCard.serialNumber,
          status: swapRequest.replacementCard.status,
          cardProduct: swapRequest.replacementCard.cardProduct
            ? {
                id: swapRequest.replacementCard.cardProduct.id,
                totalQuota: swapRequest.replacementCard.cardProduct.totalQuota,
                masaBerlaku: swapRequest.replacementCard.cardProduct.masaBerlaku,
                price: swapRequest.replacementCard.cardProduct.price,
                category: swapRequest.replacementCard.cardProduct.category
                  ? {
                      id: swapRequest.replacementCard.cardProduct.category.id,
                      categoryCode: swapRequest.replacementCard.cardProduct.category.categoryCode,
                      categoryName: swapRequest.replacementCard.cardProduct.category.categoryName,
                    }
                  : null,
                type: swapRequest.replacementCard.cardProduct.type
                  ? {
                      id: swapRequest.replacementCard.cardProduct.type.id,
                      typeCode: swapRequest.replacementCard.cardProduct.type.typeCode,
                      typeName: swapRequest.replacementCard.cardProduct.type.typeName,
                    }
                  : null,
              }
            : null,
        }
      : null,
    sourceStation: swapRequest.sourceStation
      ? {
          id: swapRequest.sourceStation.id,
          stationCode: swapRequest.sourceStation.stationCode,
          stationName: swapRequest.sourceStation.stationName,
        }
      : null,
    targetStation: swapRequest.targetStation
      ? {
          id: swapRequest.targetStation.id,
          stationCode: swapRequest.targetStation.stationCode,
          stationName: swapRequest.targetStation.stationName,
        }
      : null,
    expectedProduct: swapRequest.expectedProduct
      ? {
          id: swapRequest.expectedProduct.id,
          totalQuota: swapRequest.expectedProduct.totalQuota,
          masaBerlaku: swapRequest.expectedProduct.masaBerlaku,
          price: swapRequest.expectedProduct.price,
          category: swapRequest.expectedProduct.category
            ? {
                id: swapRequest.expectedProduct.category.id,
                categoryCode: swapRequest.expectedProduct.category.categoryCode,
                categoryName: swapRequest.expectedProduct.category.categoryName,
              }
            : null,
          type: swapRequest.expectedProduct.type
            ? {
                id: swapRequest.expectedProduct.type.id,
                typeCode: swapRequest.expectedProduct.type.typeCode,
                typeName: swapRequest.expectedProduct.type.typeName,
              }
            : null,
        }
      : null,
    requester: swapRequest.requester
      ? {
          id: swapRequest.requester.id,
          fullName: swapRequest.requester.fullName,
          username: swapRequest.requester.username,
        }
      : null,
    approver: swapRequest.approver
      ? {
          id: swapRequest.approver.id,
          fullName: swapRequest.approver.fullName,
          username: swapRequest.approver.username,
        }
      : null,
    executor: swapRequest.executor
      ? {
          id: swapRequest.executor.id,
          fullName: swapRequest.executor.fullName,
          username: swapRequest.executor.username,
        }
      : null,
    rejecter: swapRequest.rejecter
      ? {
          id: swapRequest.rejecter.id,
          fullName: swapRequest.rejecter.fullName,
          username: swapRequest.rejecter.username,
        }
      : null,
  };
}

function transformSwapHistoryData(history: any) {
  return {
    id: history.id,
    swapRequestId: history.swapRequestId,
    originalCardId: history.originalCardId,
    replacementCardId: history.replacementCardId,
    executedBy: history.executedBy,
    executedAt: toISOStringOrNull(history.executedAt),
    swapRequest: history.swapRequest
      ? {
          id: history.swapRequest.id,
          status: history.swapRequest.status,
          reason: history.swapRequest.reason,
          createdAt: toISOStringOrNull(history.swapRequest.createdAt),
          requestedAt: toISOStringOrNull(history.swapRequest.requestedAt),
          approvedAt: toISOStringOrNull(history.swapRequest.approvedAt),
          executedAt: toISOStringOrNull(history.swapRequest.executedAt),
          sourceStation: history.swapRequest.sourceStation
            ? {
                id: history.swapRequest.sourceStation.id,
                stationCode: history.swapRequest.sourceStation.stationCode,
                stationName: history.swapRequest.sourceStation.stationName,
              }
            : null,
          targetStation: history.swapRequest.targetStation
            ? {
                id: history.swapRequest.targetStation.id,
                stationCode: history.swapRequest.targetStation.stationCode,
                stationName: history.swapRequest.targetStation.stationName,
              }
            : null,
          requester: history.swapRequest.requester
            ? {
                id: history.swapRequest.requester.id,
                fullName: history.swapRequest.requester.fullName,
                username: history.swapRequest.requester.username,
              }
            : null,
          approver: history.swapRequest.approver
            ? {
                id: history.swapRequest.approver.id,
                fullName: history.swapRequest.approver.fullName,
                username: history.swapRequest.approver.username,
              }
            : null,
          executor: history.swapRequest.executor
            ? {
                id: history.swapRequest.executor.id,
                fullName: history.swapRequest.executor.fullName,
                username: history.swapRequest.executor.username,
              }
            : null,
        }
      : null,
    originalCard: history.originalCard
      ? {
          id: history.originalCard.id,
          serialNumber: history.originalCard.serialNumber,
          status: history.originalCard.status,
        }
      : null,
    replacementCard: history.replacementCard
      ? {
          id: history.replacementCard.id,
          serialNumber: history.replacementCard.serialNumber,
          status: history.replacementCard.status,
        }
      : null,
    executor: history.executor
      ? {
          id: history.executor.id,
          fullName: history.executor.fullName,
          username: history.executor.username,
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
    requestedBy: string
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
        `Kartu harus berstatus SOLD_ACTIVE untuk di-swap. Status saat ini: ${purchase.card.status}`
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
        "Sudah ada swap request yang sedang diproses untuk purchase ini"
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
        `Tidak ada kartu tersedia di ${targetStation.stationName} untuk produk ${expectedProduct.category.categoryName} - ${expectedProduct.type.typeName}`
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
        `Swap request tidak dalam status PENDING_APPROVAL. Status saat ini: ${swapRequest.status}`
      );
    }

    // 3. Validate card is still SOLD_ACTIVE
    if (swapRequest.purchase.card.status !== "SOLD_ACTIVE") {
      throw new ValidationError(
        `Kartu tidak lagi berstatus SOLD_ACTIVE. Status: ${swapRequest.purchase.card.status}`
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
        `Tidak ada kartu tersedia di ${swapRequest.targetStation.stationName} untuk produk ${swapRequest.expectedProduct.category.categoryName} - ${swapRequest.expectedProduct.type.typeName}`
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
    rejectionReason: string
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
        `Swap request tidak dalam status PENDING_APPROVAL. Status saat ini: ${swapRequest.status}`
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
    executedBy: string
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
          `Swap request harus di-approve terlebih dahulu. Status saat ini: ${swapRequest.status}`
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
          `Kartu pengganti harus berstatus IN_STATION. Status: ${replacementCard.status}`
        );
      }

      // 5. Validate replacement card product matches expected
      if (replacementCard.cardProductId !== swapRequest.expectedProductId) {
        throw new ValidationError(
          `Produk kartu pengganti tidak sesuai. Diharapkan: ${swapRequest.expectedProduct.category.categoryName} - ${swapRequest.expectedProduct.type.typeName}, Diberikan: ${replacementCard.cardProduct.category.categoryName} - ${replacementCard.cardProduct.type.typeName}`
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
        expiredDate.getDate() + replacementCard.cardProduct.masaBerlaku
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

      // 10. UPDATE source station inventory (return original card)
      const sourceInventory = await tx.cardInventory.findFirst({
        where: {
          categoryId: swapRequest.originalCard.cardProduct.categoryId,
          typeId: swapRequest.originalCard.cardProduct.typeId,
          stationId: swapRequest.sourceStationId,
        },
      });

      const sourceInventoryChanges = {
        before: sourceInventory ? {
          cardAktif: sourceInventory.cardAktif,
          cardBelumTerjual: sourceInventory.cardBelumTerjual,
        } : null,
        after: null as any,
      };

      if (sourceInventory) {
        const updated = await tx.cardInventory.update({
          where: { id: sourceInventory.id },
          data: {
            cardAktif: { decrement: 1 },
            cardBelumTerjual: { increment: 1 },
            updatedBy: executedBy,
          },
        });
        sourceInventoryChanges.after = {
          cardAktif: updated.cardAktif,
          cardBelumTerjual: updated.cardBelumTerjual,
        };
      }

      // 11. UPDATE target station inventory (issue replacement card)
      const targetInventory = await tx.cardInventory.findFirst({
        where: {
          categoryId: replacementCard.cardProduct.categoryId,
          typeId: replacementCard.cardProduct.typeId,
          stationId: swapRequest.targetStationId,
        },
      });

      const targetInventoryChanges = {
        before: targetInventory ? {
          cardAktif: targetInventory.cardAktif,
          cardBelumTerjual: targetInventory.cardBelumTerjual,
        } : null,
        after: null as any,
      };

      if (targetInventory) {
        const updated = await tx.cardInventory.update({
          where: { id: targetInventory.id },
          data: {
            cardBelumTerjual: { decrement: 1 },
            cardAktif: { increment: 1 },
            updatedBy: executedBy,
          },
        });
        targetInventoryChanges.after = {
          cardAktif: updated.cardAktif,
          cardBelumTerjual: updated.cardBelumTerjual,
        };
      }

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
        "Hanya pembuat request yang dapat membatalkan request"
      );
    }

    // Validate status
    if (swapRequest.status !== "PENDING_APPROVAL") {
      throw new ValidationError(
        "Hanya request dengan status PENDING_APPROVAL yang dapat dibatalkan"
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
