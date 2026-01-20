'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { redeemService, RedeemItem } from '@/lib/services/redeem/redeemService';

interface LastRedeemDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RedeemItem | null;
  onSuccess: () => void;
}

export default function LastRedeemDocModal({
  isOpen,
  onClose,
  data,
  onSuccess,
}: LastRedeemDocModalProps) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCamera, setUseCamera] = useState(false);

  if (!isOpen || !data) return null;

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Silakan pilih file gambar');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImageData(base64);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setUseCamera(true);
      }
    } catch (error) {
      toast.error('Tidak dapat mengakses kamera');
    }
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setImageData(imageData);
        setMimeType('image/jpeg');

        // Stop camera
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        setUseCamera(false);
      }
    }
  };

  const cancelCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setUseCamera(false);
  };

  const handleUpload = async () => {
    if (!imageData) {
      toast.error('Silakan pilih atau ambil foto terlebih dahulu');
      return;
    }

    setIsLoading(true);
    try {
      await redeemService.uploadLastDoc(data.id, {
        imageBase64: imageData,
        mimeType,
      });

      toast.success('Foto last redeem berhasil diupload');
      setImageData(null);
      setUseCamera(false);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupload foto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setImageData(null);
    setUseCamera(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload Foto Last Redeem</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-900">
            <strong>Transaksi:</strong> {data.transactionNumber}
          </p>
          <p className="text-sm text-blue-900">
            <strong>Kuota Dipakai:</strong> {data.quotaUsed}
          </p>
        </div>

        {/* Camera or File Input */}
        {!useCamera ? (
          <div className="space-y-3">
            {!imageData ? (
              <>
                <button
                  onClick={handleCameraCapture}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Ambil Foto
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Pilih dari Galeri
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files && handleFileSelect(e.target.files[0])
                  }
                  className="hidden"
                />
              </>
            ) : (
              <>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50">
                  <img
                    src={imageData}
                    alt="Preview"
                    className="w-full h-64 object-contain rounded"
                  />
                </div>
                <button
                  onClick={() => setImageData(null)}
                  className="w-full px-4 py-2 text-gray-700 border rounded-lg font-medium hover:bg-gray-50"
                >
                  Ubah Foto
                </button>
              </>
            )}
          </div>
        ) : (
          /* Camera View */
          <div className="space-y-3">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={capturePhoto}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Ambil Foto
              </button>
              <button
                onClick={cancelCamera}
                className="flex-1 px-4 py-2 text-gray-700 border rounded-lg font-medium hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Upload Button */}
        {imageData && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 border rounded-lg font-medium hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
