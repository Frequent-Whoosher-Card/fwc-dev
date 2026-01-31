"use client";

import { useState, useEffect } from "react";
import axios from '@/lib/axios';
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
  // Card Product Dropdown
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  // Partial input for recommendation mode (7 digits for FWC, 11 for VOUCHER)
  const [partialSerialInput, setPartialSerialInput] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  // Fetch card products on open
  useEffect(() => {
    if (!isOpen) return;
    axios.get('/card/product')
      .then(res => {
        const allProducts = res.data?.data || [];
        // Filter sesuai dengan prop 'product' yang sedang aktif (FWC / VOUCHER)
        const filtered = allProducts.filter((p: any) => p.programType === product);
        setProducts(filtered);
      })
      .catch((err) => {
        // Jika error 422 tapi ada data produk, tetap tampilkan & filter
        if (err?.response?.data?.found?.data) {
          const allProducts = err.response.data.found.data;
          const filtered = allProducts.filter((p: any) => p.programType === product);
          setProducts(filtered);
          toast.error('Gagal mengambil card product, tapi data tetap ditampilkan.');
        } else {
          toast.error('Gagal mengambil card product');
        }
        // Log error detail ke console
        if (err?.response) {
          console.error('Card product error:', err.response.status, err.response.data);
        } else {
          console.error('Card product error:', err);
        }
      });
  }, [isOpen, product]);

  const [inputMode, setInputMode] = useState<'MANUAL' | 'RECOMMENDATION'>('MANUAL');
  const [manualSerial, setManualSerial] = useState('');

  // Update selected product - only for Recommendation mode logic
  useEffect(() => {
    const p = products.find((x) => x.id === selectedProductId) || null;
    setSelectedProduct(p);
    setPartialSerialInput('');
    // Do not reset serialNumber here if in MANUAL mode
  }, [selectedProductId, products]);

  // Recommendation Mode: Gabungkan serial number
  useEffect(() => {
    if (inputMode === 'RECOMMENDATION') {
      const requiredLength = selectedProduct?.programType === 'VOUCHER' ? 11 : 7;

      if (
        selectedProduct &&
        typeof selectedProduct.serialTemplate === 'string' &&
        selectedProduct.serialTemplate.length >= 4 &&
        partialSerialInput.length === requiredLength
      ) {
        // Old logic: Template + Year + Input
        // New logic: Template + Input (Input includes Year+Seq)
        // FWC: 4 digit template + 7 digit input = 11 digits
        // Voucher: 4 digit template + 11 digit input = 15 digits

        const prefix = selectedProduct.serialTemplate;
        const serial = `${prefix}${partialSerialInput}`;

        // Only set if result is all digits and length is valid
        if (/^\d+$/.test(serial)) {
          setSerialNumber(serial);
        } else {
          setSerialNumber("");
        }
      } else {
        setSerialNumber("");
      }
    }
  }, [selectedProduct, partialSerialInput, inputMode]);

  // Manual Mode: serialNumber follows manualSerial input
  useEffect(() => {
    if (inputMode === 'MANUAL') {
      setSerialNumber(manualSerial);
    }
  }, [manualSerial, inputMode]);

  const [cardData, setCardData] = useState<RedeemCheckResponse | null>(null);
  const [redeemType, setRedeemType] = useState<'SINGLE' | 'ROUNDTRIP'>('SINGLE');
  // notes state removed
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Fetch user info for operatorId and stationId
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await import('@/lib/services/auth.service').then(m => m.getAuthMe());
        setUserInfo(user);
      } catch (err) {
        console.error('Failed to fetch user info', err);
        setUserInfo(null);
      }
    }
    fetchUser();
  }, []);

  const handleCheckSerial = async () => {
    // Validation based on mode
    if (inputMode === 'RECOMMENDATION') {
      if (!selectedProduct) {
        toast.error('Pilih produk kartu terlebih dahulu');
        return;
      }

      const requiredLength = selectedProduct?.programType === 'VOUCHER' ? 11 : 7;
      if (partialSerialInput.length !== requiredLength || !partialSerialInput.match(/^\d+$/)) {
        toast.error(`Masukkan ${requiredLength} digit terakhir serial`);
        return;
      }
    }

    if (!serialNumber) {
      toast.error('Serial number tidak valid');
      return;
    }

    setIsLoading(true);
    try {
      // Always use the 'product' prop (FWC/VOUCHER) determined by the parent context
      // This ensures we validate against the expected product type regardless of input mode or selected dropdown item quirks
      const progType = product;

      const data = await redeemService.checkSerial(serialNumber, progType);

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
        // Backend returns: "Kartu ini bukan produk yang sesuai (EXPECTED). Produk kartu: ACTUAL"
        // We want to show this detail to the user.
        errorMessage = error.message;
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

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCheckSerial();
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

      // Determine program type for payload
      const progType = product;

      const payload = {
        serialNumber,
        redeemType,
        operatorId: userInfo.id || userInfo.operatorId || userInfo.userId,
        stationId: userInfo.stationId || userInfo.station?.id,
        product: progType,
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
      setManualSerial('');
      setPartialSerialInput('');
      setCardData(null);
      setRedeemType('SINGLE');
      onSuccess();
      onClose();
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan saat melakukan redeem';
      // Handle specifi errors (omitted)
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
    setManualSerial('');
    setPartialSerialInput('');
    setCardData(null);
    setRedeemType('SINGLE');
    onClose();
  };

  if (!isOpen) return null;
  // Dynamic labels based on required length
  const requiredLength = selectedProduct?.programType === 'VOUCHER' ? 11 : 7;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Tambah Redeem Kuota</h2>
        <div className="text-sm text-gray-500 mb-4 font-medium">Produk: {product}</div>

        {/* Input Mode Toggle */}
        {!cardData && (
          <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
            <button
              onClick={() => setInputMode('MANUAL')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputMode === 'MANUAL'
                ? 'bg-white text-[#8D1231] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Manual / Scan
            </button>
            <button
              onClick={() => setInputMode('RECOMMENDATION')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputMode === 'RECOMMENDATION'
                ? 'bg-white text-[#8D1231] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Recommendation
            </button>
          </div>
        )}

        {/* Manual Mode Input */}
        {inputMode === 'MANUAL' && !cardData && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Serial Number (Scan/Input)</label>
            <input
              type="text"
              value={manualSerial}
              onChange={(e) => setManualSerial(e.target.value)}
              onKeyDown={handleManualKeyDown}
              placeholder="Scan Barcode atau ketik serial..."
              autoFocus
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wide"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1">Tekan Enter untuk cek otomatis</p>
          </div>
        )}

        {/* Recommendation Mode Inputs */}
        {inputMode === 'RECOMMENDATION' && !cardData && (
          <>
            {/* Card Product Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Pilih Produk Kartu</label>
              <select
                className="w-full rounded-lg border px-4 py-2 disabled:bg-gray-100"
                value={selectedProductId}
                disabled={isLoading}
                onChange={e => setSelectedProductId(e.target.value)}
              >
                <option value="">-- Pilih Card Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.category.categoryName} - {p.type.typeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Serial Input (Variable length) */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{requiredLength} Digit Terakhir Serial Kartu</label>
              <div className="flex gap-2 items-center">

                {/* Prefix (Left) - Show only when product selected */}
                {selectedProduct && selectedProduct.serialTemplate && (
                  <span
                    className="bg-gray-100 border rounded-md px-3 py-2 text-sm font-mono text-gray-600 flex items-center h-[38px]"
                    title="Prefix Serial Number"
                  >
                    {selectedProduct.serialTemplate}
                  </span>
                )}

                <input
                  type="text"
                  value={partialSerialInput}
                  onChange={e => setPartialSerialInput(e.target.value.replace(/\D/g, '').slice(0, requiredLength))}
                  placeholder={selectedProduct ? `Misal: ${'1'.repeat(requiredLength)}` : "Pilih Produk Kartu dulu"}
                  className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wide ${partialSerialInput.length === requiredLength ? 'bg-blue-50 border-blue-200' : ''}`}
                  disabled={isLoading || !selectedProduct}
                  maxLength={requiredLength}
                  style={{ minWidth: 100 }}
                />
              </div>
              {/* Helper text explaining the full serial */}
              {serialNumber && (
                <p className="text-xs text-gray-500 mt-1">
                  Full Serial: <span className="font-mono font-medium">{serialNumber}</span>
                </p>
              )}
            </div>
          </>
        )}

        {/* Step 1: Check Serial */}
        {!cardData ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={handleCheckSerial}
                disabled={isLoading || (inputMode === 'RECOMMENDATION' && (partialSerialInput.length !== requiredLength || !serialNumber)) || (inputMode === 'MANUAL' && !serialNumber)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full"
              >
                {isLoading ? 'Checking...' : 'Check Serial'}
              </button>
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
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${cardData.statusActive === 'ACTIVE'
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

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCardData(null);
                }}
                className="flex-1 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Scan/Input Ulang
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
