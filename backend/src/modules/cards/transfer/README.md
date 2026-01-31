# Dokumentasi Modul Transfer Kartu (Backend)

Dokumen ini menjelaskan cara menggunakan API Transfer Kartu untuk kebutuhan integrasi Frontend. Fitur ini mendukung transfer kartu **FWC (Membership)** maupun **Voucher** antar stasiun.

## 📌 Konsep Utama

1.  **Satu Endpoint untuk Semua**: Tidak ada endpoint terpisah untuk FWC atau Voucher. Pembedaan dilakukan melalui filter `programType` ("FWC" | "VOUCHER") saat mengambil data list.
2.  **Status `ON_TRANSFER`**: Ketika kartu dikirim, status kartunya di database berubah menjadi `ON_TRANSFER` (bukan `IN_TRANSIT`). Kartu tersebut sementara waktu "hilang" dari inventaris pengirim dan belum masuk ke inventaris penerima sampai diterima.
3.  **Flow**: `Kirim (Create)` -> `Pending` -> `Terima (Receive)` -> `Approved (Masuk Stok)`.

---

## 🚀 Daftar Endpoint

Base URL: `/transfers`

### 1. Membuat Transfer (Kirim Kartu)

Digunakan oleh **Pengirim** (Stasiun Asal) untuk mengirimkan kartu ke stasiun lain.

- **Method**: `POST`
- **URL**: `/transfers`
- **Header**: `Authorization: Bearer <token>`
- **Body (JSON)**:

```json
{
  "stationId": "uuid-stasiun-pengirim",
  "toStationId": "uuid-stasiun-tujuan",
  "categoryId": "uuid-kategori",
  "typeId": "uuid-tipe-kartu",
  "cardIds": ["uuid-kartu-1", "uuid-kartu-2", "uuid-kartu-3"],
  "note": "Catatan opsional (misal: Transfer stok tambahan)"
}
```

> **Catatan Frontend**: User harus memilih kartu spesifik (`cardIds`) yang akan dikirim. Backend akan memvalidasi apakah kartu tersebut benar-benar ada di stasiun pengirim (`IN_STATION`).

---

### 2. Mengambil List Transfer (Inbox & History)

Digunakan untuk menampilkan daftar transfer, baik yang **masuk (Incoming)** maupun **keluar (Outgoing)**.

- **Method**: `GET`
- **URL**: `/transfers`
- **Query Parameters**:

| Param         | Tipe   | Deskripsi                                                                          |
| :------------ | :----- | :--------------------------------------------------------------------------------- |
| `stationId`   | UUID   | Filter transfer yang melibatkan stasiun ini (baik sebagai pengirim ATAU penerima). |
| `status`      | String | Filter status transfer: `PENDING`, `APPROVED`, `REJECTED`.                         |
| `programType` | String | **PENTING**: Filter jenis kartu. Isi dengan `FWC` atau `VOUCHER`.                  |
| `page`        | Int    | Halaman (Default: 1).                                                              |
| `limit`       | Int    | Jumlah per halaman (Default: 10).                                                  |
| `search`      | String | Pencarian global (mencari di note, nama stasiun, nama kategori/tipe).              |

**Contoh Penggunaan Frontend:**

- **Tab "Transfer Masuk" (Incoming)**:
  - Ambil data dengan `stationId = <ID Stasiun User>` dan `status = PENDING`.
  - Di UI, cek apakah `toStation.id === <ID Stasiun User>`. Jika ya, berarti ini barang masuk (bisa tombol Terima).
- **Tab "Riwayat Transfer" (History)**:
  - Ambil semua data dengan `stationId = <ID Stasiun User>`.

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-transfer",
        "movementAt": "2024-01-31T10:00:00.000Z",
        "status": "PENDING",
        "quantity": 50,
        "note": "Kirim stok",
        "station": { "stationName": "Stasiun Halim" }, // Pengirim
        "toStation": { "stationName": "Stasiun Padalarang" }, // Penerima
        "category": { "categoryName": "Membership", "programType": "FWC" },
        "cardType": { "typeName": "Gold" }
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 3. Menerima Transfer (Receive)

Digunakan oleh **Penerima** (Stasiun Tujuan) untuk mengonfirmasi penerimaan barang.

- **Method**: `POST`
- **URL**: `/transfers/:id/receive`
- **Body**: `{}` (Kosong)

**Efek Setelah Klik Terima:**

1.  Status transfer berubah menjadi `APPROVED`.
2.  Status kartu berubah dari `ON_TRANSFER` menjadi `IN_STATION`.
3.  Kartu otomatis masuk ke inventaris Stasiun Penerima.

---

### 4. Detail Transfer

Melihat detail satu transaksi transfer.

- **Method**: `GET`
- **URL**: `/transfers/:id`

---

## 💡 Tips Integrasi Frontend

1.  **Membedakan FWC & Voucher**:
    - Gunakan query param `programType=FWC` saat user berada di menu "Stok Kartu FWC".
    - Gunakan query param `programType=VOUCHER` saat user berada di menu "Stok Voucher".
2.  **Validasi Button Terima**:
    - Pastikan tombol "Terima" hanya muncul jika transfer **status = PENDING** DAN **user adalah penerima** (`user.stationId === item.toStationId`).
