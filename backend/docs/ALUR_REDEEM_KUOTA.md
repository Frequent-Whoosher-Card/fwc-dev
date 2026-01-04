# Alur Proses Redeem Kuota - User Datang ke Stasiun

Dokumentasi ini menjelaskan alur lengkap dari saat user datang ke stasiun hingga kuota kartu berkurang setelah redeem.

## 📋 Overview

Sistem FWC (Fuel Card Management) mengelola kartu tiket dengan sistem kuota. Setiap kartu memiliki:
- **totalQuota**: Total kuota awal (misal: 10 tiket)
- **quotaTicket**: Sisa kuota yang tersedia (akan berkurang setiap redeem)

## 🔄 Alur Proses Lengkap

### **Tahap 1: User Datang ke Stasiun**
```
User datang ke stasiun dengan membawa kartu fisik
↓
User memberikan kartu ke petugas/operator di stasiun
```

**Data yang diperlukan:**
- Nomor seri kartu (serialNumber)
- Stasiun tempat redeem (stationId)
- Operator/petugas yang melayani (operatorId)

---

### **Tahap 2: Scan & Validasi Otomatis**
```
Petugas scan kartu menggunakan barcode scanner/RFID reader
↓
Nomor seri OTOMATIS ter-input ke sistem (auto-fill)
↓
Sistem OTOMATIS melakukan validasi (tanpa perlu klik):
  1. Cek apakah kartu ada di database
  2. Cek status kartu (Aktif/Non_Aktif)
  3. Cek apakah kartu belum expired
  4. Cek sisa kuota (quotaTicket > 0)
↓
Hasil validasi ditampilkan ke petugas
```

**Catatan:**
- ✅ **Input nomor seri OTOMATIS** via barcode scanner/RFID
- ✅ **Validasi OTOMATIS** setelah nomor seri ter-scan (tidak perlu klik)
- ⚠️ **Petugas hanya perlu klik konfirmasi** jika validasi berhasil

**Query Database:**
```sql
SELECT * FROM cards 
WHERE serial_number = '01112500001' 
  AND deleted_at IS NULL
  AND status_card = 'Aktif'
  AND expired_date > NOW()
  AND quota_ticket > 0
```

**Response jika valid:**
```json
{
  "card": {
    "id": "uuid",
    "serialNumber": "01112500001",
    "quotaTicket": 5,        // Sisa kuota
    "totalQuota": 10,        // Total kuota awal
    "status": "Aktif",
    "expiredDate": "2025-12-31",
    "member": {
      "name": "John Doe",
      "identityNumber": "1234567890"
    },
    "category": {
      "categoryCode": "FWC_KAI",
      "categoryName": "FWC KAI"
    },
    "type": {
      "typeCode": "GOLD_JABAN",
      "typeName": "Gold Jaban"
    }
  }
}
```

**Response jika tidak valid:**
- Kartu tidak ditemukan → Error: "Kartu tidak ditemukan"
- Kartu Non-Aktif → Error: "Kartu tidak aktif"
- Kartu expired → Error: "Kartu sudah kadaluarsa"
- Kuota habis → Error: "Kuota kartu sudah habis"

---

### **Tahap 3: Konfirmasi & Proses Redeem**
```
Validasi berhasil → Tampilkan info kartu ke petugas
↓
Petugas REVIEW informasi kartu yang ditampilkan:
  - Nomor seri
  - Nama member
  - Sisa kuota
  - Status kartu
↓
Petugas KLIK tombol "Konfirmasi Redeem" / "Proses"
↓
Sistem memproses redeem dalam database transaction
```

**Catatan:**
- ⚠️ **Petugas HARUS klik aksi konfirmasi** untuk memproses redeem
- ✅ Validasi sudah otomatis, tapi eksekusi redeem tetap manual (untuk keamanan)
- 🔒 Mencegah redeem tidak sengaja jika scanner ter-trigger secara tidak sengaja

**Proses di Database (dalam 1 transaction):**

1. **Update Card - Kurangi Kuota**
```sql
UPDATE cards 
SET quota_ticket = quota_ticket - 1,
    updated_at = NOW()
WHERE card_id = 'uuid'
  AND quota_ticket > 0
```

2. **Buat Transaction Record**
```sql
INSERT INTO transactions (
  transaction_id,
  card_id,
  transaction_number,
  operator_id,
  station_id,
  shift_date,
  status,
  created_at
) VALUES (
  'uuid',
  'card_uuid',
  'TXN-20250101-001',
  'operator_uuid',
  'station_uuid',
  NOW(),
  'Success',
  NOW()
)
```

