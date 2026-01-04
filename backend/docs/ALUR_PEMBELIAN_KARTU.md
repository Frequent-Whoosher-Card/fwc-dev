# Alur Proses Pembelian Kartu - User Datang ke Stasiun

Dokumentasi ini menjelaskan alur lengkap dari saat user datang ke stasiun hingga berhasil membeli kartu.

## 📋 Overview

Sistem FWC (Fuel Card Management) mengelola penjualan kartu tiket dengan sistem inventory. Setiap kartu memiliki:
- **serialNumber**: Nomor seri unik kartu
- **memberId**: ID member yang membeli kartu (nullable, diisi saat pembelian)
- **purchaseDate**: Tanggal pembelian kartu
- **status**: Status kartu (Aktif/Non_Aktif)
- **quotaTicket**: Sisa kuota tiket
- **totalQuota**: Total kuota awal

## 🔄 Alur Proses Lengkap

### **Tahap 1: User Datang ke Stasiun**
```
User datang ke stasiun untuk membeli kartu
↓
User mendatangi counter/loket penjualan
↓
User menyampaikan keinginan untuk membeli kartu
```

**Data yang diperlukan:**
- Informasi identitas user (nama, nomor identitas)
- Tipe kartu yang diinginkan (category & type)
- Stasiun tempat pembelian (stationId)
- Operator/petugas yang melayani (operatorId)

---

### **Tahap 2: Input Data Member**
```
Petugas meminta data identitas user
↓
Petugas input data member ke sistem:
  - Nama lengkap
  - Nomor identitas (KTP/NIK/NIPP KAI)
  - Email (opsional)
  - Phone (opsional)
  - NIPP KAI (opsional, jika ada)
↓
Sistem mencari atau membuat member baru
```

**Validasi:**
- Nomor identitas harus unik (jika member sudah ada, gunakan member yang ada)
- Nama lengkap wajib diisi
- Nomor identitas wajib diisi

**Query Database:**
```sql
-- Cari member berdasarkan nomor identitas
SELECT * FROM members 
WHERE identity_number = '1234567890'
  AND deleted_at IS NULL

-- Jika tidak ada, buat member baru
INSERT INTO members (
  member_id,
  member_name,
  identity_number,
  nationality,
  email,
  phone,
  nipp_kai,
  created_at,
  created_by
) VALUES (
  'uuid',
  'John Doe',
  '1234567890',
  'INDONESIA',
  'john@example.com',
  '081234567890',
  'NIPP123',
  NOW(),
  'operator_uuid'
)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "uuid",
      "name": "John Doe",
      "identityNumber": "1234567890",
      "email": "john@example.com",
      "phone": "081234567890"
    }
  }
}
```

---

### **Tahap 3: Pilih Tipe Kartu**
```
Petugas menanyakan tipe kartu yang diinginkan user
↓
Petugas pilih category dan type kartu:
  - Category: GOLD, SILVER, atau KAI
  - Type: JaBan, JaKa, atau KaBan
↓
Sistem cek ketersediaan stok kartu di stasiun
```

**Query Database:**
```sql
-- Cek inventory stasiun untuk category dan type tertentu
SELECT * FROM card_inventory
WHERE category_id = 'category_uuid'
  AND type_id = 'type_uuid'
  AND station_id = 'station_uuid'
  AND card_belum_terjual > 0
```

**Response jika stok tersedia:**
```json
{
  "success": true,
  "data": {
    "inventory": {
      "category": {
        "categoryCode": "GOLD",
        "categoryName": "Gold"
      },
      "type": {
        "typeCode": "JABAN",
        "typeName": "JaBan"
      },
      "availableStock": 15,  // cardBelumTerjual
      "cardProduct": {
        "price": 50000.00,
        "totalQuota": 10,
        "masaBerlaku": 365
      }
    }
  }
}
```

**Response jika stok tidak tersedia:**
```json
{
  "success": false,
  "error": {
    "message": "Stok kartu tidak tersedia di stasiun ini",
    "code": "STOCK_UNAVAILABLE"
  }
}
```

---

### **Tahap 4: Scan/Input Nomor Seri Kartu**
```
Petugas mengambil kartu fisik dari stok
↓
Petugas scan kartu menggunakan barcode scanner/RFID reader
  ATAU
Petugas input nomor seri kartu secara manual
↓
Nomor seri OTOMATIS ter-input ke sistem (jika scan)
↓
Sistem validasi kartu:
  1. Cek apakah kartu ada di database
  2. Cek apakah kartu belum terjual (status = belum ada memberId)
  3. Cek apakah kartu sesuai dengan category & type yang dipilih
  4. Cek apakah kartu ada di stok stasiun ini
```

