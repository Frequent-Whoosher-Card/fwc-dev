# UUID Migration Notes

## Overview

Semua primary key dan foreign key telah diubah dari `INT AUTO_INCREMENT` / `BIGINT AUTO_INCREMENT` menjadi `UUID` (CHAR(36)).

## Perubahan yang Dilakukan

### 1. Semua Tabel Menggunakan UUID

| Tabel | Primary Key | Tipe Data |
|-------|------------|-----------|
| roles | role_id | CHAR(36) |
| card_categories | category_id | CHAR(36) |
| card_types | type_id | CHAR(36) |
| stations | station_id | CHAR(36) |
| users | user_id | CHAR(36) |
| customers | customer_id | CHAR(36) |
| cards | card_id | CHAR(36) |
| transactions | transaction_id | CHAR(36) |
| card_usage_logs | log_id | CHAR(36) |
| card_inventory | inventory_id | CHAR(36) |

### 2. Semua Foreign Key Menggunakan UUID

Semua kolom `created_by`, `updated_by`, `deleted_by` dan foreign key lainnya menggunakan `CHAR(36)`.

## Keuntungan UUID

1. **Global Uniqueness** - UUID unik secara global, tidak hanya di database
2. **Security** - Tidak bisa di-guess seperti sequential ID
3. **Distributed Systems** - Cocok untuk sistem terdistribusi
4. **No Collision** - Tidak akan collision saat merge database
5. **Privacy** - Tidak expose informasi tentang jumlah data

## Kekurangan UUID

1. **Storage** - Lebih besar (36 bytes vs 4-8 bytes untuk INT/BIGINT)
2. **Performance** - Index lebih besar, join sedikit lebih lambat
3. **Readability** - Tidak se-readable seperti sequential number

## Implementasi di MySQL

### Format UUID
```sql
-- UUID format: 550e8400-e29b-41d4-a716-446655440000
-- Stored as: CHAR(36)
```

### Generate UUID
```sql
-- MySQL 8.0+ (recommended)
CREATE TABLE example (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID())
);

-- MySQL < 8.0 atau manual
CREATE TABLE example (
    id CHAR(36) PRIMARY KEY
);
-- Generate di application level
```

### Insert dengan UUID
```sql
-- Auto-generate (MySQL 8.0+)
INSERT INTO users (full_name, username, ...) 
VALUES ('John Doe', 'john.doe', ...);
-- UUID akan otomatis di-generate

-- Manual (semua versi)
INSERT INTO users (user_id, full_name, username, ...) 
VALUES (UUID(), 'John Doe', 'john.doe', ...);
```

## Application Code Changes

### PHP Example
```php
// Generate UUID
$userId = bin2hex(random_bytes(16));
$userId = sprintf(
    '%08s-%04s-%04s-%04s-%012s',
    substr($userId, 0, 8),
    substr($userId, 8, 4),
    substr($userId, 12, 4),
    substr($userId, 16, 4),
    substr($userId, 20, 12)
);

// Atau gunakan library
use Ramsey\Uuid\Uuid;
$userId = Uuid::uuid4()->toString();
```

### JavaScript/Node.js Example
```javascript
// Generate UUID
const { v4: uuidv4 } = require('uuid');
const userId = uuidv4();
```

### Python Example
```python
import uuid
user_id = str(uuid.uuid4())
```

## Query Examples

### Select dengan UUID
```sql
-- Query tetap sama
SELECT * FROM users WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
```

### Join dengan UUID
```sql
-- Join tetap sama
SELECT * FROM cards c
INNER JOIN customers cu ON c.customer_id = cu.customer_id
WHERE c.card_id = '550e8400-e29b-41d4-a716-446655440000';
```

## Migration dari Integer ke UUID

Jika Anda sudah punya data dengan integer ID, perlu migration script:

```sql
-- 1. Tambah kolom UUID baru
ALTER TABLE users ADD COLUMN user_id_new CHAR(36);

-- 2. Generate UUID untuk semua record
UPDATE users SET user_id_new = UUID();

-- 3. Update semua foreign key references
-- (Complex process, perlu update semua tabel yang reference)

-- 4. Drop old column, rename new column
ALTER TABLE users DROP COLUMN user_id;
ALTER TABLE users CHANGE COLUMN user_id_new user_id CHAR(36) PRIMARY KEY;
```

## Best Practices

1. **Generate di Application** - Lebih baik generate UUID di application level untuk kontrol lebih baik
2. **Index UUID** - Pastikan semua foreign key di-index untuk performa
3. **Use BINARY(16)** - Untuk performa lebih baik, bisa pakai BINARY(16) instead of CHAR(36)
4. **Validation** - Validasi format UUID di application level

## Performance Considerations

### Index Size
- INT (4 bytes) → Index: ~4 bytes per entry
- UUID CHAR(36) → Index: ~36 bytes per entry
- UUID BINARY(16) → Index: ~16 bytes per entry

### Join Performance
- UUID join sedikit lebih lambat (~5-10%) dibanding INT
- Tapi masih acceptable untuk kebanyakan use case

### Recommendation
Untuk performa optimal, pertimbangkan menggunakan `BINARY(16)`:
```sql
-- Lebih efisien
id BINARY(16) PRIMARY KEY

-- Tapi perlu convert di application
-- UUID → BINARY: UNHEX(REPLACE(uuid, '-', ''))
-- BINARY → UUID: INSERT(INSERT(INSERT(INSERT(HEX(binary), 9, 0, '-'), 14, 0, '-'), 19, 0, '-'), 24, 0, '-')
```

## Notes

- MySQL 8.0+ support `DEFAULT (UUID())` untuk auto-generate
- Untuk MySQL < 8.0, generate UUID di application level
- Semua stored procedure sudah di-update untuk menggunakan CHAR(36)
- Semua views tetap bekerja dengan UUID

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0


