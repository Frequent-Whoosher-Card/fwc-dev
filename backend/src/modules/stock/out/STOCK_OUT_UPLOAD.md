# Dokumentasi Implementasi Upload File Stock Out (FWC & Voucher)

Dokumen ini menjelaskan spesifikasi API dan panduan integrasi Frontend untuk fitur Upload File Nota Dinas dan BAST pada modul Stock Out.

## 1. Spesifikasi Backend API

Backend telah diperbarui untuk menerima input bertipe `multipart/form-data`.

### A. Create Stock Out FWC

- **Endpoint:** `POST /stock/out/fwc`
- **Content-Type:** `multipart/form-data`

| Key Parameter   | Tipe              | Wajib | Keterangan                                            |
| :-------------- | :---------------- | :---- | :---------------------------------------------------- |
| `movementAt`    | String (ISO Date) | Ya    | Tanggal transaksi, contoh: `2024-02-05T00:00:00.000Z` |
| `cardProductId` | UUID              | Ya    | ID Produk Kartu                                       |
| `stationId`     | UUID              | Ya    | ID Stasiun Tujuan                                     |
| `quantity`      | Number            | Ya    | Jumlah kartu                                          |
| `startSerial`   | String            | Ya    | Serial number awal                                    |
| `endSerial`     | String            | Ya    | Serial number akhir                                   |
| `note`          | String            | Tidak | Catatan tambahan                                      |
| `notaDinas`     | String            | Tidak | Nomor Nota Dinas (Teks)                               |
| `bast`          | String            | Tidak | Nomor BAST (Teks)                                     |
| `notaDinasFile` | **File**          | Tidak | File fisik dokumen Nota Dinas (.pdf, .jpg, dll)       |
| `bastFile`      | **File**          | Tidak | File fisik dokumen BAST (.pdf, .jpg, dll)             |

### B. Create Stock Out Voucher

- **Endpoint:** `POST /stock/out/voucher`
- **Content-Type:** `multipart/form-data`
- **Logic Tambahan:** Voucher memerlukan validasi tanggal serial (`serialDate`).

| Key Parameter   | Tipe              | Wajib | Keterangan                                                                                       |
| :-------------- | :---------------- | :---- | :----------------------------------------------------------------------------------------------- |
| `movementAt`    | String (ISO Date) | Ya    | Tanggal transaksi                                                                                |
| `serialDate`    | String (ISO Date) | Ya    | Tanggal referensi serial number (biasanya sama dengan movementAt atau diambil dari serial)       |
| `startSerial`   | String            | Ya    | **Suffix** Serial awal (5 digit terakhir) jika format panjang, atau full jika manual.            |
| ...             | ...               | ...   | Parameter `cardProductId`, `stationId`, `quantity`, `note`, `notaDinas`, `bast` sama dengan FWC. |
| `notaDinasFile` | **File**          | Tidak | File Upload                                                                                      |
| `bastFile`      | **File**          | Tidak | File Upload                                                                                      |

---

## 2. Panduan Integrasi Frontend

Karena API membutuhkan `multipart/form-data`, kita **TIDAK BISA** mengirim JSON object biasa (`{ key: value }`). Kita harus menggunakan objek `FormData`.

### A. Service Layer (`stock.service.ts`)

Pastikan fungsi pemanggil API bisa menerima `FormData` atau `any`. Jangan paksa tipe payload menjadi strict object jika ingin fleksibel.

```typescript
// frontend/lib/services/stock.service.ts

createStockOut: async (payload: any) => {
  // Payload bisa berupa FormData atau JSON Object biasa

  // Deteksi Program Type
  let programType = "fwc";
  let dataToSend = payload;

  if (payload instanceof FormData) {
    // Jika FormData, ambil programType dari dalamnya (jika di-append)
    const pt = payload.get("programType");
    if (pt) programType = pt.toString();
  } else {
    // Jika JSON
    if (payload.programType) programType = payload.programType;
    const { programType: pt, ...rest } = payload;
    dataToSend = rest;
  }

  // Axios akan otomatis set header 'multipart/form-data' jika dataToSend adalah instance FormData
  return axios.post(`/stock/out/${programType.toLowerCase()}`, dataToSend);
},
```

### B. Component / Hook Layer

Di level UI (React), saat tombol **Simpan** ditekan, kita harus menyusun `FormData`.

**Langkah-langkah:**

1.  Siapkan state untuk file: `const [notaFile, setNotaFile] = useState<File | null>(null);`
2.  Pasang `<input type="file" onChange={e => setNotaFile(e.target.files[0])} />`.
3.  Saat submit, buat `new FormData()` dan append semua field.

#### Contoh Implementasi Logic Submit:

```typescript
const handleSubmit = async () => {
  // 1. Validasi Input Dasar
  if (!form.productId || !form.stationId) {
    toast.error("Data belum lengkap");
    return;
  }

  // 2. Siapkan FormData
  const formData = new FormData();

  // 3. Append Data Wajib
  formData.append("programType", programType); // Penting untuk routing service
  formData.append("movementAt", new Date(form.movementAt).toISOString());
  formData.append("cardProductId", form.productId);
  formData.append("stationId", form.stationId);
  formData.append("quantity", form.quantity);

  // 4. Append Text Optional
  if (form.note) formData.append("note", form.note);
  if (form.notaDinas) formData.append("notaDinas", form.notaDinas);
  if (form.bast) formData.append("bast", form.bast);

  // 5. Append Logic Voucher (PENTING)
  let finalStart = form.startSerial;
  let finalEnd = form.endSerial;

  if (programType === "VOUCHER") {
    let serialDateStr = new Date(form.movementAt).toISOString();

    // Jika user input serial panjang (e.g., FWC24010100001), kita ambil suffix dan tanggalnya
    if (form.startSerial.length > 10) {
      const suffix = form.startSerial.slice(-5); // 5 digit terakhir
      // Logika parsing tanggal dari serial number jika perlu
      // ...
      finalStart = suffix;
      if (form.endSerial.length > 10) finalEnd = form.endSerial.slice(-5);
    }
    formData.append("serialDate", serialDateStr);
  }

  formData.append("startSerial", finalStart);
  formData.append("endSerial", finalEnd);

  // 6. Append FILE (Inti Fitur)
  // Pastikan object 'notaDinasFile' adalah instance File asli dari input HTML
  if (notaDinasFile) {
    formData.append("notaDinasFile", notaDinasFile);
  }

  if (bastFile) {
    formData.append("bastFile", bastFile);
  }

  // 7. Kirim ke Service
  try {
    await stockService.createStockOut(formData);
    toast.success("Berhasil disimpan!");
  } catch (err) {
    toast.error("Gagal simpan");
  }
};
```

## 3. Troubleshooting Umum

**Masalah:** Error 400 / 422 / 500 saat Submit.
**Cek:**

1.  **Header:** Jangan set `Content-Type` secara manual di Axios config. Biarkan kosong agar browser mengisi boundary-nya.
2.  **Field Name:** Pastikan key `append('notaDinasFile', file)` sama persis dengan backend model (`notaDinasFile` dan `bastFile`).
3.  **Null Value:** Jangan melakukan append jika file kosong/null.
    - _Salah:_ `formData.append('file', null)` -> Terkirim string "null".
    - _Benar:_ `if (file) formData.append('file', file)`.

## 4. Lokasi Penyimpanan

File yang berhasil diupload akan tersimpan di server backend pada folder:
`backend/storage/stock-out/`

Format nama file otomatis digenerate menjadi:
`{TIMESTAMP}-{SANITIZED_FILENAME}`
Contoh: `1707123456789-Nota-Dinas-001.pdf`
