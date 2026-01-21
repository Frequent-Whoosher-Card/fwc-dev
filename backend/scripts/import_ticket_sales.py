#!/usr/bin/env python3
import pandas as pd
import psycopg2
import os
import sys

def import_ticket_sales(excel_path):
    """Import ticket sales Excel file ke PostgreSQL menggunakan COPY command"""
    
    print("=" * 60)
    print("Import Ticket Sales Report to PostgreSQL using COPY")
    print("=" * 60)
    
    # 1. Baca Excel untuk extract date range dari header
    print(f"\n[1/5] Reading Excel file: {os.path.basename(excel_path)}")
    
    # Baca header untuk extract start_date dan end_date
    header_df = pd.read_excel(excel_path, nrows=2, header=None)
    
    # Extract date range dari baris pertama atau kedua
    # Format biasanya: "Ticket sales report-20260108-20260108"
    date_info = None
    for idx, row in header_df.iterrows():
        for cell in row:
            if cell and isinstance(cell, str) and 'report' in cell.lower():
                date_info = cell
                break
        if date_info:
            break
    
    # Parse tanggal dari string (format: YYYYMMDD)
    start_date = None
    end_date = None
    if date_info:
        import re
        dates = re.findall(r'(\d{8})', date_info)
        if len(dates) >= 2:
            from datetime import datetime
            start_date = datetime.strptime(dates[0], '%Y%m%d').date()
            end_date = datetime.strptime(dates[1], '%Y%m%d').date()
            print(f"✓ Date range: {start_date} to {end_date}")
    
    # Baca data utama
    df = pd.read_excel(excel_path, skiprows=2)
    print(f"✓ Loaded {len(df)} rows, {len(df.columns)} columns")
    
    # 2. Bersihkan nama kolom
    print("\n[2/5] Cleaning column names...")
    df.columns = [
        col.strip()
        .lower()
        .replace(' ', '_')
        .replace('/', '_')
        .replace('.', '')
        .replace('(', '')
        .replace(')', '')
        .replace('__', '_')
        for col in df.columns
    ]
    print(f"✓ Columns cleaned")
    
    # Tambahkan kolom start_date dan end_date ke DataFrame
    if start_date and end_date:
        df['start_date'] = start_date
        df['end_date'] = end_date
        print(f"✓ Added date range columns")
    
    # 3. Export ke CSV temporary
    print("\n[3/5] Exporting to temporary CSV...")
    csv_path = f'/tmp/ticket_sales_{os.getpid()}.csv'
    df.to_csv(csv_path, index=False, header=False, sep=',', na_rep='\\N')
    file_size = os.path.getsize(csv_path) / 1024 / 1024
    print(f"✓ Temporary CSV: {csv_path} ({file_size:.2f} MB)")
    
    # 4. Connect ke PostgreSQL
    print("\n[4/5] Connecting to PostgreSQL...")
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
    cursor = conn.cursor()
    print("✓ Connected to database")
    
    # 5. Import menggunakan COPY command
    print("\n[5/5] Importing data using PostgreSQL COPY command...")
    
    columns = list(df.columns)
    columns_str = ','.join(columns)
    
    copy_sql = f"""
        COPY ticket_sales_report ({columns_str})
        FROM STDIN
        WITH (FORMAT CSV, DELIMITER ',', NULL '\\N')
    """
    
    with open(csv_path, 'r') as f:
        cursor.copy_expert(copy_sql, f)
        conn.commit()
    
    print(f"✓ COPY command executed successfully!")
    
    # Verify
    cursor.execute("SELECT COUNT(*) FROM ticket_sales_report")
    count = cursor.fetchone()[0]
    print(f"✓ Verification: {count} rows in database")
    
    # Cleanup
    cursor.close()
    conn.close()
    os.remove(csv_path)
    print(f"✓ Cleaned up temporary CSV")
    
    print("\n" + "=" * 60)
    print("Import completed successfully using COPY command!")
    print("=" * 60)
    
    return count

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_ticket_sales.py <excel_file_path>")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    
    if not os.path.exists(excel_path):
        print(f"Error: File not found: {excel_path}")
        sys.exit(1)
    
    try:
        import_ticket_sales(excel_path)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
