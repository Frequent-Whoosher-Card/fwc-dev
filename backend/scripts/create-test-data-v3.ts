import ExcelJS from "exceljs";
import path from "path";
import db from "../src/config/db";

/**
 * Test Data Scenarios (Updated with FWC-Only Records feature):
 * 1. 10 data sama serial number + NIK + date (FULL MATCH)
 * 2. 3 data serial number sama tapi NIK beda (PARTIAL - Serial match only)
 * 3. 3 data serial number beda tapi NIK sama (PARTIAL - NIK match only)
 * 4. 2 data baru di Whoosh saja, tidak ada di FWC (UNMATCHED - Whoosh Only)
 * 5. 3 data baru di FWC saja, tidak ada di Whoosh (FWC ONLY - displayed with blue background)
 *
 * Total Excel: 10 + 3 + 3 + 2 = 18 rows
 * Total FWC: 10 + 3 + 3 + 3 = 19 redeems (18 matched attempts + 3 FWC-only)
 *
 * Expected UI Display:
 * - Matched: 10 (green)
 * - Partial: 6 (3 serial match + 3 NIK match) (amber)
 * - Unmatched: 2 (Whoosh only) (red)
 * - FWC Only: 3 (shown at bottom with blue background)
 */

const TEST_DATE = "2026-01-17";
const TEST_DATE_WHOOSH = "20260117";

interface TestCase {
  // Data for Excel (Whoosh)
  nik: string;
  name: string;
  serialNumber: string;
  // Data for FWC database (if different)
  fwcNik?: string;
  fwcName?: string;
  fwcSerial?: string;
  // Flags
  onlyInWhoosh?: boolean;
  onlyInFwc?: boolean;
  expected: string;
}

