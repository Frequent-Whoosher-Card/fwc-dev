import db from "../../config/db";
import { ValidationError, NotFoundError } from "../../utils/errors";
import { MemberModel } from "./model";
import { ActivityLogService } from "../activity-log/service";

export class MemberService {
  /**
   * Create new member
   */
  static async create(
    data: typeof MemberModel.createMemberBody.static,
    userId: string,
  ) {
    const member = await db.$transaction(async (tx) => {
      let finalIdentityNumber = data.identityNumber;

      // Handle Prefix based on Program Type
      if (data.programType) {
        const productType = await tx.productType.findFirst({
          where: {
            programType: data.programType as any,
            deletedAt: null,
          },
        });

        if (productType?.prefix) {
          finalIdentityNumber = `${productType.prefix}${data.identityNumber}`;
        }
      }

      const existing = await tx.member.findFirst({
        where: {
          identityNumber: finalIdentityNumber,
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ValidationError(
          `Member dengan identity number '${finalIdentityNumber}' sudah terdaftar`,
        );
      }

      const birthDateParsed = data.birthDate
        ? (() => {
            const [y, m, d] = data.birthDate.split("-").map(Number);
            return new Date(y, m - 1, d);
          })()
        : null;

      return await tx.member.create({
        data: {
          name: data.name,
          identityNumber: finalIdentityNumber,
          nationality: data.nationality || "INDONESIA",
          email: data.email || null,
          phone: data.phone || null,
          nippKai: data.nippKai || null,
          gender: data.gender || null,
          alamat: data.alamat || null,
          notes: data.notes || null,
          companyName: data.companyName ?? null,
          employeeTypeId: data.employeeTypeId ?? null,
          cityId: data.cityId ?? null,
          birthDate: birthDateParsed,
          programType: (data.programType as any) || null,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });

    const createdMember = await this.getById(member.id);

    // Activity Log
    await ActivityLogService.createActivityLog(
      userId,
      "CREATE_MEMBER",
      `Membuat member baru: ${createdMember.name} (${createdMember.identityNumber})`,
    );

    return createdMember;
  }

  /**
   * Get All Members (Paginated)
   */
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    gender?: string;
    hasNippKai?: string;
    employeeTypeId?: string;
    isDeleted?: boolean;
    programType?: string;
  }) {
    const {
      page,
      limit,
      search,
      startDate,
      endDate,
      gender,
      hasNippKai,
      employeeTypeId,
      isDeleted = false,
      programType,
    } = params;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const where: any = {
      deletedAt: isDeleted ? { not: null } : null,
    };

    // Filter by NIPKAI - only members that have NIPKAI
    if (hasNippKai === "true") {
      where.nippKai = {
        not: null,
      };
    }

    // Filter gender (enum: L or P)
    if (gender) {
      where.gender = gender as "L" | "P";
    }

    // Filter by employee type
    if (employeeTypeId) {
      where.employeeTypeId = employeeTypeId;
    }

    // Filter by program type
    if (programType) {
      where.programType = programType as any;
    }

    // Filter membership date (createdAt)
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        // Parse date string in local timezone
        const [year, month, day] = startDate.split("-").map(Number);
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (endDate) {
        // Parse date string in local timezone for end of day
        const [year, month, day] = endDate.split("-").map(Number);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      // First, find users whose fullName matches the search term (for Last Updated by)
      const matchingUsers = await db.user.findMany({
        where: {
          fullName: { contains: search, mode: "insensitive" },
        },
        select: { id: true },
      });
      const matchingUserIds = matchingUsers.map((u) => u.id);

      where.OR = [
        // Customer Name
        { name: { contains: search, mode: "insensitive" } },
        // Identity Number
        { identityNumber: { contains: search, mode: "insensitive" } },
        // Nationality
        { nationality: { contains: search, mode: "insensitive" } },
        // Email
        { email: { contains: search, mode: "insensitive" } },
        // Phone
        { phone: { contains: search, mode: "insensitive" } },
        // Address
        { alamat: { contains: search, mode: "insensitive" } },
        // Company name
        { companyName: { contains: search, mode: "insensitive" } },
      ];

      // Search by Gender (L or P)
      const searchUpper = search.toUpperCase().trim();
      if (
        searchUpper === "L" ||
        searchUpper === "LAKI" ||
        searchUpper === "LAKI-LAKI" ||
        searchUpper === "LAKI LAKI" ||
        searchUpper === "LAKI-LAKI"
      ) {
        where.OR.push({ gender: "L" });
      } else if (searchUpper === "P" || searchUpper === "PEREMPUAN") {
        where.OR.push({ gender: "P" });
      }

      // Add search by updatedBy (user fullName) - Last Updated by
      if (matchingUserIds.length > 0) {
        where.OR.push({
          updatedBy: { in: matchingUserIds },
        });
      }

      // Search by date fields (Membership Date and Last Updated)
      // Try to parse as date and search in date range
      const dateMatch = search.match(
        /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/,
      );
      if (dateMatch) {
        try {
          // Try different date formats
          let searchDate: Date | null = null;
          const dateStr = dateMatch[0];

          if (dateStr.includes("-")) {
            // YYYY-MM-DD or DD-MM-YYYY
            const parts = dateStr.split("-");
            if (parts[0].length === 4) {
              // YYYY-MM-DD
              searchDate = new Date(
                parseInt(parts[0]),
                parseInt(parts[1]) - 1,
                parseInt(parts[2]),
              );
            } else {
              // DD-MM-YYYY
              searchDate = new Date(
                parseInt(parts[2]),
                parseInt(parts[1]) - 1,
                parseInt(parts[0]),
              );
            }
          } else if (dateStr.includes("/")) {
            // DD/MM/YYYY
            const parts = dateStr.split("/");
            searchDate = new Date(
              parseInt(parts[2]),
              parseInt(parts[1]) - 1,
              parseInt(parts[0]),
            );
          }

          if (searchDate && !isNaN(searchDate.getTime())) {
            const startOfDay = new Date(searchDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(searchDate);
            endOfDay.setHours(23, 59, 59, 999);

            where.OR.push(
              // Membership Date (createdAt)
              {
                createdAt: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
              // Last Updated (updatedAt)
              {
                updatedAt: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            );
          }
        } catch (error) {
          // Ignore date parsing errors, continue with text search
        }
      }
    }

    const [items, total] = await Promise.all([
      db.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          employeeType: {
            select: { id: true, code: true, name: true },
          },
          city: {
            select: { id: true, name: true },
          },
        },
      }),
      db.member.count({ where }),
    ]);

    // Fetch user names for createdBy/updatedBy/deletedBy
    const userIds = new Set<string>();
    items.forEach((i) => {
      if (i.createdBy) userIds.add(i.createdBy);
      if (i.updatedBy) userIds.add(i.updatedBy);
      if (i.deletedBy) userIds.add(i.deletedBy);
    });

    const users = await db.user.findMany({
      where: { id: { in: [...userIds] } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const mappedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      identityNumber: item.identityNumber,
      nationality: item.nationality,
      email: item.email,
      phone: item.phone,
      nippKai: item.nippKai,
      gender: item.gender,
      alamat: item.alamat,
      notes: item.notes,
      companyName: item.companyName ?? null,
      employeeTypeId: item.employeeTypeId ?? null,
      employeeType: item.employeeType
        ? {
            id: item.employeeType.id,
            code: item.employeeType.code,
            name: item.employeeType.name,
          }
        : null,
      cityId: item.cityId ?? null,
      city: item.city ? { id: item.city.id, name: item.city.name } : null,
      birthDate: item.birthDate ? item.birthDate.toISOString() : null,
      programType: item.programType,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      ...(item.deletedAt && {
        deletedAt: item.deletedAt.toISOString(),
        deletedByName: item.deletedBy
          ? userMap.get(item.deletedBy) || null
          : null,
      }),
      createdByName: item.createdBy
        ? userMap.get(item.createdBy) || null
        : null,
      updatedByName: item.updatedBy
        ? userMap.get(item.updatedBy) || null
        : null,
    }));

    return {
      items: mappedItems,
      pagination: {
        total,
        ...(page && { page }),
        ...(limit && { limit }),
        ...(page && limit && { totalPages: Math.ceil(total / limit) }),
      },
    };
  }

  static async getById(id: string) {
    const member = await db.member.findUnique({
      where: { id },
      include: {
        employeeType: {
          select: { id: true, code: true, name: true },
        },
        city: {
          select: { id: true, name: true },
        },
      },
    });

    if (!member || member.deletedAt) {
      throw new NotFoundError("Member tidak ditemukan");
    }

    const [creator, updater] = await Promise.all([
      member.createdBy
        ? db.user.findUnique({
            where: { id: member.createdBy },
            select: { fullName: true },
          })
        : null,
      member.updatedBy
        ? db.user.findUnique({
            where: { id: member.updatedBy },
            select: { fullName: true },
          })
        : null,
    ]);

    return {
      id: member.id,
      name: member.name,
      identityNumber: member.identityNumber,
      nationality: member.nationality,
      email: member.email,
      phone: member.phone,
      nippKai: member.nippKai,
      gender: member.gender,
      alamat: member.alamat,
      notes: member.notes,
      companyName: member.companyName ?? null,
      employeeTypeId: member.employeeTypeId ?? null,
      employeeType: member.employeeType
        ? {
            id: member.employeeType.id,
            code: member.employeeType.code,
            name: member.employeeType.name,
          }
        : null,
      cityId: member.cityId ?? null,
      city: member.city ? { id: member.city.id, name: member.city.name } : null,
      birthDate: member.birthDate ? member.birthDate.toISOString() : null,
      programType: member.programType,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
      createdByName: creator?.fullName || null,
      updatedByName: updater?.fullName || null,
    };
  }

  /**
   * Update Member
   */
  static async update(
    id: string,
    data: typeof MemberModel.updateMemberBody.static,
    userId: string,
  ) {
    await db.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { id } });
      if (!member || member.deletedAt) {
        throw new NotFoundError("Member tidak ditemukan");
      }

      if (
        data.identityNumber &&
        data.identityNumber !== member.identityNumber
      ) {
        const existing = await tx.member.findFirst({
          where: {
            identityNumber: data.identityNumber,
            deletedAt: null,
            id: { not: id },
          },
        });

        if (existing) {
          throw new ValidationError(
            `Member dengan identity number '${data.identityNumber}' sudah terdaftar`,
          );
        }
      }

      const updateData: Record<string, unknown> = {
        name: data.name,
        identityNumber: data.identityNumber,
        nationality: data.nationality,
        email: data.email,
        phone: data.phone,
        nippKai: data.nippKai,
        gender: data.gender,
        alamat: data.alamat,
        notes: data.notes ?? null,
        updatedBy: userId,
        updatedAt: new Date(),
      };
      if (data.companyName !== undefined) {
        updateData.companyName = data.companyName;
      }
      if (data.employeeTypeId !== undefined) {
        updateData.employeeTypeId = data.employeeTypeId;
      }
      if (data.cityId !== undefined) {
        updateData.cityId = data.cityId;
      }
      if (data.birthDate !== undefined) {
        updateData.birthDate = data.birthDate
          ? (() => {
              const [y, m, d] = data.birthDate!.split("-").map(Number);
              return new Date(y, m - 1, d);
            })()
          : null;
      }
      if (data.programType !== undefined) {
        updateData.programType = data.programType as any;
      }
      await tx.member.update({
        where: { id },
        data: updateData as any,
      });
    });

