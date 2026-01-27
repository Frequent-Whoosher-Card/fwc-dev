import { ValidationError } from "../utils/errors";

export class BatchService {
  /**
   * Generate Batch ID format: [CATEGORY]-[ROUTE]-[STATION]-[SEQUENCE]
   * Example: SLV-JK-HLM-1
   */
  static async generateBatchId(
    tx: any, // Prisma Transaction Client
    categoryId: string,
    typeId: string,
    stationId: string,
  ): Promise<string> {
    const category = await tx.cardCategory.findUnique({
      where: { id: categoryId },
    });
    const type = await tx.cardType.findUnique({ where: { id: typeId } });
    const station = await tx.station.findUnique({ where: { id: stationId } });

    if (!category || !type || !station) {
      throw new ValidationError(
        "Data Category, Type, atau Station tidak valid",
      );
    }

    // Mapping Category Code
    let catCode = "XXX";
    const catName = category.categoryName.toUpperCase();
    if (catName.includes("GOLD")) catCode = "GLD";
    else if (catName.includes("SILVER")) catCode = "SLV";
    else if (catName.includes("KAI")) catCode = "KAI";
    else catCode = catName.substring(0, 3); // Fallback

    // Mapping Route Code (Type)
    let routeCode = "XX";
    const typeName = type.typeName.toUpperCase();
    if (typeName === "JAKA")
      routeCode = "JK"; // Jakarta - Karawang
    else if (typeName === "JABAN")
      routeCode = "JB"; // Jakarta - Bandung
    else if (typeName === "KABAN")
      routeCode = "KB"; // Karawang - Bandung
    else {
      // Fallback: ambil huruf kapital pertama dari setiap kata atau 2 huruf pertama
      // Contoh: "Jakarta Bandung" -> "JB"
      const initials = typeName.match(/\b\w/g) || [];
      routeCode = (
        (initials.shift() || "") + (initials.pop() || "")
      ).toUpperCase();
      if (routeCode.length < 2)
        routeCode = typeName.substring(0, 2).toUpperCase();
    }

    // Mapping Station Code
    const stationCode = station.stationCode.toUpperCase();

    // Construct Prefix
    // Format: [CATEGORY]-[ROUTE]-[STATION]
    const prefix = `${catCode}-${routeCode}-${stationCode}`;

    // Get Sequence
    // Count existing movements with this prefix
    // Gunakan count semantic: berapa kali prefix ini muncul di awal batchId
    // Kita harus mencari batchId yang *dimulai* dengan prefix ini.
    // Karena sequence ada di belakang, kita bisa hitung jumlah row yang match prefix.
    const count = await tx.cardStockMovement.count({
      where: {
        batchId: {
          startsWith: prefix + "-", // Ensure dash to avoid prefix collision (e.g. SLV-JK-HLM vs SLV-JK-HLMM)
        },
      },
    });

    const sequence = count + 1;

    return `${prefix}-${sequence}`;
  }
}
