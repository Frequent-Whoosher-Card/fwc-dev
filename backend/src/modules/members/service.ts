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
    const { page = 1, limit = 10, search, startDate, endDate, gender } = params;
    const skip = (page - 1) * limit;

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
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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

    await db.member.update({
      where: { id },
      data: {
        name: data.name,
        nationality: data.nationality,
        email: data.email,
        phone: data.phone,
        nippKai: data.nippKai,
        gender: data.gender,
        alamat: data.alamat,
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
}

