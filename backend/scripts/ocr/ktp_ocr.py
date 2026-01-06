#!/usr/bin/env python3
"""
Script untuk ekstraksi teks dari KTP menggunakan PaddleOCR
"""

from paddleocr import PaddleOCR
import cv2
import os
import sys
import json
import re
from pathlib import Path


class KTPOCR:
    def __init__(self, lang='id', max_image_size=1200):
        """
        Inisialisasi PaddleOCR untuk ekstraksi teks KTP
        
        Args:
            lang: Bahasa (default: 'id' untuk Indonesia)
            max_image_size: Ukuran maksimal gambar (lebar atau tinggi) sebelum resize.
                           Jika None, tidak akan di-resize. Default: 1200 pixels
                           (Optimal untuk KTP: cukup besar untuk akurasi, cukup kecil untuk kecepatan)
        """
        # Suppress print statements when called from subprocess
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print("Memuat model PaddleOCR...", file=sys.stderr)
        
        # Optimasi PaddleOCR untuk kecepatan:
        # - use_angle_cls=False: Skip angle classification (KTP biasanya sudah lurus)
        # - det_db_thresh=0.3: Threshold untuk deteksi teks (default 0.3, bisa dinaikkan untuk skip area non-teks)
        # - rec_batch_num=6: Batch size untuk recognition (default 6, bisa disesuaikan dengan RAM)
        self.ocr = PaddleOCR(
            lang=lang,
            use_angle_cls=False,  # Skip angle classification untuk mempercepat (KTP biasanya lurus)
            det_db_thresh=0.3,    # Threshold untuk deteksi teks
            rec_batch_num=6       # Batch size untuk recognition
        )
        self.max_image_size = max_image_size
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print("Model PaddleOCR siap digunakan!", file=sys.stderr)
    
    def extract_text(self, image_path):
        """
        Ekstrak teks dari gambar KTP
        
        Args:
            image_path: Path ke file gambar KTP
            
        Returns:
            Dictionary berisi hasil OCR dengan teks dan koordinat
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"File tidak ditemukan: {image_path}")
        
        # Suppress logs when called from subprocess
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print(f"\nMemproses gambar: {image_path}", file=sys.stderr)
        
        # Baca gambar untuk cek ukuran dan resize jika perlu
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Tidak dapat membaca gambar: {image_path}")
        
        original_height, original_width = img.shape[:2]
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print(f"Ukuran gambar: {original_width}x{original_height} pixels", file=sys.stderr)
        
        # Resize jika gambar terlalu besar (untuk mempercepat proses)
        if self.max_image_size and (original_width > self.max_image_size or original_height > self.max_image_size):
            # Hitung scale factor
            scale = min(self.max_image_size / original_width, self.max_image_size / original_height)
            new_width = int(original_width * scale)
            new_height = int(original_height * scale)
            
            # Resize dengan INTER_AREA untuk downscaling (lebih cepat dan lebih baik untuk teks)
            img = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_AREA)
            if os.getenv('SUPPRESS_OCR_LOGS') != '1':
                print(f"Gambar di-resize menjadi: {new_width}x{new_height} pixels (scale: {scale:.2f}) untuk mempercepat proses", file=sys.stderr)
        
        # Convert ke grayscale untuk mempercepat OCR (KTP biasanya hitam putih)
        # Ini mengurangi data yang diproses tanpa mengurangi akurasi signifikan
        if len(img.shape) == 3:
            img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Convert kembali ke BGR untuk PaddleOCR (beberapa model expect BGR)
            img = cv2.cvtColor(img_gray, cv2.COLOR_GRAY2BGR)
        
        # Lakukan OCR
        result = self.ocr.predict(img)
        
        # Format hasil
        extracted_data = {
            'image_path': image_path,
            'text_blocks': [],
            'full_text': []
        }
        
        # Parse hasil OCR - hasil dari predict() adalah OCRResult object
        if result and len(result) > 0:
            ocr_result = result[0]  # Ambil OCRResult object
            
            # OCRResult adalah dict-like, akses data menggunakan keys yang diketahui
            # Keys: rec_texts (teks), rec_scores (confidence), rec_polys/rec_boxes (bounding boxes)
            texts = ocr_result.get('rec_texts', [])
            scores = ocr_result.get('rec_scores', [])
            boxes = ocr_result.get('rec_polys', ocr_result.get('rec_boxes', []))
            
            # Parse data
            if texts is not None and len(texts) > 0:
                    # Pastikan panjangnya sama
                    min_len = min(len(texts), len(boxes) if boxes else len(texts), len(scores) if scores else len(texts))
                    
                    for i in range(min_len):
                        text = texts[i] if i < len(texts) else ""
                        bbox = boxes[i] if boxes and i < len(boxes) else None
                        confidence = scores[i] if scores and i < len(scores) else 1.0
                        
                        if text:
                            extracted_data['text_blocks'].append({
                                'text': text,
                                'confidence': float(confidence),
                                'bbox': bbox
                            })
                            extracted_data['full_text'].append(text)
            elif hasattr(ocr_result, 'dt_polys') and hasattr(ocr_result, 'rec_text'):
                # Fallback: coba akses langsung sebagai atribut
                dt_polys = ocr_result.dt_polys if ocr_result.dt_polys else []
                rec_text = ocr_result.rec_text if ocr_result.rec_text else []
                rec_score = ocr_result.rec_score if hasattr(ocr_result, 'rec_score') and ocr_result.rec_score else []
                
                min_len = min(len(dt_polys), len(rec_text))
                
                for i in range(min_len):
                    bbox = dt_polys[i] if i < len(dt_polys) else None
                    text = rec_text[i] if i < len(rec_text) else ""
                    confidence = rec_score[i] if i < len(rec_score) else 1.0
                    
                    if text:
                        extracted_data['text_blocks'].append({
                            'text': text,
                            'confidence': float(confidence),
                            'bbox': bbox
                        })
                        extracted_data['full_text'].append(text)
            elif hasattr(ocr_result, '__iter__'):
                # Jika bisa di-iterate langsung
                try:
                    for item in ocr_result:
                        if hasattr(item, 'text') or isinstance(item, (list, tuple)):
                            if isinstance(item, (list, tuple)) and len(item) >= 2:
                                bbox = item[0]
                                text_info = item[1]
                                
                                if isinstance(text_info, (list, tuple)) and len(text_info) >= 2:
                                    text = text_info[0]
                                    confidence = text_info[1]
                                elif isinstance(text_info, str):
                                    text = text_info
                                    confidence = 1.0
                                else:
                                    continue
                                
                                extracted_data['text_blocks'].append({
                                    'text': text,
                                    'confidence': float(confidence),
                                    'bbox': bbox
                                })
                                extracted_data['full_text'].append(text)
                except:
                    pass
            
            # Coba akses sebagai dict jika memiliki to_dict method
            if hasattr(ocr_result, 'to_dict'):
                try:
                    result_dict = ocr_result.to_dict()
                    # Parse dari dict
                    if 'rec_text' in result_dict:
                        texts = result_dict.get('rec_text', [])
                        scores = result_dict.get('rec_score', [1.0] * len(texts))
                        boxes = result_dict.get('dt_polys', [None] * len(texts))
                        
                        for i, text in enumerate(texts):
                            if text:
                                extracted_data['text_blocks'].append({
                                    'text': text,
                                    'confidence': float(scores[i] if i < len(scores) else 1.0),
                                    'bbox': boxes[i] if i < len(boxes) else None
                                })
                                extracted_data['full_text'].append(text)
                except:
                    pass
        
        extracted_data['combined_text'] = '\n'.join(extracted_data['full_text'])
        
        return extracted_data
    
    def extract_from_folder(self, folder_path):
        """
        Ekstrak teks dari semua gambar di folder
        
        Args:
            folder_path: Path ke folder berisi gambar KTP
            
        Returns:
            List of dictionaries berisi hasil OCR untuk setiap gambar
        """
        results = []
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif']
        
        folder = Path(folder_path)
        image_files = [
            f for f in folder.iterdir() 
            if f.suffix.lower() in image_extensions
        ]
        
        if not image_files:
            print(f"Tidak ada file gambar ditemukan di: {folder_path}")
            return results
        
        print(f"Menemukan {len(image_files)} file gambar")
        
        for img_file in image_files:
            try:
                result = self.extract_text(str(img_file))
                results.append(result)
            except Exception as e:
                print(f"Error memproses {img_file}: {str(e)}")
                continue
        
        return results
    
    def extract_ktp_fields(self, extracted_data):
        """
        Ekstrak field spesifik dari hasil OCR KTP
        
        Args:
            extracted_data: Dictionary hasil dari extract_text()
            
        Returns:
            Dictionary dengan field: nik, nama, jenis_kelamin, alamat, dll
        """
        fields = {
            'nik': None,
            'nama': None,
            'jenis_kelamin': None,
            'alamat': None,
            'rt_rw': None,
            'kelurahan': None,
            'kecamatan': None,
            'tempat_tgl_lahir': None,
            'agama': None,
            'status_perkawinan': None,
            'pekerjaan': None,
            'kewarganegaraan': None,
        }
        
        # Gabungkan semua teks untuk pencarian
        # Gunakan newline untuk mempertahankan struktur baris (penting untuk pattern matching)
        all_text = '\n'.join(extracted_data['full_text'])
        text_lines = extracted_data['full_text']
        
        # 1. NIK - biasanya 16 digit angka, bisa ada spasi atau strip
        nik_patterns = [
            r'NIK[:\s]*(\d{16})',  # NIK: 1234567890123456
            r'NIK[:\s]*(\d{4}\s?\d{4}\s?\d{4}\s?\d{4})',  # NIK dengan spasi
            r'(\d{16})',  # Hanya 16 digit (ambil yang pertama)
        ]
        nik_found = None
        for pattern in nik_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE)
            if match and match.lastindex and match.lastindex >= 1:
                nik = re.sub(r'\s+', '', match.group(1))  # Hapus spasi
                if len(nik) == 16 and nik.isdigit():
                    fields['nik'] = nik
                    nik_found = match  # Simpan match untuk digunakan di pattern nama
                    break
        
        # 2. Nama - bisa setelah NIK atau setelah label "Nama"
        # Pattern 1: Setelah NIK (16 digit), biasanya nama langsung mengikuti di baris berikutnya
        # Format: 3273172602770010\nYAN SEN NICO\nToiLahir
        if nik_found:
            nik_match = nik_found
        else:
            nik_match = re.search(r'(\d{16})', all_text)
        
        if nik_match:
            # Cari teks setelah NIK yang kemungkinan nama
            nik_end = nik_match.end()
            after_nik = all_text[nik_end:]
            
            # Cari baris setelah NIK yang berisi huruf besar (nama biasanya huruf besar semua)
            # Pattern: \n diikuti : (optional) lalu huruf besar, stop di \nat/Tgl atau label lain
            # Format bisa: \n:DEBBY ANGGRAINI\n atau \nYAN SEN NICO\n
            nama_after_nik = re.search(
                r'\n:?\s*([A-Z][A-Z\s]{2,50}?)(?:\nat/Tgl|\nToiLahir|\nTempat|\nLahir|\nKelamin|\nJenis|\nGol|\nGol\s+Darah|\nAlamat|\nRT|\nRW|\nARW|\nKel|\nKec|\nVDesa|\ncamatan|\nAgama|\nStatus|\nPekerjaan|\nKewarganegaraan|\nPROVINSI|\nKOTA|\nnegaraan|$)',
                after_nik,
                re.MULTILINE
            )
            if nama_after_nik and nama_after_nik.lastindex and nama_after_nik.lastindex >= 1:
                nama = nama_after_nik.group(1).strip()
                nama = re.sub(r'\s+', ' ', nama)
                # Pastikan bukan angka, bukan label, dan cukup panjang
                excluded_words = ['nik', 'nama', 'tempat', 'lahir', 'toilahir', 'bandung', 'kota', 'kota bandung', 'provinsi', 'jakarta', 'jakarta selatan', 'dki jakarta']
                if (len(nama) > 2 and 
                    not nama.replace(' ', '').isdigit() and 
                    not nama.lower() in excluded_words and
                    not re.match(r'^\d+', nama) and
                    len(nama.split()) <= 6 and  # Max 6 kata untuk nama
                    len(nama) >= 3):  # Min 3 karakter
                    fields['nama'] = nama
        
        # Pattern 2: Setelah label "Nama" atau "Nama Lengkap"
        if not fields['nama']:
            nama_patterns = [
                r'Nama\s+(?:Lengkap)?[:\s]*([A-Z][A-Z\s]+?)(?:\n|Tempat|Jenis|Alamat|RT|Kel|Kec|Agama|Status|Pekerjaan|Kewarganegaraan|PROVINSI|KOTA|NIK)',
                r'Nama[:\s]*([A-Z][A-Z\s]{3,50})',
            ]
            for pattern in nama_patterns:
                match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
                if match and match.lastindex and match.lastindex >= 1:
                    nama = match.group(1).strip()
                    # Bersihkan nama dari karakter aneh
                    nama = re.sub(r'\s+', ' ', nama)
                    if len(nama) > 3 and not nama.isdigit():
                        fields['nama'] = nama
                        break
        
        # 3. Jenis Kelamin
        jenis_kelamin_patterns = [
            r'Jenis\s+kelamin[:\s]*([A-Za-z/]+)',
            r'(Laki\s*[-\s]?laki|Perempuan)',
        ]
        for pattern in jenis_kelamin_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE)
            if match:
                # Check if group 1 exists, otherwise use group 0
                if match.lastindex and match.lastindex >= 1:
                    jk_text = match.group(1)
                else:
                    jk_text = match.group(0)
                
                if 'laki' in jk_text.lower() or 'male' in jk_text.lower():
                    fields['jenis_kelamin'] = 'Laki-laki'
                elif 'perempuan' in jk_text.lower() or 'female' in jk_text.lower():
                    fields['jenis_kelamin'] = 'Perempuan'
                else:
                    fields['jenis_kelamin'] = jk_text.strip()
                break
        
        # 4. Alamat - bisa setelah label "Alamat" atau setelah "Gol Darah" atau sebelum RT/RW
        # Pattern 1: Setelah label "Alamat"
        alamat_patterns = [
            r'Alamat[:\s]*([A-Z0-9\s/,-]+?)(?:\n|RT|RW|Kel|Kec|Agama|Status|Pekerjaan)',
            r'Alamat[:\s]*([^\n]{10,100})',
        ]
        for pattern in alamat_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
            if match and match.lastindex and match.lastindex >= 1:
                alamat = match.group(1).strip()
                alamat = re.sub(r'\s+', ' ', alamat)
                if len(alamat) > 5:
                    fields['alamat'] = alamat
                    break
        
        # Pattern 2: Setelah "Gol Darah" (biasanya alamat langsung setelah gol darah)
        # Format bisa: Gol Darah\n: JL KECAPI V atau Gol Darah\nLINGGABUIANANO atau Gol Darah\nJELINGGA BUANANO.2
        if not fields['alamat']:
            gol_darah_patterns = [
                r'Gol\.?\s*Darah[:\s]*[A-Z]*\n:?\s*(JL[.\s]*[A-Z][A-Z\s/,-]+?)(?:\n:?\s*\d|\n:?\s*RT|\n:?\s*RW|\n:?\s*Kel|\n:?\s*Kec)',
                r'Gol\.?\s*Darah[:\s]*[A-Z]*\n([A-Z][A-Z0-9\s/,-]+?)(?:\n\d{2,3}|\n00|\nRT|\nRW|\nKel|\nKec)',
                # Pattern lebih sederhana: ambil baris setelah Gol Darah sampai sebelum RT/RW
                r'Gol\.?\s*Darah[:\s]*\n([^\n]+)',
            ]
            for pattern in gol_darah_patterns:
                gol_darah_match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
                if gol_darah_match and gol_darah_match.lastindex and gol_darah_match.lastindex >= 1:
                    alamat = gol_darah_match.group(1).strip()
                    # Hapus ":" di awal jika ada
                    alamat = re.sub(r'^:\s*', '', alamat)
                    alamat = re.sub(r'\s+', ' ', alamat)
                    # Pastikan bukan RT/RW pattern (tidak dimulai dengan angka 2-3 digit)
                    if len(alamat) > 5 and not re.match(r'^\d{2,3}', alamat):
                        fields['alamat'] = alamat
                        break
        
        # Pattern 3: Sebelum RT/RW dengan format ":" atau tanpa ":" (baris yang mengandung alamat pattern sebelum RT/RW)
        # Cari setelah jenis kelamin atau gol darah, sebelum RT/RW
        if not fields['alamat']:
            rt_patterns = [
                r':\s*(JL[.\s]*[A-Z][A-Z\s/,-]+?)(?:\n:?\s*\d{2,3}|\n:?\s*RT|\n:?\s*RW)',
                r':\s*([A-Z][A-Z\s/,-]{3,}?)(?:\n:?\s*\d{2,3}|\n:?\s*RT|\n:?\s*RW)',
                # Pattern yang lebih spesifik: setelah LAKI-LAKI atau PEREMPUAN atau Gol Darah, sebelum RT/RW
                r'(?:LAKI-LAKI|PEREMPUAN|Gol\.?\s*Darah)[:\s]*\n([A-Z][A-Z0-9\s/,-]{3,}?)(?:\n\d{2,3}|\n00|\nRT|\nRW)',
            ]
            excluded = ['GOL', 'DARAH', 'KATHOLIK', 'ISLAM', 'CERAIHIDUP', 'BELUM KAWIN', 'KARYAWAN', 'SWASTA', 'WNI', 'SEUMUR HIDUP', 'PEREMPUAN', 'LAKILAKI', 'JAKARTA', 'BANDUNG', 'KARYAWANSWASTA', 'PROVINSI', 'JAWA BARAT', 'KOTA BANDUNG']
            for pattern in rt_patterns:
                rt_match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
                if rt_match and rt_match.lastindex and rt_match.lastindex >= 1:
                    alamat = rt_match.group(1).strip()
                    alamat = re.sub(r'\s+', ' ', alamat)
                    # Pastikan bukan label lain dan cukup panjang
                    if (len(alamat) > 5 and 
                        not alamat.upper() in excluded and
                        not re.match(r'^\d+', alamat) and
                        len(alamat) < 50):  # Max 50 karakter untuk alamat
                        fields['alamat'] = alamat
                        break
        
        # 5. RT/RW
        rt_rw_patterns = [
            r'RT[/\s]*RW[:\s]*(\d{2,3})[/\s](\d{2,3})',
            r'RT[/\s]*RW[:\s]*(\d{2,3}\s+\d{2,3})',
            r'RT[:\s]*(\d{2,3})[/\s]RW[:\s]*(\d{2,3})',
        ]
        for pattern in rt_rw_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE)
            if match:
                # Check number of groups
                num_groups = len(match.groups())
                if num_groups >= 2:
                    # Two separate groups
                    fields['rt_rw'] = f"{match.group(1)}/{match.group(2)}"
                elif num_groups == 1:
                    # Single group with both numbers
                    rt_rw_text = match.group(1).replace(' ', '/')
                    fields['rt_rw'] = rt_rw_text
                break
        
        # 6. Kelurahan
        kelurahan_patterns = [
            r'Kel[/\s]Desa[:\s]*([A-Z\s]+?)(?:\n|Kecamatan|Kec)',
            r'Kelurahan[:\s]*([A-Z\s]+?)(?:\n|Kecamatan|Kec)',
        ]
        for pattern in kelurahan_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
            if match and match.lastindex and match.lastindex >= 1:
                kelurahan = match.group(1).strip()
                kelurahan = re.sub(r'\s+', ' ', kelurahan)
                if len(kelurahan) > 2:
                    fields['kelurahan'] = kelurahan
                    break
        
        # 7. Kecamatan
        kecamatan_patterns = [
            r'Kecamatan[:\s]*([A-Z\s]+?)(?:\n|Agama|Status|Pekerjaan|Kewarganegaraan)',
        ]
        for pattern in kecamatan_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
            if match and match.lastindex and match.lastindex >= 1:
                kecamatan = match.group(1).strip()
                kecamatan = re.sub(r'\s+', ' ', kecamatan)
                if len(kecamatan) > 2:
                    fields['kecamatan'] = kecamatan
                    break
        
        # 8. Tempat/Tanggal Lahir
        ttl_patterns = [
            r'Tempat[/\s]Tgl\s+Lahir[:\s]*([A-Z\s]+?[/\s]\d{2}[-/\s]\d{2}[-/\s]\d{4})(?:\n|Jenis|Alamat)',
            r'Tempat[/\s]Tgl\s+Lahir[:\s]*([A-Z\s]+?)(?:\n|Jenis|Alamat)',
        ]
        for pattern in ttl_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
            if match and match.lastindex and match.lastindex >= 1:
                ttl = match.group(1).strip()
                ttl = re.sub(r'\s+', ' ', ttl)
                if len(ttl) > 5:
                    fields['tempat_tgl_lahir'] = ttl
                    break
        
        # 9. Agama
        agama_patterns = [
            r'Agama[:\s]*([A-Za-z\s]+?)(?:\n|Status|Pekerjaan|Kewarganegaraan)',
        ]
        for pattern in agama_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
            if match and match.lastindex and match.lastindex >= 1:
                agama = match.group(1).strip()
                agama = re.sub(r'\s+', ' ', agama)
                if len(agama) > 2:
                    fields['agama'] = agama
                    break
        
        # 10. Status Perkawinan
        status_patterns = [
            r'Status\s+Perkawinan[:\s]*([A-Za-z/\s]+?)(?:\n|Pekerjaan|Kewarganegaraan|KOTA)',
        ]
        for pattern in status_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
            if match and match.lastindex and match.lastindex >= 1:
                status = match.group(1).strip()
                # Hapus text tambahan seperti "KOTA ANDA"
                status = re.sub(r'\s+KOTA\s+[A-Z\s]+$', '', status, flags=re.IGNORECASE)
                status = re.sub(r'\s+', ' ', status)
                if len(status) > 2 and len(status) < 50:
                    fields['status_perkawinan'] = status
                    break
        
        # 11. Pekerjaan
        pekerjaan_patterns = [
            r'Pekerjaan[:\s]*([A-Za-z\s]+?)(?:\n|Kewarganegaraan|Berlaku)',
        ]
        for pattern in pekerjaan_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
            if match and match.lastindex and match.lastindex >= 1:
                pekerjaan = match.group(1).strip()
                pekerjaan = re.sub(r'\s+', ' ', pekerjaan)
                if len(pekerjaan) > 2:
                    fields['pekerjaan'] = pekerjaan
                    break
        
        # 12. Kewarganegaraan
        kewarganegaraan_patterns = [
            r'Kewarganegaraan[:\s]*([A-Z\s]+?)(?:\n|Berlaku)',
        ]
        for pattern in kewarganegaraan_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE | re.MULTILINE)
            if match and match.lastindex and match.lastindex >= 1:
                kewarganegaraan = match.group(1).strip()
                kewarganegaraan = re.sub(r'\s+', ' ', kewarganegaraan)
                if len(kewarganegaraan) > 1:
                    fields['kewarganegaraan'] = kewarganegaraan
                    break
        
        return fields
    
    def print_results(self, extracted_data):
        """
        Print hasil ekstraksi dengan format yang mudah dibaca
        """
        print("\n" + "="*60)
        print("HASIL EKSTRAKSI TEKS KTP")
        print("="*60)
        print(f"\nFile: {extracted_data['image_path']}")
        print(f"\nJumlah blok teks ditemukan: {len(extracted_data['text_blocks'])}")
        print("\n--- Teks yang Ditemukan ---")
        
        for i, block in enumerate(extracted_data['text_blocks'], 1):
            print(f"\n[{i}] {block['text']}")
            print(f"    Confidence: {block['confidence']:.2%}")
        
        print("\n--- Teks Lengkap (Gabungan) ---")
        print(extracted_data['combined_text'])
        print("\n" + "="*60)


def main():
    """
    Fungsi utama untuk menjalankan ekstraksi teks KTP
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Ekstraksi teks dari KTP menggunakan PaddleOCR')
    parser.add_argument('input', help='Path ke file gambar KTP atau folder berisi gambar KTP')
    parser.add_argument('--output', '-o', help='Path ke file JSON output (opsional)')
    parser.add_argument('--lang', default='id', help='Bahasa OCR (default: id)')
    parser.add_argument('--max-size', type=int, default=800, 
                        help='Ukuran maksimal gambar (lebar/tinggi) sebelum resize untuk mempercepat proses. Default: 800. Set 0 untuk disable resize.')
    
    args = parser.parse_args()
    
    # Inisialisasi OCR
    # Note: PaddleOCR otomatis mendeteksi GPU jika tersedia
    max_size = args.max_size if args.max_size > 0 else None
    ktp_ocr = KTPOCR(lang=args.lang, max_image_size=max_size)
    
    # Cek apakah input adalah file atau folder
    input_path = Path(args.input)
    
    if input_path.is_file():
        # Proses single file
        try:
            result = ktp_ocr.extract_text(str(input_path))
            ktp_ocr.print_results(result)
            
            # Simpan ke JSON jika diminta
            if args.output:
                with open(args.output, 'w', encoding='utf-8') as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                print(f"\nHasil disimpan ke: {args.output}")
        
        except Exception as e:
            print(f"Error: {str(e)}")
    
    elif input_path.is_dir():
        # Proses folder
        results = ktp_ocr.extract_from_folder(str(input_path))
        
        if results:
            for result in results:
                ktp_ocr.print_results(result)
                print("\n")
            
            # Simpan ke JSON jika diminta
            if args.output:
                with open(args.output, 'w', encoding='utf-8') as f:
                    json.dump(results, f, ensure_ascii=False, indent=2)
                print(f"\nHasil disimpan ke: {args.output}")
    
    else:
        print(f"Error: Path tidak valid: {args.input}")


if __name__ == '__main__':
    main()

