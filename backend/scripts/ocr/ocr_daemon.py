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
                # Check for request files (exclude .tmp and .processing files)
                request_files = [
                    f for f in self.request_dir.glob("*.json")
                    if f.suffix == '.json' and not f.name.endswith('.tmp') and not f.name.endswith('.processing')
                ]
                
                for request_file in request_files:
                    # Skip temp files
                    if request_file.suffix == '.tmp':
                        continue
                    
                    # Lock mechanism: rename file to .processing to claim ownership
                    # This prevents multiple daemon instances from processing the same file
                    processing_file = request_file.with_suffix('.processing')
                    request_id = request_file.stem
                    
                    try:
                        # Try to claim the file by renaming it
                        # If rename fails, another process is already handling it
                        try:
                            request_file.rename(processing_file)
                        except (FileNotFoundError, OSError):
                            # File was already claimed or deleted, skip
                            continue
                        
                        # Now we own the file, read it safely
                        max_retries = 10
                        retry_count = 0
                        file_ready = False
                        request = None
                        
                        while retry_count < max_retries:
                            try:
                                # Check file size
                                if not processing_file.exists():
                                    # File was deleted somehow, skip
                                    break
                                
                                file_size = processing_file.stat().st_size
                                if file_size == 0:
                                    # File is empty, might still be writing (shouldn't happen after rename)
                                    retry_count += 1
                                    time.sleep(0.1)
                                    continue
                                
                                # Try to read file
                                with open(processing_file, 'r') as f:
                                    request = json.load(f)
                                
                                # Verify request has required fields
                                if request and isinstance(request, dict) and 'image' in request:
                                    file_ready = True
                                    break
                                else:
                                    # Invalid request format, skip
                                    break
                                    
                            except (json.JSONDecodeError, IOError, OSError, FileNotFoundError) as e:
                                # File might still be writing or was deleted
                                if isinstance(e, FileNotFoundError):
                                    # File was deleted, skip
                                    break
                                retry_count += 1
                                time.sleep(0.1)
                        
                        if not file_ready or request is None:
                            # File not ready after retries or was deleted, cleanup and skip
                            try:
                                if processing_file.exists():
                                    processing_file.unlink()
                            except:
                                pass
                            continue
                        
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
                        response_file = self.response_dir / f"{request_id}.json"
                        
                        # Ensure response directory exists
                        response_file.parent.mkdir(parents=True, exist_ok=True)
                        
                        # Write response atomically using temp file then rename
                        temp_response_file = response_file.with_suffix('.tmp')
                        with open(temp_response_file, 'w') as f:
                            json.dump(response, f, ensure_ascii=False)
                        temp_response_file.replace(response_file)
                        
                        # Delete processing file after response is written
                        try:
                            if processing_file.exists():
                                processing_file.unlink()
                        except:
                            pass
                        
                    except FileNotFoundError:
                        # File was deleted before we could process it (race condition)
                        # This is normal, just cleanup and continue
                        try:
                            if 'processing_file' in locals() and processing_file.exists():
                                processing_file.unlink()
                        except:
                            pass
                        continue
                    except Exception as e:
                        # Write error response only if we successfully claimed the file
                        if 'processing_file' in locals() and processing_file.exists():
                            response_file = self.response_dir / f"{request_id}.json"
                            error_response = {
                                'success': False,
                                'error': f'Processing error: {str(e)}'
                            }
                            try:
                                # Ensure response directory exists
                                response_file.parent.mkdir(parents=True, exist_ok=True)
                                
                                # Write error response atomically
                                temp_response_file = response_file.with_suffix('.tmp')
                                with open(temp_response_file, 'w') as f:
                                    json.dump(error_response, f, ensure_ascii=False)
                                temp_response_file.replace(response_file)
                            except Exception as cleanup_error:
                                if os.getenv('SUPPRESS_OCR_LOGS') != '1':
                                    print(f"Error writing error response: {cleanup_error}", file=sys.stderr)
                        
                        # Always cleanup processing file
                        try:
                            if 'processing_file' in locals() and processing_file.exists():
                                processing_file.unlink()
                        except:
                            pass
                        
                        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
                            print(f"Error processing request {request_id}: {e}", file=sys.stderr)
                
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

