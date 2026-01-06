# OCR KTP Scripts

Script Python untuk ekstraksi field KTP menggunakan PaddleOCR.

## Instalasi

```bash
pip install -r requirements.txt
```

## File

- `ktp_ocr.py` - Class utama untuk OCR dengan fungsi `extract_ktp_fields()`
- `ktp_extract.py` - Script untuk dipanggil dari subprocess, output JSON ke stdout

## Penggunaan

### Manual Testing

```bash
python ktp_extract.py /path/to/ktp_image.jpg
```

### Dari Backend TypeScript

Script ini dipanggil otomatis oleh backend melalui endpoint `POST /members/ocr-extract`.

