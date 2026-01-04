# Database Design - Frequent Whoosher Card (FWC) System

## 1. Overview

Database design untuk sistem manajemen Frequent Whoosher Card (FWC) PT Kereta Cepat Indonesia China. Sistem ini mengelola penjualan kartu frequent traveler untuk jalur Jakarta-Bandung (JaBan), Jakarta-Karawang (JaKa), dan Karawang-Bandung (KaBan).

## 2. Entity Relationship Diagram (ERD)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Customers  │────────<│    Cards     │────────>│ Card_Cat    │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │                        │                        │
      │                        │                        │
      │                  ┌─────▼─────┐                 │
      │                  │Transactions│                 │
      │                  └─────┬─────┘                 │
      │                        │                        │
      │                        │                        │
┌─────▼─────┐            ┌─────▼─────┐          ┌─────▼─────┐
│ Operators │            │ Stations  │          │ Card_Types│
└───────────┘            └───────────┘          └───────────┘
```

## 3. Database Tables

### 3.1. Table: customers
Menyimpan data pelanggan yang membeli kartu FWC.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| customer_id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID unik pelanggan |
| customer_name | VARCHAR(255) | NOT NULL | Nama lengkap pelanggan |
| identity_number | VARCHAR(50) | NOT NULL, UNIQUE | Nomor identitas (NIK/KTP) |
| nationality | VARCHAR(100) | NOT NULL, DEFAULT 'INDONESIA' | Kewarganegaraan |
| email | VARCHAR(255) | NULL | Email pelanggan |
| phone | VARCHAR(20) | NULL | Nomor telepon pelanggan |
| nipp_kai | VARCHAR(20) | NULL | NIPP KAI (untuk karyawan KAI) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | | Waktu pembuatan record |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Waktu update terakhir |

**Indexes:**
- `idx_identity_number` ON `identity_number`
- `idx_email` ON `email`
- `idx_phone` ON `phone`

### 3.2. Table: card_categories
Master data kategori kartu.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| category_id | INT | PRIMARY KEY, AUTO_INCREMENT | ID kategori |
| category_code | VARCHAR(20) | NOT NULL, UNIQUE | Kode kategori (Gold, Silver, KAI) |
| category_name | VARCHAR(100) | NOT NULL | Nama kategori |
| description | TEXT | NULL | Deskripsi kategori |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |

**Sample Data:**
- Gold
- Silver
- KAI

### 3.3. Table: card_types
Master data tipe kartu berdasarkan rute.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| type_id | INT | PRIMARY KEY, AUTO_INCREMENT | ID tipe kartu |
| type_code | VARCHAR(20) | NOT NULL, UNIQUE | Kode tipe (JaBan, JaKa, KaBan) |
| type_name | VARCHAR(100) | NOT NULL | Nama tipe kartu |
| route_description | VARCHAR(255) | NULL | Deskripsi rute |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |

**Sample Data:**
- JaBan (Jakarta-Bandung)
- JaKa (Jakarta-Karawang)
- KaBan (Karawang-Bandung)

### 3.4. Table: stations
Master data stasiun.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| station_id | INT | PRIMARY KEY, AUTO_INCREMENT | ID stasiun |
| station_code | VARCHAR(20) | NOT NULL, UNIQUE | Kode stasiun |
| station_name | VARCHAR(255) | NOT NULL | Nama stasiun |
| location | VARCHAR(255) | NULL | Lokasi stasiun |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |

**Sample Data:**
- Halim

### 3.5. Table: operators
Master data operator yang melakukan transaksi.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| operator_id | INT | PRIMARY KEY, AUTO_INCREMENT | ID operator |
| operator_name | VARCHAR(255) | NOT NULL | Nama operator |
| nip | VARCHAR(50) | NULL, UNIQUE | Nomor Induk Pegawai |
| is_active | BOOLEAN | DEFAULT TRUE | Status aktif |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Waktu update |

**Indexes:**
- `idx_nip` ON `nip`

### 3.6. Table: cards
Data kartu FWC yang dijual.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| card_id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID kartu |
| serial_number | VARCHAR(50) | NOT NULL, UNIQUE | Nomor seri kartu |
| customer_id | BIGINT | NOT NULL, FOREIGN KEY | ID pelanggan |
| category_id | INT | NOT NULL, FOREIGN KEY | ID kategori kartu |
| type_id | INT | NOT NULL, FOREIGN KEY | ID tipe kartu |
| quota_ticket | INT | NOT NULL, DEFAULT 0 | Kuota tiket tersedia |
| total_quota | INT | NOT NULL | Total kuota tiket |
| fw_price | DECIMAL(15,2) | NOT NULL | Harga kartu |
| purchase_date | DATE | NOT NULL | Tanggal pembelian |
| masa_berlaku | INT | NOT NULL | Masa berlaku (hari) |
| expired_date | DATE | NOT NULL | Tanggal kadaluarsa |
| status_card | ENUM('Aktif', 'Non Aktif') | NOT NULL, DEFAULT 'Aktif' | Status kartu |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Waktu update |

**Indexes:**
- `idx_serial_number` ON `serial_number`
- `idx_customer_id` ON `customer_id`
- `idx_category_id` ON `category_id`
- `idx_type_id` ON `type_id`
- `idx_expired_date` ON `expired_date`
- `idx_status_card` ON `status_card`

**Foreign Keys:**
- `fk_cards_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`)
- `fk_cards_category` FOREIGN KEY (`category_id`) REFERENCES `card_categories`(`category_id`)
- `fk_cards_type` FOREIGN KEY (`type_id`) REFERENCES `card_types`(`type_id`)

### 3.7. Table: transactions
Data transaksi penjualan kartu.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| transaction_id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID transaksi |
| card_id | BIGINT | NOT NULL, FOREIGN KEY | ID kartu |
| transaction_number | VARCHAR(50) | NOT NULL, UNIQUE | Nomor transaksi (NO Reference EDC) |
| operator_id | INT | NOT NULL, FOREIGN KEY | ID operator |
| station_id | INT | NOT NULL, FOREIGN KEY | ID stasiun |
| shift_date | DATETIME | NOT NULL | Tanggal dan waktu shift |
| transaction_status | ENUM('Success', 'Failed', 'Pending') | NOT NULL, DEFAULT 'Success' | Status transaksi |
| notes | TEXT | NULL | Catatan tambahan |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Waktu update |

**Indexes:**
- `idx_transaction_number` ON `transaction_number`
- `idx_card_id` ON `card_id`
- `idx_operator_id` ON `operator_id`
- `idx_station_id` ON `station_id`
- `idx_shift_date` ON `shift_date`

**Foreign Keys:**
- `fk_transactions_card` FOREIGN KEY (`card_id`) REFERENCES `cards`(`card_id`)
- `fk_transactions_operator` FOREIGN KEY (`operator_id`) REFERENCES `operators`(`operator_id`)
- `fk_transactions_station` FOREIGN KEY (`station_id`) REFERENCES `stations`(`station_id`)

### 3.8. Table: card_usage_logs
Log penggunaan kuota kartu (opsional untuk tracking penggunaan).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| log_id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID log |
| card_id | BIGINT | NOT NULL, FOREIGN KEY | ID kartu |
| quota_used | INT | NOT NULL, DEFAULT 1 | Jumlah kuota yang digunakan |
| remaining_quota | INT | NOT NULL | Sisa kuota setelah penggunaan |
| usage_date | DATETIME | NOT NULL | Tanggal penggunaan |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |

**Indexes:**
- `idx_card_id` ON `card_id`
- `idx_usage_date` ON `usage_date`

**Foreign Keys:**
- `fk_usage_logs_card` FOREIGN KEY (`card_id`) REFERENCES `cards`(`card_id`)

### 3.9. Table: card_inventory
Inventory kartu berdasarkan kategori dan tipe (untuk tracking kartu beredar, terjual, dll).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| inventory_id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID inventory |
| category_id | INT | NOT NULL, FOREIGN KEY | ID kategori |
| type_id | INT | NOT NULL, FOREIGN KEY | ID tipe |
| card_beredar | INT | NOT NULL, DEFAULT 0 | Jumlah kartu beredar |
| card_terjual_aktif | INT | NOT NULL, DEFAULT 0 | Jumlah kartu terjual (aktif) |
| card_terjual_nonaktif | INT | NOT NULL, DEFAULT 0 | Jumlah kartu terjual (non aktif) |
| card_belum_terjual | INT | NOT NULL, DEFAULT 0 | Jumlah kartu belum terjual |
| last_updated | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Waktu update terakhir |

**Indexes:**
- `idx_category_type` ON (`category_id`, `type_id`)

**Foreign Keys:**
- `fk_inventory_category` FOREIGN KEY (`category_id`) REFERENCES `card_categories`(`category_id`)
- `fk_inventory_type` FOREIGN KEY (`type_id`) REFERENCES `card_types`(`type_id`)

## 4. Relationships

1. **customers → cards** (One-to-Many)
   - Satu pelanggan dapat memiliki banyak kartu

2. **card_categories → cards** (One-to-Many)
   - Satu kategori dapat memiliki banyak kartu

3. **card_types → cards** (One-to-Many)
   - Satu tipe dapat memiliki banyak kartu

4. **cards → transactions** (One-to-Many)
   - Satu kartu dapat memiliki banyak transaksi (jika ada refund/exchange)

5. **operators → transactions** (One-to-Many)
   - Satu operator dapat melakukan banyak transaksi

6. **stations → transactions** (One-to-Many)
   - Satu stasiun dapat memiliki banyak transaksi

7. **cards → card_usage_logs** (One-to-Many)
   - Satu kartu dapat memiliki banyak log penggunaan

## 5. SQL DDL Scripts

### 5.1. Create Database

```sql
CREATE DATABASE fwc_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fwc_system;
```

### 5.2. Create Tables

```sql
-- Table: card_categories
CREATE TABLE card_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_code VARCHAR(20) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: card_types
CREATE TABLE card_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_code VARCHAR(20) NOT NULL UNIQUE,
    type_name VARCHAR(100) NOT NULL,
    route_description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: stations
