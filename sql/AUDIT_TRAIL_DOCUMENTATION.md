# Audit Trail & Soft Delete Documentation

## Overview

Semua tabel dalam sistem FWC telah dilengkapi dengan kolom audit trail untuk tracking siapa yang membuat, mengubah, atau menghapus data. Sistem juga menggunakan **soft delete pattern** untuk menjaga integritas data dan memungkinkan recovery jika diperlukan.

## Kolom Audit Trail

Setiap tabel (kecuali `card_usage_logs` yang hanya memiliki `created_by`) memiliki kolom berikut:

| Kolom | Tipe | Deskripsi | Foreign Key |
|-------|------|-----------|-------------|
| `created_at` | TIMESTAMP | Waktu record dibuat | - |
| `created_by` | INT | ID operator yang membuat record | `operators.operator_id` |
| `updated_at` | TIMESTAMP | Waktu record terakhir diupdate | - |
| `updated_by` | INT | ID operator yang mengupdate record | `operators.operator_id` |
| `deleted_at` | TIMESTAMP | Waktu record dihapus (soft delete) | - |
| `deleted_by` | INT | ID operator yang menghapus record | `operators.operator_id` |

## Tabel dengan Audit Trail

### 1. Master Tables
- ✅ `card_categories`
- ✅ `card_types`
- ✅ `stations`
- ✅ `operators` (self-reference untuk created_by/updated_by/deleted_by)

### 2. Core Tables
- ✅ `customers`
- ✅ `cards`
- ✅ `transactions`

### 3. Supporting Tables
- ✅ `card_inventory` (hanya `updated_by`, karena auto-update)
- ⚠️ `card_usage_logs` (hanya `created_by` sebagai VARCHAR untuk system/gate ID)

## Soft Delete Pattern

### Konsep

Soft delete berarti data tidak benar-benar dihapus dari database, melainkan hanya ditandai sebagai "deleted" dengan mengisi kolom `deleted_at`. Data yang sudah di-soft delete tidak akan muncul di query normal, tetapi masih bisa di-recover jika diperlukan.

### Implementasi

```sql
-- Soft Delete (tidak benar-benar menghapus)
UPDATE cards 
SET deleted_at = NOW(), 
    deleted_by = @operator_id
WHERE card_id = @card_id;

-- Query normal (hanya menampilkan data yang tidak dihapus)
SELECT * FROM cards WHERE deleted_at IS NULL;

-- Query termasuk data yang dihapus (untuk admin/recovery)
SELECT * FROM cards WHERE deleted_at IS NOT NULL;
```

### Keuntungan Soft Delete

1. **Data Recovery** - Data bisa di-restore jika terhapus secara tidak sengaja
2. **Audit Trail** - Tetap bisa melihat history data yang sudah dihapus
3. **Referential Integrity** - Foreign key constraints tetap terjaga
4. **Compliance** - Memenuhi requirement untuk data retention
5. **Analytics** - Data historis tetap tersedia untuk analisis

## Best Practices

### 1. Query Normal (Exclude Soft Deleted)

**Selalu** gunakan `WHERE deleted_at IS NULL` untuk query normal:

```sql
-- ✅ BENAR
SELECT * FROM cards 
WHERE deleted_at IS NULL 
AND status_card = 'Aktif';

-- ❌ SALAH (akan include soft deleted records)
SELECT * FROM cards 
WHERE status_card = 'Aktif';
```

### 2. Views

Semua views sudah otomatis exclude soft deleted records:

```sql
-- View sudah include WHERE deleted_at IS NULL
SELECT * FROM vw_card_summary;
SELECT * FROM vw_transaction_detail;
```

### 3. Stored Procedures

Update stored procedures untuk exclude soft deleted:

```sql
CREATE PROCEDURE sp_get_card_by_serial(IN p_serial_number VARCHAR(50))
BEGIN
    SELECT * FROM cards
    WHERE serial_number = p_serial_number
      AND deleted_at IS NULL;  -- ✅ Include soft delete check
END;
```

### 4. Application Layer

Di application code, selalu set audit trail fields:

```php
// Example: Create Card
INSERT INTO cards (
    serial_number, customer_id, category_id, type_id,
    created_by, updated_by  -- ✅ Set audit trail
) VALUES (
    @serial_number, @customer_id, @category_id, @type_id,
    @current_operator_id, @current_operator_id
);

// Example: Update Card
UPDATE cards 
SET quota_ticket = @new_quota,
    updated_by = @current_operator_id,  -- ✅ Set updated_by
    updated_at = NOW()
WHERE card_id = @card_id
  AND deleted_at IS NULL;  -- ✅ Exclude soft deleted

// Example: Soft Delete Card
UPDATE cards 
SET deleted_at = NOW(),
    deleted_by = @current_operator_id  -- ✅ Set deleted_by
WHERE card_id = @card_id;
```

## Indexes untuk Performance

