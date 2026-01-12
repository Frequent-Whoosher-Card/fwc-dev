#!/usr/bin/env python3
"""
KTP Detection Daemon Service untuk caching model detection
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
from io import BytesIO

# Suppress warnings
if os.getenv('SUPPRESS_OCR_LOGS') == '1':
    import warnings
    warnings.filterwarnings('ignore')

from ktp_detect import KTPDetector

class KTPDetectionDaemon:
    def __init__(self, request_dir, response_dir, model_path=None):
        """Initialize detection model once - this is the expensive operation"""
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print("Initializing KTP detection model (this may take a few seconds)...", file=sys.stderr)
        
        # Load model once - cached in memory
        self.detector = KTPDetector(model_path=model_path)
        self.request_dir = Path(request_dir)
        self.response_dir = Path(response_dir)
        
        # Create directories if they don't exist
        self.request_dir.mkdir(parents=True, exist_ok=True)
        self.response_dir.mkdir(parents=True, exist_ok=True)
        
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print("KTP detection model loaded and ready!", file=sys.stderr)
    
    def process_request(self, image_data_base64, return_multiple=False, min_confidence=0.5):
        """
        Process detection request using cached model
        
        Args:
            image_data_base64: Base64 encoded image data
            return_multiple: If True, return all detections. If False, return only the best one.
            min_confidence: Minimum confidence threshold (default: 0.5)
            
        Returns:
            Dictionary with detection results and cropped image(s) (base64)
        """
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data_base64)
            
            # Run detection and crop
            result = self.detector.detect_and_crop(
                image_bytes, 
                return_multiple=return_multiple,
                min_confidence=min_confidence
            )
            
            if not result['success']:
                return {
                    'success': False,
                    'error': result.get('error', 'Unknown error')
                }
            
            # Handle multiple detections
            if return_multiple and 'cropped_images' in result:
                cropped_images = []
                for det in result['cropped_images']:
                    cropped_pil = det['cropped_image']
                    buffered = BytesIO()
                    cropped_pil.save(buffered, format='JPEG', quality=95)
                    cropped_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                    
                    cropped_images.append({
                        'cropped_image': cropped_base64,
                        'bbox': det['bbox'],
                        'confidence': det['confidence']
                    })
                
                response = {
                    'success': True,
                    'cropped_images': cropped_images,
                    'original_size': result['original_size'],
                }
                return response
            
            # Handle single detection
            if 'cropped_image' in result:
                # Convert cropped image to base64
                cropped_pil = result['cropped_image']
                buffered = BytesIO()
                
                # Save as JPEG with good quality
                cropped_pil.save(buffered, format='JPEG', quality=95)
                cropped_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                
                # Format response
                response = {
                    'success': True,
                    'cropped_image': cropped_base64,
                    'bbox': result['bbox'],
                    'original_size': result['original_size'],
                }
                
                if result.get('confidence') is not None:
                    response['confidence'] = result['confidence']
                
                return response
            
            return {
                'success': False,
                'error': 'Invalid detection result format'
            }
                    
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
                    processing_file = request_file.with_suffix('.processing')
                    request_id = request_file.stem
                    
                    try:
                        # Try to claim the file by renaming it
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
                                    break
                                
                                file_size = processing_file.stat().st_size
                                if file_size == 0:
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
                                    break
                                    
                            except (json.JSONDecodeError, IOError, OSError, FileNotFoundError) as e:
                                if isinstance(e, FileNotFoundError):
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
                        
                        # Extract image data and options
                        image_data = request.get('image')
                        return_multiple = request.get('return_multiple', False)
                        min_confidence = request.get('min_confidence', 0.5)
                        
                        if not image_data:
                            response = {
                                'success': False,
                                'error': 'Missing "image" field in request'
                            }
                        else:
                            # Process detection request
                            response = self.process_request(
                                image_data,
                                return_multiple=return_multiple,
                                min_confidence=min_confidence
                            )
                        
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
                        # File was deleted before we could process it
                        try:
                            if 'processing_file' in locals() and processing_file.exists():
                                processing_file.unlink()
                        except:
                            pass
                        continue
                    except Exception as e:
                        # Write error response
                        if 'processing_file' in locals() and processing_file.exists():
                            response_file = self.response_dir / f"{request_id}.json"
                            error_response = {
                                'success': False,
                                'error': f'Processing error: {str(e)}'
                            }
                            try:
                                response_file.parent.mkdir(parents=True, exist_ok=True)
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
        print("Usage: ktp_detection_daemon.py <request_dir> <response_dir> [model_path]", file=sys.stderr)
        sys.exit(1)
    
    request_dir = sys.argv[1]
    response_dir = sys.argv[2]
    model_path = sys.argv[3] if len(sys.argv) > 3 else None
    
    daemon = KTPDetectionDaemon(request_dir, response_dir, model_path=model_path)
    daemon.run()