async function createTestData() {
  console.log("=== TRUNCATING REDEEM TABLE ===\n");

  // Truncate redeem table
  await db.redeem.deleteMany({});
  console.log("✅ Redeem table truncated\n");

  // Get prerequisites
  const station = await db.station.findFirst();
  const operator = await db.user.findFirst();

  if (!station || !operator) {
    console.error("❌ No station or operator found!");
    return;
  }

  console.log("Station:", station.stationName);
  console.log("Operator:", operator.fullName);

  // Define test cases
  const testCases: TestCase[] = [
    // ========== GROUP 1: 10 MATCHING DATA (Serial + NIK sama) ==========
    {
      nik: "3201010101010001",
      name: "Match User 01",
      serialNumber: "01260100001",
      expected: "✅ MATCH - All data sama",
    },
    {
      nik: "3201010101010002",
      name: "Match User 02",
      serialNumber: "01260100002",
      expected: "✅ MATCH - All data sama",
    },
    {
      nik: "3201010101010003",
      name: "Match User 03",
      serialNumber: "01260100003",
      expected: "✅ MATCH - All data sama",
    },
    {
      nik: "3201010101010004",
      name: "Match User 04",
      serialNumber: "01260100004",
      expected: "✅ MATCH - All data sama",
    },
    {
      nik: "3201010101010005",
      name: "Match User 05",
      serialNumber: "01260100005",
      expected: "✅ MATCH - All data sama",
    },
    {
      nik: "3201010101010006",
      name: "Match User 06",
      serialNumber: "01260100006",
      expected: "✅ MATCH - All data sama",
    },
    {
      nik: "3201010101010007",
      name: "Match User 07",
      serialNumber: "01260100007",
      expected: "✅ MATCH - All data sama",
    },
    {
      nik: "3201010101010008",
      name: "Match User 08",
      serialNumber: "01260100008",
      expected: "✅ MATCH - All data sama",
    },
    {
      nik: "3201010101010009",
      name: "Match User 09",
      serialNumber: "01260100009",
      expected: "✅ MATCH - All data sama",
    },
    {
      nik: "3201010101010010",
      name: "Match User 10",
      serialNumber: "01260100010",
      expected: "✅ MATCH - All data sama",
    },

    // ========== GROUP 2: 3 SERIAL SAMA, NIK BEDA (Partial - Serial match only) ==========
    // Whoosh has: Serial X, NIK A
    // FWC has: Serial X, NIK B (different NIK)
    {
      nik: "3202020202020001",
      name: "Serial Match A",
      serialNumber: "01260200001",
      fwcNik: "3299990000000001",
      fwcName: "FWC User Different A",
      expected: "⚠️ PARTIAL - Serial sama, NIK beda",
    },
    {
      nik: "3202020202020002",
      name: "Serial Match B",
      serialNumber: "01260200002",
      fwcNik: "3299990000000002",
      fwcName: "FWC User Different B",
      expected: "⚠️ PARTIAL - Serial sama, NIK beda",
    },
    {
      nik: "3202020202020003",
      name: "Serial Match C",
      serialNumber: "01260200003",
      fwcNik: "3299990000000003",
      fwcName: "FWC User Different C",
      expected: "⚠️ PARTIAL - Serial sama, NIK beda",
    },

    // ========== GROUP 3: 3 NIK SAMA, SERIAL BEDA (Partial - NIK match only) ==========
    // Whoosh has: Serial A, NIK X
    // FWC has: Serial B, NIK X (different Serial)
    {
      nik: "3203030303030001",
      name: "NIK Match A",
      serialNumber: "01260300001",
      fwcSerial: "01269999001", // Different serial in FWC
      expected: "⚠️ PARTIAL - NIK sama, Serial beda",
    },
    {
      nik: "3203030303030002",
      name: "NIK Match B",
      serialNumber: "01260300002",
      fwcSerial: "01269999002",
      expected: "⚠️ PARTIAL - NIK sama, Serial beda",
    },
    {
      nik: "3203030303030003",
      name: "NIK Match C",
      serialNumber: "01260300003",
      fwcSerial: "01269999003",
      expected: "⚠️ PARTIAL - NIK sama, Serial beda",
    },

    // ========== GROUP 4: 2 DATA BARU DI WHOOSH SAJA ==========
    {
      nik: "3204040404040001",
      name: "Whoosh Only A",
      serialNumber: "01260400001",
      onlyInWhoosh: true,
      expected: "❌ NOT FOUND - Hanya ada di Whoosh",
    },
    {
      nik: "3204040404040002",
      name: "Whoosh Only B",
      serialNumber: "01260400002",
      onlyInWhoosh: true,
      expected: "❌ NOT FOUND - Hanya ada di Whoosh",
    },

    // ========== GROUP 5: 3 DATA BARU DI FWC SAJA (akan tampil dengan background biru) ==========
    // Data ini akan muncul di bagian bawah tabel dengan label "FWC Only"
    {
      nik: "3205050505050001",
      name: "FWC Only User A",
      serialNumber: "01260500001",
      onlyInFwc: true,
      expected: "📦 FWC ONLY - Tidak ada di Whoosh (tampil dengan background biru)",
    },
    {
      nik: "3205050505050002",
      name: "FWC Only User B",
      serialNumber: "01260500002",
      onlyInFwc: true,
      expected: "📦 FWC ONLY - Tidak ada di Whoosh (tampil dengan background biru)",
    },
    {
      nik: "3205050505050003",
      name: "FWC Only User C",
      serialNumber: "01260500003",
      onlyInFwc: true,
      expected: "📦 FWC ONLY - Tidak ada di Whoosh (tampil dengan background biru)",
    },
  ];

  console.log("\n=== CREATING MEMBERS, CARDS, AND REDEEMS ===\n");

  // Get card product
  const cardProduct = await db.cardProduct.findFirst();
  if (!cardProduct) {
    console.error("❌ No card product found!");
    return;
  }

  let membersCreated = 0;
  let cardsCreated = 0;
  let redeemsCreated = 0;

  for (const tc of testCases) {
    // Skip if only in Whoosh (don't create in FWC)
    if (tc.onlyInWhoosh) {
      console.log(`⏭️ Skipping FWC creation for: ${tc.name} (Whoosh only)`);
      continue;
    }

    const nikForFwc = tc.fwcNik || tc.nik;
    const nameForFwc = tc.fwcName || tc.name;
    const serialForFwc = tc.fwcSerial || tc.serialNumber;

    try {
      // 1. Create or find member
      let member = await db.member.findFirst({
        where: { identityNumber: nikForFwc },
      });

      if (!member) {
        member = await db.member.create({
          data: {
            identityNumber: nikForFwc,
            name: nameForFwc,
            phone: `08${Math.random().toString().slice(2, 12)}`,
            gender: "L", // L = Laki-laki, P = Perempuan
            createdBy: operator.id,
          },
        });
        membersCreated++;
        console.log(`👤 Created member: ${nameForFwc} (${nikForFwc})`);
      }

      // 2. Create card
      let card = await db.card.findFirst({
        where: { serialNumber: serialForFwc },
      });

      if (!card) {
        card = await db.card.create({
          data: {
            serialNumber: serialForFwc,
            cardProductId: cardProduct.id,
            status: "SOLD_ACTIVE", // Card is sold and active
            memberId: member.id,
            createdBy: operator.id,
          },
        });
        cardsCreated++;
        console.log(`💳 Created card: ${serialForFwc}`);
      } else {
        // Link existing card to member if not linked
        if (!card.memberId) {
          await db.card.update({
            where: { id: card.id },
            data: { memberId: member.id, status: "SOLD_ACTIVE" },
          });
        }
      }

      // 3. Create redeem
      const transactionNumber = `TRX-TEST-${Date.now()}-${redeemsCreated}`;
      await db.redeem.create({
        data: {
          cardId: card.id,
          transactionNumber,
          operatorId: operator.id,
          stationId: station.id,
          shiftDate: new Date(TEST_DATE),
          status: "Success",
          prev_quota: 10,
          quota_used: 1,
          remain_quota: 9,
          redeem_type: "SINGLE",
          createdBy: operator.id,
        },
      });
      redeemsCreated++;
      console.log(`✅ Created redeem for: ${nameForFwc}`);
    } catch (error: any) {
      console.error(`❌ Error for ${tc.name}: ${error.message}`);
    }
  }

  console.log(`\n=== FWC DATA CREATED ===`);
  console.log(`Members: ${membersCreated}`);
  console.log(`Cards: ${cardsCreated}`);
  console.log(`Redeems: ${redeemsCreated}`);

  // ========== CREATE EXCEL FILE ==========
  console.log("\n=== CREATING EXCEL FILE ===\n");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Whoosh Data");

  // Header row
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
  ]);

  // Add data rows (only non-FWC-only data)
  let rowNum = 1;
  for (const tc of testCases) {
    // Skip if only in FWC (don't add to Excel)
    if (tc.onlyInFwc) {
      continue;
    }

    const rowData = new Array(37).fill("");
    rowData[0] = rowNum;
    rowData[1] = tc.nik;
    rowData[2] = tc.name;
    rowData[11] = TEST_DATE_WHOOSH;
    rowData[36] = tc.serialNumber;
    sheet.addRow(rowData);
    rowNum++;
  }

  const outputPath = path.join(
    __dirname,
    "../storage/temp/test_reconciliation_v3.xlsx"
  );
  await workbook.xlsx.writeFile(outputPath);

  console.log(`✅ Excel created: ${outputPath}`);
  console.log(`   Total rows: ${rowNum - 1}`);

  // ========== SUMMARY ==========
  console.log("\n" + "=".repeat(60));
  console.log("TEST DATA SUMMARY");
  console.log("=".repeat(60));

  console.log("\n📊 EXCEL (WHOOSH) - 18 rows:");
  console.log("   • 10 rows: Match semua (Serial + NIK + Date sama) ✅");
  console.log("   • 3 rows: Serial sama, NIK beda ⚠️");
  console.log("   • 3 rows: NIK sama, Serial beda ⚠️");
  console.log("   • 2 rows: Hanya di Whoosh (tidak ada di FWC) ❌");

  console.log("\n🗃️ DATABASE (FWC) - 19 redeems:");
  console.log("   • 10 redeems: Match semua ✅");
  console.log(
    "   • 3 redeems: Serial sama, NIK beda (untuk test Serial Match) ⚠️"
  );
  console.log("   • 3 redeems: NIK sama, Serial beda (untuk test NIK Match) ⚠️");
  console.log("   • 3 redeems: Hanya di FWC (tidak ada di Whoosh) 📦");

  console.log("\n📈 EXPECTED RESULTS IN UI:");
  console.log("   ✅ MATCHED (green): 10");
  console.log("   ⚠️ PARTIAL (amber):");
  console.log("      - Serial match only: 3");
  console.log("      - NIK match only: 3");
  console.log("   ❌ UNMATCHED (red): 2 (Whoosh only)");
  console.log("   📦 FWC ONLY (blue background): 3");

  console.log("\n💡 FWC ONLY RECORDS:");
  console.log("   • Ditampilkan di bagian bawah tabel");
  console.log("   • Background biru untuk membedakan dari records lain");
  console.log("   • Kolom Whoosh menunjukkan 'Tidak ada di Whoosh'");
  console.log("   • Muncul dalam stats card 'FWC Only': 3");

  console.log("\n" + "=".repeat(60));

  // Print detail table
  console.log("\nDETAIL TEST CASES:");
  console.log("-".repeat(80));
  console.log("No | Serial       | NIK              | Category");
  console.log("-".repeat(80));

  let no = 1;
  for (const tc of testCases) {
    if (!tc.onlyInFwc) {
      console.log(
        `${String(no).padStart(2)} | ${tc.serialNumber.padEnd(12)} | ${tc.nik.padEnd(16)} | ${tc.expected}`
      );
      no++;
    }
  }
  console.log("-".repeat(80));
  console.log("\nFWC ONLY (tidak ada di Excel):");
  for (const tc of testCases.filter((t) => t.onlyInFwc)) {
    console.log(
      `   | ${tc.serialNumber.padEnd(12)} | ${tc.nik.padEnd(16)} | ${tc.expected}`
    );
  }
}

createTestData()
  .catch(console.error)
  .finally(() => db.$disconnect());
