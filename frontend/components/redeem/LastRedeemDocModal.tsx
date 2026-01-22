'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  // FIX: showReupload harus di level atas agar tidak menyebabkan error hooks
  const [showReupload, setShowReupload] = useState(false);

  // Always call hooks in the same order, never conditionally
  // Modal close on overlay click or Escape
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  };
  // Close modal on Escape key
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Silakan pilih file gambar');
      return;
    }
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.onloadstart = () => setUploadProgress(0);
    reader.onloadend = () => setUploadProgress(100);
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImageData(base64);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  // Camera logic
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Camera logic removed (not used in UI)

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
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupload foto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setImageData(null);
    setUseCamera(false);
    onClose();
  };

  // --- Quota calculation (same as CreateRedeemModal) ---

  let content = null;
  if (isOpen && data) {
    // Defensive: cardProduct may not have totalQuota, so check type
    let totalQuota: number | null = null;
    if (
      data.card?.cardProduct &&
      typeof (data.card.cardProduct as any).totalQuota === 'number'
    ) {
      totalQuota = (data.card.cardProduct as any).totalQuota;
    }
    const quotaRemaining = typeof data.card?.quotaTicket === 'number' ? data.card.quotaTicket : null;
    const kuotaAwal = totalQuota;
    const kuotaTerpakai = totalQuota != null && quotaRemaining != null ? totalQuota - quotaRemaining : null;
    const sisaKuota = quotaRemaining;
    // Debug log
    console.log('DEBUG QUOTA:', { totalQuota, quotaRemaining, kuotaAwal, kuotaTerpakai, sisaKuota, data });

    // If fileObject exists, show image and allow re-upload
    const hasLastRedeemPhoto = !!data.fileObject?.path;

    content = (
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleOverlayClick}
      >
        <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 max-h-[95vh] overflow-y-auto animate-fadein">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#8D1231] tracking-tight">Last Redeem</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-[#8D1231] text-2xl leading-none transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* If last redeem photo exists, show image and re-upload button */}
          {hasLastRedeemPhoto && !showReupload ? (
            <div className="flex flex-col items-center mb-6">
              <img
                src={data.fileObject.path}
                alt="Last Redeem Photo"
                className="w-64 h-64 object-contain rounded border mb-2"
              />
              <span className="text-xs text-gray-500 mb-2">Diupload: {data.fileObject.createdAt ? new Date(data.fileObject.createdAt).toLocaleString() : '-'}</span>
              <button
                type="button"
                onClick={() => { setShowReupload(true); setImageData(null); }}
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
              >
                Upload Ulang Foto
              </button>
            </div>
          ) : !useCamera ? (
            <>
              <div className="flex w-full gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
                >
                  Ambil Foto
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 transition"
                >
                  Upload Gambar
                </button>
              </div>
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center py-10 mb-6 bg-gray-50 cursor-pointer transition hover:border-[#8D1231]"
                onClick={() => fileInputRef.current?.click()}
              >
                {!imageData ? (
                  <>
                    {/* Cloud upload icon SVG (mirip gambar user) */}
                    <svg width="56" height="40" viewBox="0 0 56 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                      <path d="M41.5 34H14.5C8.70101 34 4 29.299 4 23.5C4 18.264 7.995 13.995 13.09 13.09C14.97 8.13 19.62 4.5 25 4.5C30.38 4.5 35.03 8.13 36.91 13.09C42.005 13.995 46 18.264 46 23.5C46 29.299 41.299 34 35.5 34H41.5Z" fill="#1DA1F2"/>
                      <path d="M28 24V14M28 14L24 18M28 14L32 18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-gray-500 font-medium text-center">Drop Your Image Here, or Browse</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                  </>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center gap-2 border rounded bg-white px-3 py-2 mb-2">
                      <img src={imageData} alt="Preview" className="w-8 h-8 object-cover rounded mr-2" />
                      <span className="text-sm font-medium text-gray-700 flex-1 truncate">{fileInputRef.current?.files?.[0]?.name || 'Image'}</span>
                      <span className="text-xs text-gray-400">{fileInputRef.current?.files?.[0]?.size ? `${(fileInputRef.current.files[0].size/1024).toFixed(0)} KB` : ''}</span>
                      <svg className="w-5 h-5 text-green-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-gray-200 rounded mb-2">
                      <div className="h-3 bg-[#22336c] rounded" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mb-6 flex flex-col items-center">
              <video ref={videoRef} autoPlay playsInline className="w-full max-w-xs h-64 rounded bg-black mb-4" style={{display:'block'}} />
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition"
                >
                  Ambil Foto
                </button>
                <button
                  type="button"
                  onClick={cancelCamera}
                  className="flex-1 px-4 py-2 border rounded font-medium hover:bg-gray-50 transition"
                >
                  Batal
                </button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Data Section - grid layout */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex flex-col"><span className="text-gray-500 font-medium">Customer Name</span><span className="font-semibold text-gray-800">{data.card?.member?.name || '-'}</span></div>
            <div className="flex flex-col"><span className="text-gray-500 font-medium">NIK</span><span className="font-semibold text-gray-800">{data.card?.member?.identityNumber || '-'}</span></div>
            <div className="flex flex-col"><span className="text-gray-500 font-medium">Card Category</span><span className="font-semibold text-gray-800">{data.card?.cardProduct?.category?.categoryName || data.card?.category || '-'}</span></div>
            <div className="flex flex-col"><span className="text-gray-500 font-medium">Card Type</span><span className="font-semibold text-gray-800">{data.card?.cardProduct?.type?.typeName || data.card?.cardType || '-'}</span></div>
            <div className="flex flex-col"><span className="text-gray-500 font-medium">Serial Number</span><span className="font-semibold text-gray-800">{data.card?.serialNumber || '-'}</span></div>
            <div className="flex flex-col"><span className="text-gray-500 font-medium">Kuota Awal</span><span className="font-semibold text-gray-800">{kuotaAwal ?? '-'}</span></div>
            <div className="flex flex-col"><span className="text-gray-500 font-medium">Kuota Terpakai</span><span className="font-semibold text-gray-800">{kuotaTerpakai ?? '-'}</span></div>
            <div className="flex flex-col"><span className="text-gray-500 font-medium">Sisa Kuota</span><span className="font-semibold text-gray-800">{sisaKuota ?? '-'}</span></div>
          </div>

          {/* Submit/Upload Button */}
          {(!hasLastRedeemPhoto || showReupload) && (
            <div className="flex justify-end mt-6">
              <button
                onClick={handleUpload}
                disabled={!imageData || isLoading}
                className="bg-[#8D1231] text-white px-8 py-2 rounded font-bold text-base shadow-sm hover:bg-[#6c0e25] transition disabled:opacity-50"
              >
                {isLoading ? 'Uploading...' : (hasLastRedeemPhoto ? 'Upload Ulang' : 'Submit')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  return content;
}
