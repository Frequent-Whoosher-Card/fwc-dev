# Inbox Module Documentation

## Overview

Modul Inbox berfungsi sebagai pusat notifikasi dan manajemen tugas (task management) sederhana di dalam sistem FWC. Modul ini tidak hanya menangani pesan teks biasa, tetapi juga **System Events** yang memerlukan tindakan (actionable items) dari pengguna, seperti validasi stok atau persetujuan isu.

## Fitur Utama

1.  **General Messaging**: Pesan informasi standar antar pengguna.
2.  **Actionable Notifications**: Notifikasi yang memiliki status (`PENDING` / `COMPLETED`) dan memicu aksi di Frontend (misal: Validasi Stok).
3.  **System Alerts**: Peringatan otomatis dari sistem (misal: Stok Menipis/Low Stock).
4.  **Audit Trail**: Menyimpan riwayat komunikasi dan aksi yang dilakukan pengguna.

---

## Struktur Data (Inbox Model)

Setiap item inbox memiliki struktur sebagai berikut:

| Field     | Tipe    | Deskripsi                                                                   |
| :-------- | :------ | :-------------------------------------------------------------------------- |
| `id`      | UUID    | ID Unik pesan.                                                              |
| `title`   | String  | Judul pesan. Jika sudah selesai, biasanya diawali `[SELESAI]`.              |
| `message` | String  | Isi pesan ringkas.                                                          |
| `type`    | String  | Tipe pesan (Lihat bagian **Message Types**).                                |
| `isRead`  | Boolean | Status keterbacaan. Actionable items yang selesai otomatis ditandai `true`. |
| `payload` | JSON    | Data dinamis untuk konteks pesan (ID transaksi, status, dll).               |
| `sentTo`  | UUID    | User ID penerima.                                                           |

---

## Message Types & Flows

### 1. Stock Distribution (Kiriman Stok)

- **Sender**: Admin / Superadmin
- **Receiver**: Supervisor Station
- **Trigger**: Admin melakukan **Stock Out** (Distribusi Kartu).
- **Tujuan**: Meminta Supervisor memvalidasi fisik kartu yang diterima.

**Payload Schema:**

```json
{
  "movementId": "uuid-stock-movement",
  "cardProductId": "uuid-product",
  "quantity": 100,
  "status": "PENDING"
}
```

**Flow:**

1.  **Pending**: Supervisor menerima pesan dengan `payload.status = "PENDING"`. Frontend menampilkan tombol **"Validasi"**.
2.  **Action**: Supervisor menekan validasi -> Frontend memanggil API `POST /out/:movementId/validate`.
3.  **Completed**:
    - Backend melakukan update pada pesan Inbox tersebut.
    - `title` berubah menjadi `[SELESAI] Kiriman Stock...`.
    - `payload.status` berubah menjadi `"COMPLETED"`.
    - `payload.validationResult` ditambahkan (berisi jumlah received/lost/damaged).
    - Frontend mengubah tampilan menjadi "History/Selesai".

### 2. Stock Issue Approval (Persetujuan Laporan Masalah)

- **Sender**: System (atas nama Supervisor)
- **Receiver**: Admin / Superadmin
- **Trigger**: Supervisor melakukan validasi Stock Out dan melaporkan ada kartu **HILANG** atau **RUSAK**.
- **Tujuan**: Meminta Admin menyetujui penghapusan/update status kartu yang bermasalah tersebut.

**Flow:**

1.  Admin menerima pesan laporan isu.
2.  Admin melakukan approval/rejection.
3.  Pesan ditandai `[RESOLVED]`.

### 3. Low Stock Alert (Peringatan Stok Menipis)

- **Sender**: System
- **Receiver**: Admin / Superadmin
- **Trigger**: Job scheduler atau event trigger mengecek stok stasiun < threshold.
- **Tujuan**: Memberi tahu Admin untuk segera restock.

---

## Panduan Integration (Frontend)

### Menentukan State UI

Gunakan kombinasi `type` dan `payload.status` untuk menentukan tampilan.

```javascript
// Contoh Logic React/Vue
if (inbox.type === "STOCK_DISTRIBUTION") {
  if (inbox.payload.status === "PENDING") {
    return <ButtonValidation movementId={inbox.payload.movementId} />;
  } else if (inbox.payload.status === "COMPLETED") {
    return (
      <StatusBadge status="Selesai" detail={inbox.payload.validationResult} />
    );
  }
}
```

### API Endpoints Terkait

1.  **Get Inbox**
    - `GET /inbox`
    - Query params: `page`, `limit`, `type`, `isRead`.

2.  **Get Inbox Detail**
    - `GET /inbox/:id`
    - Mendapatkan detail pesan beserta payload lengkapnya.

3.  **Validate Stock Out (Action - Unified)**
    - **Endpoint**: `POST /out/validate/:movementId`
    - **Support**: Mendukung validasi untuk **FWC** dan **VOUCHER**.
    - **Body**:
      ```json
      {
        "receivedSerialNumbers": ["123", "124"],
        "lostSerialNumbers": [],
        "damagedSerialNumbers": [],
        "note": "Semua aman"
      }
      ```
    - _Catatan: API ini otomatis mendeteksi tipe program (FWC/Voucher) dan mengupdate status Inbox terkait menjadi COMPLETED._

### Tips untuk Developer Frontend

- **Satu Tombol untuk Semua**: Anda tidak perlu membuat logic if-else untuk membedakan URL validasi FWC atau Voucher. Cukup gunakan endpoint `/out/validate/:movementId` untuk semua jenis notifikasi "STOCK_DISTRIBUTION".
- **Response Konsisten**: Struktur response sukses akan selalu sama untuk kedua tipe, memudahkan parsing data.
