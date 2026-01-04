# 📊 RINGKASAN DATA SEEDER - SISTEM FWC

Dokumentasi ini menjelaskan data yang sudah dibuat oleh seeder `seedInventoryAndPurchases.ts` untuk memudahkan testing dan pemahaman alur data.

---

## 📦 1. STOCK IN (PRODUKSI KARTU)

Tabel ini menampilkan batch produksi kartu yang dibuat di Office.

| No | Category | Type | Jumlah Kartu | Serial Number Range | Status | Keterangan |
|----|----------|------|--------------|---------------------|--------|------------|
| 1 | Gold | JaBan | 20 | 01112500061 - 01112500080 | APPROVED | Batch produksi Gold JaBan |
| 2 | Silver | JaKa | 15 | 01222500001 - 01222500015 | APPROVED | Batch produksi Silver JaKa |
| 3 | Gold | KaBan | 10 | 01132500001 - 01132500010 | APPROVED | Batch produksi Gold KaBan |

**Total Produksi:** 45 kartu

**Catatan:**
- Serial number format: `{serialTemplate}{YY}{suffix}`
  - Contoh: `01112500061` = Template `0111` + Tahun `25` + Suffix `00061`
- Semua kartu dibuat dengan status `IN_OFFICE`
- Inventory Office otomatis bertambah sesuai jumlah produksi

---

## 🚚 2. STOCK OUT (DISTRIBUSI KARTU)

Tabel ini menampilkan distribusi kartu dari Office ke Stasiun.

| No | Category | Type | Stasiun Tujuan | Jumlah Kartu | Serial Range (Suffix) | Status | Keterangan |
|----|----------|------|----------------|--------------|----------------------|--------|------------|
| 1 | Gold | JaBan | Halim | 10 | 61-70 | APPROVED | Distribusi ke Stasiun Halim |
| 2 | Silver | JaKa | Success | 8 | 1-8 | APPROVED | Distribusi ke Stasiun Success |
| 3 | Gold | KaBan | Tegalluar | 5 | 1-5 | APPROVED | Distribusi ke Stasiun Tegalluar |

**Total Distribusi:** 23 kartu

**Catatan:**
- Status awal: `PENDING` (setelah dibuat)
- Status akhir: `APPROVED` (setelah validasi)
- Semua kartu diterima (tidak ada yang hilang/rusak)
- Kartu berubah status: `IN_OFFICE` → `IN_TRANSIT` → `IN_STATION`

---

## ✅ 3. VALIDASI STOCK OUT

Tabel ini menampilkan hasil validasi penerimaan kartu di stasiun.

| Movement ID | Stasiun | Diterima | Hilang | Rusak | Status | Validator |
|-------------|---------|----------|--------|-------|--------|-----------|
| 3bf26373... | Halim | 10 | 0 | 0 | APPROVED | rama |
| f6968744... | Success | 8 | 0 | 0 | APPROVED | rama |
| bed9d99e... | Tegalluar | 5 | 0 | 0 | APPROVED | rama |

**Total Validasi:** 23 kartu (semua diterima)

**Catatan:**
- Semua kartu yang dikirim diterima dengan baik
- Tidak ada kartu yang hilang atau rusak
- Inventory stasiun otomatis bertambah setelah validasi

---

## 💰 4. PURCHASES (PEMBELIAN KARTU)

Tabel ini menampilkan transaksi pembelian kartu oleh customer.

### 4.1. Pembelian per Stasiun

| Stasiun | Jumlah Pembelian | Category | Type | Serial Numbers | Member |
|---------|-------------------|----------|------|----------------|--------|
| **Halim** | 20 | Gold | JaBan | 01112500061-01112500070<br>01112500081-01112500085<br>01112500121-01112500125 | Member Seeder |
| **Success** | 3 | Silver | JaKa | 01222500046-01222500048 | Member Seeder |
| **Tegalluar** | 2 | Gold | KaBan | 01132500031-01132500032 | Member Seeder |

