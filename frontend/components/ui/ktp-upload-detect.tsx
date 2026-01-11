'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/apiConfig';
import toast from 'react-hot-toast';

interface KTPUploadDetectProps {
  onImageChange: (file: File | null) => void;
  onDetectionComplete?: (sessionId: string, croppedImageBase64: string) => void;
  onExtractOCR?: (sessionId: string) => Promise<void>;
  className?: string;
}

export function KTPUploadDetect({
  onImageChange,
  onDetectionComplete,
  onExtractOCR,
  className = '',
}: KTPUploadDetectProps) {
  const [originalImage, setOriginalImage] = useState<string>('');
  const [croppedImage, setCroppedImage] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isExtractingOCR, setIsExtractingOCR] = useState(false);
  const [detectionError, setDetectionError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    // Show original image preview
    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset states
    setCroppedImage('');
    setSessionId('');
    setDetectionError('');
    setIsDetecting(true);

    try {
      // Call detection endpoint
      const token = localStorage.getItem('fwc_token');
      if (!token) {
        throw new Error('Session expired. Silakan login kembali.');
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/members/ktp-detect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || result.error || 'Gagal mendeteksi KTP');
      }

      // Store sessionId and cropped image
      const detectedSessionId = result.data.sessionId;
      const detectedCroppedImage = result.data.cropped_image;

      if (!detectedSessionId || !detectedCroppedImage) {
        throw new Error('Response tidak valid: sessionId atau cropped_image tidak ditemukan');
      }

      setSessionId(detectedSessionId);
      setCroppedImage(detectedCroppedImage);
      setDetectionError('');

      // Call callback
      if (onDetectionComplete) {
        onDetectionComplete(detectedSessionId, detectedCroppedImage);
      }

      // Update parent component
      onImageChange(file);

      toast.success('KTP berhasil dideteksi!');
    } catch (error: any) {
      console.error('Detection error:', error);
      const errorMessage = error.message || 'Gagal mendeteksi KTP. Pastikan gambar mengandung KTP yang jelas.';
      setDetectionError(errorMessage);
      toast.error(errorMessage);
      setOriginalImage('');
      onImageChange(null);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleExtractOCR = async () => {
    if (!sessionId) {
      toast.error('Session tidak ditemukan. Silakan upload ulang gambar.');
      return;
    }

    setIsExtractingOCR(true);
    try {
      if (onExtractOCR) {
        await onExtractOCR(sessionId);
      } else {
        // Default OCR extraction
        const token = localStorage.getItem('fwc_token');
        if (!token) {
          throw new Error('Session expired. Silakan login kembali.');
        }

        const formData = new FormData();
        formData.append('session_id', sessionId);

        const response = await fetch(`${API_BASE_URL}/members/ocr-extract`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || result.error || 'Gagal mengekstrak data KTP');
        }

        toast.success('Data KTP berhasil diekstrak!');
      }
    } catch (error: any) {
      console.error('OCR extraction error:', error);
      toast.error(error.message || 'Gagal mengekstrak data KTP');
    } finally {
      setIsExtractingOCR(false);
    }
  };

  const handleCancel = () => {
    setOriginalImage('');
    setCroppedImage('');
    setSessionId('');
    setDetectionError('');
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!originalImage ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="ktp-upload-detect"
          />
          <label
            htmlFor="ktp-upload-detect"
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
          {/* Detection Status */}
          {isDetecting && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="animate-spin text-blue-600" size={20} />
              <span className="text-sm text-blue-700">
                Mendeteksi KTP dalam gambar...
              </span>
            </div>
          )}

          {/* Detection Error */}
          {detectionError && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Gagal Mendeteksi KTP</p>
                <p className="text-xs text-red-600 mt-1">{detectionError}</p>
              </div>
            </div>
          )}

          {/* Original Image Preview - Show during detection */}
          {originalImage && isDetecting && (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <div className="p-2 bg-blue-50 border-b border-blue-200">
                <p className="text-xs font-medium text-blue-800">
                  ⏳ Memproses gambar...
                </p>
              </div>
              <img
                src={originalImage}
                alt="Original KTP - Processing"
                className="max-h-96 w-full object-contain"
              />
            </div>
          )}

          {/* Cropped Image Preview - Show after detection success */}
          {croppedImage && !isDetecting && (
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="p-2 bg-green-50 border-b border-green-200">
                  <p className="text-xs font-medium text-green-800">
                    ✓ KTP berhasil dideteksi dan di-crop
                  </p>
                </div>
                <img
                  src={`data:image/jpeg;base64,${croppedImage}`}
                  alt="Cropped KTP"
                  className="max-h-96 w-full object-contain"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {onExtractOCR && (
                  <button
                    type="button"
                    onClick={handleExtractOCR}
                    disabled={isExtractingOCR}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#8B1538] text-white rounded-md hover:bg-[#73122E] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isExtractingOCR ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Mengekstrak data...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Ekstrak Data KTP
                      </>
                    )}
                  </button>
                )}
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
      )}
    </div>
  );
}
