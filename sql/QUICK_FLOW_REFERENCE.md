# Quick Flow Reference - FWC System

## 🎯 Ringkasan Alur Utama

### 1️⃣ Penjualan Kartu (Sales Flow)
```
Customer → Operator → Input Data → Pilih Kartu → Bayar → Create Card → Serahkan Kartu
```

### 2️⃣ Penggunaan Kartu (Usage Flow)
```
Customer → Scan Kartu → Validasi → Cek Quota → Kurangi Quota → Buka Gate → Naik Kereta
```

### 3️⃣ Manajemen Inventory (Inventory Flow)
```
Admin/System → Query Cards → Hitung per Kategori/Tipe → Update Inventory Table
```

### 4️⃣ Maintenance (Maintenance Flow)
```
Scheduled Job → Cek Expired Cards → Update Status → Sync Inventory → Generate Reports
```

---

## 📊 Flowchart Ringkas

### Penjualan Kartu
```
START
  ↓
Input Data Customer
  ↓
Pilih Kategori & Tipe
  ↓
Cek Inventory → [Tidak] → END
  ↓ [Ya]
Generate Serial Number
  ↓
Pembayaran via EDC
  ↓
[Gagal] → END
  ↓ [Berhasil]
Create Customer & Card
  ↓
Create Transaction
  ↓
Update Inventory
  ↓
Serahkan Kartu
  ↓
END
```

### Penggunaan Kartu
```
START
  ↓
Scan Kartu
  ↓
Validasi Status & Expiry
  ↓
[Invalid] → Tolak Akses → END
  ↓ [Valid]
Cek Quota
  ↓
[Habis] → Tolak Akses → END
  ↓ [Ada]
Kurangi Quota (-1)
  ↓
Log Penggunaan
  ↓
Buka Gate
  ↓
END
```

---

## 🔄 State Diagram - Card Lifecycle

```
[Created] → [Active] → [In Use] → [Quota Exhausted] → [Inactive]
                ↓                        ↓
            [Expired]              [Inactive]
                ↓                        ↓
            [Inactive] ←──────── [Top Up/Extend]
```

---

## 👥 User Roles & Responsibilities

| Role | Tugas Utama |
|------|-------------|
| **Customer** | Beli kartu, gunakan kartu untuk naik kereta |
| **Operator** | Proses penjualan, input data, validasi kartu |
| **Admin** | Kelola master data, inventory, laporan |
| **System** | Auto expiry check, inventory sync, notifications |

---

## 📋 Checklist Proses Penjualan

- [ ] Customer datang ke stasiun
- [ ] Operator login ke sistem
- [ ] Input data customer (Nama, NIK, Email, Phone)
- [ ] Pilih kategori kartu (Gold/Silver/KAI)
- [ ] Pilih tipe kartu (JaBan/JaKa/KaBan)
- [ ] Cek inventory tersedia
- [ ] Generate serial number
- [ ] Proses pembayaran via EDC
- [ ] Dapatkan NO Reference EDC
- [ ] Create customer record (jika baru)
- [ ] Create card record (Status: Aktif)
- [ ] Hitung expired date (Purchase Date + Masa Berlaku)
- [ ] Create transaction record
- [ ] Update inventory
- [ ] Cetak receipt
- [ ] Serahkan kartu ke customer

---

## 📋 Checklist Validasi Kartu

- [ ] Kartu ditemukan di database
- [ ] Status kartu = Aktif
- [ ] Tanggal belum kadaluarsa
- [ ] Quota masih tersedia (> 0)
- [ ] Serial number valid

---

## 🔍 Key Decision Points

### 1. Penjualan
- **Inventory tersedia?** → Ya: Lanjut | Tidak: Informasi ke customer
- **Pembayaran berhasil?** → Ya: Create card | Tidak: Retry/Batal

### 2. Penggunaan
- **Kartu valid?** → Ya: Lanjut | Tidak: Tolak akses
- **Quota tersedia?** → Ya: Kurangi quota | Tidak: Tolak akses

### 3. Maintenance
- **Kartu kadaluarsa?** → Ya: Update status Non Aktif | Tidak: Biarkan
- **Inventory perlu sync?** → Ya: Jalankan sp_update_card_inventory | Tidak: Skip

---

## 🎯 Business Rules Summary

1. **Serial Number** harus unik
2. **Identity Number** harus unik per customer
3. **Quota** tidak boleh negatif
4. **Expired Date** = Purchase Date + Masa Berlaku
5. **Status Default** saat pembelian = Aktif
6. **Inventory** auto-update via triggers
7. **Kartu kadaluarsa** otomatis menjadi Non Aktif

---

## 📊 Data Flow Summary

```
Customer Data → Customers Table
     ↓
Card Data → Cards Table → Inventory Update
     ↓
Transaction Data → Transactions Table
     ↓
Usage Data → Card Usage Logs Table
     ↓
Inventory Stats → Card Inventory Table
```

---

## 🔗 Related Documents

- **APPLICATION_FLOW.md** - Dokumentasi lengkap dengan diagram detail
- **DATABASE_DESIGN.md** - Struktur database
- **fwc_database.sql** - SQL DDL scripts
- **ERD_DIAGRAM.md** - Entity Relationship Diagram

---

**Last Updated:** 2025-01-XX