Index telah ditambahkan pada kolom `deleted_at` untuk performa query:

```sql
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX idx_cards_deleted_at ON cards(deleted_at);
```

## Foreign Key Constraints

Semua foreign key untuk audit trail menggunakan `ON DELETE SET NULL`:

```sql
CONSTRAINT fk_cards_created_by 
    FOREIGN KEY (created_by) 
    REFERENCES operators(operator_id) 
    ON DELETE SET NULL
```

Ini berarti jika operator dihapus, kolom `created_by` akan menjadi NULL (bukan error).

## Special Cases

### 1. Operators Table

Table `operators` menggunakan **self-reference** untuk `created_by`, `updated_by`, dan `deleted_by`:

```sql
created_by INT NULL,
CONSTRAINT fk_operators_created_by 
    FOREIGN KEY (created_by) 
    REFERENCES operators(operator_id) 
    ON DELETE SET NULL
```

Ini memungkinkan admin pertama dibuat tanpa reference, atau admin lain membuat operator baru.

### 2. Card Usage Logs

Table `card_usage_logs` hanya memiliki `created_by` sebagai VARCHAR(50) karena:
- Log dibuat oleh system/gate, bukan operator
- Tidak perlu soft delete (log tidak pernah dihapus)
- `created_by` bisa berisi "SYSTEM", "GATE-001", dll

### 3. Transactions

Untuk `transactions`, `created_by` biasanya sama dengan `operator_id` (operator yang melakukan transaksi), tetapi tetap disimpan terpisah untuk audit trail yang lebih detail.

## Recovery Process

### Restore Soft Deleted Record

```sql
-- Restore card yang terhapus
UPDATE cards 
SET deleted_at = NULL,
    deleted_by = NULL,
    updated_by = @current_operator_id,
    updated_at = NOW()
WHERE card_id = @card_id
  AND deleted_at IS NOT NULL;
```

### Permanent Delete (Hard Delete)

Jika benar-benar perlu menghapus data secara permanen (setelah periode retention):

```sql
-- ⚠️ HATI-HATI: Permanent delete, tidak bisa di-recover
DELETE FROM cards 
WHERE deleted_at IS NOT NULL
  AND deleted_at < DATE_SUB(NOW(), INTERVAL 7 YEAR);  -- Contoh: hapus setelah 7 tahun
```

## Audit Trail Queries

### Siapa yang membuat record?

```sql
SELECT 
    c.*,
    o.operator_name AS created_by_name
FROM cards c
LEFT JOIN operators o ON c.created_by = o.operator_id
WHERE c.card_id = @card_id;
```

### Siapa yang mengupdate record terakhir?

```sql
SELECT 
    c.*,
    o.operator_name AS updated_by_name,
    c.updated_at
FROM cards c
LEFT JOIN operators o ON c.updated_by = o.operator_id
WHERE c.card_id = @card_id;
```

### History perubahan

```sql
-- Lihat semua perubahan pada card (jika ada audit log table)
SELECT * FROM card_audit_log
WHERE card_id = @card_id
ORDER BY changed_at DESC;
```

### Data yang dihapus oleh operator tertentu

```sql
SELECT 
    c.*,
    o.operator_name AS deleted_by_name,
    c.deleted_at
FROM cards c
LEFT JOIN operators o ON c.deleted_by = o.operator_id
WHERE c.deleted_by = @operator_id
  AND c.deleted_at IS NOT NULL;
```

## Migration Script

Jika Anda sudah punya data existing tanpa audit trail, gunakan script berikut:

```sql
-- Set created_by untuk data existing (gunakan operator_id dari transactions jika ada)
UPDATE cards c
INNER JOIN transactions t ON c.card_id = t.card_id
SET c.created_by = t.operator_id,
    c.updated_by = t.operator_id
WHERE c.created_by IS NULL;

-- Set created_by untuk customers dari cards
UPDATE customers c
INNER JOIN cards ca ON c.customer_id = ca.customer_id
SET c.created_by = ca.created_by,
    c.updated_by = ca.updated_by
WHERE c.created_by IS NULL;
```

## Compliance & Security

1. **Data Retention** - Soft delete memungkinkan compliance dengan regulasi data retention
2. **Audit Requirements** - Semua perubahan tercatat dengan siapa dan kapan
3. **Non-Repudiation** - Tidak bisa menyangkal siapa yang membuat/mengubah data
4. **Forensics** - Bisa trace siapa yang menghapus data jika ada masalah

## Recommendations

1. ✅ **Selalu set audit trail** saat create/update/delete
2. ✅ **Gunakan views** untuk query normal (sudah exclude soft deleted)
3. ✅ **Index deleted_at** untuk performa query
4. ✅ **Regular backup** data yang di-soft delete
5. ✅ **Permanent delete** hanya setelah periode retention
6. ✅ **Log semua perubahan** jika perlu audit trail yang lebih detail

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0