**Total Pembelian:** 25 kartu

### 4.2. Detail Transaksi

| Transaction Number | Tanggal | Kartu | Stasiun | Harga | Status Kartu |
|-------------------|---------|-------|---------|-------|--------------|
| PUR-20260102-526369 | 2026-01-01 | 01112500061 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-527038 | 2026-01-01 | 01112500062 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-527575 | 2026-01-01 | 01112500063 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-528127 | 2026-01-01 | 01112500064 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-528652 | 2026-01-01 | 01112500065 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-551299 | 2026-01-01 | 01112500066 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-551931 | 2026-01-01 | 01112500067 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-552472 | 2026-01-01 | 01112500068 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-552984 | 2026-01-01 | 01112500069 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-553538 | 2026-01-01 | 01112500070 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-574604 | 2026-01-01 | 01112500081 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-575238 | 2026-01-01 | 01112500082 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-575780 | 2026-01-01 | 01112500083 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-576346 | 2026-01-01 | 01112500084 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-576860 | 2026-01-01 | 01112500085 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-622177 | 2026-01-01 | 01112500121 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-623097 | 2026-01-01 | 01112500122 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-623619 | 2026-01-01 | 01112500123 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-624108 | 2026-01-01 | 01112500124 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-624664 | 2026-01-01 | 01112500125 | Halim | Rp 2.000.000 | SOLD_ACTIVE |
| PUR-20260102-625492 | 2026-01-01 | 01222500046 | Success | Rp 450.000 | SOLD_ACTIVE |
| PUR-20260102-626073 | 2026-01-01 | 01222500047 | Success | Rp 450.000 | SOLD_ACTIVE |
| PUR-20260102-626572 | 2026-01-01 | 01222500048 | Success | Rp 450.000 | SOLD_ACTIVE |
| PUR-20260102-627291 | 2026-01-01 | 01132500031 | Tegalluar | Rp 1.000.000 | SOLD_ACTIVE |
| PUR-20260102-627820 | 2026-01-01 | 01132500032 | Tegalluar | Rp 1.000.000 | SOLD_ACTIVE |

**Catatan:**
- Semua kartu berubah status: `IN_STATION` → `SOLD_ACTIVE`
- Setiap kartu memiliki `purchaseDate` dan `expiredDate`
- Inventory stasiun: `cardBelumTerjual` berkurang, `cardAktif` bertambah

---

## 📊 5. INVENTORY SUMMARY

### 5.1. Total Summary (Keseluruhan)

| Metrik | Jumlah |
|--------|--------|
| **Total Cards** | 340 kartu |
| **Total Lost** | 0 kartu |
| **Total Damaged** | 0 kartu |
| **Total Stock IN** | 248 kartu |
| **Total Stock OUT** | 67 kartu |

### 5.2. Inventory per Lokasi

| Lokasi | Total Kartu | Keterangan |
|--------|-------------|------------|
| **Office** | 248 kartu | Kartu yang masih di office (belum didistribusi) |
| **Halim** | 20 kartu | Total kartu di stasiun Halim |
| **Success** | 29 kartu | Total kartu di stasiun Success |
| **Tegalluar** | 18 kartu | Total kartu di stasiun Tegalluar |

### 5.3. Inventory per Category & Type (Detail)

| Category | Type | Office | Stasiun | Belum Terjual | Aktif (Terjual) | Keterangan |
|----------|------|--------|---------|----------------|-----------------|------------|
| Gold | JaBan | ~181 | 20 | ~5 | 20 | Sebagian besar di office, 20 terjual di Halim |
| Silver | JaKa | ~15 | 29 | ~26 | 3 | Sebagian besar di stasiun, 3 terjual di Success |
| Gold | KaBan | ~52 | 18 | ~16 | 2 | Sebagian besar di office, 2 terjual di Tegalluar |