**Query Database:**
```sql
SELECT * FROM cards 
WHERE serial_number = '01112500001'
  AND deleted_at IS NULL
  AND member_id IS NULL  -- Belum terjual
  AND category_id = 'category_uuid'
  AND type_id = 'type_uuid'
  AND status_card = 'Aktif'
```

**Response jika valid:**
```json
{
  "success": true,
  "data": {
    "card": {
      "id": "uuid",
      "serialNumber": "01112500001",
      "category": {
        "categoryCode": "GOLD",
        "categoryName": "Gold"
      },
      "type": {
        "typeCode": "JABAN",
        "typeName": "JaBan"
      },
      "totalQuota": 10,
      "quotaTicket": 10,
      "fwPrice": 50000.00,
      "masaBerlaku": 365,
      "status": "Aktif"
    },
    "canPurchase": true
  }
}
```

**Response jika tidak valid:**
- Kartu tidak ditemukan → Error: "Kartu tidak ditemukan"
- Kartu sudah terjual → Error: "Kartu sudah terjual"
- Kartu tidak sesuai tipe → Error: "Kartu tidak sesuai dengan tipe yang dipilih"
- Kartu tidak ada di stok stasiun → Error: "Kartu tidak tersedia di stasiun ini"

---

### **Tahap 5: Konfirmasi & Proses Pembelian**
```
Validasi berhasil → Tampilkan info kartu dan member ke petugas
↓
Petugas REVIEW informasi:
  - Nomor seri kartu
  - Nama member
  - Tipe kartu (category & type)
  - Harga kartu
  - Total kuota
  - Masa berlaku
↓
Petugas KLIK tombol "Konfirmasi Pembelian" / "Proses"
↓
Sistem memproses pembelian dalam database transaction
```

**Catatan:**
- ⚠️ **Petugas HARUS klik aksi konfirmasi** untuk memproses pembelian
- ✅ Validasi sudah otomatis, tapi eksekusi pembelian tetap manual (untuk keamanan)
- 🔒 Mencegah pembelian tidak sengaja jika scanner ter-trigger secara tidak sengaja

**Proses di Database (dalam 1 transaction):**

1. **Update Card - Assign ke Member & Set Purchase Date**
```sql
UPDATE cards 
SET member_id = 'member_uuid',
    purchase_date = NOW(),
    expired_date = NOW() + INTERVAL '365 days',  -- Berdasarkan masaBerlaku
    updated_at = NOW(),
    updated_by = 'operator_uuid'
WHERE card_id = 'card_uuid'
  AND member_id IS NULL  -- Pastikan belum terjual
```

2. **Update CardInventory - Kurangi Stok Belum Terjual, Tambah Stok Terjual Aktif**
```sql
-- Kurangi cardBelumTerjual
UPDATE card_inventory
SET card_belum_terjual = card_belum_terjual - 1,
    card_terjual_aktif = card_terjual_aktif + 1,
    card_beredar = card_beredar + 1,
    last_updated = NOW(),
    updated_by = 'operator_uuid'
WHERE category_id = 'category_uuid'
  AND type_id = 'type_uuid'
  AND station_id = 'station_uuid'
```

3. **Buat Transaction Record (Opsional - untuk tracking penjualan)**
```sql
INSERT INTO transactions (
  transaction_id,
  card_id,
  transaction_number,
  operator_id,
  station_id,
  shift_date,
  status,
  notes,
  created_at,
  created_by
) VALUES (
  'uuid',
  'card_uuid',
  'TXN-SALE-20250101-001',
  'operator_uuid',
  'station_uuid',
  NOW(),
  'Success',
  'Pembelian kartu baru',
  NOW(),
  'operator_uuid'
)
```

---

### **Tahap 6: Konfirmasi & Response**
```
Transaksi berhasil
↓
Sistem mengembalikan response ke petugas
↓
Petugas memberikan konfirmasi ke user
↓
User menerima kartu fisik
```

