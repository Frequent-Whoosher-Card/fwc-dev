/**
 * Seed tabel City dengan kota/kabupaten di Indonesia dari API wilayah.id.
 * Menghapus semua data city lalu mengisi ulang dari API.
 * Jalankan: bunx prisma db seed (dari folder backend)
 */
import db from "../src/config/db";
import { fetchAllRegenciesIndonesia } from "../src/utils/wilayah";

async function main() {
  console.log("City seed: menghapus semua data city...");
  await db.city.deleteMany({});

  console.log("City seed: mengambil data dari API wilayah.id...");
  const regencies = await fetchAllRegenciesIndonesia();

  if (regencies.length === 0) {
    console.log("City seed: tidak ada data regency dari API.");
    return;
  }

  const toCreate = regencies.map((r) => ({ name: r.regencyName }));
  await db.city.createMany({ data: toCreate });
  console.log(`City seed: ${toCreate.length} kota/kabupaten berhasil ditambahkan.`);
}

main()
  .catch((e) => {
    console.error("City seed error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
