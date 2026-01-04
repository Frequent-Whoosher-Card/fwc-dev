import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

const excelFilePath = join(process.cwd(), 'Salinan dari fwc sistem informasi.xlsx');

console.log('📊 Analyzing Excel file structure...\n');
console.log(`File: ${excelFilePath}\n`);

try {
  // Read Excel file
  const fileBuffer = readFileSync(excelFilePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  console.log(`📑 Total Sheets: ${workbook.SheetNames.length}\n`);

  // Analyze each sheet
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Sheet ${index + 1}: "${sheetName}"`);
    console.log('='.repeat(60));

    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      defval: null, // Default value for empty cells
      raw: false,   // Get formatted values
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
      console.log(`   ${idx + 1}. ${col}`);
    });

    // Analyze data types and sample values
    console.log(`\n🔍 Column Analysis (first 5 rows):`);
    console.log('-'.repeat(60));
    
    columns.forEach((col) => {
      const sampleValues = data.slice(0, 5).map((row: any) => row[col]).filter(v => v !== null && v !== undefined);
      const nonEmptyCount = data.filter((row: any) => row[col] !== null && row[col] !== undefined && row[col] !== '').length;
      
      console.log(`\n📌 ${col}:`);
      console.log(`   - Non-empty values: ${nonEmptyCount}/${data.length} (${Math.round(nonEmptyCount/data.length*100)}%)`);
      console.log(`   - Sample values:`);
      sampleValues.slice(0, 3).forEach((val, idx) => {
        const displayVal = String(val).length > 50 ? String(val).substring(0, 50) + '...' : String(val);
        console.log(`     ${idx + 1}. ${displayVal}`);
      });
      
      // Detect data type
      const types = sampleValues.map(v => {
        const str = String(v);
        if (!isNaN(Number(str)) && str.trim() !== '') return 'number';
        if (str.match(/^\d{4}-\d{2}-\d{2}/) || str.match(/^\d{2}\/\d{2}\/\d{4}/)) return 'date';
        if (str.includes('@')) return 'email';
        if (str.match(/^\+?\d{10,}$/)) return 'phone';
        return 'string';
      });
      const mostCommonType = types.length > 0 ? types[0] : 'unknown';
      console.log(`   - Detected type: ${mostCommonType}`);
    });

    // Show first 3 rows as sample
    console.log(`\n📄 Sample Data (first 3 rows):`);
    console.log('-'.repeat(60));
    data.slice(0, 3).forEach((row: any, idx) => {
      console.log(`\nRow ${idx + 1}:`);
      columns.forEach(col => {
        const value = row[col];
        const displayValue = value !== null && value !== undefined 
          ? (String(value).length > 50 ? String(value).substring(0, 50) + '...' : String(value))
          : '(empty)';
        console.log(`   ${col}: ${displayValue}`);
      });
    });
  });

  console.log(`\n\n✅ Analysis complete!`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Identify which sheet contains the data to import`);
  console.log(`   2. Map Excel columns to database fields`);
  console.log(`   3. Create import script based on this analysis`);

} catch (error) {
  console.error('❌ Error analyzing Excel file:');
  console.error(error);
  process.exit(1);
}














