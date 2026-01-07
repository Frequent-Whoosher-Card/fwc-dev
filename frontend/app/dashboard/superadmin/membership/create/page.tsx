'use client';


import SuccessModal from '../components/ui/SuccessModal';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  DollarSign,
  Calendar,
  CheckCircle,
  Search,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/apiConfig';
import { createMember, extractKTPFields } from '@/lib/services/membership.service';
import { createPurchase } from '@/lib/services/purchase.service';
import { ImageCropUpload } from '@/components/ui/image-crop-upload';

/* ======================
   BASE INPUT STYLE
====================== */
const base =
  'h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none';

/* ======================
   FIELD WRAPPER
====================== */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}

/* ======================
   DATE FIELD
====================== */
function DateField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <Calendar
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      <input
        type="date"
        name={name}
          value={value}
          onChange={onChange}
          className={`${base} pr-10`}
        required
      />
      </div>
    </Field>
  );
}

/* ======================
   SECTION CARD
====================== */
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="md:col-span-2 rounded-md border border-gray-200 p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
        {children}
      </div>
    </div>
  );
}

/* ======================
   SUCCESS MODAL
====================== */

/* ======================
   TYPES
====================== */
interface CardProduct {
  id: string;
  categoryId: string;
  typeId: string;
  price: string;
  masaBerlaku: number;
  totalQuota: number;
  category: {
    id: string;
    categoryName: string;
  };
  type: {
    id: string;
    typeName: string;
  };
}

interface Card {
  id: string;
  serialNumber: string;
  status: string;
  cardProductId: string;
}
const calculateExpiredDate = (
  purchasedDate: string,
  masaBerlaku: number
) => {
  if (!purchasedDate || !masaBerlaku) return '';

  const date = new Date(purchasedDate);
  date.setDate(date.getDate() + masaBerlaku);

  return date.toISOString().split('T')[0];
};

/* ======================
   PAGE
====================== */
interface Card {
  id: string;
  serialNumber: string;
  status: string;
  cardProductId: string;
}

export default function AddMemberPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatorName, setOperatorName] = useState('');
  const [ktpImage, setKtpImage] = useState<File | null>(null);
  const [isExtractingOCR, setIsExtractingOCR] = useState(false);

  // Card Products
  const [cardProducts, setCardProducts] = useState<CardProduct[]>([]);
  const [selectedCardProductId, setSelectedCardProductId] = useState('');
  const [selectedCardProduct, setSelectedCardProduct] = useState<CardProduct | null>(null);

  // Available Cards (IN_STATION)
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isLoadingCards, setIsLoadingCards] = useState(false);


  const [fieldError, setFieldError] = useState<{
  nik?: string;
  edcReferenceNumber?: string;
}>({});