CREATE TABLE stations (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    station_code VARCHAR(20) NOT NULL UNIQUE,
    station_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: operators
CREATE TABLE operators (
    operator_id INT AUTO_INCREMENT PRIMARY KEY,
    operator_name VARCHAR(255) NOT NULL,
    nip VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_nip ON operators(nip);

-- Table: customers
CREATE TABLE customers (
    customer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    identity_number VARCHAR(50) NOT NULL UNIQUE,
    nationality VARCHAR(100) NOT NULL DEFAULT 'INDONESIA',
    email VARCHAR(255),
    phone VARCHAR(20),
    nipp_kai VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_identity_number ON customers(identity_number);
CREATE INDEX idx_email ON customers(email);
CREATE INDEX idx_phone ON customers(phone);

-- Table: cards
CREATE TABLE cards (
    card_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    category_id INT NOT NULL,
    type_id INT NOT NULL,
    quota_ticket INT NOT NULL DEFAULT 0,
    total_quota INT NOT NULL,
    fw_price DECIMAL(15,2) NOT NULL,
    purchase_date DATE NOT NULL,
    masa_berlaku INT NOT NULL,
    expired_date DATE NOT NULL,
    status_card ENUM('Aktif', 'Non Aktif') NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cards_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_cards_category FOREIGN KEY (category_id) REFERENCES card_categories(category_id),
    CONSTRAINT fk_cards_type FOREIGN KEY (type_id) REFERENCES card_types(type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_serial_number ON cards(serial_number);
CREATE INDEX idx_customer_id ON cards(customer_id);
CREATE INDEX idx_category_id ON cards(category_id);
CREATE INDEX idx_type_id ON cards(type_id);
CREATE INDEX idx_expired_date ON cards(expired_date);
CREATE INDEX idx_status_card ON cards(status_card);

-- Table: transactions
CREATE TABLE transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    card_id BIGINT NOT NULL,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    operator_id INT NOT NULL,
    station_id INT NOT NULL,
    shift_date DATETIME NOT NULL,
    transaction_status ENUM('Success', 'Failed', 'Pending') NOT NULL DEFAULT 'Success',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_card FOREIGN KEY (card_id) REFERENCES cards(card_id),
    CONSTRAINT fk_transactions_operator FOREIGN KEY (operator_id) REFERENCES operators(operator_id),
    CONSTRAINT fk_transactions_station FOREIGN KEY (station_id) REFERENCES stations(station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_transaction_number ON transactions(transaction_number);
CREATE INDEX idx_card_id ON transactions(card_id);
CREATE INDEX idx_operator_id ON transactions(operator_id);
CREATE INDEX idx_station_id ON transactions(station_id);
CREATE INDEX idx_shift_date ON transactions(shift_date);

-- Table: card_usage_logs
CREATE TABLE card_usage_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    card_id BIGINT NOT NULL,
    quota_used INT NOT NULL DEFAULT 1,
    remaining_quota INT NOT NULL,
    usage_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usage_logs_card FOREIGN KEY (card_id) REFERENCES cards(card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_card_id ON card_usage_logs(card_id);
CREATE INDEX idx_usage_date ON card_usage_logs(usage_date);

-- Table: card_inventory
CREATE TABLE card_inventory (
    inventory_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    type_id INT NOT NULL,
    card_beredar INT NOT NULL DEFAULT 0,
    card_terjual_aktif INT NOT NULL DEFAULT 0,
    card_terjual_nonaktif INT NOT NULL DEFAULT 0,
    card_belum_terjual INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_category FOREIGN KEY (category_id) REFERENCES card_categories(category_id),
    CONSTRAINT fk_inventory_type FOREIGN KEY (type_id) REFERENCES card_types(type_id),
    UNIQUE KEY unique_category_type (category_id, type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_category_type ON card_inventory(category_id, type_id);
```

### 5.3. Insert Master Data

```sql
-- Insert Card Categories
INSERT INTO card_categories (category_code, category_name, description) VALUES
('Gold', 'Gold', 'Kartu kategori Gold'),
('Silver', 'Silver', 'Kartu kategori Silver'),
('KAI', 'KAI', 'Kartu untuk karyawan KAI');

-- Insert Card Types
INSERT INTO card_types (type_code, type_name, route_description) VALUES
('JaBan', 'Jakarta-Bandung', 'Rute Jakarta ke Bandung'),
('JaKa', 'Jakarta-Karawang', 'Rute Jakarta ke Karawang'),
('KaBan', 'Karawang-Bandung', 'Rute Karawang ke Bandung');

-- Insert Stations
INSERT INTO stations (station_code, station_name, location) VALUES
('Halim', 'Halim', 'Stasiun Halim');

-- Insert Operators (sample from data)
INSERT INTO operators (operator_name, nip) VALUES
('Marcelino Kondoy', '499128'),
('Marriola Steven', '499096'),
('Alliyah Saffanah Anggraeni Tjahjadi', '499089'),
('Aridhita Eltia Anggraeni', '499126'),
('Deby Wildan Ramdani', '499127'),
('Desti Alia Rahma', '499108'),
('Desvania Tri Crisna', '499109'),
('Marlina Sari', '499129'),
('Siska Utari Agustina', '499215'),
('Siti Lia Khofipah', '499118'),
('Yori Dela Lovenia', '499120'),
('Aldo Alfansah', '499193'),
('Axel Dhiaulhaq', '499152'),
('Fajri Hidayat', '499110'),
('Muhammad Haikal', '2401645'),
('Royan Muhammad Firdaus', '2401652'),
('Reinaldy Arifin', '2404308'),
('Liza Ramadhini', NULL);
```

## 6. Business Rules

1. **Serial Number** harus unik untuk setiap kartu
2. **Identity Number** harus unik untuk setiap pelanggan
3. **Quota Ticket** tidak boleh melebihi **Total Quota**
4. **Expired Date** dihitung dari **Purchase Date** + **Masa Berlaku** (hari)
5. Status kartu default adalah 'Aktif' saat pembelian
6. Untuk karyawan KAI, field **nipp_kai** harus diisi
7. **Transaction Number** (NO Reference EDC) harus unik

## 7. Views (Optional)

### 7.1. View: vw_card_summary
View untuk melihat ringkasan kartu dengan informasi pelanggan.

```sql
CREATE VIEW vw_card_summary AS
SELECT 
    c.card_id,
    c.serial_number,
    cus.customer_name,
    cus.identity_number,
    cat.category_name AS card_category,
    ct.type_name AS card_type,
    c.quota_ticket,
    c.total_quota,
    c.fw_price,
    c.purchase_date,
    c.expired_date,
    c.status_card
FROM cards c
INNER JOIN customers cus ON c.customer_id = cus.customer_id
INNER JOIN card_categories cat ON c.category_id = cat.category_id
INNER JOIN card_types ct ON c.type_id = ct.type_id;
```

### 7.2. View: vw_transaction_detail
View untuk melihat detail transaksi dengan informasi lengkap.

```sql
CREATE VIEW vw_transaction_detail AS
SELECT 
    t.transaction_id,
    t.transaction_number,
    c.serial_number AS card_serial,
    cus.customer_name,
    o.operator_name,
    s.station_name,
    t.shift_date,
    t.transaction_status,
    t.notes
FROM transactions t
INNER JOIN cards c ON t.card_id = c.card_id
INNER JOIN customers cus ON c.customer_id = cus.customer_id
INNER JOIN operators o ON t.operator_id = o.operator_id
INNER JOIN stations s ON t.station_id = s.station_id;
```

## 8. Stored Procedures (Optional)

### 8.1. Procedure: sp_update_card_inventory
Procedure untuk update inventory kartu.

```sql
DELIMITER //
CREATE PROCEDURE sp_update_card_inventory()
BEGIN
    DELETE FROM card_inventory;
    
    INSERT INTO card_inventory (category_id, type_id, card_beredar, card_terjual_aktif, card_terjual_nonaktif, card_belum_terjual)
    SELECT 
        c.category_id,
        c.type_id,
        COUNT(*) AS card_beredar,
        SUM(CASE WHEN c.status_card = 'Aktif' THEN 1 ELSE 0 END) AS card_terjual_aktif,
        SUM(CASE WHEN c.status_card = 'Non Aktif' THEN 1 ELSE 0 END) AS card_terjual_nonaktif,
        0 AS card_belum_terjual
    FROM cards c
    GROUP BY c.category_id, c.type_id;
END //
DELIMITER ;
```

## 9. Indexes Summary

| Table | Index Name | Columns | Type |
|-------|-----------|---------|------|
| customers | idx_identity_number | identity_number | UNIQUE |
| customers | idx_email | email | INDEX |
| customers | idx_phone | phone | INDEX |
| cards | idx_serial_number | serial_number | UNIQUE |
| cards | idx_customer_id | customer_id | INDEX |
| cards | idx_category_id | category_id | INDEX |
| cards | idx_type_id | type_id | INDEX |
| cards | idx_expired_date | expired_date | INDEX |
| cards | idx_status_card | status_card | INDEX |
| transactions | idx_transaction_number | transaction_number | UNIQUE |
| transactions | idx_card_id | card_id | INDEX |
| transactions | idx_operator_id | operator_id | INDEX |
| transactions | idx_station_id | station_id | INDEX |
| transactions | idx_shift_date | shift_date | INDEX |
| operators | idx_nip | nip | INDEX |
| card_inventory | idx_category_type | category_id, type_id | INDEX |

## 10. Data Migration Notes

1. **Identity Number** harus di-normalisasi (hapus spasi, uppercase)
2. **Email** harus di-normalisasi (lowercase, trim)
3. **Phone** harus di-normalisasi (hapus spasi, karakter khusus)
4. **Serial Number** harus di-validasi format
5. **Purchase Date** dan **Expired Date** harus di-validasi format tanggal
6. **FW Price** harus di-validasi sebagai angka positif
7. Data duplikat harus di-handle dengan baik

## 11. Performance Considerations

1. Gunakan **partitioning** pada tabel `transactions` berdasarkan `shift_date` jika data sangat besar
2. Gunakan **archiving** untuk data transaksi lama (> 2 tahun)
3. Buat **materialized view** atau **summary table** untuk laporan yang sering diakses
4. Monitor dan optimize query yang sering digunakan
5. Pertimbangkan penggunaan **read replicas** untuk reporting

## 12. Security Considerations

1. Enkripsi data sensitif (identity_number, email, phone)
2. Implementasi audit logging untuk perubahan data penting
3. Role-based access control (RBAC)
4. Regular backup dan disaster recovery plan
5. Data retention policy sesuai regulasi

## 13. Future Enhancements

1. Tabel untuk tracking perubahan status kartu (card_status_history)
2. Tabel untuk promo dan diskon (promotions, discount_codes)
3. Tabel untuk refund dan exchange (refunds, exchanges)
4. Integration dengan payment gateway
5. Real-time inventory tracking
6. Mobile app integration

## 14. Audit Trail & Soft Delete

Semua tabel dalam sistem telah dilengkapi dengan kolom audit trail untuk tracking:

- **created_by** - ID operator yang membuat record (FK ke operators)
- **updated_by** - ID operator yang mengupdate record (FK ke operators)
- **deleted_by** - ID operator yang menghapus record (FK ke operators)
- **deleted_at** - Timestamp soft delete (NULL jika belum dihapus)

### Soft Delete Pattern

Sistem menggunakan **soft delete** pattern, dimana data tidak benar-benar dihapus melainkan hanya ditandai dengan `deleted_at`. Ini memungkinkan:
- Data recovery jika terhapus tidak sengaja
- Audit trail lengkap
- Compliance dengan data retention requirements

### Query Best Practices

**Selalu** gunakan `WHERE deleted_at IS NULL` untuk query normal:

```sql
-- ✅ BENAR
SELECT * FROM cards WHERE deleted_at IS NULL;

-- ❌ SALAH
SELECT * FROM cards;  -- Akan include soft deleted records
```

Semua views sudah otomatis exclude soft deleted records.

Untuk dokumentasi lengkap, lihat **AUDIT_TRAIL_DOCUMENTATION.md**.

---

**Document Version:** 1.1  
**Last Updated:** 2025-01-XX  
**Author:** Database Design Team