3. **Buat CardUsageLog (Audit Trail)**
```sql
INSERT INTO card_usage_logs (
  log_id,
  card_id,
  quota_used,
  remaining_quota,
  usage_date,
  created_at,
  created_by
) VALUES (
  'uuid',
  'card_uuid',
  1,                    -- 1 kuota digunakan
  4,                    -- Sisa kuota setelah redeem
  NOW(),
  NOW(),
  'operator_uuid'
)
```

4. **Update Card Status (jika kuota habis)**
```sql
-- Jika quotaTicket menjadi 0 setelah redeem
UPDATE cards 
SET status_card = 'Non_Aktif',
    updated_at = NOW()
WHERE card_id = 'uuid'
  AND quota_ticket = 0
```

---

### **Tahap 4: Konfirmasi & Response**
```
Transaksi berhasil
↓
Sistem mengembalikan response ke petugas
↓
Petugas memberikan konfirmasi ke user
```

**Response Success:**
```json
{
  "success": true,
  "message": "Redeem berhasil",
  "data": {
    "transaction": {
      "id": "uuid",
      "transactionNumber": "TXN-20250101-001",
      "card": {
        "serialNumber": "01112500001",
        "quotaTicket": 4,        // Sudah berkurang 1
        "totalQuota": 10,
        "status": "Aktif"
      },
      "station": {
        "stationName": "Stasiun Halim"
      },
      "operator": {
        "fullName": "Petugas A"
      },
      "shiftDate": "2025-01-01T10:30:00Z",
      "status": "Success"
    },
    "usageLog": {
      "quotaUsed": 1,
      "remainingQuota": 4,
      "usageDate": "2025-01-01T10:30:00Z"
    }
  }
}
```

---

## 📊 Struktur Database yang Terlibat

### 1. **Table: cards**
Menyimpan informasi kartu dan kuota
```prisma
model Card {
  id            String    @id
  serialNumber  String    @unique
  quotaTicket   Int       // Sisa kuota (akan berkurang)
  totalQuota    Int       // Total kuota awal
  status        CardStatus
  expiredDate  DateTime?
  // ... fields lainnya
}
```

### 2. **Table: transactions**
Mencatat setiap transaksi redeem
```prisma
model Transaction {
  id                String    @id
  cardId            String
  transactionNumber String    @unique
  operatorId        String
  stationId         String
  shiftDate         DateTime
  status            TransactionStatus
  // ... fields lainnya
}
```

### 3. **Table: card_usage_logs**
Audit trail penggunaan kuota
```prisma
model CardUsageLog {
  id             String   @id
  cardId         String
  quotaUsed      Int      // Berapa kuota yang digunakan
  remainingQuota Int      // Sisa kuota setelah redeem
  usageDate      DateTime
  // ... fields lainnya
}
```

---

## 🔐 Validasi & Business Rules

### Validasi Sebelum Redeem:
1. ✅ Kartu harus ada di database
2. ✅ Kartu status = 'Aktif'
3. ✅ Kartu belum expired (expiredDate > NOW())
4. ✅ Sisa kuota > 0 (quotaTicket > 0)
5. ✅ Operator harus terautentikasi
6. ✅ Operator harus memiliki akses ke stasiun tersebut

### Business Rules:
1. **Setiap redeem mengurangi 1 kuota** dari `quotaTicket`
2. **Jika kuota habis** (quotaTicket = 0), status kartu otomatis menjadi 'Non_Aktif'
3. **Setiap redeem harus dicatat** di `transactions` dan `card_usage_logs`
4. **Transaction number harus unique** (format: `TXN-{timestamp}-{serialNumber}`)
5. **Semua operasi dalam 1 database transaction** untuk menjaga konsistensi data

---

## 🎯 Contoh Skenario Lengkap

### Skenario: User dengan kartu Gold Jaban, sisa kuota 5

**Sebelum Redeem:**
```
Card: 01112500001
- totalQuota: 10
- quotaTicket: 5
- status: Aktif
```

**Proses Redeem:**
1. User datang ke Stasiun Halim
2. Petugas scan/input nomor seri: `01112500001`
3. Sistem validasi: ✅ Valid
4. Petugas konfirmasi redeem
5. Sistem eksekusi:
   - Update `cards.quotaTicket` = 4 (5 - 1)
   - Insert `transactions` record
   - Insert `card_usage_logs` record

**Setelah Redeem:**
```
Card: 01112500001
- totalQuota: 10 (tidak berubah)
- quotaTicket: 4 (berkurang 1)
- status: Aktif (masih ada kuota)
```

**Database Records:**
```sql
-- Transaction
INSERT INTO transactions VALUES (
  'txn-uuid',
  'card-uuid',
  'TXN-20250101-01112500001',
  'operator-uuid',
  'station-uuid',
  '2025-01-01 10:30:00',
  'Success'
);

-- Usage Log
INSERT INTO card_usage_logs VALUES (
  'log-uuid',
  'card-uuid',
  1,  -- quotaUsed
  4,  -- remainingQuota
  '2025-01-01 10:30:00'
);
```