**Catatan:**
- **Office**: Kartu yang masih di office (status `IN_OFFICE`)
- **Stasiun**: Kartu yang sudah didistribusi ke stasiun (status `IN_STATION`)
- **Belum Terjual**: Kartu di stasiun yang belum dibeli (`cardBelumTerjual`)
- **Aktif (Terjual)**: Kartu yang sudah terjual dan aktif (`cardAktif`)

---

## 👥 6. MEMBERS (DATA MEMBER)

| Nama | Identity Number | Email | Phone | Kartu yang Dibeli |
|------|-----------------|-------|-------|-------------------|
| Member Seeder | (auto-generated) | - | - | 25 kartu |

**Catatan:**
- Member dibuat otomatis oleh seeder
- Semua pembelian menggunakan member yang sama untuk testing

---

## 🔄 7. ALUR DATA LENGKAP (DARI SEEDER)

### Step 1: Stock IN (Produksi)
```
Office: Membuat 45 kartu baru
├─ Gold JaBan: 20 kartu (01112500061-01112500080)
├─ Silver JaKa: 15 kartu (01222500001-01222500015)
└─ Gold KaBan: 10 kartu (01132500001-01132500010)

Status: IN_OFFICE
Inventory Office: +45
```

### Step 2: Stock OUT (Distribusi)
```
Office → Stasiun: Mengirim 23 kartu
├─ Gold JaBan → Halim: 10 kartu (suffix 61-70)
├─ Silver JaKa → Success: 8 kartu (suffix 1-8)
└─ Gold KaBan → Tegalluar: 5 kartu (suffix 1-5)

Status: IN_OFFICE → IN_TRANSIT (PENDING)
Inventory Office: -23
```

### Step 3: Validasi Stock OUT
```
Stasiun: Menerima dan validasi 23 kartu
├─ Halim: 10 diterima, 0 hilang, 0 rusak
├─ Success: 8 diterima, 0 hilang, 0 rusak
└─ Tegalluar: 5 diterima, 0 hilang, 0 rusak

Status: IN_TRANSIT → IN_STATION (APPROVED)
Inventory Stasiun: +23 (cardBelumTerjual)
```

### Step 4: Purchase (Pembelian)
```
Customer: Membeli 25 kartu
├─ Halim: 20 pembelian Gold JaBan
├─ Success: 3 pembelian Silver JaKa
└─ Tegalluar: 2 pembelian Gold KaBan

Status: IN_STATION → SOLD_ACTIVE
Inventory Stasiun: 
  - cardBelumTerjual: -25
  - cardAktif: +25
```

---

## 📈 8. STATISTIK RINGKAS

| Metrik | Jumlah |
|--------|--------|
| **Total Kartu Diproduksi** | 248 kartu (dari semua batch) |
| **Total Kartu Didistribusi** | 67 kartu |
| **Total Kartu Terjual** | 25 kartu |
| **Total Kartu di Office** | 248 kartu |
| **Total Kartu di Stasiun** | 67 kartu |
| **Total Revenue** | ~Rp 45.350.000 |

**Breakdown Revenue:**
- Gold JaBan (20 kartu × Rp 2.000.000) = Rp 40.000.000
- Silver JaKa (3 kartu × Rp 450.000) = Rp 1.350.000
- Gold KaBan (2 kartu × Rp 1.000.000) = Rp 2.000.000

---

## 🎯 9. DATA UNTUK TESTING

### 9.1. Kartu untuk Testing Redeem

| Serial Number | Category | Type | Status | Quota | Stasiun | Bisa Redeem? |
|---------------|----------|------|--------|-------|---------|--------------|
| 01112500061 | Gold | JaBan | SOLD_ACTIVE | 10 | Halim | ✅ Ya |
| 01112500062 | Gold | JaBan | SOLD_ACTIVE | 10 | Halim | ✅ Ya |
| 01222500046 | Silver | JaKa | SOLD_ACTIVE | 6 | Success | ✅ Ya |
| 01132500031 | Gold | KaBan | SOLD_ACTIVE | 10 | Tegalluar | ✅ Ya |

