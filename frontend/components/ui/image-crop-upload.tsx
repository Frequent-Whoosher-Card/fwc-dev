'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Crop, Loader2, Check } from 'lucide-react';

interface ImageCropUploadProps {
  onImageChange: (file: File | null) => void;
  onCropComplete?: (croppedFile: File) => void;
  aspectRatio?: number;
  maxSize?: number; // in pixels (width or height)
  className?: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropUpload({
  onImageChange,
  onCropComplete,
  aspectRatio,
  maxSize = 400,
  className = '',
}: ImageCropUploadProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<CropArea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCropped, setIsCropped] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsCropped(false);
      });
      reader.readAsDataURL(file);
    }
  };

  const initializeCropArea = useCallback(() => {
    if (!imgRef.current) return;

    const img = imgRef.current;
    const imgWidth = img.offsetWidth || img.clientWidth;
    const imgHeight = img.offsetHeight || img.clientHeight;

    if (imgWidth === 0 || imgHeight === 0) {
      // Wait for image to load properly
      setTimeout(initializeCropArea, 100);
      return;
    }

    // Calculate initial crop area (80% of image, centered)
    const cropWidth = imgWidth * 0.8;
    const cropHeight = aspectRatio ? cropWidth / aspectRatio : imgHeight * 0.8;

    const x = (imgWidth - cropWidth) / 2;
    const y = (imgHeight - cropHeight) / 2;

    setCropArea({
      x,
      y,
      width: cropWidth,
      height: cropHeight,
    });
  }, [aspectRatio]);

  const handleImageLoad = () => {
    setTimeout(initializeCropArea, 100);
  };

  const getMousePos = (e: React.MouseEvent) => {
    if (!containerRef.current || !imgRef.current) return { x: 0, y: 0 };

    const container = containerRef.current;
    const img = imgRef.current;
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    // Calculate relative position within the image
    const x = e.clientX - imgRect.left;
    const y = e.clientY - imgRect.top;

    return { 
      x: Math.max(0, Math.min(x, img.offsetWidth)), 
      y: Math.max(0, Math.min(y, img.offsetHeight)) 
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cropArea) return;
    const target = e.target as HTMLElement;
    
    // Check if clicking on resize handle
    if (target.dataset.handle) {
      e.stopPropagation();
      setIsResizing(target.dataset.handle);
      setResizeStart({ ...cropArea });
      const pos = getMousePos(e);
      setDragStart({ x: pos.x, y: pos.y });
    } else {
      // Dragging crop area
      setIsDragging(true);
      const pos = getMousePos(e);
      setDragStart({ x: pos.x - cropArea.x, y: pos.y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cropArea || !imgRef.current) return;

    const pos = getMousePos(e);
    const img = imgRef.current;
    const imgWidth = img.offsetWidth;
    const imgHeight = img.offsetHeight;

    if (isResizing && resizeStart) {
      // Resize crop area
      const deltaX = pos.x - dragStart.x;
      const deltaY = pos.y - dragStart.y;
      const minSize = 50;
      let newCrop: CropArea = { ...resizeStart };

      switch (isResizing) {
        case 'nw': // Northwest (top-left)
          newCrop.width = Math.max(minSize, resizeStart.width - deltaX);
          newCrop.height = aspectRatio ? newCrop.width / aspectRatio : Math.max(minSize, resizeStart.height - deltaY);
          if (aspectRatio) {
            newCrop.width = newCrop.height * aspectRatio;
          }
          newCrop.x = resizeStart.x + resizeStart.width - newCrop.width;
          newCrop.y = resizeStart.y + resizeStart.height - newCrop.height;
          break;
        case 'ne': // Northeast (top-right)
          newCrop.width = Math.max(minSize, resizeStart.width + deltaX);
          newCrop.height = aspectRatio ? newCrop.width / aspectRatio : Math.max(minSize, resizeStart.height - deltaY);
          if (aspectRatio) {
            newCrop.width = newCrop.height * aspectRatio;
          }
          newCrop.y = resizeStart.y + resizeStart.height - newCrop.height;
          break;
        case 'sw': // Southwest (bottom-left)
          newCrop.width = Math.max(minSize, resizeStart.width - deltaX);
          newCrop.height = aspectRatio ? newCrop.width / aspectRatio : Math.max(minSize, resizeStart.height + deltaY);
          if (aspectRatio) {
            newCrop.width = newCrop.height * aspectRatio;
          }
          newCrop.x = resizeStart.x + resizeStart.width - newCrop.width;
          break;
        case 'se': // Southeast (bottom-right)
          newCrop.width = Math.max(minSize, resizeStart.width + deltaX);
          newCrop.height = aspectRatio ? newCrop.width / aspectRatio : Math.max(minSize, resizeStart.height + deltaY);
          if (aspectRatio) {
            newCrop.width = newCrop.height * aspectRatio;
          }
          break;
        case 'n': // North (top)
          newCrop.height = Math.max(minSize, resizeStart.height - deltaY);
          if (aspectRatio) {
            newCrop.width = newCrop.height * aspectRatio;
          }
          newCrop.y = resizeStart.y + resizeStart.height - newCrop.height;
          break;
        case 'e': // East (right)
          newCrop.width = Math.max(minSize, resizeStart.width + deltaX);
          if (aspectRatio) {
            newCrop.height = newCrop.width / aspectRatio;
          }
          break;
        case 's': // South (bottom)
          newCrop.height = Math.max(minSize, resizeStart.height + deltaY);
          if (aspectRatio) {
            newCrop.width = newCrop.height * aspectRatio;
          }
          break;
        case 'w': // West (left)
          newCrop.width = Math.max(minSize, resizeStart.width - deltaX);
          if (aspectRatio) {
            newCrop.height = newCrop.width / aspectRatio;
          }
          newCrop.x = resizeStart.x + resizeStart.width - newCrop.width;
          break;
      }

      // Keep within image bounds
      if (newCrop.x < 0) {
        newCrop.width += newCrop.x;
        newCrop.x = 0;
        if (aspectRatio) {
          newCrop.height = newCrop.width / aspectRatio;
        }
      }
      if (newCrop.y < 0) {
        newCrop.height += newCrop.y;
        newCrop.y = 0;
        if (aspectRatio) {
          newCrop.width = newCrop.height * aspectRatio;
        }
      }
      if (newCrop.x + newCrop.width > imgWidth) {
        newCrop.width = imgWidth - newCrop.x;
        if (aspectRatio) {
          newCrop.height = newCrop.width / aspectRatio;
          newCrop.y = Math.max(0, newCrop.y);
        }
      }
      if (newCrop.y + newCrop.height > imgHeight) {
        newCrop.height = imgHeight - newCrop.y;
        if (aspectRatio) {
          newCrop.width = newCrop.height * aspectRatio;
          newCrop.x = Math.max(0, newCrop.x);
        }
      }

      // Final size check
      newCrop.width = Math.max(minSize, Math.min(newCrop.width, imgWidth - newCrop.x));
      newCrop.height = Math.max(minSize, Math.min(newCrop.height, imgHeight - newCrop.y));

      setCropArea(newCrop);
    } else if (isDragging) {
      // Drag crop area
      const newX = pos.x - dragStart.x;
      const newY = pos.y - dragStart.y;

      setCropArea({
        ...cropArea,
        x: Math.max(0, Math.min(newX, imgWidth - cropArea.width)),
        y: Math.max(0, Math.min(newY, imgHeight - cropArea.height)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
    setResizeStart(null);
  };

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: CropArea): Promise<File | null> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return null;
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      return new Promise<File>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }

            // Resize if needed
            const img = new Image();
            img.onload = () => {
              let finalWidth = img.width;
              let finalHeight = img.height;

              // Resize if larger than maxSize
              if (finalWidth > maxSize || finalHeight > maxSize) {
                const scale = Math.min(maxSize / finalWidth, maxSize / finalHeight);
                finalWidth = Math.round(finalWidth * scale);
                finalHeight = Math.round(finalHeight * scale);
              }

              const resizeCanvas = document.createElement('canvas');
              const resizeCtx = resizeCanvas.getContext('2d');
              if (!resizeCtx) {
                reject(new Error('Could not get canvas context'));
                return;
              }

              resizeCanvas.width = finalWidth;
              resizeCanvas.height = finalHeight;
              resizeCtx.drawImage(img, 0, 0, finalWidth, finalHeight);

              resizeCanvas.toBlob(
                (resizedBlob) => {
                  if (!resizedBlob) {
                    reject(new Error('Resize failed'));
                    return;
                  }
                  const file = new File(
                    [resizedBlob],
                    `ktp-${Date.now()}.jpg`,
                    { type: 'image/jpeg' }
                  );
                  resolve(file);
                },
                'image/jpeg',
                0.9
              );
            };
            img.src = URL.createObjectURL(blob);
          },
          'image/jpeg',
          0.9
        );
      });
    },
    [maxSize]
  );

  const handleCropComplete = async () => {
    if (!imgRef.current || !cropArea) {
      return;
    }

    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imgRef.current, cropArea);
      if (croppedFile) {
        onImageChange(croppedFile);
        setIsCropped(true);
        if (onCropComplete) {
          onCropComplete(croppedFile);
        }
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setImgSrc('');
    setCropArea(null);
    setIsCropped(false);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!imgSrc ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload className="mb-2 text-gray-400" size={32} />
            <span className="text-sm text-gray-600">
              Klik untuk upload gambar KTP
            </span>
            <span className="text-xs text-gray-400 mt-1">
              JPEG, PNG, atau WebP (max 10MB)
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            ref={containerRef}
            className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imgSrc}
              style={{ maxHeight: '400px', width: '100%', objectFit: 'contain', display: 'block' }}
              onLoad={handleImageLoad}
            />
            {cropArea && (
              <>
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
                  style={{
                    left: `${cropArea.x}px`,
                    top: `${cropArea.y}px`,
                    width: `${cropArea.width}px`,
                    height: `${cropArea.height}px`,
                  }}
                  onMouseDown={handleMouseDown}
                />
                {/* Resize handles - corners */}
                <div
                  data-handle="nw"
                  className="absolute w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize hover:bg-blue-600 transition-colors z-10"
                  style={{
                    left: `${cropArea.x - 2.5}px`,
                    top: `${cropArea.y - 2.5}px`,
                  }}
                  onMouseDown={handleMouseDown}
                />
                <div
                  data-handle="ne"
                  className="absolute w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize hover:bg-blue-600 transition-colors z-10"
                  style={{
                    left: `${cropArea.x + cropArea.width - 2.5}px`,
                    top: `${cropArea.y - 2.5}px`,
                  }}
                  onMouseDown={handleMouseDown}
                />
                <div
                  data-handle="sw"
                  className="absolute w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize hover:bg-blue-600 transition-colors z-10"
                  style={{
                    left: `${cropArea.x - 2.5}px`,
                    top: `${cropArea.y + cropArea.height - 2.5}px`,
                  }}
                  onMouseDown={handleMouseDown}
                />
                <div
                  data-handle="se"
                  className="absolute w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize hover:bg-blue-600 transition-colors z-10"
                  style={{
                    left: `${cropArea.x + cropArea.width - 2.5}px`,
                    top: `${cropArea.y + cropArea.height - 2.5}px`,
                  }}
                  onMouseDown={handleMouseDown}
                />
                {/* Resize handles - edges */}
                <div
                  data-handle="n"
                  className="absolute h-5 bg-blue-500 border-2 border-white rounded cursor-ns-resize hover:bg-blue-600 transition-colors z-10"
                  style={{
                    left: `${cropArea.x + cropArea.width / 2 - 10}px`,
                    top: `${cropArea.y - 2.5}px`,
                    width: '20px',
                  }}
                  onMouseDown={handleMouseDown}
                />
                <div
                  data-handle="s"
                  className="absolute h-5 bg-blue-500 border-2 border-white rounded cursor-ns-resize hover:bg-blue-600 transition-colors z-10"
                  style={{
                    left: `${cropArea.x + cropArea.width / 2 - 10}px`,
                    top: `${cropArea.y + cropArea.height - 2.5}px`,
                    width: '20px',
                  }}
                  onMouseDown={handleMouseDown}
                />
                <div
                  data-handle="e"
                  className="absolute w-5 bg-blue-500 border-2 border-white rounded cursor-ew-resize hover:bg-blue-600 transition-colors z-10"
                  style={{
                    left: `${cropArea.x + cropArea.width - 2.5}px`,
                    top: `${cropArea.y + cropArea.height / 2 - 10}px`,
                    height: '20px',
                  }}
                  onMouseDown={handleMouseDown}
                />
                <div
                  data-handle="w"
                  className="absolute w-5 bg-blue-500 border-2 border-white rounded cursor-ew-resize hover:bg-blue-600 transition-colors z-10"
                  style={{
                    left: `${cropArea.x - 2.5}px`,
                    top: `${cropArea.y + cropArea.height / 2 - 10}px`,
                    height: '20px',
                  }}
                  onMouseDown={handleMouseDown}
                />
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCropComplete}
              disabled={!cropArea || isProcessing || isCropped}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#8B1538] text-white rounded-md hover:bg-[#73122E] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Memproses...
                </>
              ) : isCropped ? (
                <>
                  <Check size={16} />
                  Sudah di-crop
                </>
              ) : (
                <>
                  <Crop size={16} />
                  Selesai Crop
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