**Response Success:**
```json
{
  "success": true,
  "message": "Pembelian kartu berhasil",
  "data": {
    "card": {
      "id": "uuid",
      "serialNumber": "01112500001",
      "member": {
        "name": "John Doe",
        "identityNumber": "1234567890"
      },
      "category": {
        "categoryCode": "GOLD",
        "categoryName": "Gold"
      },
      "type": {
        "typeCode": "JABAN",
        "typeName": "JaBan"
      },
      "totalQuota": 10,
      "quotaTicket": 10,
      "purchaseDate": "2025-01-01T10:30:00Z",
      "expiredDate": "2026-01-01T10:30:00Z",
      "status": "Aktif",
      "fwPrice": 50000.00
    },
    "transaction": {
      "transactionNumber": "TXN-SALE-20250101-001",
      "station": {
        "stationName": "Stasiun Halim"
      },
      "operator": {
        "fullName": "Petugas A"
      }
    }
  }
}
```

---

## 📊 Struktur Database yang Terlibat

### 1. **Table: members**
Menyimpan informasi member/pembeli
```prisma
model Member {
  id             String    @id
  name           String
  identityNumber String    @unique
  nationality    String
  email          String?
  phone          String?
  nippKai        String?
  cards          Card[]
}
```

### 2. **Table: cards**
Menyimpan informasi kartu
```prisma
model Card {
  id            String    @id
  serialNumber  String    @unique
  memberId      String?   // Diisi saat pembelian
  cardProductId String
  categoryId    String
  typeId        String
  quotaTicket   Int
  totalQuota    Int
  fwPrice       Decimal
  purchaseDate  DateTime? // Diisi saat pembelian
  masaBerlaku   Int
  expiredDate   DateTime?
  status        CardStatus
  member        Member?
}
```

### 3. **Table: card_inventory**
Menyimpan inventory kartu per stasiun
```prisma
model CardInventory {
  id               String   @id
  categoryId       String
  typeId           String
  stationId        String?
  cardBeredar      Int      // Total kartu beredar
  cardAktif        Int      // Kartu terjual aktif
  cardNonAktif     Int      // Kartu terjual nonaktif
  cardBelumTerjual Int      // Kartu belum terjual (stok)
  cardOffice       Int?     // Kartu di office
}
```

### 4. **Table: transactions**
Mencatat setiap transaksi (opsional untuk penjualan)
```prisma
model Transaction {
  id                String    @id
  cardId            String
  transactionNumber String    @unique
  operatorId        String
  stationId         String
  shiftDate         DateTime
  status            TransactionStatus
  notes             String?
}
```

---

## 🔐 Validasi & Business Rules

### Validasi Sebelum Pembelian:
1. ✅ Member harus valid (ada atau baru dibuat)
2. ✅ Nomor identitas member harus unik
3. ✅ Stok kartu harus tersedia di stasiun (cardBelumTerjual > 0)
4. ✅ Kartu harus sesuai dengan category & type yang dipilih
5. ✅ Kartu harus belum terjual (memberId IS NULL)
6. ✅ Operator harus terautentikasi
7. ✅ Operator harus memiliki akses ke stasiun tersebut

### Business Rules:
1. **Setiap pembelian mengassign kartu ke member** (update memberId)
2. **Purchase date diisi saat pembelian** (purchaseDate = NOW())
3. **Expired date dihitung dari purchase date** (expiredDate = purchaseDate + masaBerlaku)
4. **Status kartu default = Aktif** saat pembelian
5. **Inventory stok berkurang** (cardBelumTerjual - 1, cardTerjualAktif + 1)
6. **Semua operasi dalam 1 database transaction** untuk menjaga konsistensi data

---

## 🎯 Contoh Skenario Lengkap

### Skenario: User membeli kartu Gold JaBan

**Sebelum Pembelian:**
```
Member: Tidak ada (baru)
Card: 01112500001
- memberId: NULL (belum terjual)
- status: Aktif
- totalQuota: 10
- quotaTicket: 10

Inventory Stasiun Halim (GOLD, JABAN):
- cardBelumTerjual: 15
- cardTerjualAktif: 5
```

**Proses Pembelian:**
1. User datang ke Stasiun Halim
2. Petugas input data member: John Doe, NIK: 1234567890
3. Sistem membuat member baru
4. Petugas pilih: Category = GOLD, Type = JABAN
5. Sistem cek stok: ✅ Tersedia (15 kartu)
6. Petugas scan kartu: `01112500001`
7. Sistem validasi: ✅ Valid (belum terjual, sesuai tipe)
8. Petugas konfirmasi pembelian
9. Sistem eksekusi:
   - Update card: memberId = member_uuid, purchaseDate = NOW()
   - Update inventory: cardBelumTerjual = 14, cardTerjualAktif = 6

