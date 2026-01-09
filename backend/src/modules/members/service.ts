<<<<<<< HEAD
import db from "../../config/db";
import { ValidationError, NotFoundError } from "../../utils/errors";
import { MemberModel } from "./model";
import { spawn } from "bun";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export class MemberService {
  /**
   * Create new member
   */
  static async create(
    data: typeof MemberModel.createMemberBody.static,
    userId: string
  ) {
    // Check duplicate identityNumber
    const existing = await db.member.findFirst({
      where: {
        identityNumber: data.identityNumber,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ValidationError(
        `Member dengan identity number '${data.identityNumber}' sudah terdaftar`
      );
    }

    const member = await db.member.create({
      data: {
        name: data.name,
        identityNumber: data.identityNumber,
        nationality: data.nationality || "INDONESIA",
        email: data.email || null,
        phone: data.phone || null,
        nippKai: data.nippKai || null,
        gender: data.gender || null,
        alamat: data.alamat || null,
        notes: data.notes || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return await this.getById(member.id);
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
  }) {
    const { page, limit, search, startDate, endDate, gender } = params;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const where: any = {
      deletedAt: null, // Soft delete filter
    };

    // Filter gender
    if (gender) {
      where.gender = { 
        equals: gender, 
        mode: "insensitive" 
      };
    }

    // Filter membership date (createdAt)
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        // Parse date string in local timezone
        const [year, month, day] = startDate.split('-').map(Number);
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (endDate) {
        // Parse date string in local timezone for end of day
        const [year, month, day] = endDate.split('-').map(Number);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      // First, find users whose fullName matches the search term
      const matchingUsers = await db.user.findMany({
        where: {
          fullName: { contains: search, mode: "insensitive" },
        },
        select: { id: true },
      });
      const matchingUserIds = matchingUsers.map((u) => u.id);

      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { identityNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];

      // Add search by updatedBy (user fullName)
      if (matchingUserIds.length > 0) {
        where.OR.push({
          updatedBy: { in: matchingUserIds },
        });
      }
    }

    const [items, total] = await Promise.all([
      db.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.member.count({ where }),
    ]);

    // Fetch user names for createdBy/updatedBy
    const userIds = new Set<string>();
    items.forEach((i) => {
      if (i.createdBy) userIds.add(i.createdBy);
      if (i.updatedBy) userIds.add(i.updatedBy);
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
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
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

  /**
   * Get Detail Member
   */
  static async getById(id: string) {
    const member = await db.member.findUnique({
      where: { id },
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
    userId: string
  ) {
    const member = await db.member.findUnique({ where: { id } });
    if (!member || member.deletedAt) {
      throw new NotFoundError("Member tidak ditemukan");
    }

    // Check duplicate identityNumber if it's being updated
    if (data.identityNumber && data.identityNumber !== member.identityNumber) {
      const existing = await db.member.findFirst({
        where: {
          identityNumber: data.identityNumber,
          deletedAt: null,
          id: { not: id }, // Exclude current member
        },
      });

      if (existing) {
        throw new ValidationError(
          `Member dengan identity number '${data.identityNumber}' sudah terdaftar`
        );
      }
    }

    await db.member.update({
      where: { id },
      data: {
        name: data.name,
        identityNumber: data.identityNumber,
        nationality: data.nationality,
        email: data.email,
        phone: data.phone,
        nippKai: data.nippKai,
        gender: data.gender,
        alamat: data.alamat,
        notes: data.notes || null,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    return await this.getById(id);
  }

  /**
   * Delete Member (Soft Delete)
   */
  static async delete(id: string, userId: string) {
    const member = await db.member.findUnique({ where: { id } });
    if (!member || member.deletedAt) {
      throw new NotFoundError("Member tidak ditemukan");
    }

    // Check if member has active cards
    const activeCards = await db.card.count({
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
        `Tidak dapat menghapus member. Member memiliki ${activeCards} kartu aktif.`
      );
    }

    await db.member.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { success: true, message: "Member berhasil dihapus" };
  }

  /**
   * Extract KTP fields using OCR
   */
  static async extractKTPFields(imageFile: File): Promise<typeof MemberModel.ocrExtractResponse.static> {
    // Path ke Python script (relatif dari backend directory)
    const pythonScriptPath = join(process.cwd(), "scripts/ocr/ktp_extract.py");
    
    // Simpan file temporary
    const tempDir = tmpdir();
    const tempFilePath = join(tempDir, `ktp_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);
    
    try {
      // Write file ke temporary location
      const arrayBuffer = await imageFile.arrayBuffer();
      await writeFile(tempFilePath, Buffer.from(arrayBuffer));

      // Call Python script via subprocess
      // Set environment variable to suppress warnings
      const pythonProcess = spawn([
        "python3",
        pythonScriptPath,
        tempFilePath,
      ], {
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          DISABLE_MODEL_SOURCE_CHECK: "True",
          PYTHONUNBUFFERED: "1",
          SUPPRESS_OCR_LOGS: "1", // Suppress print statements in Python
        },
      });

      // Read output (JSON should be in stdout, last line)
      // Ignore stderr as it contains warnings/logs from PaddleOCR
      const output = await new Response(pythonProcess.stdout).text();
      
      // Read stderr but only use it if process fails (ignore warnings)
      let errorOutput = '';
      try {
        errorOutput = await new Response(pythonProcess.stderr).text();
      } catch {
        // Ignore stderr read errors
      }

      // Wait for process to finish
      const exitCode = await pythonProcess.exited;

      // Cleanup temporary file
      try {
        await unlink(tempFilePath);
      } catch (e) {
        // Ignore cleanup errors
      }

      // Extract JSON from output (might have warnings/logs before JSON)
      // JSON should be the last line or last valid JSON object
      let jsonOutput = output.trim();
      
      // Try to find JSON in output (might be mixed with warnings)
      const jsonMatch = jsonOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonOutput = jsonMatch[0];
      }

      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(jsonOutput);
      } catch (parseError) {
        // If parsing fails and exit code is non-zero, it's a real error
        if (exitCode !== 0) {
          // Only use stderr if it contains actual error (not warnings)
          const actualError = errorOutput.includes('Error:') || errorOutput.includes('Traceback') 
            ? errorOutput 
            : "OCR process failed";
          throw new Error(`OCR process failed: ${actualError}`);
        }
        // If exit code is 0 but can't parse, it's a parsing error
        throw new Error(`Failed to parse OCR output: ${parseError}`);
      }

      // Check if Python script returned error response
      if (!result.success) {
        throw new Error(result.error || "OCR extraction failed");
      }
      
      // If exit code is non-zero but result.success is true, log warning but continue
      if (exitCode !== 0) {
        console.warn(`OCR process exited with code ${exitCode} but returned success. Stderr: ${errorOutput.substring(0, 200)}`);
      }

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
      // Cleanup temporary file on error
      try {
        await unlink(tempFilePath);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (error instanceof Error) {
        throw new ValidationError(`OCR extraction failed: ${error.message}`);
      }
      throw new ValidationError("OCR extraction failed: Unknown error");
    }
  }
}

=======
import db from "../../config/db";
import { ValidationError, NotFoundError } from "../../utils/errors";
import { MemberModel } from "./model";

export class MemberService {
  /**
   * Create new member
   */
  static async create(
    data: typeof MemberModel.createMemberBody.static,
    userId: string
  ) {
    // Check duplicate identityNumber
    const existing = await db.member.findFirst({
      where: {
        identityNumber: data.identityNumber,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ValidationError(
        `Member dengan identity number '${data.identityNumber}' sudah terdaftar`
      );
    }

    const member = await db.member.create({
      data: {
        name: data.name,
        identityNumber: data.identityNumber,
        nationality: data.nationality || "INDONESIA",
        email: data.email || null,
        phone: data.phone || null,
        nippKai: data.nippKai || null,
        gender: data.gender || null,
        alamat: data.alamat || null,
        notes: data.notes || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return await this.getById(member.id);
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
  }) {
    const { page, limit, search, startDate, endDate, gender, hasNippKai } = params;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const where: any = {
      deletedAt: null, // Soft delete filter
    };

    // Filter by NIPKAI - only members that have NIPKAI
    if (hasNippKai === 'true') {
      where.nippKai = {
        not: null,
      };
    }

    // Filter gender (enum: L or P)
    if (gender) {
      where.gender = gender as "L" | "P";
    }

    // Filter membership date (createdAt)
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        // Parse date string in local timezone
        const [year, month, day] = startDate.split('-').map(Number);
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (endDate) {
        // Parse date string in local timezone for end of day
        const [year, month, day] = endDate.split('-').map(Number);
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
      ];

      // Search by Gender (L or P)
      const searchUpper = search.toUpperCase().trim();
      if (searchUpper === 'L' || searchUpper === 'LAKI' || searchUpper === 'LAKI-LAKI' || searchUpper === 'LAKI LAKI' || searchUpper === 'LAKI-LAKI') {
        where.OR.push({ gender: 'L' });
      } else if (searchUpper === 'P' || searchUpper === 'PEREMPUAN') {
        where.OR.push({ gender: 'P' });
      }

      // Add search by updatedBy (user fullName) - Last Updated by
      if (matchingUserIds.length > 0) {
        where.OR.push({
          updatedBy: { in: matchingUserIds },
        });
      }

      // Search by date fields (Membership Date and Last Updated)
      // Try to parse as date and search in date range
      const dateMatch = search.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/);
      if (dateMatch) {
        try {
          // Try different date formats
          let searchDate: Date | null = null;
          const dateStr = dateMatch[0];
          
          if (dateStr.includes('-')) {
            // YYYY-MM-DD or DD-MM-YYYY
            const parts = dateStr.split('-');
            if (parts[0].length === 4) {
              // YYYY-MM-DD
              searchDate = new Date(parts[0], parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
              // DD-MM-YYYY
              searchDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
          } else if (dateStr.includes('/')) {
            // DD/MM/YYYY
            const parts = dateStr.split('/');
            searchDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
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
              }
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
      }),
      db.member.count({ where }),
    ]);

    // Fetch user names for createdBy/updatedBy
    const userIds = new Set<string>();
    items.forEach((i) => {
      if (i.createdBy) userIds.add(i.createdBy);
      if (i.updatedBy) userIds.add(i.updatedBy);
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
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
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

  /**
   * Get Detail Member
   */
  static async getById(id: string) {
    const member = await db.member.findUnique({
      where: { id },
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
    userId: string
  ) {
    const member = await db.member.findUnique({ where: { id } });
    if (!member || member.deletedAt) {
      throw new NotFoundError("Member tidak ditemukan");
    }

    // Check duplicate identityNumber if it's being updated
    if (data.identityNumber && data.identityNumber !== member.identityNumber) {
      const existing = await db.member.findFirst({
        where: {
          identityNumber: data.identityNumber,
          deletedAt: null,
          id: { not: id }, // Exclude current member
        },
      });

      if (existing) {
        throw new ValidationError(
          `Member dengan identity number '${data.identityNumber}' sudah terdaftar`
        );
      }
    }

    await db.member.update({
      where: { id },
      data: {
        name: data.name,
        identityNumber: data.identityNumber,
        nationality: data.nationality,
        email: data.email,
        phone: data.phone,
        nippKai: data.nippKai,
        gender: data.gender,
        alamat: data.alamat,
        notes: data.notes || null,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    return await this.getById(id);
  }

  /**
   * Delete Member (Soft Delete)
   */
  static async delete(id: string, userId: string) {
    const member = await db.member.findUnique({ where: { id } });
    if (!member || member.deletedAt) {
      throw new NotFoundError("Member tidak ditemukan");
    }

    // Check if member has active cards
    const activeCards = await db.card.count({
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
        `Tidak dapat menghapus member. Member memiliki ${activeCards} kartu aktif.`
      );
    }

    await db.member.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { success: true, message: "Member berhasil dihapus" };
  }

  /**
   * Extract KTP fields using OCR
   */
  static async extractKTPFields(imageFile: File): Promise<typeof MemberModel.ocrExtractResponse.static> {
    // Import OCR service (lazy import to avoid circular dependencies)
    const { ocrService } = await import("../../services/ocr_service");
    
    try {
      // Use cached OCR daemon service (model loaded once, reused for all requests)
      const result = await ocrService.processImage(imageFile);

      if (!result.success) {
        throw new Error(result.error || "OCR extraction failed");
      }

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
      if (error instanceof Error) {
        throw new ValidationError(`OCR extraction failed: ${error.message}`);
      }
      throw new ValidationError("OCR extraction failed: Unknown error");
    }
  }
}

>>>>>>> da9ad286010c29f3d8e17c72ef368bf0864559eb
