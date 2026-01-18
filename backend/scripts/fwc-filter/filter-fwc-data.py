#!/usr/bin/env python3
"""
Script untuk filter data FWC dari file Excel Ticket Sales Report

Aturan:
- Data FWC = NIK/Passport No. mengandung "fw" (case-insensitive)
- Data selain itu diabaikan

Usage:
    python3 filter-fwc-data.py <input-file.xlsx> [output-file.csv]

Example:
    python3 filter-fwc-data.py "Ticket sales report-20260108-20260108.xlsx"
    python3 filter-fwc-data.py "Ticket sales report-20260108-20260108.xlsx" "fwc.csv"
"""

import sys
import os
import pandas as pd

def find_nik_column(df):
    """Find the column index containing NIK/Passport No."""
    # Search in first 10 rows for the header
    for row_idx in range(min(10, len(df))):
        for col_idx in range(len(df.columns)):
            cell_value = str(df.iloc[row_idx, col_idx]).lower().strip()
            # Look for exact match of NIK/Passport column header
            if "nik" in cell_value and "passport" in cell_value:
                return col_idx, row_idx
            elif cell_value == "nik/passport no." or cell_value == "nik/passport":
                return col_idx, row_idx
    
    # Fallback: search for column that might be NIK based on content pattern
    for col_idx in range(len(df.columns)):
        for row_idx in range(min(10, len(df))):
            cell_value = str(df.iloc[row_idx, col_idx]).lower().strip()
            if "nik" in cell_value or "passport" in cell_value:
                return col_idx, row_idx
    
    return None, None

def main():
    # Parse arguments
    if len(sys.argv) < 2:
        print("Usage: python3 filter-fwc-data.py <input-file.xlsx> [output-file.csv]")
        print('Example: python3 filter-fwc-data.py "Ticket sales report-20260108-20260108.xlsx"')
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    # Default output file is fwc.csv in the same directory as input
    default_output = os.path.join(os.path.dirname(input_file) or ".", "fwc.csv")
    output_file = sys.argv[2] if len(sys.argv) > 2 else default_output
    
    # Ensure output has .csv extension
    if not output_file.lower().endswith('.csv'):
        output_file = output_file.rsplit('.', 1)[0] + '.csv'
    
    # Resolve paths
    input_path = os.path.abspath(input_file)
    output_path = os.path.abspath(output_file)
    
    print("=" * 60)
    print("FWC Data Filter Script")
    print("=" * 60)
    print(f"Input file:  {input_path}")
    print(f"Output file: {output_path}")
    print()
    
    # Check if input file exists
    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)
    
    try:
        # 1. Read the Excel file
        print("Reading Excel file...")
        df = pd.read_excel(input_path, header=None)
        
        print(f"Total rows in file: {len(df)}")
        print(f"Total columns: {len(df.columns)}")
        
        # Find NIK/Passport column and header row
        nik_col_idx, header_row_idx = find_nik_column(df)
        
        if nik_col_idx is None:
            print("Error: Could not find NIK/Passport No. column in the Excel file")
            sys.exit(1)
        
        print(f"Header row index: {header_row_idx + 1}")
        print(f"NIK/Passport column index: {nik_col_idx + 1}")
        print(f"NIK column header: '{df.iloc[header_row_idx, nik_col_idx]}'")
        
        # 2. Filter data - keep header rows and FWC data
        # Get NIK column values (excluding header rows)
        nik_column = df.iloc[:, nik_col_idx].astype(str).str.lower()
        
        # Create mask for FWC data (contains 'fw')
        fwc_mask = nik_column.str.contains("fw", case=False, na=False)
        
        # Include header rows (rows before and including header)
        for i in range(header_row_idx + 1):
            fwc_mask.iloc[i] = True
        
        # Apply filter
        filtered_df = df[fwc_mask].copy()
        
        # Count FWC data (excluding header rows)
        fwc_count = fwc_mask.sum() - (header_row_idx + 1)
        total_data_rows = len(df) - header_row_idx - 1
        
        print()
        print("=" * 60)
        print("FILTER RESULTS")
        print("=" * 60)
        print(f"Total data rows (excluding header): {total_data_rows}")
        print(f"FWC data rows found: {fwc_count}")
        print(f"Non-FWC data rows filtered out: {total_data_rows - fwc_count}")
        
        if fwc_count == 0:
            print()
            print("Warning: No FWC data found in the file!")
            print("Make sure the NIK/Passport No. column contains values with 'FW' prefix.")
        else:
            # Show sample FWC data
            print()
            print("Sample FWC entries (first 5):")
            data_rows = filtered_df.iloc[header_row_idx + 1:]
            for i, (_, row) in enumerate(data_rows.head(5).iterrows()):
                print(f"  {i + 1}. {row.iloc[nik_col_idx]}")
        
        # 3. Save to CSV file
        print()
        print("Creating output CSV file...")
        
        # Reset index for clean output
        filtered_df.reset_index(drop=True, inplace=True)
        
        # Save as CSV without header (since we're keeping the original structure)
        filtered_df.to_csv(output_path, index=False, header=False)
        
        # Get file size
        file_size = os.path.getsize(output_path)
        file_size_kb = file_size / 1024
        
        print(f"Output saved to: {output_path}")
        print(f"File size: {file_size_kb:.2f} KB")
        print()
        print("=" * 60)
        print("DONE!")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error processing file: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