**Setelah Pembelian:**
```
Member: John Doe (uuid)
Card: 01112500001
- memberId: member_uuid (sudah terjual)
- purchaseDate: 2025-01-01 10:30:00
- expiredDate: 2026-01-01 10:30:00
- status: Aktif
- totalQuota: 10
- quotaTicket: 10

Inventory Stasiun Halim (GOLD, JABAN):
- cardBelumTerjual: 14 (berkurang 1)
- cardTerjualAktif: 6 (bertambah 1)
```

---

## 🚨 Error Handling

### Error Cases:

1. **Member dengan nomor identitas sudah ada**
```json
{
  "success": true,
  "message": "Member sudah terdaftar",
  "data": {
    "member": {
      "id": "existing_uuid",
      "name": "John Doe",
      "identityNumber": "1234567890"
    }
  }
}
```
→ Gunakan member yang sudah ada, lanjutkan ke tahap berikutnya

2. **Stok tidak tersedia**
```json
{
  "success": false,
  "error": {
    "message": "Stok kartu tidak tersedia di stasiun ini",
    "code": "STOCK_UNAVAILABLE",
    "data": {
      "availableStock": 0
    }
  }
}
```

3. **Kartu sudah terjual**
```json
{
  "success": false,
  "error": {
    "message": "Kartu sudah terjual",
    "code": "CARD_ALREADY_SOLD",
    "data": {
      "serialNumber": "01112500001",
      "member": {
        "name": "Jane Doe"
      }
    }
  }
}
```

4. **Kartu tidak sesuai tipe**
```json
{
  "success": false,
  "error": {
    "message": "Kartu tidak sesuai dengan tipe yang dipilih",
    "code": "CARD_TYPE_MISMATCH",
    "data": {
      "selectedCategory": "GOLD",
      "selectedType": "JABAN",
      "cardCategory": "SILVER",
      "cardType": "JAKA"
    }
  }
}
```

---

## 📝 Catatan Penting

1. **Database Transaction**: Semua operasi (update card, update inventory, insert transaction) harus dalam 1 database transaction untuk menjaga konsistensi
2. **Concurrent Access**: Gunakan database locking atau optimistic locking untuk mencegah race condition saat multiple pembelian bersamaan
3. **Stock Management**: Pastikan stok selalu konsisten antara cardBelumTerjual dan jumlah kartu fisik yang ada
4. **Member Management**: Jika member sudah ada, gunakan member yang ada (jangan buat duplikat)

---

## 🔄 Flow Diagram

```
User → Stasiun untuk Beli Kartu
  ↓
Petugas Input Data Member
  ├─ Member Baru → Buat Member
  └─ Member Ada → Gunakan Member Existing
  ↓
Petugas Pilih Tipe Kartu (Category & Type)
  ↓
Sistem Cek Stok Stasiun
  ├─ ❌ Stok Habis → Error: Stok tidak tersedia
  └─ ✅ Stok Tersedia → Lanjut
  ↓
Petugas Scan/Input Nomor Seri Kartu
  ↓
Validasi Kartu
  ├─ ❌ Invalid → Tampilkan Error
  │   ├─ Kartu tidak ditemukan
  │   ├─ Kartu sudah terjual
  │   ├─ Kartu tidak sesuai tipe
  │   └─ Kartu tidak ada di stok
  └─ ✅ Valid → Tampilkan Info Kartu
      ↓
      Petugas REVIEW Info:
      - Serial Number
      - Member Name
      - Category & Type
      - Harga
      - Total Quota
      ↓
      Petugas KLIK "Konfirmasi Pembelian"
      ↓
      Database Transaction:
      ├─ Update Card (memberId, purchaseDate, expiredDate)
      ├─ Update Inventory (kurangi stok, tambah terjual)
      └─ Insert Transaction (opsional)
      ↓
      Return Success Response
      ↓
      Tampilkan Konfirmasi Sukses
      ↓
      User Terima Kartu Fisik
```

---

## 🎯 Detail Interaksi UI/UX

### **Step 1: Input Data Member**
```
┌─────────────────────────────────────┐
│ Form Data Member                     │
├─────────────────────────────────────┤
│ Nama Lengkap: [____________]        │
│ Nomor Identitas: [____________]      │
│ Email: [____________] (opsional)     │
│ Phone: [____________] (opsional)    │
│ NIPP KAI: [____________] (opsional) │
│                                     │
│ [Tombol: Cari/Create Member]       │
└─────────────────────────────────────┘
```

