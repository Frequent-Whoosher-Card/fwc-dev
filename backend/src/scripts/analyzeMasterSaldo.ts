import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

const excelFilePath = join(process.cwd(), 'Salinan dari fwc sistem informasi.xlsx');

function analyzeMasterSaldo() {
  console.log('📊 Analyzing Master Saldo sheet...\n');
  console.log(`File: ${excelFilePath}\n`);

  try {
    // Read Excel file
    const fileBuffer = readFileSync(excelFilePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Find the master saldo sheet (case insensitive)
    const sheetName = workbook.SheetNames.find(
      name => name.toLowerCase().includes('master') && name.toLowerCase().includes('saldo')
    );

    if (!sheetName) {
      console.log('❌ Sheet "master saldo" not found');
      console.log('Available sheets:', workbook.SheetNames.join(', '));
      return;
    }

    console.log(`✅ Found sheet: "${sheetName}"\n`);

    const worksheet = workbook.Sheets[sheetName];
    
    // Get the range of the sheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1');
    console.log(`Sheet range: ${worksheet['!ref']}`);
    console.log(`Total rows: ${range.e.r + 1}, Total columns: ${range.e.c + 1}\n`);

    // Read first 20 rows to understand structure
    console.log('📋 First 20 rows (raw cell data):');
    console.log('='.repeat(80));
    
    for (let row = 0; row < Math.min(20, range.e.r + 1); row++) {
      const rowData: any = {};
      for (let col = 0; col <= Math.min(10, range.e.c); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell && cell.v !== undefined) {
          rowData[cellAddress] = cell.v;
        }
      }
      if (Object.keys(rowData).length > 0) {
        console.log(`Row ${row + 1}:`, JSON.stringify(rowData, null, 2));
      }
    }

    // Try to convert to JSON with header row detection
    console.log('\n' + '='.repeat(80));
    console.log('📋 Data as JSON (first 15 rows):');
    console.log('='.repeat(80));
    
    // Try different header rows
    for (let headerRow = 0; headerRow < 5; headerRow++) {
      const data = XLSX.utils.sheet_to_json(worksheet, {
        defval: null,
        raw: false,
        header: headerRow,
        range: headerRow,
      });
      
      if (data.length > 0) {
        console.log(`\n--- Using row ${headerRow + 1} as header ---`);
        console.log('Headers:', Object.keys(data[0] as any).join(', '));
        console.log('First 3 data rows:');
        console.log(JSON.stringify(data.slice(0, 3), null, 2));
      }
    }

    // Get all data without header assumption
    const allData = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      raw: false,
    });

    console.log('\n' + '='.repeat(80));
    console.log('📊 Summary:');
    console.log('='.repeat(80));
    console.log(`Total rows in sheet: ${allData.length}`);
    
    // Analyze the actual data structure
    if (allData.length > 0) {
      const firstRow = allData[0] as any;
      const keys = Object.keys(firstRow);
      console.log(`\nColumn keys found: ${keys.join(', ')}`);
      
      // Try to identify meaningful columns
      console.log('\n🔍 Analyzing data patterns...');
      
      // Look for serial number patterns
      const serialNumbers: string[] = [];
      const relasi: string[] = [];
      const typeCard: string[] = [];
      const counts: number[] = [];
      const totalKuota: number[] = [];
      const sisaKuota: number[] = [];
      
      allData.slice(0, 100).forEach((row: any) => {
        Object.values(row).forEach((val: any) => {
          if (typeof val === 'string') {
            // Check if it looks like a serial number (starts with numbers)
            if (/^0\d{10,}$/.test(val)) {
              serialNumbers.push(val);
            }
            // Check for relasi values
            if (['Jaban', 'Jaka', 'KaBan'].includes(val)) {
              relasi.push(val);
            }
            // Check for card types
            if (['Gold', 'Silver'].includes(val)) {
              typeCard.push(val);
            }
          }
          if (typeof val === 'number' && val > 0 && val <= 100) {
            counts.push(val);
          }
        });
      });
      
      console.log(`\nFound patterns:`);
      console.log(`- Serial numbers (like 01112500001): ${serialNumbers.length} found`);
      console.log(`- Relasi values (Jaban/Jaka/KaBan): ${relasi.length} found`);
      console.log(`- Card types (Gold/Silver): ${typeCard.length} found`);
      console.log(`- Count values: ${counts.length} found`);
      
      if (serialNumbers.length > 0) {
        console.log(`\nSample serial numbers: ${serialNumbers.slice(0, 5).join(', ')}`);
      }
    }

    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error analyzing sheet:');
    console.error(error);
  }
}

// Run analysis
analyzeMasterSaldo();

