import ExcelJS from "exceljs";
import path from "path";

async function createTestExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Whoosh Data");

  // Header row (row 2 to match real Whoosh format)
  sheet.addRow([]); // Row 1 empty
  sheet.addRow([
    "No",
    "NIK/Passport No.",
    "Name",
    "Col4",
    "Col5",
    "Col6",
    "Col7",
    "Col8",
    "Col9",
    "Col10",
    "Col11",
    "Ticketing Time",  // Fixed: with space
    "Col13",
    "Col14",
    "Col15",
    "Col16",
    "Col17",
    "Col18",
    "Col19",
    "Col20",
    "Col21",
    "Col22",
    "Col23",
    "Col24",
    "Col25",
    "Col26",
    "Col27",
    "Col28",
    "Col29",
    "Col30",
    "Col31",
    "Col32",
    "Col33",
    "Col34",
    "Col35",
    "Col36",
    "PlatTrade",
  ]); // Row 2 = Header

  // Test data - beberapa yang AKAN MATCH dan beberapa yang TIDAK MATCH

  const testData = [
    // === AKAN MATCH (by serial number) ===
    {
      no: 1,
      nik: "317405211111",
      name: "Joko",
      ticketingTime: "20260114",
      platTrade: "01252600033", // Match dengan card serial Joko
      expected: "MATCH by Serial",
    },
    {
      no: 2,
      nik: "32750502020008111",
      name: "Aditya Iza",
      ticketingTime: "20260113",
      platTrade: "01112600017", // Match dengan card serial Aditya
      expected: "MATCH by Serial",
    },

    // === AKAN MATCH (by NIK + Date) ===
    {
      no: 3,
      nik: "3174096112900001",
      name: "Ramadhani",
      ticketingTime: "20260114",
      platTrade: "", // No serial, but NIK + date should match
      expected: "MATCH by NIK+Date (if redeem exists)",
    },

    // === TIDAK MATCH (NIK tidak ada di database) ===
    {
      no: 4,
      nik: "9999999999999999",
      name: "John Fake",
      ticketingTime: "20260114",
      platTrade: "",
      expected: "NO MATCH - NIK not found",
    },

    // === TIDAK MATCH (Serial tidak ada) ===
    {
      no: 5,
      nik: "8888888888888888",
      name: "Jane Unknown",
      ticketingTime: "20260114",
      platTrade: "FAKE-SERIAL-123",
      expected: "NO MATCH - Serial not found",
    },

    // === AKAN MATCH (by serial - Yudha) ===
    {
      no: 6,
      nik: "327505020200061231",
      name: "Yudha",
      ticketingTime: "20260114",
      platTrade: "01122600017", // Match dengan card serial Yudha
      expected: "MATCH by Serial",
    },

    // === FWC Records (should be included - contain "FWC" in PlatTrade) ===
    {
      no: 7,
      nik: "317405211111",
      name: "Joko FWC",
      ticketingTime: "20260114",
      platTrade: "FWC-01252600033",
      expected: "MATCH by Serial (FWC prefix)",
    },

    // === Non-FWC Record (should be SKIPPED) ===
    {
      no: 8,
      nik: "1234567890123456",
      name: "Non FWC Person",
      ticketingTime: "20260114",
      platTrade: "REGULAR-TICKET",
      expected: "SKIPPED - Not FWC",
    },
  ];

  // Add data rows (starting row 3)
  for (const row of testData) {
    const rowData = new Array(37).fill("");
    rowData[0] = row.no;
    rowData[1] = row.nik;
    rowData[2] = row.name;
    rowData[11] = row.ticketingTime; // Column 12 (index 11)
    rowData[36] = row.platTrade; // Column 37 (index 36)
    sheet.addRow(rowData);
  }

  // Save file
  const outputPath = path.join(__dirname, "../storage/temp/test_reconciliation.xlsx");
  await workbook.xlsx.writeFile(outputPath);

  console.log("=== TEST EXCEL CREATED ===");
  console.log("Path:", outputPath);
  console.log("\n=== TEST DATA SUMMARY ===");
  console.log("Total rows:", testData.length);
  console.log("\nExpected results:");
  testData.forEach((row) => {
    console.log(`  Row ${row.no}: ${row.name} - ${row.expected}`);
  });

  console.log("\n=== CATATAN ===");
  console.log("- Rows 1, 2, 6, 7: Should MATCH (by serial number)");
  console.log("- Row 3: May MATCH if member has redeem on that date");
  console.log("- Rows 4, 5: Should NOT MATCH (fake NIK/serial)");
  console.log("- Row 8: Should be SKIPPED (not FWC record)");
}

createTestExcel().catch(console.error);
