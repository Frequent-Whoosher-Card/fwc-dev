"use client";

import { useState, useEffect } from "react";
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { redeemService, RedeemCheckResponse, ProductType } from '@/lib/services/redeem/redeemService';

interface CreateRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProduct?: 'FWC' | 'VOUCHER';
}

export default function CreateRedeemModal({
  isOpen,
  onClose,
  onSuccess,
  initialProduct,
}: CreateRedeemModalProps) {
  // Product Types Dropdown
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  
  // Card Product Dropdown
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  // Partial input for recommendation mode (7 digits for FWC, 11 for VOUCHER)
  const [partialSerialInput, setPartialSerialInput] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  
  // Fetch product types on open
  useEffect(() => {
    if (!isOpen) return;
    redeemService.getProductTypes()
      .then(types => {
        setProductTypes(types);
        // Set initial product type if provided
        if (initialProduct) {
          const initial = types.find(t => t.programType === initialProduct);
          if (initial) setSelectedProductType(initial);
        }
      })
      .catch((err) => {
        toast.error('Gagal mengambil tipe produk');
        console.error('Product types error:', err);
      });
  }, [isOpen, initialProduct]);
  
  // Fetch card products when product type changes
  useEffect(() => {
    if (!selectedProductType) {
      setProducts([]);
      return;
    }
    
    axios.get('/card/product')
      .then(res => {
        const allProducts = res.data?.data || [];
        // Filter berdasarkan programType yang dipilih
        const filtered = allProducts.filter((p: any) => p.programType === selectedProductType.programType);
        setProducts(filtered);
      })
      .catch((err) => {
        if (err?.response?.data?.found?.data) {
          const allProducts = err.response.data.found.data;
          const filtered = allProducts.filter((p: any) => p.programType === selectedProductType.programType);
          setProducts(filtered);
          toast.error('Gagal mengambil card product, tapi data tetap ditampilkan.');
        } else {
          toast.error('Gagal mengambil card product');
        }
        if (err?.response) {
          console.error('Card product error:', err.response.status, err.response.data);
        } else {
          console.error('Card product error:', err);
        }
      });
  }, [isOpen, selectedProductType]);

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
  const [passengerNik, setPassengerNik] = useState('');
  const [passengerName, setPassengerName] = useState('');
  // notes state removed
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  
  // Last Redeem Flow States
  const [showLastRedeemOptions, setShowLastRedeemOptions] = useState(false);
  const [lastRedeemChoice, setLastRedeemChoice] = useState<'skip' | 'upload' | null>(null);
  const [lastRedeemFile, setLastRedeemFile] = useState<File | null>(null);
  const [lastRedeemPreview, setLastRedeemPreview] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useState<any>(null)[0];
  const canvasRef = useState<any>(null)[0];

  // Force SINGLE for VOUCHER
  useEffect(() => {
    if (selectedProductType?.programType === 'VOUCHER') {
      setRedeemType('SINGLE');
    }
  }, [selectedProductType]);

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
      // Always use the 'selectedProductType?.programType' (FWC/VOUCHER) determined by selection
      const progType = selectedProductType?.programType || 'FWC';
      if (!progType) {
        toast.error('Silakan pilih tipe produk terlebih dahulu');
        return;
      }

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

  const handleLastRedeemClick = () => {
    setShowLastRedeemOptions(true);
  };

  const handleLastRedeemChoiceChange = (choice: 'skip' | 'upload') => {
    setLastRedeemChoice(choice);
    setLastRedeemFile(null);
    setLastRedeemPreview(null);
    setUseCamera(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLastRedeemFile(file);
      const reader = new FileReader();
      reader.onload = () => setLastRedeemPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    if (!useCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef) {
          videoRef.current = document.createElement('video');
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setUseCamera(true);
      } catch (err) {
        toast.error('Gagal mengakses kamera');
      }
    } else {
      if (videoRef?.current && canvasRef) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        canvasRef.current.getContext('2d').drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob((blob: Blob | null) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            setLastRedeemFile(file);
            setLastRedeemPreview(URL.createObjectURL(blob));
          }
        }, 'image/jpeg');
        videoRef.current.srcObject?.getTracks().forEach((t: any) => t.stop());
        setUseCamera(false);
      }
    }
  };

  const handleRedeem = async () => {
    if (!cardData) {
      toast.error('Silakan check kartu terlebih dahulu');
      return;
    }

    if (selectedProductType?.programType === 'VOUCHER') {
      if (!passengerNik.trim() || !passengerName.trim()) {
        toast.error('NIK dan Nama Penumpang wajib diisi');
        return;
      }
      if (passengerNik.trim().length !== 16 || !/^\d{16}$/.test(passengerNik.trim())) {
        toast.error('NIK harus 16 digit angka');
        return;
      }
    }

    // Check if this is last quota and user chose to upload but hasn't uploaded
    if (cardData.quotaRemaining === 1 && lastRedeemChoice === 'upload' && !lastRedeemFile) {
      toast.error('Silakan upload foto terlebih dahulu atau pilih "Lanjutkan Tanpa Upload"');
      return;
    }

    setIsLoading(true);
    try {
      if (!userInfo) {
        toast.error('User info tidak ditemukan. Silakan login ulang.');
        return;
      }

      // Determine program type for payload
      const progType = selectedProductType?.programType || 'FWC';
      if (!progType) {
        toast.error('Tipe produk tidak valid');
        return;
      }

      const payload = {
        serialNumber,
        redeemType,
        operatorId: userInfo.id || userInfo.operatorId || userInfo.userId,
        stationId: userInfo.stationId || userInfo.station?.id,
        product: progType,
        passengerNik: selectedProductType?.programType === 'VOUCHER' ? passengerNik.trim() : undefined,
        passengerName: selectedProductType?.programType === 'VOUCHER' ? passengerName.trim() : undefined,
      };
      const result = await redeemService.createRedeem(payload);
      
      // Upload last redeem photo if provided
      if (lastRedeemFile && result.id) {
        try {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const base64 = reader.result as string;
              const base64Data = base64.split(',')[1]; // Remove data:image/...;base64, prefix
              await redeemService.uploadLastDoc(result.id, {
                imageBase64: base64Data,
                mimeType: lastRedeemFile.type,
              });
              toast.success('Foto last redeem berhasil diupload');
            } catch (uploadErr) {
              console.error('Last redeem upload error:', uploadErr);
              toast.error('Redeem berhasil, tapi gagal upload foto');
            }
          };
          reader.readAsDataURL(lastRedeemFile);
        } catch (err) {
          console.error('File read error:', err);
          toast.error('Gagal membaca file foto');
        }
      }
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
      setPassengerNik('');
      setPassengerName('');
      setShowLastRedeemOptions(false);
      setLastRedeemChoice(null);
      setLastRedeemFile(null);
      setLastRedeemPreview(null);
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
    setPassengerNik('');
    setPassengerName('');
    setShowLastRedeemOptions(false);
    setLastRedeemChoice(null);
    setLastRedeemFile(null);
    setLastRedeemPreview(null);
    if (videoRef?.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t: any) => t.stop());
    }
    onClose();
  };

  if (!isOpen) return null;
  // Dynamic labels based on required length
  const requiredLength = selectedProduct?.programType === 'VOUCHER' ? 11 : 7;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Tambah Redeem Kuota</h2>
        
        {/* Product Type Selection */}
        {!cardData && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pilih Tipe Produk</label>
            <select
              value={selectedProductType?.id || ''}
              onChange={(e) => {
                const selected = productTypes.find(p => p.id === e.target.value);
                setSelectedProductType(selected || null);
                setSelectedProductId('');
                setPartialSerialInput('');
                setSerialNumber('');
              }}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Tipe Produk --</option>
              {productTypes.map(pt => (
                <option key={pt.id} value={pt.id}>
                  {pt.abbreviation} {pt.description ? `- ${pt.description}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

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
                  <p className="text-gray-600">{selectedProductType?.programType === 'VOUCHER' ? 'Nama Perusahaan' : 'Nama Pelanggan'}</p>
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
                {selectedProductType?.programType !== 'VOUCHER' && (
                  <>
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
                      <p className="text-red-600 font-bold">Sisa Kuota</p>
                      <p className="text-red-600 font-bold text-lg">{cardData.quotaRemaining}</p>
                    </div>
                  </>
                )}
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

            {selectedProductType?.programType === 'VOUCHER' && (
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-800">Data Penumpang</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">NIK <span className="text-xs text-gray-500">(16 digit)</span></label>
                    <input
                      type="text"
                      value={passengerNik}
                      onChange={(e) => setPassengerNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="Masukkan NIK penumpang (16 digit)"
                      className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      disabled={isLoading}
                      maxLength={16}
                    />
                    {passengerNik && (
                      <p className={`text-xs mt-1 ${
                        passengerNik.length === 16 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {passengerNik.length}/16 digit
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Penumpang</label>
                    <input
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder="Masukkan nama penumpang"
                      className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Last Redeem Options (only show when quota is 1 AND NOT VOUCHER) */}
            {cardData.quotaRemaining === 1 && selectedProductType?.programType !== 'VOUCHER' && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h4 className="font-bold text-orange-800">Ini adalah transaksi terakhir!</h4>
                </div>
                
                {!showLastRedeemOptions ? (
                  <p className="text-sm text-orange-700">
                    Klik tombol &quot;Last Redeem&quot; untuk melanjutkan dengan atau tanpa upload foto terakhir.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-orange-700 font-medium">Upload foto last redeem?</p>
                    
                    {/* Choice Options */}
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 p-3 bg-white border-2 rounded-lg cursor-pointer hover:border-orange-400 transition">
                        <input
                          type="radio"
                          name="lastRedeemChoice"
                          value="skip"
                          checked={lastRedeemChoice === 'skip'}
                          onChange={() => handleLastRedeemChoiceChange('skip')}
                          className="w-4 h-4 mt-0.5"
                        />
                        <div>
                          <p className="font-medium text-sm text-gray-800">Lanjutkan Tanpa Upload</p>
                          <p className="text-xs text-gray-600">Proses redeem langsung tanpa foto</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-white border-2 rounded-lg cursor-pointer hover:border-orange-400 transition">
                        <input
                          type="radio"
                          name="lastRedeemChoice"
                          value="upload"
                          checked={lastRedeemChoice === 'upload'}
                          onChange={() => handleLastRedeemChoiceChange('upload')}
                          className="w-4 h-4 mt-0.5"
                        />
                        <div>
                          <p className="font-medium text-sm text-gray-800">Upload Foto Sekarang</p>
                          <p className="text-xs text-gray-600">Upload foto last redeem sebelum proses</p>
                        </div>
                      </label>
                    </div>

                    {/* Upload Interface */}
                    {lastRedeemChoice === 'upload' && (
                      <div className="bg-white border rounded-lg p-3 space-y-3">
                        {!lastRedeemPreview ? (
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                              id="lastRedeemFileInput"
                            />
                            <label
                              htmlFor="lastRedeemFileInput"
                              className="block w-full px-4 py-3 bg-blue-50 text-blue-700 border-2 border-dashed border-blue-300 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition"
                            >
                              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm font-medium">Pilih File atau Drop Foto</p>
                            </label>
                            <button
                              onClick={handleCameraCapture}
                              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                            >
                              {useCamera ? '📸 Ambil Foto' : '📷 Buka Kamera'}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <img src={lastRedeemPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                            <button
                              onClick={() => {
                                setLastRedeemFile(null);
                                setLastRedeemPreview(null);
                              }}
                              className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                            >
                              🗑️ Hapus & Upload Ulang
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Redeem Type Selection (FWC only) */}
            {selectedProductType?.programType !== 'VOUCHER' && (
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
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCardData(null);
                  setShowLastRedeemOptions(false);
                  setLastRedeemChoice(null);
                  setLastRedeemFile(null);
                  setLastRedeemPreview(null);
                }}
                className="flex-1 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Scan/Input Ulang
              </button>
              
              {/* Conditional Button: Last Redeem or Redeem */}
              {/* Show "Last Redeem" button only if: quota is 1, NOT VOUCHER, and hasn't shown options yet */}
              {cardData.quotaRemaining === 1 && 
               selectedProductType?.programType !== 'VOUCHER' && 
               !showLastRedeemOptions ? (
                <button
                  onClick={handleLastRedeemClick}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  Last Redeem
                </button>
              ) : (
                <button
                  onClick={handleRedeem}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Redeem'}
                </button>
              )}
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
