import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

console.log("[DB] Initializing Prisma Client (Hybrid Pool)...");

const connectionString = `${process.env.DATABASE_URL}`;

// Menggunakan PG Pool eksplisit - Ini TERBUKTI berhasil konek di Bun
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const db = new PrismaClient({ adapter });

export default db;
