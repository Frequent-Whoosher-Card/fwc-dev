# Panduan Testing OCR KTP

## 1. Testing Python Script Langsung

### Test 1: Basic Functionality
```bash
cd /Users/rama/projects/fwc/backend/scripts/ocr
python3 ktp_extract.py /path/to/ktp_image.jpg
```

**Expected Output:**
- JSON dengan `success: true`
- Field `identityNumber`, `name`, `gender`, `alamat` terisi
- Tidak ada error

### Test 2: Error Handling - File Tidak Ada
```bash
python3 ktp_extract.py /path/to/nonexistent.jpg
```

**Expected Output:**
- JSON dengan `success: false`
- Error message yang jelas

### Test 3: Parse JSON Output
```bash
python3 ktp_extract.py /path/to/ktp_image.jpg | python3 -m json.tool
```

**Expected Output:**
- Valid JSON yang bisa di-parse
- Format sesuai dengan `ocrExtractResponse`

---

## 2. Testing Backend Endpoint

### Prerequisites
1. Backend server harus running
2. Python dependencies sudah terinstall
3. Punya access token untuk authentication

### Test 1: cURL - Basic Request

```bash
curl -X POST http://localhost:3000/members/ocr-extract \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@/path/to/ktp_image.jpg" \
  | python3 -m json.tool
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "identityNumber": "4529643389000738",
    "name": "Nama Asli Anda",
    "gender": "Laki-laki",
    "alamat": "Alamat Lengkap",
    ...
  },
  "raw": {
    "text_blocks_count": 30,
    "combined_text": "..."
  },
  "message": "KTP fields extracted successfully"
}
```

### Test 2: Error - Missing File
```bash
curl -X POST http://localhost:3000/members/ocr-extract \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  | python3 -m json.tool
```

**Expected Response:**
- Status: 400
- Error message tentang missing file

### Test 3: Error - Invalid File Type
```bash
curl -X POST http://localhost:3000/members/ocr-extract \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@/path/to/document.pdf" \
  | python3 -m json.tool
```

**Expected Response:**
- Status: 400
- Error message tentang invalid file type

### Test 4: Error - File Too Large
```bash
# Buat file besar dummy (11MB)
dd if=/dev/zero of=large.jpg bs=1M count=11

curl -X POST http://localhost:3000/members/ocr-extract \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@large.jpg" \
  | python3 -m json.tool
```

**Expected Response:**
- Status: 400
- Error message tentang file size

### Test 5: Error - Unauthorized
```bash
curl -X POST http://localhost:3000/members/ocr-extract \
  -F "image=@/path/to/ktp_image.jpg" \
  | python3 -m json.tool
```

**Expected Response:**
- Status: 401
- Error message tentang authentication

---

## 3. Testing dengan Postman

### Setup
1. Import collection dari `backend/postman/FWC_API.postman_collection.json`
2. Set environment variable `token` dengan access token Anda
3. Set base URL sesuai environment

### Request Configuration
- **Method:** POST
- **URL:** `{{base_url}}/members/ocr-extract`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** form-data
  - Key: `image` (type: File)
  - Value: Select KTP image file

### Test Cases di Postman

#### Test 1: Valid KTP Image
- Upload valid KTP image
- **Expected:** 200 OK dengan data terisi

#### Test 2: Different Image Formats
- Test dengan JPEG, PNG, WebP
- **Expected:** Semua format berhasil

#### Test 3: Various Image Sizes
- Test dengan gambar kecil (< 500px)
- Test dengan gambar besar (> 2000px, akan di-resize)
- **Expected:** Semua ukuran berhasil diproses

---

## 4. Testing End-to-End Flow

### Scenario: Create Member dengan OCR

1. **Upload KTP Image**
   ```bash
   curl -X POST http://localhost:3000/members/ocr-extract \
     -H "Authorization: Bearer TOKEN" \
     -F "image=@ktp.jpg" > ocr_result.json
   ```

2. **Parse dan Gunakan Hasil**
   ```bash
   # Extract field dari response
   NIK=$(cat ocr_result.json | jq -r '.data.identityNumber')
   NAME=$(cat ocr_result.json | jq -r '.data.name')
   GENDER=$(cat ocr_result.json | jq -r '.data.gender')
   ALAMAT=$(cat ocr_result.json | jq -r '.data.alamat')
   ```

3. **Create Member dengan Data dari OCR**
   ```bash
   curl -X POST http://localhost:3000/members \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d "{
       \"identityNumber\": \"$NIK\",
       \"name\": \"$NAME\",
       \"gender\": \"$GENDER\",
       \"alamat\": \"$ALAMAT\",
       \"nationality\": \"INDONESIA\"
     }"
   ```

**Expected Result:**
- Member berhasil dibuat dengan data dari OCR
- Data sesuai dengan yang ada di KTP

---

## 5. Performance Testing

### Test Response Time
```bash
time curl -X POST http://localhost:3000/members/ocr-extract \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@ktp.jpg" > /dev/null
```

**Expected:**
- First request: ~10-15 detik (model loading)
- Subsequent requests: ~5-10 detik (jika model masih di memory)

### Test Concurrent Requests
```bash
# Test 3 concurrent requests
for i in {1..3}; do
  curl -X POST http://localhost:3000/members/ocr-extract \
    -H "Authorization: Bearer TOKEN" \
    -F "image=@ktp.jpg" > result_$i.json &
done
wait
```

**Expected:**
- Semua request berhasil
- Response time mungkin lebih lama karena model loading

---

## 6. Validation Checklist

- [ ] Python script bisa dijalankan langsung
- [ ] Output JSON valid dan bisa di-parse
- [ ] Endpoint bisa diakses dengan authentication
- [ ] File upload berhasil
- [ ] Field NIK, nama, gender, alamat terisi dengan benar
- [ ] Error handling bekerja (missing file, invalid type, etc.)
- [ ] File cleanup bekerja (temporary file dihapus)
- [ ] Response format sesuai dengan model TypeScript
- [ ] Performance acceptable untuk production use

---

## Troubleshooting

### Error: "OCR process failed"
- Cek Python script path di `service.ts`
- Pastikan Python dependencies terinstall
- Cek Python version (harus 3.x)

### Error: "File not found"
- Cek path temporary file
- Cek permissions untuk write file

### Slow Performance
- Normal untuk first request (model loading)
- Pertimbangkan optimasi untuk production

### Field Tidak Terisi
- Cek format KTP (mungkin berbeda)
- Cek regex pattern di `extract_ktp_fields()`
- Lihat `raw.combined_text` untuk debug

