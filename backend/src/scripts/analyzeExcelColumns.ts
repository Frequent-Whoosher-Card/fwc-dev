import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

const excelFilePath = join(process.cwd(), '50 data.xlsx');

function analyzeExcelColumns() {
  console.log('📊 Analyzing Excel file columns...\n');
  console.log(`File: ${excelFilePath}\n`);

  try {
    // Read Excel file
    const fileBuffer = readFileSync(excelFilePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    console.log(`📑 Total Sheets: ${workbook.SheetNames.length}\n`);

    // Analyze each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Sheet ${index + 1}: "${sheetName}"`);
      console.log('='.repeat(80));

      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON to see structure
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        defval: null,
        raw: false,
      });

      console.log(`\n📊 Total Rows: ${data.length}`);
      
      if (data.length === 0) {
        console.log('⚠️  Sheet is empty');
        return;
      }

      // Get column names from first row
      const firstRow = data[0] as Record<string, any>;
      const columns = Object.keys(firstRow);
      
      console.log(`\n📋 Columns (${columns.length}):`);
      columns.forEach((col, idx) => {
        const sampleValue = firstRow[col];
        const displayValue = sampleValue !== null && sampleValue !== undefined 
          ? String(sampleValue).substring(0, 30)
          : '(empty)';
        console.log(`   ${idx + 1}. "${col}" (sample: ${displayValue})`);
      });

      // Check for Serial Number column
      const hasSerialNumber = columns.some(col => 
        col.toLowerCase().includes('serial') && col.toLowerCase().includes('number')
      );
      
      console.log(`\n🔍 Key Columns Check:`);
      console.log(`   - Serial Number: ${hasSerialNumber ? '✅ Found' : '❌ Not Found'}`);
      console.log(`   - Sample Serial Number values:`);
      
      // Show first 5 serial numbers
      const serialColumn = columns.find(col => 
        col.toLowerCase().includes('serial') && col.toLowerCase().includes('number')
      );
      
      if (serialColumn) {
        data.slice(0, 5).forEach((row: any, idx) => {
          const serial = row[serialColumn];
          console.log(`     ${idx + 1}. ${serial}`);
        });
      } else {
        console.log(`     ⚠️  Serial Number column not found, checking all columns...`);
        // Show first row all values
        data.slice(0, 3).forEach((row: any, idx) => {
          console.log(`\n     Row ${idx + 1}:`);
          columns.forEach(col => {
            const val = row[col];
            if (val !== null && val !== undefined && val !== '') {
              const strVal = String(val);
              // Check if it looks like a serial number (starts with 0 and has numbers)
              if (/^0\d+$/.test(strVal)) {
                console.log(`       ${col}: ${strVal} ⭐ (looks like serial number)`);
              } else {
                console.log(`       ${col}: ${strVal.substring(0, 30)}`);
              }
            }
          });
        });
      }
    });

    console.log('\n\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error analyzing Excel file:');
    console.error(error);
  }
}

// Run analysis
analyzeExcelColumns();











