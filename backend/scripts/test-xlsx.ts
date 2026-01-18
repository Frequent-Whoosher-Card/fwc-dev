import ExcelJS from "exceljs";

const filePath = "../Ticket sales report-20260108-20260108.xlsx";

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.worksheets[0];
  
  // Convert to 2D array
  const rawData: any[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const rowValues: any[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      while (rowValues.length < colNumber) {
        rowValues.push("");
      }
      rowValues[colNumber - 1] = cell.value;
    });
    rawData.push(rowValues);
  });

  console.log("Total rows:", rawData.length);
  console.log("\nRow 2 (header):", rawData[2]?.slice(0, 5));
  console.log("Row 3 (first data):", rawData[3]?.slice(0, 5));

  // Find NIK column
  let nikColIdx = -1;
  let headerRowIdx = -1;
  for (let rowIdx = 0; rowIdx < 10; rowIdx++) {
    const row = rawData[rowIdx];
    if (!row) continue;
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cellValue = String(row[colIdx] || "").toLowerCase().trim();
      if (cellValue.includes("nik")) {
        nikColIdx = colIdx;
        headerRowIdx = rowIdx;
        console.log(`\nFound NIK at row ${rowIdx}, col ${colIdx}: "${row[colIdx]}"`);
        break;
      }
    }
    if (nikColIdx >= 0) break;
  }

  // Count FW records
  let fwCount = 0;
  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (row) {
      const nikVal = String(row[nikColIdx] || "").toUpperCase();
      if (nikVal.includes("FW")) {
        fwCount++;
        if (fwCount <= 3) {
          console.log(`FW row ${i}: "${row[nikColIdx]}"`);
        }
      }
    }
  }
  console.log(`\nTotal FW records: ${fwCount}`);
}

main().catch(console.error);