    const updatedMember = await this.getById(id);

    // Activity Log
    await ActivityLogService.createActivityLog(
      userId,
      "UPDATE_MEMBER",
      `Memperbarui member: ${updatedMember.name} (${updatedMember.identityNumber})`,
    );

    return updatedMember;
  }

  /**
   * Delete Member (Soft Delete)
   * @param notes - Alasan penghapusan (wajib, disimpan di member.notes)
   */
  static async delete(id: string, userId: string, notes: string) {
    const trimmedNotes = notes?.trim() ?? "";
    if (!trimmedNotes) {
      throw new ValidationError("Alasan penghapusan wajib diisi");
    }

    return await db.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { id } });
      if (!member || member.deletedAt) {
        throw new NotFoundError("Member tidak ditemukan");
      }

      const activeCards = await tx.card.count({
        where: {
          memberId: id,
          deletedAt: null,
          status: {
            in: ["SOLD_ACTIVE", "SOLD_INACTIVE"],
          },
        },
      });

      if (activeCards > 0) {
        throw new ValidationError(
          `Tidak dapat menghapus member. Member memiliki ${activeCards} kartu aktif.`,
        );
      }

      await tx.member.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
          notes: trimmedNotes,
        },
      });

      // Activity Log - using member data before update (it was fetched above)
      await ActivityLogService.createActivityLog(
        userId,
        "DELETE_MEMBER",
        `Menghapus member: ${member.name} (${member.identityNumber}). Alasan: ${trimmedNotes}`,
      );

      return { success: true, message: "Member berhasil dihapus" };
    });
  }

  /**
   * Block Member's Card
   */
  static async blockCard(
    memberId: string,
    cardId: string,
    userId: string,
    notes?: string,
  ) {
    return await db.$transaction(async (tx) => {
      // Find card and verify ownership
      const card = await tx.card.findFirst({
        where: {
          id: cardId,
          memberId: memberId,
          deletedAt: null,
        },
      });

      if (!card) {
        throw new NotFoundError(
          "Card not found or does not belong to this member",
        );
      }

      if (card.status === "BLOCKED") {
        throw new ValidationError("Card is already blocked");
      }

      // Update status to BLOCKED
      await tx.card.update({
        where: { id: cardId },
        data: {
          status: "BLOCKED",
          updatedBy: userId,
          updatedAt: new Date(),
          notes: `${card.notes ? card.notes + "\n" : ""}[BLOCKED]${notes ? ": " + notes : ""}`,
        },
      });

      // Activity Log
      await ActivityLogService.createActivityLog(
        userId,
        "BLOCK_CARD",
        `Memblokir kartu ${card.serialNumber} milik member ID ${memberId}.${notes ? " Alasan: " + notes : ""}`,
      );

      return { success: true, message: "Card blocked successfully" };
    });
  }

  /**
   * Unblock Member's Card
   */
  static async unblockCard(
    memberId: string,
    cardId: string,
    userId: string,
    notes?: string,
  ) {
    return await db.$transaction(async (tx) => {
      // Find card and verify ownership
      const card = await tx.card.findFirst({
        where: {
          id: cardId,
          memberId: memberId,
          deletedAt: null,
        },
      });

      if (!card) {
        throw new NotFoundError(
          "Card not found or does not belong to this member",
        );
      }

      if (card.status !== "BLOCKED") {
        throw new ValidationError("Card is not blocked");
      }

      // Update status back to SOLD_ACTIVE
      await tx.card.update({
        where: { id: cardId },
        data: {
          status: "SOLD_ACTIVE",
          updatedBy: userId,
          updatedAt: new Date(),
          notes: `${card.notes ? card.notes + "\n" : ""}[UNBLOCKED]${notes ? ": " + notes : ""}`,
        },
      });

      // Activity Log
      await ActivityLogService.createActivityLog(
        userId,
        "UNBLOCK_CARD",
        `Membuka blokir kartu ${card.serialNumber} milik member ID ${memberId}.${notes ? " Alasan: " + notes : ""}`,
      );

      return { success: true, message: "Card unblocked successfully" };
    });
  }

  /**
   * Extract KTP fields using OCR
   */
  /**
   * Detect and crop KTP from image
   */
  static async detectKTP(
    imageFile: File,
    returnMultiple: boolean = false,
    minConfidence: number = 0.5,
  ): Promise<typeof MemberModel.ktpDetectionResponse.static> {
    const startTime = performance.now();
    console.log("🔍 [KTP Detection] Memulai deteksi KTP...");

    // Import services (lazy import to avoid circular dependencies)
    const { ktpDetectionService } =
      await import("../../services/ktp_detection_service");
    const { tempStorage } = await import("../../utils/temp_storage");

    try {
      // Use cached detection daemon service (model loaded once, reused for all requests)
      const detectionStartTime = performance.now();
      const result = await ktpDetectionService.detectAndCrop(
        imageFile,
        returnMultiple,
        minConfidence,
      );

      if (!result.success) {
        throw new Error(result.error || "KTP detection failed");
      }

      // Generate session ID for temporary storage
      const sessionId = tempStorage.generateSessionId();

      // Store cropped image(s) temporarily
      if (returnMultiple && result.cropped_images) {
        // Multiple detections
        if (!result.original_size) {
          throw new Error("Invalid detection response: missing original_size");
        }

        await tempStorage.storeImages(
          sessionId,
          result.cropped_images.map((img) => ({
            croppedImage: img.cropped_image,
            bbox: img.bbox,
            originalSize: result.original_size!,
            confidence: img.confidence,
          })),
        );

        const detectionTime = performance.now() - detectionStartTime;
        const totalTime = performance.now() - startTime;
        console.log(
          `✅ [KTP Detection] Deteksi selesai dalam ${detectionTime.toFixed(2)}ms`,
        );
        console.log(
          `✅ [KTP Detection] Total waktu (termasuk penyimpanan): ${totalTime.toFixed(2)}ms`,
        );
        console.log(
          `📊 [KTP Detection] Jumlah KTP terdeteksi: ${result.cropped_images.length}`,
        );

        return {
          success: true,
          data: {
            sessionId,
            cropped_images: result.cropped_images,
            original_size: result.original_size,
          },
          message: `Detected ${result.cropped_images.length} KTP(s) successfully`,
        };
      } else {
        // Single detection
        if (!result.cropped_image || !result.bbox || !result.original_size) {
          throw new Error("Invalid detection response");
        }

        await tempStorage.storeImage(
          sessionId,
          result.cropped_image,
          result.bbox,
          result.original_size,
          result.confidence,
        );

        const detectionTime = performance.now() - detectionStartTime;
        const totalTime = performance.now() - startTime;
        console.log(
          `✅ [KTP Detection] Deteksi selesai dalam ${detectionTime.toFixed(2)}ms`,
        );
        console.log(
          `✅ [KTP Detection] Total waktu (termasuk penyimpanan): ${totalTime.toFixed(2)}ms`,
        );
        console.log(
          `📊 [KTP Detection] Confidence: ${result.confidence?.toFixed(2)}`,
        );

        return {
          success: true,
          data: {
            sessionId,
            cropped_image: result.cropped_image,
            bbox: result.bbox,
            original_size: result.original_size,
            confidence: result.confidence || undefined,
          },
          message: "KTP detected and cropped successfully",
        };
      }
    } catch (error) {
      const totalTime = performance.now() - startTime;
      console.error(
        `❌ [KTP Detection] Gagal setelah ${totalTime.toFixed(2)}ms`,
      );
      if (error instanceof Error) {
        console.error(`❌ [KTP Detection] Error: ${error.message}`);
        throw new ValidationError(`KTP detection failed: ${error.message}`);
      }
      throw new ValidationError("KTP detection failed: Unknown error");
    }
  }

  /**
   * Extract KTP fields using OCR
   * Supports File upload, base64 cropped image, or sessionId
   */
  static async extractKTPFields(
    imageFileOrBase64OrSessionId: File | string,
    isSessionId: boolean = false,
  ): Promise<typeof MemberModel.ocrExtractResponse.static> {
    const startTime = performance.now();
    console.log("📝 [KTP Extraction] Memulai ekstraksi data KTP...");

    // Import services (lazy import to avoid circular dependencies)
    const { ocrService } = await import("../../services/ocr_service");
    const { tempStorage } = await import("../../utils/temp_storage");

    try {
      let fileObj: File;
      const prepStartTime = performance.now();

      // Handle sessionId, base64 string, or File object
      if (isSessionId && typeof imageFileOrBase64OrSessionId === "string") {
        // SessionId - retrieve from temp storage
        const stored = await tempStorage.getImage(imageFileOrBase64OrSessionId);
        if (!stored) {
          throw new Error(
            "Session expired or not found. Please re-upload the image.",
          );
        }
        // Convert stored base64 to File
        const base64Data = stored.croppedImage.replace(
          /^data:image\/\w+;base64,/,
          "",
        );
        const buffer = Buffer.from(base64Data, "base64");
        fileObj = new File([buffer], "cropped_ktp.jpg", { type: "image/jpeg" });

        // Cleanup after use (optional - can also let TTL handle it)
        // await tempStorage.deleteImage(imageFileOrBase64OrSessionId);
      } else if (typeof imageFileOrBase64OrSessionId === "string") {
        // Base64 string - convert to File
        const base64Data = imageFileOrBase64OrSessionId.replace(
          /^data:image\/\w+;base64,/,
          "",
        );
        const buffer = Buffer.from(base64Data, "base64");
        fileObj = new File([buffer], "cropped_ktp.jpg", { type: "image/jpeg" });
      } else {
        // File object
        fileObj = imageFileOrBase64OrSessionId;
      }

      const prepTime = performance.now() - prepStartTime;
      console.log(
        `⏱️  [KTP Extraction] Waktu persiapan file: ${prepTime.toFixed(2)}ms`,
      );

      // Use cached OCR daemon service (model loaded once, reused for all requests)
      const ocrStartTime = performance.now();
      const result = await ocrService.processImage(fileObj);
      const ocrTime = performance.now() - ocrStartTime;

      if (!result.success) {
        throw new Error(result.error || "OCR extraction failed");
      }

      const totalTime = performance.now() - startTime;
      console.log(
        `✅ [KTP Extraction] OCR processing selesai dalam ${ocrTime.toFixed(2)}ms`,
      );
      console.log(`✅ [KTP Extraction] Total waktu: ${totalTime.toFixed(2)}ms`);
      console.log(
        `📊 [KTP Extraction] Data terektrak: NIK=${result.data?.identityNumber || "N/A"}, Nama=${result.data?.name || "N/A"}`,
      );

      return {
        success: true,
        data: {
          identityNumber: result.data?.identityNumber || null,
          name: result.data?.name || null,
          gender: result.data?.gender || null,
          alamat: result.data?.alamat || null,
        },
        raw: result.raw,
        message: "KTP fields extracted successfully",
      };
    } catch (error) {
      const totalTime = performance.now() - startTime;
      console.error(
        `❌ [KTP Extraction] Gagal setelah ${totalTime.toFixed(2)}ms`,
      );
      if (error instanceof Error) {
        console.error(`❌ [KTP Extraction] Error: ${error.message}`);
        throw new ValidationError(`OCR extraction failed: ${error.message}`);
      }
      throw new ValidationError("OCR extraction failed: Unknown error");
    }
  }
}
