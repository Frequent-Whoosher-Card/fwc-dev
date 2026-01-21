import { writeFile, unlink } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import prisma from "../../config/db";

const execAsync = promisify(exec);

export class TicketSalesService {
  /**
   * Import ticket sales data from Excel file
   */
  static async importFromExcel(
    file: File,
  ): Promise<{ totalRows: number; filename: string }> {
    const uploadDir = path.join(process.cwd(), "uploads");
    const tempExcelPath = path.join(
      uploadDir,
      `temp_${Date.now()}_${file.name}`,
    );

    try {
      // 1. Simpan file upload ke temporary
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(tempExcelPath, Buffer.from(arrayBuffer));

      console.log(`✓ File uploaded: ${tempExcelPath}`);

      // 2. Jalankan script Python untuk import
      const pythonScript = path.join(
        process.cwd(),
        "scripts",
        "import_ticket_sales.py",
      );
      const { stdout, stderr } = await execAsync(
        `python3 ${pythonScript} "${tempExcelPath}"`,
      );

      if (stderr && !stderr.includes("✓")) {
        throw new Error(`Import error: ${stderr}`);
      }

      console.log(stdout);

      // 3. Parse jumlah rows dari output
      const match = stdout.match(/(\d+) rows in database/);
      const totalRows = match ? parseInt(match[1]) : 0;

      // 4. Cleanup temporary file
      await unlink(tempExcelPath);

      return {
        totalRows,
        filename: file.name,
      };
    } catch (error) {
      // Cleanup on error
      try {
        await unlink(tempExcelPath);
      } catch {}

      throw error;
    }
  }

  /**
   * Get statistics from ticket sales data
   */
  static async getStats() {
    const [totalTickets, totalRevenue, stationCount] = await Promise.all([
      // Total tickets
      prisma.ticket_sales_report.count(),

      // Total revenue (sum of after_tax_price)
      prisma.ticket_sales_report
        .aggregate({
          _sum: {
            after_tax_price: true,
          },
        })
        .then((result: any) => Number(result._sum.after_tax_price || 0)),

      // Distinct station count
      prisma.ticket_sales_report
        .findMany({
          select: {
            ticketing_station: true,
          },
          distinct: ["ticketing_station"],
        })
        .then((stations: any[]) => stations.length),
    ]);

    return {
      totalTickets,
      totalRevenue,
      stationCount,
    };
  }
}
