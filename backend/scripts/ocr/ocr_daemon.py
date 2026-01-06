#!/usr/bin/env python3
"""
OCR Daemon Service untuk caching model PaddleOCR
Model di-load sekali saat startup, kemudian reuse untuk semua request
Menggunakan file-based communication untuk kompatibilitas dengan Bun
"""

import sys
import json
import os
import base64
import tempfile
import time
from pathlib import Path
import glob

# Suppress warnings
if os.getenv('SUPPRESS_OCR_LOGS') == '1':
    import warnings
    warnings.filterwarnings('ignore')
    os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'

from ktp_ocr import KTPOCR

class OCRDaemon:
    def __init__(self, request_dir, response_dir):
        """Initialize OCR model once - this is the expensive operation"""
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print("Initializing OCR model (this may take a few seconds)...", file=sys.stderr)
        
        # Load model once - cached in memory
        # max_image_size=1200: Optimal untuk KTP - cukup besar untuk akurasi, cukup kecil untuk kecepatan
        self.ocr = KTPOCR(lang='id', max_image_size=1200)
        self.request_dir = Path(request_dir)
        self.response_dir = Path(response_dir)
        
        # Create directories if they don't exist
        self.request_dir.mkdir(parents=True, exist_ok=True)
        self.response_dir.mkdir(parents=True, exist_ok=True)
        
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print("OCR model loaded and ready!", file=sys.stderr)
    
    def process_request(self, image_data_base64):
        """
        Process OCR request using cached model
        
        Args:
            image_data_base64: Base64 encoded image data
            
        Returns:
            Dictionary with OCR results
        """
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data_base64)
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(image_bytes)
                temp_path = temp_file.name
            
            try:
                # Extract text using cached OCR model
                extracted_data = self.ocr.extract_text(temp_path)
                
                # Extract KTP fields
                fields = self.ocr.extract_ktp_fields(extracted_data)
                
                # Format response
                response = {
                    'success': True,
                    'data': {
                        'identityNumber': fields.get('nik'),
                        'name': fields.get('nama'),
                        'gender': fields.get('jenis_kelamin'),
                        'alamat': fields.get('alamat'),
                    },
                    'raw': {
                        'text_blocks_count': len(extracted_data.get('text_blocks', [])),
                        'combined_text': extracted_data.get('combined_text', ''),
                    }
                }
                
                return response
            finally:
                # Cleanup temporary file
                try:
                    os.unlink(temp_path)
                except:
                    pass
                    
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def run(self):
        """Main loop: watch request directory, process files, write responses"""
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print(f"Watching request directory: {self.request_dir}", file=sys.stderr)
        
        while True:
            try:
                # Check for request files
                request_files = list(self.request_dir.glob("*.json"))
                
                for request_file in request_files:
                    try:
                        # Read request
                        with open(request_file, 'r') as f:
                            request = json.load(f)
                        
                        # Extract image data
                        image_data = request.get('image')
                        if not image_data:
                            response = {
                                'success': False,
                                'error': 'Missing "image" field in request'
                            }
                        else:
                            # Process OCR request
                            response = self.process_request(image_data)
                        
                        # Write response
                        request_id = request_file.stem
                        response_file = self.response_dir / f"{request_id}.json"
                        with open(response_file, 'w') as f:
                            json.dump(response, f, ensure_ascii=False)
                        
                        # Delete request file
                        request_file.unlink()
                        
                    except Exception as e:
                        # Write error response
                        request_id = request_file.stem
                        response_file = self.response_dir / f"{request_id}.json"
                        error_response = {
                            'success': False,
                            'error': f'Processing error: {str(e)}'
                        }
                        try:
                            with open(response_file, 'w') as f:
                                json.dump(error_response, f, ensure_ascii=False)
                            request_file.unlink()
                        except:
                            pass
                
                # Sleep a bit to avoid busy waiting
                time.sleep(0.1)
                
            except KeyboardInterrupt:
                # Graceful shutdown on Ctrl+C
                break
            except Exception as e:
                if os.getenv('SUPPRESS_OCR_LOGS') != '1':
                    print(f"Error in daemon loop: {e}", file=sys.stderr)
                time.sleep(1)  # Wait before retrying

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: ocr_daemon.py <request_dir> <response_dir>", file=sys.stderr)
        sys.exit(1)
    
    request_dir = sys.argv[1]
    response_dir = sys.argv[2]
    
    daemon = OCRDaemon(request_dir, response_dir)
    daemon.run()

