import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

const excelFilePath = join(process.cwd(), '50 data.xlsx');

function debugExcelStructure() {
  console.log('📊 Debugging Excel file structure...\n');
  console.log(`File: ${excelFilePath}\n`);

  try {
    // Read Excel file
    const fileBuffer = readFileSync(excelFilePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    console.log(`📑 Total Sheets: ${workbook.SheetNames.join(', ')}\n`);

    // Analyze each sheet in detail
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n${'='.repeat(100)}`);
      console.log(`Sheet ${index + 1}: "${sheetName}"`);
      console.log('='.repeat(100));

      const worksheet = workbook.Sheets[sheetName];
      
      // Get raw data as array of arrays (preserves position)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1');
      console.log(`Range: ${worksheet['!ref']}`);
      console.log(`Total rows: ${range.e.r + 1}, Total columns: ${range.e.c + 1}\n`);

      // Show first 5 rows as raw arrays
      console.log('📋 First 5 rows as raw arrays:');
      for (let row = 0; row < Math.min(5, range.e.r + 1); row++) {
        const rowData: any[] = [];
        for (let col = 0; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          if (cell) {
            rowData.push(cell.v);
          } else {
            rowData.push(null);
          }
        }
        console.log(`Row ${row + 1}:`, rowData);
      }

      // Convert to JSON with header
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        defval: null,
        raw: false,
      });

      console.log(`\n📊 Total rows when converted to JSON: ${data.length}`);
      
      if (data.length === 0) {
        console.log('⚠️  Sheet is empty');
        return;
      }

      // Show first row as JSON
      const firstRow = data[0] as Record<string, any>;
      const columns = Object.keys(firstRow);
      
      console.log(`\n📋 Columns detected (${columns.length}):`);
      columns.forEach((col, idx) => {
        const value = firstRow[col];
        console.log(`   ${idx + 1}. "${col}" = ${value} (type: ${typeof value})`);
      });

      // Try to find Serial Number in different ways
      console.log(`\n🔍 Searching for Serial Number:`);
      
      // Method 1: Exact match
      if (columns.includes('Serial Number')) {
        console.log(`   ✅ Found "Serial Number" column`);
        console.log(`   Sample values from first 5 rows:`);
        data.slice(0, 5).forEach((row: any, idx) => {
          console.log(`      Row ${idx + 1}: ${row['Serial Number']}`);
        });
      } else {
        console.log(`   ❌ "Serial Number" column not found`);
      }

      // Method 2: Case-insensitive search
      const serialCol = columns.find(col => 
        col.toLowerCase().includes('serial') || 
        col.toLowerCase().includes('number') ||
        (col.toLowerCase().includes('serial') && col.toLowerCase().includes('number'))
      );
      
      if (serialCol && serialCol !== 'Serial Number') {
        console.log(`   ⚠️  Found similar column: "${serialCol}"`);
        console.log(`   Sample values from first 5 rows:`);
        data.slice(0, 5).forEach((row: any, idx) => {
          console.log(`      Row ${idx + 1}: ${row[serialCol]}`);
        });
      }

      // Method 3: Check if any column contains values that look like serial numbers
      console.log(`\n🔍 Checking all columns for serial number patterns:`);
      data.slice(0, 5).forEach((row: any, idx) => {
        columns.forEach(col => {
          const value = row[col];
          if (value && typeof value === 'string') {
            // Check if it looks like a serial number (hex, numbers, etc)
            if (/^[0-9a-fA-F]+$/.test(String(value)) && String(value).length >= 8) {
              console.log(`   Row ${idx + 1}, Column "${col}": ${value} ⭐ (looks like serial number)`);
            }
          } else if (value && typeof value === 'number') {
            // Check if it's a large number that could be serial
            if (value > 1000000) {
              console.log(`   Row ${idx + 1}, Column "${col}": ${value} ⭐ (large number, could be serial)`);
            }
          }
        });
      });

      // Show all columns and their sample values
      console.log(`\n📋 All columns with sample values:`);
      columns.forEach((col) => {
        const sampleValues = data.slice(0, 3).map((row: any) => row[col]).filter(v => v !== null && v !== undefined);
        console.log(`\n   "${col}":`);
        sampleValues.forEach((val, idx) => {
          const displayVal = String(val).length > 50 ? String(val).substring(0, 50) + '...' : String(val);
          console.log(`      ${idx + 1}. ${displayVal}`);
        });
      });
    });

    console.log('\n\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Error analyzing Excel file:');
    console.error(error);
  }
}

// Run debug
debugExcelStructure();