### **Step 2: Pilih Tipe Kartu**
```
┌─────────────────────────────────────┐
│ Pilih Tipe Kartu                    │
├─────────────────────────────────────┤
│ Category: [Dropdown: GOLD ▼]       │
│ Type: [Dropdown: JABAN ▼]          │
│                                     │
│ Stok Tersedia: 15 kartu            │
│ Harga: Rp 50.000                    │
│ Total Quota: 10 tiket               │
│                                     │
│ [Tombol: Lanjutkan]                │
└─────────────────────────────────────┘
```

### **Step 3: Scan/Input Nomor Seri**
```
┌─────────────────────────────────────┐
│ Input Nomor Seri Kartu              │
├─────────────────────────────────────┤
│ [Input: Auto-filled dari scanner]   │
│                                     │
│ [Tombol: Validasi Kartu]           │
└─────────────────────────────────────┘
```

### **Step 4: Validasi & Review**
```
┌─────────────────────────────────────┐
│ ✅ Kartu Valid                      │
├─────────────────────────────────────┤
│ Nomor Seri: 01112500001            │
│ Member: John Doe                   │
│ Category: Gold                     │
│ Type: JaBan                        │
│ Harga: Rp 50.000                   │
│ Total Quota: 10 tiket              │
│ Masa Berlaku: 365 hari            │
│                                     │
│ [Tombol: Konfirmasi Pembelian] ← KLIK │
└─────────────────────────────────────┘
```

### **Step 5: Konfirmasi Sukses**
```
┌─────────────────────────────────────┐
│ ✅ Pembelian Berhasil!              │
├─────────────────────────────────────┤
│ Transaksi: TXN-SALE-20250101-001   │
│ Nomor Seri: 01112500001            │
│ Member: John Doe                   │
│ Total Quota: 10 tiket              │
│                                     │
│ [Tombol: Cetak Struk]              │
│ [Tombol: Pembelian Baru]           │
└─────────────────────────────────────┘
```

---

## 📌 Endpoint yang Diperlukan

Untuk implementasi lengkap, diperlukan endpoint:

### 1. **POST /members** atau **GET /members/search**
**Cari atau Buat Member**
```typescript
POST /members
Body: {
  "name": "John Doe",
  "identityNumber": "1234567890",
  "email": "john@example.com",
  "phone": "081234567890",
  "nippKai": "NIPP123"
}

Response:
{
  "success": true,
  "data": {
    "member": {
      "id": "uuid",
      "name": "John Doe",
      "identityNumber": "1234567890"
    }
  }
}
```

### 2. **GET /inventory/stock**
**Cek Stok Kartu di Stasiun**
```typescript
GET /inventory/stock?categoryId=uuid&typeId=uuid&stationId=uuid

Response:
{
  "success": true,
  "data": {
    "availableStock": 15,
    "cardProduct": {
      "price": 50000.00,
      "totalQuota": 10,
      "masaBerlaku": 365
    }
  }
}
```

### 3. **GET /cards/validate/:serialNumber**
**Validasi Kartu untuk Pembelian**
```typescript
GET /cards/validate/01112500001?categoryId=uuid&typeId=uuid&stationId=uuid

Response (Valid):
{
  "success": true,
  "data": {
    "card": {
      "id": "uuid",
      "serialNumber": "01112500001",
      "totalQuota": 10,
      "quotaTicket": 10,
      "fwPrice": 50000.00,
      "masaBerlaku": 365
    },
    "canPurchase": true
  }
}
```

### 4. **POST /cards/purchase**
**Proses Pembelian Kartu**
```typescript
POST /cards/purchase
Body: {
  "cardId": "uuid",
  "memberId": "uuid",
  "stationId": "uuid",  // Auto dari session user
  "operatorId": "uuid",  // Auto dari session user
  "notes": "Optional notes"
}

Response:
{
  "success": true,
  "message": "Pembelian kartu berhasil",
  "data": {
    "card": {
      "serialNumber": "01112500001",
      "purchaseDate": "2025-01-01T10:30:00Z",
      "expiredDate": "2026-01-01T10:30:00Z"
    }
  }
}
```

---

## 🎯 Ringkasan Flow

1. ✅ **User datang** → Stasiun untuk beli kartu
2. ✅ **Input data member** → Cari atau buat member baru
3. ✅ **Pilih tipe kartu** → Category & Type, cek stok
4. ✅ **Scan/Input nomor seri** → Validasi kartu
5. ⚠️ **Konfirmasi manual** → Petugas harus klik tombol untuk proses pembelian
6. ✅ **Update database** → Assign member, update inventory, set purchase date
7. ✅ **Konfirmasi sukses** → User terima kartu fisik

Endpoint-endpoint ini perlu dibuat untuk melengkapi alur pembelian kartu.