---

## 🚨 Error Handling

### Error Cases:

1. **Kartu tidak ditemukan**
```json
{
  "success": false,
  "error": {
    "message": "Kartu dengan nomor seri 01112500001 tidak ditemukan",
    "code": "CARD_NOT_FOUND"
  }
}
```

2. **Kuota habis**
```json
{
  "success": false,
  "error": {
    "message": "Kuota kartu sudah habis",
    "code": "QUOTA_EXHAUSTED",
    "data": {
      "quotaTicket": 0,
      "totalQuota": 10
    }
  }
}
```

3. **Kartu expired**
```json
{
  "success": false,
  "error": {
    "message": "Kartu sudah kadaluarsa",
    "code": "CARD_EXPIRED",
    "data": {
      "expiredDate": "2024-12-31"
    }
  }
}
```

4. **Kartu Non-Aktif**
```json
{
  "success": false,
  "error": {
    "message": "Kartu tidak aktif",
    "code": "CARD_INACTIVE"
  }
}
```

---

## 📝 Catatan Penting

1. **Database Transaction**: Semua operasi (update card, insert transaction, insert log) harus dalam 1 database transaction untuk menjaga konsistensi
2. **Concurrent Access**: Gunakan database locking atau optimistic locking untuk mencegah race condition saat multiple redeem bersamaan
3. **Audit Trail**: Setiap redeem harus tercatat di `card_usage_logs` untuk tracking
4. **Master Saldo Sheet**: Sheet "Master Saldo" di Excel adalah snapshot/report yang bisa di-generate dari data `cards` dan `card_usage_logs`

---

## 🔄 Flow Diagram

```
User → Stasiun dengan Kartu
  ↓
Petugas Scan Kartu (Barcode/RFID)
  ↓
Nomor Seri OTOMATIS ter-input
  ↓
Validasi OTOMATIS
  ├─ ❌ Invalid → Tampilkan Error Message
  │   └─ Petugas informasikan ke user
  └─ ✅ Valid → Tampilkan Info Kartu
      ↓
      Petugas REVIEW Info:
      - Serial Number
      - Member Name
      - Sisa Kuota
      - Status
      ↓
      Petugas KLIK "Konfirmasi Redeem"
      ↓
      Database Transaction:
      ├─ Update Card (quotaTicket - 1)
      ├─ Insert Transaction
      ├─ Insert CardUsageLog
      └─ Update Status (jika kuota habis)
      ↓
      Return Success Response
      ↓
      Tampilkan Konfirmasi Sukses
      ↓
      User Terima Konfirmasi
```

## 🎯 Detail Interaksi UI/UX

### **Step 1: Scan Kartu**
```
[Input Field: Nomor Seri]
┌─────────────────────────────┐
│ [Auto-filled dari scanner]  │ ← Otomatis terisi saat scan
└─────────────────────────────┘
```

### **Step 2: Validasi Otomatis (Loading)**
```
🔄 Memvalidasi kartu...
```

### **Step 3a: Jika Valid - Tampilkan Info**
```
✅ Kartu Valid

┌─────────────────────────────────────┐
│ Nomor Seri: 01112500001            │
│ Member: John Doe                   │
│ Sisa Kuota: 5 / 10                 │
│ Status: Aktif                      │
│                                     │
│ [Tombol: Konfirmasi Redeem] ← KLIK │
└─────────────────────────────────────┘
```

### **Step 3b: Jika Invalid - Tampilkan Error**
```
❌ Kartu Tidak Valid

┌─────────────────────────────────────┐
│ Error: Kuota kartu sudah habis     │
│                                     │
│ [Tombol: Coba Lagi]                │
└─────────────────────────────────────┘
```

### **Step 4: Setelah Konfirmasi**
```
✅ Redeem Berhasil!

┌─────────────────────────────────────┐
│ Transaksi: TXN-20250101-001        │
│ Sisa Kuota: 4 / 10                 │
│                                     │
│ [Tombol: Redeem Lagi]              │
└─────────────────────────────────────┘
```

---

## 📌 Endpoint yang Diperlukan (Belum Tersedia)

Untuk implementasi lengkap, diperlukan endpoint:

