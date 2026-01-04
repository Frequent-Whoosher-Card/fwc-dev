# FWC (Frequent Whoosher Card) System - Database Design

## Overview

Database design untuk sistem manajemen Frequent Whoosher Card (FWC) PT Kereta Cepat Indonesia China. Sistem ini mengelola penjualan kartu frequent traveler untuk jalur Jakarta-Bandung (JaBan), Jakarta-Karawang (JaKa), dan Karawang-Bandung (KaBan).

## Files

1. **DATABASE_DESIGN.md** - Dokumentasi lengkap database design termasuk:
   - Entity Relationship Diagram (ERD)
   - Deskripsi tabel lengkap
   - Relationships dan constraints
   - Business rules
   - Views dan stored procedures
   - Performance considerations

2. **fwc_database.sql** - SQL DDL script yang siap dijalankan:
   - Create database dan semua tabel
   - Insert master data
   - Create views
   - Create stored procedures
   - Create triggers

3. **ERD_DIAGRAM.md** - Diagram ERD visual dalam format Mermaid dan text-based

## Quick Start

### 1. Install MySQL/MariaDB

Pastikan MySQL atau MariaDB sudah terinstall di sistem Anda.

### 2. Create Database

Jalankan script SQL untuk membuat database:

```bash
mysql -u root -p < fwc_database.sql
```

Atau jika menggunakan MySQL client:

```sql
mysql -u root -p
source fwc_database.sql;
```

### 3. Verify Installation

```sql
USE fwc_system;
SHOW TABLES;
```

Anda seharusnya melihat tabel-tabel berikut:
- card_categories
- card_types
- stations
- operators
- customers
- cards
- transactions
- card_usage_logs
- card_inventory

## Database Structure

### Core Tables

- **customers** - Data pelanggan
- **cards** - Data kartu FWC
- **transactions** - Data transaksi penjualan

### Master Tables

- **card_categories** - Kategori kartu (Gold, Silver, KAI)
- **card_types** - Tipe kartu (JaBan, JaKa, KaBan)
- **stations** - Data stasiun
- **operators** - Data operator

### Supporting Tables

- **card_usage_logs** - Log penggunaan kuota kartu
- **card_inventory** - Inventory kartu per kategori dan tipe

## Views

Database menyediakan beberapa views untuk kemudahan query:

- **vw_card_summary** - Ringkasan kartu dengan informasi pelanggan
- **vw_transaction_detail** - Detail transaksi lengkap
- **vw_inventory_summary** - Ringkasan inventory

## Stored Procedures

- **sp_update_card_inventory()** - Update inventory kartu
- **sp_get_card_by_serial(serial_number)** - Get card by serial number
- **sp_update_card_quota(card_id, quota_used)** - Update quota setelah penggunaan

## Sample Queries

### Get all active cards expiring in next 30 days

```sql
SELECT * FROM vw_card_summary 
WHERE status_card = 'Aktif' 
AND days_until_expiry BETWEEN 0 AND 30
ORDER BY expired_date;
```

### Get sales summary by operator

```sql
SELECT 
    o.operator_name,
    COUNT(t.transaction_id) AS total_transactions,
    SUM(c.fw_price) AS total_revenue
FROM transactions t
INNER JOIN operators o ON t.operator_id = o.operator_id
INNER JOIN cards c ON t.card_id = c.card_id
WHERE t.transaction_status = 'Success'
GROUP BY o.operator_id, o.operator_name
ORDER BY total_revenue DESC;
```

### Get cards by category and type

```sql
SELECT 
    cat.category_name,
    ct.type_name,
    COUNT(*) AS total_cards,
    SUM(CASE WHEN c.status_card = 'Aktif' THEN 1 ELSE 0 END) AS active_cards,
    SUM(CASE WHEN c.status_card = 'Non Aktif' THEN 1 ELSE 0 END) AS inactive_cards
FROM cards c
INNER JOIN card_categories cat ON c.category_id = cat.category_id
INNER JOIN card_types ct ON c.type_id = ct.type_id
GROUP BY cat.category_id, cat.category_name, ct.type_id, ct.type_name;
```

## Data Migration

Untuk memigrasikan data dari Excel ke database, Anda perlu:

1. Extract data dari Excel ke format CSV atau langsung ke database
2. Normalize data:
   - Identity Number: hapus spasi, uppercase
   - Email: lowercase, trim
   - Phone: hapus spasi, karakter khusus
   - Serial Number: validasi format
   - Dates: validasi format tanggal
3. Handle duplikat data
4. Insert data ke tabel-tabel yang sesuai

### Sample Migration Script (Python)

```python
import pandas as pd
import mysql.connector
from mysql.connector import Error

# Read Excel
df = pd.read_excel('fwc.xlsx', sheet_name='FWC Reguler')

# Connect to database
conn = mysql.connector.connect(
    host='localhost',
    database='fwc_system',
    user='root',
    password='your_password'
)

cursor = conn.cursor()

# Insert customers
for _, row in df.iterrows():
    # Normalize data
    identity_number = str(row['Identity Number']).strip().upper()
    email = str(row['Email']).lower().strip() if pd.notna(row['Email']) else None
    phone = str(row['Phone']).strip() if pd.notna(row['Phone']) else None
    
    # Insert customer
    cursor.execute("""
        INSERT INTO customers (customer_name, identity_number, nationality, email, phone)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE customer_name = VALUES(customer_name)
    """, (row['Customer Name'], identity_number, row['Nationality'], email, phone))
    
    # Get customer_id
    customer_id = cursor.lastrowid
    
    # Get category_id and type_id
    cursor.execute("SELECT category_id FROM card_categories WHERE category_code = %s", (row['Card Category'],))
    category_id = cursor.fetchone()[0]
    
    cursor.execute("SELECT type_id FROM card_types WHERE type_code = %s", (row['Card Type'],))
    type_id = cursor.fetchone()[0]
    
    # Insert card
    cursor.execute("""
        INSERT INTO cards (serial_number, customer_id, category_id, type_id, 
                          quota_ticket, total_quota, fw_price, purchase_date, 
                          masa_berlaku, expired_date, status_card)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (row['Serial Number'], customer_id, category_id, type_id,
          row['Quota Ticket'], row['Quota Ticket'], row['FW Price'],
          row['Purchase Date'], row['Masa Berlaku'], row['Expired Date'],
          row['Status Card']))
    
    # Insert transaction
    # Get operator_id and station_id
    # ... (similar process)

conn.commit()
cursor.close()
conn.close()
```

## Maintenance

### Update Inventory

Inventory akan otomatis ter-update melalui triggers, atau bisa di-update manual:

```sql
CALL sp_update_card_inventory();
```

### Backup Database

```bash
mysqldump -u root -p fwc_system > fwc_backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
mysql -u root -p fwc_system < fwc_backup_20250101.sql
```

## Notes

- Pastikan MySQL/MariaDB versi 5.7+ atau 8.0+
- Gunakan charset `utf8mb4` untuk support emoji dan karakter khusus
- Regular backup disarankan untuk data penting
- Monitor performance indexes secara berkala
- Pertimbangkan partitioning untuk tabel `transactions` jika data sangat besar

## Support

Untuk pertanyaan atau issue, silakan hubungi tim database administrator.

---

**Version:** 1.0  
**Last Updated:** 2025-01-XX