const [checking, setChecking] = useState<{
  nik?: boolean;
  edcReferenceNumber?: boolean;
}>({});

  // Form State
  const [form, setForm] = useState({
    name: '',
    nik: '',
    nationality: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    membershipDate: '',
    expiredDate: '',
    purchasedDate: '',
    price: '',
    cardProductId: '',
    station: '',
    shiftDate: '',
    serialNumber: '',
    edcReferenceNumber: '',
    notes: '',
  });

  // Load operator name and card categories/types
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get operator name from localStorage
        const userStr = localStorage.getItem('fwc_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setOperatorName(user.fullName || user.username || '');
        }

        // Load card products
        const token = localStorage.getItem('fwc_token');
        const productsRes = await fetch(`${API_BASE_URL}/card/product`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setCardProducts(productsData.data || []);
        }

        // Set default dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        setForm((prev) => ({
          ...prev,
          membershipDate: todayStr,
          purchasedDate: todayStr,
          shiftDate: todayStr,
        }));
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Load available cards when card product is selected
  useEffect(() => {
    if (!selectedCardProductId) {
      setAvailableCards([]);
      setSelectedCard(null);
      setSelectedCardId('');
      setForm((prev) => ({ ...prev, serialNumber: '', price: '' }));
      return;
    }

    const loadAvailableCards = async () => {
      setIsLoadingCards(true);
      try {
        const token = localStorage.getItem('fwc_token');
        
        // NOTE: Endpoint GET /cards belum ada di backend
        // Endpoint yang diperlukan: GET /cards?cardProductId={id}&status=IN_STATION
        // Response format: { success: true, data: [{ id, serialNumber, status, cardProductId }] }
        
        // Untuk sementara, kita akan menggunakan workaround:
        // 1. Coba endpoint /cards jika sudah dibuat
        // 2. Jika belum, tampilkan pesan bahwa endpoint perlu dibuat
        
        const res = await fetch(
          `${API_BASE_URL}/cards?cardProductId=${selectedCardProductId}&status=IN_STATION`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          // Parse cards from response
          // Response format: { success: true, data: { items: [...], pagination: {...} } }
          if (data.success && data.data) {
            const cards = data.data.items || [];
            setAvailableCards(cards);
            console.log(`✅ Loaded ${cards.length} available cards for product ${selectedCardProductId}`);
          } else {
            setAvailableCards([]);
            console.warn('⚠️ Unexpected response format:', data);
          }
        } else {
          // Handle error responses
          const errorData = await res.json().catch(() => ({}));
          setAvailableCards([]);
          console.error(`❌ Error loading cards (${res.status}):`, errorData);
          
          if (res.status === 404) {
            console.warn('⚠️ Cards endpoint returned 404. Make sure backend is restarted and endpoint is registered.');
          } else if (res.status === 401) {
            console.error('❌ Unauthorized. Check authentication token.');
          } else if (res.status === 403) {
            console.error('❌ Forbidden. Check user permissions.');
          }
        }
      } catch (error) {
        console.error('Failed to load available cards:', error);
        setAvailableCards([]);
      } finally {
        setIsLoadingCards(false);
      }
    };

    loadAvailableCards();
  }, [selectedCardProductId]);
  useEffect(() => {
  if (!selectedCardProduct || !form.purchasedDate) return;

  setForm((prev) => ({
    ...prev,
    expiredDate: calculateExpiredDate(
      prev.purchasedDate,
      selectedCardProduct.masaBerlaku
    ),
  }));
}, [form.purchasedDate, selectedCardProduct]);


  // Handle card product selection
  const handleSelectCardProduct = (productId: string) => {
    setSelectedCardProductId(productId);
    const product = cardProducts.find((p) => p.id === productId);
    setSelectedCardProduct(product || null);
    
    // Reset card selection
    setSelectedCard(null);
    setSelectedCardId('');
    setForm((prev) => ({
  ...prev,
  serialNumber: '',
  price: product ? product.price : '',
  expiredDate: product
    ? calculateExpiredDate(
        prev.purchasedDate,
        product.masaBerlaku
      )
    : '',
}));
  }

  // Handle card selection
  const handleSelectCard = (cardId: string) => {
    const card = availableCards.find((c) => c.id === cardId);
    if (card) {
      setSelectedCardId(cardId);
      setSelectedCard(card);
      setForm((prev) => ({
        ...prev,
        serialNumber: card.serialNumber,
      }));

      // Calculate expired date if card product is selected
      if (selectedCardProduct) {
        const purchasedDate = new Date(form.purchasedDate || new Date());
        const expiredDate = new Date(purchasedDate);
        expiredDate.setDate(expiredDate.getDate() + selectedCardProduct.masaBerlaku);
        setForm((prev) => ({
          ...prev,
          expiredDate: expiredDate.toISOString().split('T')[0],
        }));
      }
    }
  };

  const onlyNumber = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
  };

  const handleKTPImageChange = async (file: File | null) => {
    setKtpImage(file);
    if (file) {
      setIsExtractingOCR(true);
      try {
        const ocrResult = await extractKTPFields(file);
        if (ocrResult.success && ocrResult.data) {
          const data = ocrResult.data;
          
          // Auto-fill form dengan data dari OCR (NIK, Nama, Jenis Kelamin, dan Alamat)
          setForm((prev) => ({
            ...prev,
            nik: data.identityNumber || prev.nik,
            name: data.name || prev.name,
            gender: data.gender === 'Laki-laki' ? 'L' : data.gender === 'Perempuan' ? 'P' : prev.gender,
            address: data.alamat || prev.address,
          }));

          toast.success('Data KTP berhasil diekstrak!');
        } else {
          toast.error('Gagal mengekstrak data KTP. Silakan isi manual.');
        }
      } catch (error: any) {
        console.error('OCR Error:', error);
        toast.error(error.message || 'Gagal mengekstrak data KTP. Silakan isi manual.');
      } finally {
        setIsExtractingOCR(false);
      }
    }
  };

  const checkUniqueField = async (
  field: 'nik' | 'edcReferenceNumber',
  value: string
) => {
  if (!value) return;

  setChecking((p) => ({ ...p, [field]: true }));

  try {
    const token = localStorage.getItem('fwc_token');

    const url =
      field === 'nik'
        ? `${API_BASE_URL}/members?identityNumber=${value}`
        : `${API_BASE_URL}/purchases?edcReferenceNumber=${value}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const data = await res.json();

    if (data.data?.items?.length > 0) {
      setFieldError((p) => ({
        ...p,
        [field]:
          field === 'nik'
            ? 'NIK sudah terdaftar'
            : 'No. Reference EDC sudah digunakan',
      }));
    } else {
      setFieldError((p) => ({ ...p, [field]: undefined }));
    }
  } catch (err) {
    console.error(err);
  } finally {
    setChecking((p) => ({ ...p, [field]: false }));
  }
};

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setShowSuccess(true); // cuma buka modal review
};

const handleConfirmSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    // 1. TOKEN
    const token = localStorage.getItem('fwc_token');
    if (!token) {
      toast.error('Session expired. Silakan login kembali.');
      return;
    }

    // 2. GET STATION
    const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) throw new Error('Gagal mengambil data user');

    const meData = await meRes.json();
    if (!meData.data?.stationId) {
      toast.error(
        'User tidak memiliki stasiun. Silakan hubungi administrator.',
        { duration: 5000 }
      );
      return;
    }
    const stationIdFromMe = meData.data.stationId;

    // 3. VALIDATION
    if (!selectedCardProductId) {
      toast.error('Card Product wajib dipilih');
      return;
    }
    if (!selectedCard) {
      toast.error('Serial Number wajib dipilih');
      return;
    }
    if (!form.edcReferenceNumber.trim()) {
      toast.error('No. Reference EDC wajib diisi');
      return;
    }

    // 4. CREATE MEMBER
    const memberRes = await createMember({
      name: form.name,
      identityNumber: form.nik,
      nationality: form.nationality || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      gender: form.gender || undefined,
      alamat: form.address || undefined,
      notes: form.notes || undefined,
    });
    if (!memberRes.success) {
      throw new Error(memberRes.error?.message || 'Gagal membuat member');
    }

    const memberId = memberRes.data.id;

    // 5. CREATE PURCHASE
    const purchaseRes = await createPurchase({
      cardId: selectedCard.id,
      memberId,
      edcReferenceNumber: form.edcReferenceNumber.trim(),
      purchasedDate: form.membershipDate,
      expiredDate: form.expiredDate,
      shiftDate: form.shiftDate,
      price: form.price ? parseFloat(form.price) : undefined,
      operatorName,
      stationId: stationIdFromMe,
    });

    if (!purchaseRes?.success) {
      throw new Error(
        purchaseRes?.message || 'Gagal membuat transaksi'
      );
    }

    router.push('/dashboard/superadmin/membership');
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || 'Gagal menyimpan data');
  } finally {
    setIsSubmitting(false);
  }
};




  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded p-1 hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Add Member</h1>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* KTP Upload dengan Crop - Full Width */}
            <div className="md:col-span-2">
              <Field label="Upload & Crop Gambar KTP (Opsional - untuk auto-fill)">
                <ImageCropUpload
                  onImageChange={handleKTPImageChange}
                  maxSize={400}
                  className="w-full"
                />
                {isExtractingOCR && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Mengekstrak data dari KTP...</span>
                  </div>
                )}
              </Field>
            </div>

            {/* Membership Name - Full Width */}
            <div className="md:col-span-2">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Membership Name"
                className={base}
                required
              />
            </div>

            {/* NIK & Nationality */}
          <div className="relative">
  <input
  name="nik"
  value={form.nik}
  onChange={(e) => {
    handleChange(e);

    // 🔥 RESET ERROR SAAT USER NGEDIT / HAPUS
    if (!e.target.value) {
      setFieldError((p) => ({ ...p, nik: undefined }));
    }
  }}
  onInput={onlyNumber}
  onBlur={() => {
    if (form.nik) {
      checkUniqueField('nik', form.nik);
    }
  }}
  placeholder="NIK"
  className={`${base} pr-32 ${
    fieldError.nik ? 'border-red-500' : ''
  }`}
  required
/>


  {/* ERROR DI DALAM FIELD */}
  {fieldError.nik && (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-600">
      {fieldError.nik}
    </span>
  )}

  {/* CHECKING */}
  {!fieldError.nik && checking.nik && (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
      Checking...
    </span>
  )}
</div>


            <input
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              placeholder="Nationality"
              className={base}
            />

            {/* Gender & Phone */}
            <div className="relative">
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={`${base} appearance-none pr-10`}
              >
                <option value="">Gender</option>
                <option value="L">Laki - Laki</option>
                <option value="P">Perempuan</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                onInput={onlyNumber}
                placeholder="Phone Number"
                className={`${base} pl-10`}
              />
            </div>

            {/* Email - Full Width */}
            <div className="relative md:col-span-2">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email Address"
                className={`${base} pl-10`}
              />
            </div>

            {/* Alamat - Full Width */}
            <div className="relative md:col-span-2">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Alamat"
                className={`${base} pl-10`}
              />
            </div>

            {/* Membership Period */}
           <SectionCard title="Membership Period">
  <Field label="Membership Date">
  <div className="relative">
    <Calendar
      size={16}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
    />
    <input
      type="date"
      name="membershipDate"
      value={form.membershipDate}
      readOnly
      className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
    />
  </div>
</Field>


  {/* Expired Date - READ ONLY (AUTO) */}
  <Field label="Expired Date">
    <div className="relative">
      <Calendar
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="date"
        name="expiredDate"
        value={form.expiredDate}
        readOnly
        className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
      />
    </div>
  </Field>
</SectionCard>


        {/* Purchase Information */}
<SectionCard title="Purchase Information">
  {/* Purchased Date - READ ONLY */}
  <Field label="Purchased Date">
    <div className="relative">
      <Calendar
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="date"
        name="purchasedDate"
        value={form.purchasedDate}
        readOnly
        className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
      />
    </div>
  </Field>

  {/* FWC Price - READ ONLY */}
  <Field label="FWC Price">
    <div className="relative">
      <DollarSign
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        name="price"
        value={form.price}
        readOnly
        placeholder="FWC Price"
        className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
        required
      />
    </div>
  </Field>
</SectionCard>


            {/* Card Information */}
            <SectionCard title="Card Information">
              <Field label="Card Product">
                <div className="relative">
                  <select
                    name="cardProductId"
                    value={selectedCardProductId}
                    onChange={(e) => handleSelectCardProduct(e.target.value)}
                    className={`${base} appearance-none pr-10`}
                    required
                  >
                    <option value="">Select Card Product</option>
                    {cardProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.category.categoryName} - {product.type.typeName}
                      </option>
                    ))}
                </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </Field>

              <Field label="Serial Number">
                <div className="relative">
                  <select
                    name="serialNumber"
                    value={selectedCardId}
                    onChange={(e) => handleSelectCard(e.target.value)}
                    className={`${base} appearance-none pr-10`}
                    disabled={!selectedCardProductId || isLoadingCards}
                    required
                  >
                    <option value="">
                      {isLoadingCards
                        ? 'Loading...'
                        : !selectedCardProductId
                        ? 'Pilih Card Product terlebih dahulu'
                        : availableCards.length === 0
                        ? 'Tidak ada kartu tersedia'
                        : 'Pilih Serial Number'}
                    </option>
                    {availableCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.serialNumber}
                      </option>
                    ))}
                </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                {selectedCardProductId && availableCards.length === 0 && !isLoadingCards && (
                  <p className="text-xs text-yellow-600 mt-1">
                    {isLoadingCards 
                      ? 'Memuat kartu...'
                      : 'Tidak ada kartu tersedia untuk product ini dengan status IN_STATION. Pastikan ada kartu yang tersedia di sistem.'}
                  </p>
                )}
              </Field>
            </SectionCard>

            {/* Operational Information */}
            <SectionCard title="Operational Information">
  <Field label="Stasiun">
    <select
      name="station"
      value={form.station}
      onChange={handleChange}
      className={base}
    >
      <option value="">Select</option>
      <option value="Halim">Halim</option>
      <option value="Karawang">Karawang</option>
      <option value="Padalarang">Padalarang</option>
      <option value="Tegalluar">Tegalluar</option>
    </select>
  </Field>

  {/* Shift Date - READ ONLY */}
  <Field label="Shift Date">
    <div className="relative">
      <Calendar
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="date"
        name="shiftDate"
        value={form.shiftDate}
        readOnly
        className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
      />
    </div>
  </Field>
</SectionCard>


            {/* No. Reference EDC - Full Width */}
    {/* No. Reference EDC - Full Width */}
<div className="relative md:col-span-2">
  <input
    name="edcReferenceNumber"
    value={form.edcReferenceNumber}
    onChange={(e) => {
      handleChange(e);

      if (!e.target.value) {
        setFieldError((p) => ({
          ...p,
          edcReferenceNumber: undefined,
        }));
      }
    }}
    onBlur={() => {
      if (form.edcReferenceNumber) {
        checkUniqueField(
          'edcReferenceNumber',
          form.edcReferenceNumber
        );
      }
    }}
    placeholder="No. Reference EDC"
    className={`${base} pr-40 ${
      fieldError.edcReferenceNumber
        ? 'border-red-500'
        : ''
    }`}
    required
  />

  {/* ERROR DI DALAM FIELD */}
  {fieldError.edcReferenceNumber && (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-600">
      {fieldError.edcReferenceNumber}
    </span>
  )}

  {/* CHECKING */}
  {!fieldError.edcReferenceNumber &&
    checking.edcReferenceNumber && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
        Checking...
      </span>
    )}
</div>


            {/* Operator Name - Full Width, Read-only */}
            <div className="md:col-span-2">
              <input
                name="operatorName"
                value={operatorName || 'Operator Name (akan diisi otomatis dari akun Anda)'}
                readOnly
                className={`${base} bg-gray-50`}
              />
            </div>

            {/* Notes - Full Width */}
            <div className="md:col-span-2">
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Notes (optional)"
                className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
           <button
  type="submit"
  disabled={
    isSubmitting ||
    checking.nik ||
    checking.edcReferenceNumber ||
    !!fieldError.nik ||
    !!fieldError.edcReferenceNumber
  }
              className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white hover:bg-[#73122E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

<SuccessModal
  open={showSuccess}
  title="Data Member"
  message="Please review the member data before continuing"
  data={{
    'Membership Name': form.name,
    'Membership Date': form.membershipDate,
    'Expired Date': form.expiredDate,
    Nationality: form.nationality || 'Indonesia',
    'Identity Number': form.nik,
    Address: form.address,
    'Phone Number': form.phone,
    'Email Address': form.email,
    'Card Category': selectedCardProduct?.category.categoryName,
    'Card Type': selectedCardProduct?.type.typeName,
    'Purchased Date': form.purchasedDate,
    'Total Quota (Trips)': selectedCardProduct?.totalQuota,
  }}
  onClose={() => setShowSuccess(false)}
  onConfirm={handleConfirmSubmit}

/>


    </>
  );
}