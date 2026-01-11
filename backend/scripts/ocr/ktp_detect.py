#!/usr/bin/env python3
"""
Script untuk deteksi dan crop KTP menggunakan model machine learning
Menggunakan PyTorch YOLO model untuk deteksi bounding box KTP
"""

import torch
import cv2
import numpy as np
from PIL import Image
import os
import sys
from pathlib import Path

# Suppress warnings
if os.getenv('SUPPRESS_OCR_LOGS') == '1':
    import warnings
    warnings.filterwarnings('ignore')

class KTPDetector:
    def __init__(self, model_path=None):
        """
        Inisialisasi KTP detector dengan model PyTorch
        
        Args:
            model_path: Path ke model file (.pt). Jika None, akan mencari di models/best.pt
        """
        if model_path is None:
            # Default path: relative dari script ini
            script_dir = Path(__file__).parent
            model_path = script_dir / "models" / "best.pt"
        
        model_path = Path(model_path)
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print(f"Loading KTP detection model from {model_path}...", file=sys.stderr)
        
        # Load model
        try:
            # Try to load as YOLO model (ultralytics format)
            try:
                from ultralytics import YOLO
                self.model = YOLO(str(model_path))
                self.model_type = 'yolo'
                if os.getenv('SUPPRESS_OCR_LOGS') != '1':
                    print("Loaded as YOLO model", file=sys.stderr)
            except ImportError:
                # Fallback to torch.load for custom PyTorch models
                device = 'cuda' if torch.cuda.is_available() else 'cpu'
                self.model = torch.load(str(model_path), map_location=device)
                self.model.eval()
                self.model_type = 'pytorch'
                self.device = device
                if os.getenv('SUPPRESS_OCR_LOGS') != '1':
                    print(f"Loaded as PyTorch model on {device}", file=sys.stderr)
        except Exception as e:
            raise RuntimeError(f"Failed to load model: {str(e)}")
        
        if os.getenv('SUPPRESS_OCR_LOGS') != '1':
            print("KTP detection model loaded successfully!", file=sys.stderr)
    
    def detect_and_crop(self, image_input, return_multiple=False, min_confidence=0.5):
        """
        Deteksi KTP dalam gambar dan crop area KTP
        
        Args:
            image_input: Bisa berupa:
                - Path ke file gambar (str atau Path)
                - PIL Image object
                - numpy array (BGR format dari cv2)
                - bytes (raw image data)
            return_multiple: Jika True, return semua detections. Jika False, return hanya yang terbaik.
            min_confidence: Minimum confidence threshold untuk detections (default: 0.5)
        
        Returns:
            Dictionary dengan:
                - success: bool
                - cropped_image: PIL Image (jika success dan return_multiple=False)
                - cropped_images: List of dicts dengan cropped_image, bbox, confidence (jika return_multiple=True)
                - bbox: bounding box coordinates (x1, y1, x2, y2) (jika success dan return_multiple=False)
                - original_size: (width, height) dari gambar original
                - confidence: confidence score (jika return_multiple=False)
                - error: error message (jika failed)
        """
        try:
            # Convert input to numpy array (BGR format)
            if isinstance(image_input, (str, Path)):
                # File path
                img = cv2.imread(str(image_input))
                if img is None:
                    return {
                        'success': False,
                        'error': f'Failed to read image from path: {image_input}'
                    }
            elif isinstance(image_input, Image.Image):
                # PIL Image
                img = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
            elif isinstance(image_input, np.ndarray):
                # Already numpy array
                img = image_input.copy()
                # If RGB, convert to BGR
                if len(img.shape) == 3 and img.shape[2] == 3:
                    # Assume RGB if not already BGR
                    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            elif isinstance(image_input, bytes):
                # Raw bytes
                nparr = np.frombuffer(image_input, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    return {
                        'success': False,
                        'error': 'Failed to decode image from bytes'
                    }
            else:
                return {
                    'success': False,
                    'error': f'Unsupported image input type: {type(image_input)}'
                }
            
            original_height, original_width = img.shape[:2]
            
            # Run detection
            if self.model_type == 'yolo':
                # YOLO model (ultralytics)
                results = self.model(img, verbose=False)
                
                # Get first result
                if len(results) == 0 or len(results[0].boxes) == 0:
                    return {
                        'success': False,
                        'error': 'No KTP detected in image'
                    }
                
                # Get all boxes with confidence scores
                boxes = results[0].boxes
                detections = []
                
                for box in boxes:
                    conf = float(box.conf[0]) if hasattr(box, 'conf') else 1.0
                    if conf >= min_confidence:
                        xyxy = box.xyxy[0].cpu().numpy()
                        x1, y1, x2, y2 = map(int, xyxy)
                        
                        # Ensure coordinates are within image bounds
                        x1 = max(0, min(x1, original_width))
                        y1 = max(0, min(y1, original_height))
                        x2 = max(0, min(x2, original_width))
                        y2 = max(0, min(y2, original_height))
                        
                        # Ensure valid box
                        if x2 > x1 and y2 > y1:
                            detections.append({
                                'bbox': (x1, y1, x2, y2),
                                'confidence': conf
                            })
                
                if len(detections) == 0:
                    return {
                        'success': False,
                        'error': 'No valid KTP detection found (confidence too low)'
                    }
                
                # Sort by confidence (highest first)
                detections.sort(key=lambda x: x['confidence'], reverse=True)
                
                # If return_multiple, return all detections
                if return_multiple:
                    cropped_images = []
                    for det in detections:
                        x1, y1, x2, y2 = det['bbox']
                        cropped = img[y1:y2, x1:x2]
                        cropped_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
                        cropped_pil = Image.fromarray(cropped_rgb)
                        cropped_images.append({
                            'cropped_image': cropped_pil,
                            'bbox': det['bbox'],
                            'confidence': det['confidence']
                        })
                    
                    return {
                        'success': True,
                        'cropped_images': cropped_images,
                        'original_size': (original_width, original_height),
                    }
                
                # Otherwise, return only the best detection
                best_det = detections[0]
                x1, y1, x2, y2 = best_det['bbox']
                cropped = img[y1:y2, x1:x2]
                cropped_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
                cropped_pil = Image.fromarray(cropped_rgb)
                
                return {
                    'success': True,
                    'cropped_image': cropped_pil,
                    'bbox': best_det['bbox'],
                    'original_size': (original_width, original_height),
                    'confidence': best_det['confidence']
                }
                
            else:
                # Custom PyTorch model - only supports single detection
                # Preprocess image
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                img_tensor = self._preprocess_image(img_rgb)
                
                # Run inference
                with torch.no_grad():
                    if isinstance(self.model, torch.nn.Module):
                        output = self.model(img_tensor.to(self.device))
                    else:
                        output = self.model(img_tensor.to(self.device))
                
                # Parse output (adjust based on your model's output format)
                # Assuming output is [batch, 4] for bbox coordinates (normalized)
                if isinstance(output, (list, tuple)):
                    bbox = output[0] if len(output) > 0 else None
                elif isinstance(output, torch.Tensor):
                    bbox = output[0].cpu().numpy() if output.dim() > 1 else output.cpu().numpy()
                else:
                    bbox = output
                
                if bbox is None:
                    return {
                        'success': False,
                        'error': 'Model output is invalid'
                    }
                
                # Convert normalized coordinates to pixel coordinates
                if len(bbox) >= 4:
                    # Assuming format: [x1, y1, x2, y2] normalized (0-1)
                    x1 = int(bbox[0] * original_width)
                    y1 = int(bbox[1] * original_height)
                    x2 = int(bbox[2] * original_width)
                    y2 = int(bbox[3] * original_height)
                else:
                    return {
                        'success': False,
                        'error': 'Invalid bounding box format'
                    }
                
                # Ensure coordinates are within image bounds
                x1 = max(0, min(x1, original_width))
                y1 = max(0, min(y1, original_height))
                x2 = max(0, min(x2, original_width))
                y2 = max(0, min(y2, original_height))
                
                # Ensure valid box
                if x2 <= x1 or y2 <= y1:
                    return {
                        'success': False,
                        'error': 'Invalid bounding box coordinates'
                    }
                
                # Crop image
                cropped = img[y1:y2, x1:x2]
                
                # Convert to PIL Image (RGB)
                cropped_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
                cropped_pil = Image.fromarray(cropped_rgb)
                
                return {
                    'success': True,
                    'cropped_image': cropped_pil,
                    'bbox': (x1, y1, x2, y2),
                    'original_size': (original_width, original_height),
                    'confidence': None
                }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Detection error: {str(e)}'
            }
    
    def _preprocess_image(self, img_rgb, target_size=640):
        """
        Preprocess image for PyTorch model
        """
        # Resize maintaining aspect ratio
        h, w = img_rgb.shape[:2]
        scale = target_size / max(h, w)
        new_h, new_w = int(h * scale), int(w * scale)
        
        img_resized = cv2.resize(img_rgb, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        
        # Pad to target_size
        img_padded = np.zeros((target_size, target_size, 3), dtype=np.uint8)
        img_padded[:new_h, :new_w] = img_resized
        
        # Normalize to [0, 1]
        img_normalized = img_padded.astype(np.float32) / 255.0
        
        # Convert to tensor: [C, H, W]
        img_tensor = torch.from_numpy(img_normalized).permute(2, 0, 1)
        
        # Add batch dimension: [1, C, H, W]
        img_tensor = img_tensor.unsqueeze(0)
        
        return img_tensor


def main():
    """
    Test function untuk command line usage
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Detect and crop KTP from image')
    parser.add_argument('input', help='Path to input image')
    parser.add_argument('--output', '-o', help='Path to save cropped image (optional)')
    parser.add_argument('--model', '-m', help='Path to model file (.pt)')
    
    args = parser.parse_args()
    
    try:
        detector = KTPDetector(model_path=args.model)
        result = detector.detect_and_crop(args.input)
        
        if result['success']:
            print(f"KTP detected successfully!")
            print(f"Bounding box: {result['bbox']}")
            print(f"Original size: {result['original_size']}")
            if result.get('confidence'):
                print(f"Confidence: {result['confidence']:.2%}")
            
            if args.output:
                result['cropped_image'].save(args.output)
                print(f"Cropped image saved to: {args.output}")
            else:
                print("(No output path specified, skipping save)")
        else:
            print(f"Error: {result['error']}")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
