import db from "../config/db";

/**
 * Seeder untuk menambahkan 1 data pembelian yang sudah expired hari ini
 * 
 * Script ini akan:
 * 1. Mencari kartu yang sudah terjual (SOLD_ACTIVE) atau membuat pembelian baru
 * 2. Mengupdate expiredDate menjadi tanggal yang sudah lewat (kemarin)
 * 3. Memastikan purchaseDate juga di masa lalu
 * 4. Membuat transaction record jika belum ada
 */

async function seedExpiredToday() {
  try {
    console.log("🚀 Memulai seeder pembelian expired hari ini...\n");

    // 1. Cari kartu yang sudah terjual (SOLD_ACTIVE) 
    // PENTING: Kita akan update purchaseDate ke hari ini, jadi tidak masalah purchaseDate-nya kapan
    let soldCard = await db.card.findFirst({
      where: {
        status: "SOLD_ACTIVE",
        memberId: {
          not: null,
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
        member: true,
      },
    });

    // Jika tidak ada kartu yang sudah terjual, buat pembelian baru dulu
    if (!soldCard) {
      console.log("⚠️  Tidak ada kartu terjual, membuat pembelian baru...\n");

      // Cari kartu yang tersedia
      let availableCard = await db.card.findFirst({
        where: {
          memberId: null,
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

        // Generate serial number unik
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
          nextSerialNumber = `${cardProduct.serialTemplate}00001`;
        }

        // Pastikan serial number unik
        const existingCard = await db.card.findUnique({
          where: {
            serialNumber: nextSerialNumber,
          },
        });

        if (existingCard) {
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

        availableCard = await db.card.create({
          data: {
            serialNumber: nextSerialNumber,
            cardProductId: cardProduct.id,
            status: "IN_OFFICE",
            quotaTicket: 0,
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
      }

      // Cari atau buat member
      let member = await db.member.findFirst({
        where: {
          identityNumber: "1234567890123457", // Identity number berbeda untuk expired
          deletedAt: null,
        },
      });

      if (!member) {
        member = await db.member.create({
          data: {
            name: "Member Expired Seeder",
            identityNumber: "1234567890123457",
            nationality: "INDONESIA",
            email: "member.expired.seeder@example.com",
            phone: "081234567891",
          },
        });
        console.log(`✅ Member baru dibuat: ${member.name}`);
      }

      // Cari user dan station
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
        station = user.station;
      } else {
        station = await db.station.findFirst({
          where: {
            deletedAt: null,
          },
        });

        if (!station) {
          station = await db.station.create({
            data: {
              stationCode: "STN-002",
              stationName: "Stasiun Expired Seeder",
              location: "Lokasi Expired Seeder",
            },
          });
        }

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
        }
      }

      // Hitung tanggal: purchaseDate = beberapa hari yang lalu, expiredDate = kemarin
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Purchase date = 30 hari yang lalu (misalnya)
      const purchaseDate = new Date(today);
      purchaseDate.setDate(purchaseDate.getDate() - 30);

      // Expired date = kemarin (sudah expired)
      const expiredDate = new Date(today);
      expiredDate.setDate(expiredDate.getDate() - 1);
      expiredDate.setHours(23, 59, 59, 999);

      // Generate transaction number
      const purchaseDateStr = purchaseDate.toISOString().split("T")[0].replace(/-/g, "");
      const transactionCount = await db.redeem.count({
        where: {
          transactionNumber: {
            startsWith: `TXN-SALE-${purchaseDateStr}`,
          },
        },
      });
      const transactionNumber = `TXN-SALE-${purchaseDateStr}-${String(
        transactionCount + 1
      ).padStart(3, "0")}`;

      // Proses pembelian dalam transaction
      const result = await db.$transaction(async (tx) => {
        // Update card
        const updatedCard = await tx.card.update({
          where: {
            id: availableCard.id,
          },
          data: {
            memberId: member.id,
            purchaseDate: purchaseDate,
            expiredDate: expiredDate,
            status: "SOLD_ACTIVE",
            quotaTicket: availableCard.cardProduct.totalQuota,
            updatedBy: user.id,
          },
          include: {
            cardProduct: {
              include: {
                category: true,
                type: true,
              },
            },
            member: true,
          },
        });

        // Create redeem
        const redeem = await tx.redeem.create({
          data: {
            cardId: updatedCard.id,
            transactionNumber: transactionNumber,
            operatorId: user.id,
            stationId: station.id,
            shiftDate: purchaseDate,
            status: "Success",
            notes: "Pembelian expired dari seeder",
            createdBy: user.id,
          },
        });

        // Update inventory
        const cardProduct = await tx.cardProduct.findUnique({
          where: { id: availableCard.cardProductId },
          select: { categoryId: true, typeId: true },
        });

        if (!cardProduct) {
          throw new Error("CardProduct tidak ditemukan");
        }

        const categoryId = cardProduct.categoryId;
        const typeId = cardProduct.typeId;

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
        };
      });

      soldCard = result.card;
      console.log(`✅ Pembelian baru dibuat untuk expired card\n`);
    }

    // 2. Update kartu menjadi expired
    // IMPORTANT: Data expired di-group berdasarkan purchaseDate, bukan expiredDate!
    // Jadi purchaseDate harus = hari ini agar muncul di group tanggal hari ini
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Purchase date = hari ini (agar muncul di group tanggal hari ini)
    const purchaseDate = new Date(today);
    purchaseDate.setHours(10, 0, 0, 0); // Jam 10 pagi hari ini

    // Expired date = awal hari ini (00:00:00) agar expiredDate < now terpenuhi
    // Ini memastikan kartu sudah expired (expiredDate < now)
    const expiredDate = new Date(today);
    expiredDate.setHours(0, 0, 0, 0); // Awal hari ini

    console.log(`\n📅 Mengupdate kartu menjadi expired:`);
    console.log(`   Purchase Date: ${purchaseDate.toISOString()} (hari ini - untuk grouping)`);
    console.log(`   Expired Date: ${expiredDate.toISOString()} (awal hari ini - sudah expired)`);
    console.log(`   Sekarang: ${now.toISOString()}`);
    console.log(`   ⚠️  CATATAN: Data expired di-group berdasarkan purchaseDate, bukan expiredDate!`);

    // Update card menjadi expired
    const expiredCard = await db.card.update({
      where: {
        id: soldCard.id,
      },
      data: {
        purchaseDate: purchaseDate,
        expiredDate: expiredDate,
        updatedBy: soldCard.updatedBy || undefined,
      },
      include: {
        cardProduct: {
          include: {
            category: true,
            type: true,
          },
        },
        member: true,
      },
    });

    // Verifikasi expiredDate
    const verifyCard = await db.card.findUnique({
      where: { id: expiredCard.id },
      select: { expiredDate: true, purchaseDate: true },
    });

    if (verifyCard && verifyCard.expiredDate) {
      const isExpired = verifyCard.expiredDate < now;
      console.log(`\n📊 Verifikasi:`);
      console.log(`   PurchaseDate di database: ${verifyCard.purchaseDate?.toISOString() || "N/A"}`);
      console.log(`   ExpiredDate di database: ${verifyCard.expiredDate.toISOString()}`);
      console.log(`   Status: ${isExpired ? '✅ SUDAH EXPIRED' : '❌ BELUM EXPIRED'}`);
      
      // Pastikan expiredDate < now
      if (verifyCard.expiredDate >= now) {
        console.log(`\n⚠️  ExpiredDate masih di masa depan, mengupdate ke awal hari ini...`);
        const earlyToday = new Date(today);
        earlyToday.setHours(0, 0, 0, 0);
        
        await db.card.update({
          where: { id: expiredCard.id },
          data: { expiredDate: earlyToday },
        });
        
        console.log(`✅ ExpiredDate diupdate ke: ${earlyToday.toISOString()}`);
      }
      
      // PASTIKAN purchaseDate = hari ini (untuk grouping)
      const purchaseDateToday = new Date(today);
      purchaseDateToday.setHours(10, 0, 0, 0);
      
      // Selalu update purchaseDate ke hari ini, tidak peduli sebelumnya kapan
      const purchaseDateStr = verifyCard.purchaseDate?.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      if (!verifyCard.purchaseDate || purchaseDateStr !== todayStr) {
        console.log(`\n⚠️  PurchaseDate bukan hari ini (${purchaseDateStr}), mengupdate ke hari ini (${todayStr})...`);
        await db.card.update({
          where: { id: expiredCard.id },
          data: { purchaseDate: purchaseDateToday },
        });
        console.log(`✅ PurchaseDate diupdate ke: ${purchaseDateToday.toISOString()}`);
      } else {
        console.log(`\n✅ PurchaseDate sudah benar: ${verifyCard.purchaseDate.toISOString()}`);
      }
    }

    // Ambil data terbaru dari database untuk memastikan
    const finalCard = await db.card.findUnique({
      where: { id: expiredCard.id },
      include: {
        cardProduct: {
          include: {
            category: true,
            type: true,
          },
        },
        member: true,
      },
    });

    if (!finalCard) {
      throw new Error("Kartu tidak ditemukan setelah update");
    }

    // Verifikasi expired
    const isExpired = finalCard.expiredDate && finalCard.expiredDate < now;
    const expiredStatus = isExpired ? "✅ SUDAH EXPIRED" : "⏳ HARI INI (belum lewat)";

    console.log("\n✅ Kartu expired berhasil dibuat!");
    console.log("\n📋 Detail Kartu Expired:");
    console.log(`   Serial Number: ${finalCard.serialNumber}`);
    console.log(`   Member: ${finalCard.member?.name || "N/A"}`);
    console.log(`   Category: ${finalCard.cardProduct.category.categoryName}`);
    console.log(`   Type: ${finalCard.cardProduct.type.typeName}`);
    console.log(`   Purchase Date: ${finalCard.purchaseDate?.toLocaleDateString("id-ID") || "N/A"}`);
    console.log(`   Expired Date: ${finalCard.expiredDate?.toLocaleDateString("id-ID") || "N/A"} ${expiredStatus}`);
    console.log(`   Expired Date (ISO): ${finalCard.expiredDate?.toISOString() || "N/A"}`);
    console.log(`   Sekarang (ISO): ${now.toISOString()}`);
    console.log(`   Quota Ticket: ${finalCard.quotaTicket}`);
    console.log(`   Status: ${finalCard.status}`);

    if (!isExpired) {
      console.log(`\n💡 Catatan: ExpiredDate = hari ini. Kartu akan expired di akhir hari ini.`);
    }

    console.log("\n✅ Seeder selesai!");
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Jalankan seeder
seedExpiredToday()
  .then(() => {
    console.log("\n✨ Seeder expired berhasil dijalankan!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeder expired gagal:", error);
    process.exit(1);
  });

