"use client";

import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { redeemService, RedeemCheckResponse } from '@/lib/services/redeem/redeemService';

interface CreateRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: 'FWC' | 'VOUCHER';
}

export default function CreateRedeemModal({
  isOpen,
  onClose,
  onSuccess,
  product = 'FWC',
}: CreateRedeemModalProps) {
  const [serialNumber, setSerialNumber] = useState('');
  const [cardData, setCardData] = useState<RedeemCheckResponse | null>(null);
  const [redeemType, setRedeemType] = useState<'SINGLE' | 'ROUNDTRIP'>('SINGLE');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Fetch user info for operatorId and stationId
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await import('@/lib/services/auth.service').then(m => m.getAuthMe());
        setUserInfo(user);
      } catch (err) {
        setUserInfo(null);
      }
    }
    fetchUser();
  }, []);

  const handleCheckSerial = async () => {
    if (!serialNumber.trim()) {
      toast.error('Serial number tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    try {
      const data = await redeemService.checkSerial(serialNumber, product);
      // Validasi status kartu - HARUS dicek SEBELUM set cardData
      if (data.statusActive !== 'ACTIVE') {
        toast.error('Kartu tidak aktif. Silakan gunakan kartu yang aktif.');
        setCardData(null);
        return;
      }
      if (data.quotaRemaining <= 0) {
        toast.error('Kuota kartu sudah habis. Silakan isi ulang kuota terlebih dahulu.');
        setCardData(null);
        return;
      }
      // Jika semua validasi passed, baru set cardData
      setCardData(data);
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan saat mengambil data kartu';
      // Handle specific error messages
      if (error.message.includes('bukan produk yang sesuai')) {
        errorMessage = 'Kartu ini bukan produk yang sesuai. Silakan gunakan kartu dengan produk yang benar.';
      } else if (error.message.includes('not found') || error.message.includes('Not found')) {
        errorMessage = 'Data kartu tidak ditemukan. Periksa kembali nomor seri kartu.';
      } else if (error.message.includes('inactive') || error.message.includes('not active')) {
        errorMessage = 'Kartu tidak aktif. Silakan gunakan kartu yang aktif.';
      } else if (error.message.includes('expired')) {
        errorMessage = 'Kartu sudah kadaluarsa. Silakan perpanjang masa berlaku kartu.';
      } else if (error.message.includes('quota') || error.message.includes('kuota')) {
        errorMessage = 'Kuota kartu tidak mencukupi. Silakan isi ulang kuota.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setCardData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!cardData) {
      toast.error('Silakan check kartu terlebih dahulu');
      return;
    }

    setIsLoading(true);
    try {
      if (!userInfo) {
        toast.error('User info tidak ditemukan. Silakan login ulang.');
        return;
      }
      const payload = {
        serialNumber,
        redeemType,
        operatorId: userInfo.id || userInfo.operatorId || userInfo.userId,
        stationId: userInfo.stationId || userInfo.station?.id,
        product,
        notes: notes.trim() || undefined,
      };
      const result = await redeemService.createRedeem(payload);
      // Show result summary
      toast.custom(
        (t) => (
          <div className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-green-500 max-w-sm">
            <p className="font-semibold text-green-700 mb-2">✓ Redeem Berhasil</p>
            <p className="text-sm text-gray-700">
              Nomor Transaksi: <strong>{result.transactionNumber}</strong>
            </p>
            <p className="text-sm text-gray-700">
              Sisa Kuota: <strong>{result.remainingQuota}</strong>
            </p>
          </div>
        ),
        { duration: 5000 }
      );
      // Reset form
      setSerialNumber('');
      setCardData(null);
      setRedeemType('SINGLE');
      setNotes('');
      onSuccess();
      onClose();
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan saat melakukan redeem';
      // Handle specific error messages
      if (error.message.includes('not found') || error.message.includes('Not found')) {
        errorMessage = 'Data kartu tidak ditemukan. Silakan periksa kembali.';
      } else if (error.message.includes('Not enough quota') || error.message.includes('quota') || error.message.includes('kuota')) {
        errorMessage = 'Kuota tidak mencukupi untuk transaksi ini. Silakan isi ulang kuota.';
      } else if (error.message.includes('not active') || error.message.includes('inactive')) {
        errorMessage = 'Kartu tidak aktif. Silakan aktifkan kartu terlebih dahulu.';
      } else if (error.message.includes('expired') || error.message.includes('kadaluarsa')) {
        errorMessage = 'Kartu sudah kadaluarsa. Silakan perpanjang masa berlaku kartu.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSerialNumber('');
    setCardData(null);
    setRedeemType('SINGLE');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Tambah Redeem Kuota</h2>
        <div className="mb-2">
          <span className="text-xs text-gray-500 mr-2">Produk:</span>
          <span className="px-2 py-1 rounded bg-red-50 text-[#8D1231] font-semibold border border-[#8D1231] text-xs">{product}</span>
        </div>

        {/* Step 1: Check Serial */}
        {!cardData ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nomor Seri Kartu
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckSerial()}
                  placeholder="Masukkan nomor seri..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleCheckSerial}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Checking...' : 'Check'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Show Card Data & Redeem Options */
          <div className="space-y-4">
            {/* Card Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-blue-900">Data Kartu</h3>



              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">NIK</p>
                  <p className="font-medium">{cardData.nik}</p>
                </div>
                <div>
                  <p className="text-gray-600">Nama Pelanggan</p>
                  <p className="font-medium">{cardData.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Kategori</p>
                  <p className="font-medium">{cardData.cardCategory}</p>
                </div>
                <div>
                  <p className="text-gray-600">Tipe</p>
                  <p className="font-medium">{cardData.cardType}</p>
                </div>
                <div>
                  <p className="text-gray-600">No. Seri</p>
                  <p className="font-medium">{cardData.serialNumber}</p>
                </div>
                {/* Kuota Awal */}
                <div>
                  <p className="text-gray-600">Kuota Awal</p>
                  <p className="font-medium text-lg">{cardData.cardProduct?.totalQuota ?? '-'}</p>
                </div>
                {/* Kuota Terpakai */}
                <div>
                  <p className="text-gray-600">Kuota Terpakai</p>
                  <p className="font-medium text-lg">
                    {cardData.cardProduct?.totalQuota != null && cardData.quotaRemaining != null
                      ? cardData.cardProduct.totalQuota - cardData.quotaRemaining
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Sisa Kuota</p>
                  <p className="font-medium text-lg">{cardData.quotaRemaining}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    cardData.statusActive === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {cardData.statusActive}
                </span>
              </div>
            </div>

            {/* Redeem Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipe Redeem
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="redeemType"
                    value="SINGLE"
                    checked={redeemType === 'SINGLE'}
                    onChange={(e) =>
                      setRedeemType(e.target.value as 'SINGLE' | 'ROUNDTRIP')
                    }
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">Single Journey (1 Arah)</p>
                    <p className="text-xs text-gray-600">Kuota pengurangan: 1</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="redeemType"
                    value="ROUNDTRIP"
                    checked={redeemType === 'ROUNDTRIP'}
                    onChange={(e) =>
                      setRedeemType(e.target.value as 'SINGLE' | 'ROUNDTRIP')
                    }
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">PP/Roundtrip (Pulang Pergi)</p>
                    <p className="text-xs text-gray-600">Kuota pengurangan: 2</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Catatan (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Masukkan catatan..."
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCardData(null);
                  setSerialNumber('');
                }}
                className="flex-1 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Ubah Serial
              </button>
              <button
                onClick={handleRedeem}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Redeem'}
              </button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="mt-4 w-full px-4 py-2 text-gray-700 border rounded-md text-sm font-medium hover:bg-gray-50"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