### 1. **GET /cards/validate/:serialNumber** 
**Validasi & Get Info Kartu (Auto-trigger setelah scan)**
```typescript
// Endpoint ini dipanggil OTOMATIS setelah nomor seri ter-scan
GET /cards/validate/01112500001

Response (Valid):
{
  "success": true,
  "data": {
    "card": {
      "id": "uuid",
      "serialNumber": "01112500001",
      "quotaTicket": 5,
      "totalQuota": 10,
      "status": "Aktif",
      "expiredDate": "2025-12-31",
      "member": { "name": "John Doe" },
      "category": { "categoryName": "FWC KAI" },
      "type": { "typeName": "Gold Jaban" }
    },
    "canRedeem": true  // Flag untuk enable tombol konfirmasi
  }
}

Response (Invalid):
{
  "success": false,
  "error": {
    "message": "Kuota kartu sudah habis",
    "code": "QUOTA_EXHAUSTED"
  }
}
```

### 2. **POST /transactions/redeem**
**Proses Redeem (Manual trigger dari tombol konfirmasi)**
```typescript
// Endpoint ini dipanggil saat petugas KLIK tombol "Konfirmasi Redeem"
POST /transactions/redeem
Body: {
  "cardId": "uuid",
  "stationId": "uuid",  // Auto dari session user
  "operatorId": "uuid",  // Auto dari session user
  "notes": "Optional notes"
}

Response:
{
  "success": true,
  "message": "Redeem berhasil",
  "data": {
    "transaction": {
      "transactionNumber": "TXN-20250101-001",
      "card": {
        "serialNumber": "01112500001",
        "quotaTicket": 4,  // Sudah berkurang
        "totalQuota": 10
      }
    }
  }
}
```

### 3. **GET /cards/:id/usage-logs**
**History Penggunaan Kuota**
```typescript
GET /cards/{cardId}/usage-logs

Response:
{
  "success": true,
  "data": {
    "logs": [
      {
        "quotaUsed": 1,
        "remainingQuota": 4,
        "usageDate": "2025-01-01T10:30:00Z"
      }
    ]
  }
}
```

## 🔧 Implementasi Frontend (Flow)

### **Component: RedeemCard.tsx**

```typescript
// 1. Input field dengan auto-fill dari scanner
const [serialNumber, setSerialNumber] = useState('');
const [cardInfo, setCardInfo] = useState(null);
const [loading, setLoading] = useState(false);

// 2. Auto-validate saat serial number ter-input (dari scanner)
useEffect(() => {
  if (serialNumber.length >= 10) {  // Minimal panjang nomor seri
    validateCard(serialNumber);
  }
}, [serialNumber]);

// 3. Function validasi (auto-trigger)
const validateCard = async (serial) => {
  setLoading(true);
  try {
    const response = await fetch(`/cards/validate/${serial}`);
    const data = await response.json();
    
    if (data.success) {
      setCardInfo(data.data.card);
      // Enable tombol konfirmasi
    } else {
      // Tampilkan error
      showError(data.error.message);
    }
  } catch (error) {
    showError('Error validasi kartu');
  } finally {
    setLoading(false);
  }
};

// 4. Function redeem (manual trigger dari tombol)
const handleRedeem = async () => {
  if (!cardInfo) return;
  
  setLoading(true);
  try {
    const response = await fetch('/transactions/redeem', {
      method: 'POST',
      body: JSON.stringify({
        cardId: cardInfo.id,
        stationId: currentUser.stationId,
        operatorId: currentUser.id
      })
    });
    
    const data = await response.json();
    if (data.success) {
      showSuccess('Redeem berhasil!');
      // Reset form
      setSerialNumber('');
      setCardInfo(null);
    }
  } catch (error) {
    showError('Error proses redeem');
  } finally {
    setLoading(false);
  }
};

// 5. Render UI
return (
  <div>
    {/* Input dengan auto-fill dari scanner */}
    <input 
      value={serialNumber}
      onChange={(e) => setSerialNumber(e.target.value)}
      placeholder="Scan atau input nomor seri"
      autoFocus
    />
    
    {/* Loading saat validasi */}
    {loading && <p>Memvalidasi...</p>}
    
    {/* Info kartu jika valid */}
    {cardInfo && (
      <div>
        <p>Member: {cardInfo.member.name}</p>
        <p>Sisa Kuota: {cardInfo.quotaTicket} / {cardInfo.totalQuota}</p>
        
        {/* Tombol konfirmasi - MANUAL KLIK */}
        <button onClick={handleRedeem}>
          Konfirmasi Redeem
        </button>
      </div>
    )}
  </div>
);
```

## 🎯 Ringkasan Flow

1. ✅ **Scan Otomatis** → Nomor seri auto-fill ke input field
2. ✅ **Validasi Otomatis** → System auto-validate setelah scan
3. ⚠️ **Konfirmasi Manual** → Petugas harus klik tombol untuk proses redeem
4. ✅ **Keamanan** → Mencegah redeem tidak sengaja jika scanner ter-trigger

Endpoint-endpoint ini perlu dibuat untuk melengkapi alur redeem.

