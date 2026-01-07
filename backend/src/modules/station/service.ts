import db from "../../config/db";
import { ValidationError, NotFoundError } from "../../utils/errors";

export class StationService {
  /**
   * Create new station
   */
  static async create(
    data: {
      stationCode: string;
      stationName: string;
      location?: string;
    },
    userId: string
  ) {
    // Check duplicate code
    const existing = await db.station.findUnique({
      where: { stationCode: data.stationCode },
    });
    if (existing) {
      throw new ValidationError("Kode stasiun sudah terdaftar");
    }

    const station = await db.station.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return await this.getById(station.id);
  }

  /**
   * Get All Stations (Paginated)
   */
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Soft delete filter
    };

    if (search) {
      where.OR = [
        { stationCode: { contains: search, mode: "insensitive" } },
        { stationName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.station.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.station.count({ where }),
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
      stationCode: item.stationCode,
      stationName: item.stationName,
      location: item.location,
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
   * Get Detail Station
   */
  static async getById(id: string) {
    const station = await db.station.findUnique({
      where: { id },
    });

    if (!station || station.deletedAt) {
      throw new NotFoundError("Stasiun tidak ditemukan");
    }

    const [creator, updater] = await Promise.all([
      station.createdBy
        ? db.user.findUnique({
            where: { id: station.createdBy },
            select: { fullName: true },
          })
        : null,
      station.updatedBy
        ? db.user.findUnique({
            where: { id: station.updatedBy },
            select: { fullName: true },
          })
        : null,
    ]);

    return {
      id: station.id,
      stationCode: station.stationCode,
      stationName: station.stationName,
      location: station.location,
      createdAt: station.createdAt.toISOString(),
      updatedAt: station.updatedAt.toISOString(),
      createdByName: creator?.fullName || null,
      updatedByName: updater?.fullName || null,
    };
  }

  /**
   * Update Station
   */
  static async update(
    id: string,
    data: {
      stationCode?: string;
      stationName?: string;
      location?: string;
    },
    userId: string
  ) {
    const station = await db.station.findUnique({ where: { id } });
    if (!station || station.deletedAt) {
      throw new NotFoundError("Stasiun tidak ditemukan");
    }

    // Check duplicate code if changing
    if (data.stationCode && data.stationCode !== station.stationCode) {
      const existing = await db.station.findUnique({
        where: { stationCode: data.stationCode },
      });
      if (existing) {
        throw new ValidationError("Kode stasiun sudah terdaftar");
      }
    }

    await db.station.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    return await this.getById(id);
  }

  /**
   * Delete Station (Soft Delete)
   */
  static async delete(id: string, userId: string) {
    const station = await db.station.findUnique({ where: { id } });
    if (!station || station.deletedAt) {
      throw new NotFoundError("Stasiun tidak ditemukan");
    }

    await db.station.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { success: true, message: "Stasiun berhasil dihapus" };
  }
}
