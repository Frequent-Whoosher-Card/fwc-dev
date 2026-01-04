import db from "../config/db";

/**
 * Seeder untuk menambahkan 1 data pembelian hari ini
 * 
 * Script ini akan:
 * 1. Mencari kartu yang tersedia (belum terjual)
 * 2. Mencari atau membuat member
 * 3. Mencari user (operator) dan station
 * 4. Membuat pembelian dengan purchaseDate = hari ini
 * 5. Membuat transaction record
 * 6. Update inventory
 */

async function seedPurchaseToday() {
  try {
    console.log("🚀 Memulai seeder pembelian hari ini...\n");

    // 1. Cari kartu yang tersedia (belum terjual, status IN_OFFICE atau IN_STATION)
    let availableCard = await db.card.findFirst({
      where: {
        memberId: null, // Belum terjual
        status: {
          in: ["IN_OFFICE", "IN_STATION"],
        },
        deletedAt: null,
      },
      include: {
        cardProduct: {
          include: {
            category: true,
            type: true,
          },
        },
      },
    });

    // Jika tidak ada kartu tersedia, buat kartu baru
    if (!availableCard) {
      console.log("⚠️  Tidak ada kartu tersedia, membuat kartu baru...\n");

      // Cari cardProduct yang aktif
      const cardProduct = await db.cardProduct.findFirst({
        where: {
          isActive: true,
          deletedAt: null,
        },
        include: {
          category: true,
          type: true,
        },
      });

      if (!cardProduct) {
        throw new Error(
          "❌ Tidak ada cardProduct yang aktif. Pastikan ada cardProduct dengan isActive = true."
        );
      }

      console.log(`✅ CardProduct ditemukan:`);
      console.log(`   Category: ${cardProduct.category.categoryName}`);
      console.log(`   Type: ${cardProduct.type.typeName}`);
      console.log(`   Serial Template: ${cardProduct.serialTemplate}`);

      // Generate serial number unik
      // Cari serial number terakhir untuk pattern ini
      const lastCard = await db.card.findFirst({
        where: {
          serialNumber: {
            startsWith: cardProduct.serialTemplate,
          },
        },
        orderBy: {
          serialNumber: "desc",
        },
        select: {
          serialNumber: true,
        },
      });

      let nextSerialNumber: string;
      if (lastCard) {
        // Extract number dari serial terakhir dan increment
        const lastNumber = lastCard.serialNumber.replace(
          cardProduct.serialTemplate,
          ""
        );
        const nextNumber = String(parseInt(lastNumber, 10) + 1).padStart(
          lastNumber.length,
          "0"
        );
        nextSerialNumber = `${cardProduct.serialTemplate}${nextNumber}`;
      } else {
        // Jika belum ada kartu dengan pattern ini, mulai dari 00001
        nextSerialNumber = `${cardProduct.serialTemplate}00001`;
      }

      // Pastikan serial number unik
      const existingCard = await db.card.findUnique({
        where: {
          serialNumber: nextSerialNumber,
        },
      });

      if (existingCard) {
        // Jika sudah ada, cari yang belum digunakan
        let counter = 1;
        do {
          const numStr = String(
            parseInt(nextSerialNumber.replace(cardProduct.serialTemplate, ""), 10) +
              counter
          ).padStart(5, "0");
          nextSerialNumber = `${cardProduct.serialTemplate}${numStr}`;
          const check = await db.card.findUnique({
            where: { serialNumber: nextSerialNumber },
          });
          if (!check) break;
          counter++;
        } while (counter < 10000);
      }

      console.log(`✅ Serial Number baru: ${nextSerialNumber}`);

      // Buat kartu baru
      availableCard = await db.card.create({
        data: {
          serialNumber: nextSerialNumber,
          cardProductId: cardProduct.id,
          status: "IN_OFFICE",
          quotaTicket: 0, // Akan diupdate saat pembelian
        },
        include: {
          cardProduct: {
            include: {
              category: true,
              type: true,
            },
          },
        },
      });

      console.log(`✅ Kartu baru dibuat: ${availableCard.serialNumber}\n`);
    } else {
      console.log(`✅ Kartu ditemukan: ${availableCard.serialNumber}`);
      console.log(`   Category: ${availableCard.cardProduct.category.categoryName}`);
      console.log(`   Type: ${availableCard.cardProduct.type.typeName}\n`);
    }

    // 2. Cari atau buat member
    let member = await db.member.findFirst({
      where: {
        identityNumber: "1234567890123456", // Default identity number untuk seeder
        deletedAt: null,
      },
    });

    if (!member) {
      member = await db.member.create({
        data: {
          name: "Member Seeder",
          identityNumber: "1234567890123456",
          nationality: "INDONESIA",
          email: "member.seeder@example.com",
          phone: "081234567890",
        },
      });
      console.log(`✅ Member baru dibuat: ${member.name}`);
    } else {
      console.log(`✅ Member ditemukan: ${member.name}`);
    }

    // 3. Cari user (operator) dan station
    // Pertama, cari user yang memiliki stationId
    let user = await db.user.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        stationId: {
          not: null,
        },
      },
      include: {
        station: true,
      },
    });

    let station;

    if (user && user.stationId && user.station) {
      // User memiliki station
      station = user.station;
      console.log(`✅ Operator: ${user.fullName}`);
      console.log(`✅ Station: ${station.stationName}`);
    } else {
      // User tidak memiliki station, cari atau buat station
      console.log("⚠️  User tidak memiliki station, mencari atau membuat station...\n");

      // Cari station yang ada
      station = await db.station.findFirst({
        where: {
          deletedAt: null,
        },
      });

      if (!station) {
        // Buat station baru
        station = await db.station.create({
          data: {
            stationCode: "STN-001",
            stationName: "Stasiun Seeder",
            location: "Lokasi Seeder",
          },
        });
        console.log(`✅ Station baru dibuat: ${station.stationName}`);
      } else {
        console.log(`✅ Station ditemukan: ${station.stationName}`);
      }

      // Cari user (tanpa filter stationId) atau gunakan user pertama yang ditemukan
      if (!user) {
        const foundUser = await db.user.findFirst({
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            station: true,
          },
        });

        if (!foundUser) {
          throw new Error(
            "❌ Tidak ada user yang tersedia. Pastikan ada user aktif di database."
          );
        }

        user = foundUser;
      }

      // Update user dengan stationId jika belum ada
      if (user.stationId !== station.id) {
        user = await db.user.update({
          where: {
            id: user.id,
          },
          data: {
            stationId: station.id,
          },
          include: {
            station: true,
          },
        });
        console.log(`✅ User diupdate dengan station: ${user.fullName}`);
      }

      console.log(`✅ Operator: ${user.fullName}`);
      console.log(`✅ Station: ${station.stationName}`);
    }

    // 4. Hitung expiredDate berdasarkan masaBerlaku
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set ke awal hari

    const masaBerlaku = availableCard.cardProduct.masaBerlaku;
    const expiredDate = new Date(today);
    expiredDate.setDate(expiredDate.getDate() + masaBerlaku);

    // 5. Generate transaction number
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const transactionCount = await db.redeem.count({
      where: {
        transactionNumber: {
          startsWith: `TXN-SALE-${dateStr}`,
        },
      },
    });
    const transactionNumber = `TXN-SALE-${dateStr}-${String(
      transactionCount + 1
    ).padStart(3, "0")}`;

    // 6. Proses pembelian dalam transaction
    const result = await db.$transaction(async (tx) => {
      // Update card
      const updatedCard = await tx.card.update({
        where: {
          id: availableCard.id,
        },
        data: {
          memberId: member.id,
          purchaseDate: today,
          expiredDate: expiredDate,
          status: "SOLD_ACTIVE",
          quotaTicket: availableCard.cardProduct.totalQuota,
          updatedBy: user.id,
        },
      });

      // Create redeem
      const redeem = await tx.redeem.create({
        data: {
          cardId: updatedCard.id,
          transactionNumber: transactionNumber,
          operatorId: user.id,
          stationId: station.id,
          shiftDate: today,
          status: "Success",
          notes: "Pembelian dari seeder",
          createdBy: user.id,
        },
      });

      // Update inventory
      // Get categoryId and typeId from cardProduct
      const cardProduct = await tx.cardProduct.findUnique({
        where: { id: availableCard.cardProductId },
        select: { categoryId: true, typeId: true },
      });

      if (!cardProduct) {
        throw new Error("CardProduct tidak ditemukan");
      }

      const categoryId = cardProduct.categoryId;
      const typeId = cardProduct.typeId;

      // Cari atau buat inventory
      let inventory = await tx.cardInventory.findUnique({
        where: {
          unique_category_type_station: {
            categoryId: categoryId,
            typeId: typeId,
            stationId: station.id,
          },
        },
      });

      if (inventory) {
        // Update inventory yang sudah ada
        inventory = await tx.cardInventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            cardBelumTerjual: {
              decrement: 1,
            },
            cardAktif: {
              increment: 1,
            },
            cardBeredar: {
              increment: 1,
            },
            updatedBy: user.id,
          },
        });
      } else {
        // Buat inventory baru jika belum ada
        inventory = await tx.cardInventory.create({
          data: {
            categoryId: categoryId,
            typeId: typeId,
            stationId: station.id,
            cardBelumTerjual: 0,
            cardAktif: 1,
            cardBeredar: 1,
            cardNonAktif: 0,
            updatedBy: user.id,
          },
        });
      }

      return {
        card: updatedCard,
        redeem: redeem,
        inventory: inventory,
      };
    });

    console.log("\n✅ Pembelian berhasil dibuat!");
    console.log("\n📋 Detail Pembelian:");
    console.log(`   Serial Number: ${result.card.serialNumber}`);
    console.log(`   Member: ${member.name}`);
    console.log(`   Purchase Date: ${today.toLocaleDateString("id-ID")}`);
    console.log(`   Expired Date: ${expiredDate.toLocaleDateString("id-ID")}`);
    console.log(`   Quota Ticket: ${result.card.quotaTicket}`);
    console.log(`   Transaction Number: ${result.redeem.transactionNumber}`);
    console.log(`   Station: ${station.stationName}`);
    console.log(`   Operator: ${user.fullName}`);

    console.log("\n✅ Seeder selesai!");
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Jalankan seeder
seedPurchaseToday()
  .then(() => {
    console.log("\n✨ Seeder berhasil dijalankan!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeder gagal:", error);
    process.exit(1);
  });