**Catatan:**
- Semua kartu yang terjual memiliki `quotaTicket = totalQuota` (belum digunakan)
- Kartu siap untuk testing redeem

### 9.2. Kartu untuk Testing Purchase Baru

| Serial Number | Category | Type | Status | Lokasi | Bisa Dibeli? |
|---------------|----------|------|--------|--------|--------------|
| 01112500071 | Gold | JaBan | IN_STATION | Halim | ✅ Ya |
| 01112500072 | Gold | JaBan | IN_STATION | Halim | ✅ Ya |
| 01222500009 | Silver | JaKa | IN_STATION | Success | ✅ Ya |
| 01132500006 | Gold | KaBan | IN_STATION | Tegalluar | ✅ Ya |

**Catatan:**
- Kartu dengan status `IN_STATION` siap untuk dibeli
- Pastikan kartu belum pernah dibeli sebelumnya

---

## 🔍 10. QUERY UNTUK VERIFIKASI

### 10.1. Cek Total Kartu per Status
```sql
SELECT status, COUNT(*) as jumlah 
FROM cards 
WHERE deleted_at IS NULL 
GROUP BY status;
```

### 10.2. Cek Inventory per Stasiun
```sql
SELECT 
  s.station_name,
  ci.card_belum_terjual,
  ci.card_terjual_aktif,
  ci.card_terjual_nonaktif
FROM card_inventory ci
LEFT JOIN stations s ON ci.station_id = s.station_id
WHERE ci.deleted_at IS NULL;
```

### 10.3. Cek Total Purchases per Stasiun
```sql
SELECT 
  s.station_name,
  COUNT(*) as total_pembelian
FROM card_purchases cp
JOIN stations s ON cp.station_id = s.station_id
WHERE cp.deleted_at IS NULL
GROUP BY s.station_name;
```

---

## 📝 11. CATATAN PENTING

1. **Serial Number Format:**
   - Format: `{serialTemplate}{YY}{suffix}`
   - Contoh: `01112500061` = Template `0111` + Tahun `25` + Suffix `00061`

2. **Status Kartu:**
   - `IN_OFFICE`: Di office, belum didistribusi
   - `IN_TRANSIT`: Sedang dalam perjalanan ke stasiun
   - `IN_STATION`: Sudah diterima di stasiun, siap dijual
   - `SOLD_ACTIVE`: Sudah terjual, aktif (masih ada kuota)
   - `SOLD_INACTIVE`: Sudah terjual, nonaktif (kuota habis)

3. **Inventory Tracking:**
   - `cardOffice`: Kartu di office
   - `cardBeredar`: Total kartu yang beredar
   - `cardBelumTerjual`: Kartu di stasiun yang belum terjual
   - `cardAktif`: Kartu yang sudah terjual dan aktif
   - `cardNonAktif`: Kartu yang sudah terjual dan nonaktif

4. **Data Testing:**
   - Semua data dibuat dengan tanggal mundur (untuk testing)
   - Stock IN: 7 hari yang lalu
   - Stock OUT: 5 hari yang lalu
   - Purchase: 3 hari yang lalu

---

## 🚀 12. NEXT STEPS UNTUK TESTING

1. ✅ **Stock IN** - Sudah ada data
2. ✅ **Stock OUT** - Sudah ada data
3. ✅ **Validasi Stock OUT** - Sudah ada data
4. ✅ **Purchase** - Sudah ada data
5. ⏳ **Redeem** - Belum ada, bisa testing dengan kartu yang sudah terjual
6. ⏳ **Sales Report** - Bisa testing dengan data purchase yang ada

---

**Terakhir Update:** 2026-01-02
**Seeder Version:** 1.0.0

