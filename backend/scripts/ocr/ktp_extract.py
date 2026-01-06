#!/usr/bin/env python3
"""
Script untuk ekstraksi field KTP dari gambar
Digunakan untuk dipanggil dari subprocess oleh backend TypeScript
Output: JSON ke stdout
"""

import sys
import os
import json

# Suppress warnings when called from subprocess
if os.getenv('SUPPRESS_OCR_LOGS') == '1':
    import warnings
    warnings.filterwarnings('ignore')
    # Set environment to suppress PaddleOCR connectivity check
    os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'

from ktp_ocr import KTPOCR

def main():
    if len(sys.argv) < 2:
        error_response = {
            'success': False,
            'error': 'Missing image path argument'
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    try:
        # Inisialisasi OCR (akan load model, ini yang lambat)
        # Untuk production, bisa dioptimasi dengan keep-alive process
        ocr = KTPOCR(lang='id', max_image_size=400)
        
        # Ekstrak teks dari gambar
        extracted_data = ocr.extract_text(image_path)
        
        # Ekstrak field spesifik
        fields = ocr.extract_ktp_fields(extracted_data)
        
        # Format response - NIK, Nama, Jenis Kelamin, dan Alamat
        response = {
            'success': True,
            'data': {
                'identityNumber': fields.get('nik'),
                'name': fields.get('nama'),
                'gender': fields.get('jenis_kelamin'),
                'alamat': fields.get('alamat'),
            },
            # Raw OCR data untuk debugging
            'raw': {
                'text_blocks_count': len(extracted_data.get('text_blocks', [])),
                'combined_text': extracted_data.get('combined_text', ''),
            }
        }
        
        # Output JSON ke stdout (tanpa print statement lain untuk parsing yang mudah)
        # Flush stdout untuk memastikan output langsung terkirim
        print(json.dumps(response, ensure_ascii=False), flush=True)
        sys.exit(0)  # Explicit exit with success code
        
    except FileNotFoundError as e:
        error_response = {
            'success': False,
            'error': f'File not found: {str(e)}'
        }
        print(json.dumps(error_response, ensure_ascii=False), flush=True)
        sys.exit(1)
    except Exception as e:
        error_response = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False), flush=True)
        sys.exit(1)

if __name__ == '__main__':
    main()

