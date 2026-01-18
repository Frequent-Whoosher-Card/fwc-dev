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
    "Ticketing Time",
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

  // Comprehensive test data with various scenarios
  const testData = [
    // ============ CASE 1: WILL MATCH - Serial number exists in DB ============
    {
      no: 1,
      nik: "317405211111",
      name: "Joko (Match by Serial)",
      ticketingTime: "20260114", // Same date as redeem
      platTrade: "01252600033",
      expected: "✅ MATCH - Serial exists, date matches",
    },
    {
      no: 2,
      nik: "32750502020008111",
      name: "Aditya (Match by Serial)",
      ticketingTime: "20260114",
      platTrade: "01112600017",
      expected: "✅ MATCH - Serial exists",
    },

    // ============ CASE 2: WILL MATCH - By NIK + Date ============
    {
      no: 3,
      nik: "3174096112900001",
      name: "Ramadhani (Match by NIK+Date)",
      ticketingTime: "20260114", // Matches redeem shift_date
      platTrade: "FWC-UNKNOWN-001", // Serial doesn't exist, but NIK+date matches
      expected: "✅ MATCH - NIK+Date match",
    },

    // ============ CASE 3: UNMATCHED - Serial not in database ============
    {
      no: 4,
      nik: "317405211111",
      name: "Joko (Fake Serial)",
      ticketingTime: "20260114",
      platTrade: "09999900001", // Serial doesn't exist in DB
      expected: "❌ UNMATCHED - Serial not found",
    },
    {
      no: 5,
      nik: "32750502020008111",
      name: "Aditya (Fake Serial)",
      ticketingTime: "20260114",
      platTrade: "08888800002", // Serial doesn't exist in DB
      expected: "❌ UNMATCHED - Serial not found",
    },

    // ============ CASE 4: UNMATCHED - NIK exists but wrong date ============
    {
      no: 6,
      nik: "317405211111",
      name: "Joko (Wrong Date)",
      ticketingTime: "20260101", // Different date - no redeem on this date
      platTrade: "FWC-WRONGDATE-001",
      expected: "❌ UNMATCHED - NIK exists but no redeem on this date",
    },
    {
      no: 7,
      nik: "3174096112900001",
      name: "Ramadhani (Wrong Date)",
      ticketingTime: "20260201", // Feb 1 - no redeem on this date
      platTrade: "FWC-WRONGDATE-002",
      expected: "❌ UNMATCHED - Wrong date",
    },

    // ============ CASE 5: UNMATCHED - NIK not in database at all ============
    {
      no: 8,
      nik: "9999999999999999",
      name: "John Doe (NIK Not Found)",
      ticketingTime: "20260114",
      platTrade: "FWC-NOTFOUND-001",
      expected: "❌ UNMATCHED - NIK doesn't exist in system",
    },
    {
      no: 9,
      nik: "1234567890123456",
      name: "Jane Smith (NIK Not Found)",
      ticketingTime: "20260114",
      platTrade: "FWC-NOTFOUND-002",
      expected: "❌ UNMATCHED - NIK doesn't exist",
    },

    // ============ CASE 6: UNMATCHED - Both serial and NIK invalid ============
    {
      no: 10,
      nik: "0000000000000000",
      name: "Unknown Person 1",
      ticketingTime: "20260114",
      platTrade: "07777700001",
      expected: "❌ UNMATCHED - Both invalid",
    },
    {
      no: 11,
      nik: "1111111111111111",
      name: "Unknown Person 2",
      ticketingTime: "20260115",
      platTrade: "06666600002",
      expected: "❌ UNMATCHED - Both invalid",
    },

    // ============ CASE 7: MATCH - Another valid serial ============
    {
      no: 12,
      nik: "327505020200061231",
      name: "Yudha (Match by Serial)",
      ticketingTime: "20260114",
      platTrade: "01122600017",
      expected: "✅ MATCH - Serial exists",
    },

    // ============ CASE 8: UNMATCHED - Valid NIK, no serial, future date ============
    {
      no: 13,
      nik: "317405211111",
      name: "Joko (Future Date)",
      ticketingTime: "20260301", // March - no redeem yet
      platTrade: "FWC-FUTURE-001",
      expected: "❌ UNMATCHED - Future date",
    },

    // ============ CASE 9: UNMATCHED - Past date before any redeem ============
    {
      no: 14,
      nik: "32750502020008111",
      name: "Aditya (Old Date)",
      ticketingTime: "20251225", // Dec 2025 - before redeems created
      platTrade: "FWC-OLDDATE-001",
      expected: "❌ UNMATCHED - Date before any redeem",
    },

    // ============ CASE 10: MATCH with FWC prefix ============
    {
      no: 15,
      nik: "317405211111",
      name: "Joko (FWC Prefix Serial)",
      ticketingTime: "20260114",
      platTrade: "FWC-01112600016", // Will be cleaned to 01112600016
      expected: "✅ MATCH - Serial with FWC prefix",
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
  const outputPath = path.join(__dirname, "../storage/temp/test_reconciliation_v2.xlsx");
  await workbook.xlsx.writeFile(outputPath);

  console.log("=== TEST EXCEL CREATED ===");
  console.log("Path:", outputPath);
  console.log("\n=== TEST DATA SUMMARY ===");
  console.log("Total rows:", testData.length);
  
  console.log("\n=== EXPECTED RESULTS ===");
  console.log("\n✅ MATCHED (should be ~5):");
  testData.filter(r => r.expected.includes("✅")).forEach(row => {
    console.log(`  #${row.no}: ${row.name} - ${row.platTrade}`);
  });

  console.log("\n❌ UNMATCHED (should be ~10):");
  testData.filter(r => r.expected.includes("❌")).forEach(row => {
    console.log(`  #${row.no}: ${row.name} - Reason: ${row.expected.replace("❌ UNMATCHED - ", "")}`);
  });

  console.log("\n=== SUMMARY ===");
  const matched = testData.filter(r => r.expected.includes("✅")).length;
  const unmatched = testData.filter(r => r.expected.includes("❌")).length;
  console.log(`Expected: ${matched} MATCHED, ${unmatched} UNMATCHED`);
}

createTestExcel().catch(console.error);
