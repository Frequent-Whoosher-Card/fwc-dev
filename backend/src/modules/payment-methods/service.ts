import db from "../../config/db";
import { ValidationError, NotFoundError } from "../../utils/errors";

export class PaymentMethodService {
  static async getAll() {
    const list = await db.paymentMethod.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    return list;
  }

  static async getById(id: string) {
    const item = await db.paymentMethod.findUnique({
      where: { id },
    });

    if (!item || item.deletedAt) {
      throw new NotFoundError("Metode pembayaran tidak ditemukan");
    }

    return item;
  }

  static async create(
    data: { name: string; notes?: string },
    userId: string,
  ) {
    const existing = await db.paymentMethod.findFirst({
      where: {
        name: { equals: data.name.trim(), mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ValidationError(
        `Metode pembayaran '${data.name}' sudah ada`,
      );
    }

    const item = await db.paymentMethod.create({
      data: {
        name: data.name.trim(),
        notes: data.notes?.trim() || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return item;
  }

  static async update(
    id: string,
    data: { name?: string; notes?: string | null },
    userId: string,
  ) {
    const item = await db.paymentMethod.findUnique({
      where: { id },
    });

    if (!item || item.deletedAt) {
      throw new NotFoundError("Metode pembayaran tidak ditemukan");
    }

    if (data.name !== undefined && data.name.trim() !== item.name) {
      const existing = await db.paymentMethod.findFirst({
        where: {
          name: { equals: data.name.trim(), mode: "insensitive" },
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ValidationError(
          `Metode pembayaran '${data.name}' sudah ada`,
        );
      }
    }

    const updated = await db.paymentMethod.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
        updatedBy: userId,
      },
    });

    return updated;
  }

  static async delete(id: string, userId: string) {
    const item = await db.paymentMethod.findUnique({
      where: { id },
      include: {
        members: {
          where: { deletedAt: null },
          take: 1,
        },
      },
    });

    if (!item || item.deletedAt) {
      throw new NotFoundError("Metode pembayaran tidak ditemukan");
    }

    if (item.members.length > 0) {
      throw new ValidationError(
        "Tidak dapat menghapus metode pembayaran yang masih digunakan oleh member",
      );
    }

    await db.paymentMethod.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { message: "Metode pembayaran berhasil dihapus" };
  }
}
