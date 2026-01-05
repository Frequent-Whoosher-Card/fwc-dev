'use client';


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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/apiConfig';
import { createMember } from '@/lib/services/membership.service';
import { createPurchase } from '@/lib/services/purchase.service';

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
function SuccessModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[380px] rounded-xl bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={28} className="text-green-600" />
        </div>
        <h2 className="text-lg font-semibold">Data Saved</h2>
        <p className="mt-2 text-sm text-gray-600">
          Member dan transaksi berhasil disimpan
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-[#8B1538] py-2 text-sm font-medium text-white hover:bg-[#73122E]"
        >
          OK
        </button>
      </div>
    </div>
  );
}

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


/* ======================
   PAGE
====================== */

const CARD_RULES = {
  JaBan: {
    Gold: { price: 2000000, days: 60 },
    Silver: { price: 1350000, days: 30 },
    KAI: { price: 500000, days: 30 }, // ✅ KAI INTERNAL
  },
  JaKa: {
    Gold: { price: 500000, days: 60 },
    Silver: { price: 450000, days: 30 },
    KAI: { price: 200000, days: 30 }, // ✅ KAI INTERNAL
  },
  KaBan: {
    Gold: { price: 1000000, days: 60 },
    Silver: { price: 750000, days: 30 },
    KAI: { price: 300000, days: 30 }, // ✅ KAI INTERNAL
  },
};


export default function AddMemberPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatorName, setOperatorName] = useState('');

  // Card Products
  const [cardProducts, setCardProducts] = useState<CardProduct[]>([]);
  const [selectedCardProductId, setSelectedCardProductId] = useState('');
  const [selectedCardProduct, setSelectedCardProduct] = useState<CardProduct | null>(null);

  // Available Cards (IN_STATION)
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

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
      price: product ? parseFloat(product.price).toString() : '',
    }));
  };

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user has stationId (required for purchase)
      const token = localStorage.getItem('fwc_token');
      if (!token) {
        toast.error('Session expired. Silakan login kembali.');
        setIsSubmitting(false);
        return;
      }

      try {
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (meRes.ok) {
          const meData = await meRes.json();
          if (!meData.data?.stationId) {
            toast.error(
              'User tidak memiliki stasiun. Silakan hubungi administrator untuk menetapkan stasiun.',
              { duration: 5000 }
            );
            setIsSubmitting(false);
            return;
          }
        }
      } catch (meError) {
        console.warn('Could not verify user station:', meError);
        // Continue anyway, backend will validate
      }

      // Validation
      if (!selectedCardProductId) {
        toast.error('Card Product wajib dipilih');
        setIsSubmitting(false);
        return;
      }

      if (!selectedCardId || !form.serialNumber.trim()) {
        toast.error('Serial Number wajib dipilih');
        setIsSubmitting(false);
        return;
      }

      if (!form.edcReferenceNumber.trim()) {
        toast.error('No. Reference EDC wajib diisi');
        setIsSubmitting(false);
        return;
      }

      // 1. Create Member
      const memberPayload = {
        name: form.name,
        identityNumber: form.nik,
        nationality: form.nationality || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        alamat: form.address || undefined,
        notes: form.notes || undefined,
      };

      const memberRes = await createMember(memberPayload);
      if (!memberRes.success) {
        throw new Error(memberRes.error?.message || 'Gagal membuat member');
      }

      const memberId = memberRes.data.id;

      // 2. Use selected card ID
      if (!selectedCardId || !selectedCard) {
        throw new Error('Card tidak dipilih. Pastikan memilih serial number dari dropdown.');
      }

      const cardId = selectedCard.id;

      // 2. Create Purchase
      const purchasePayload: any = {
        cardId: cardId,
        memberId: memberId,
        edcReferenceNumber: form.edcReferenceNumber.trim(),
      };

      // Only include optional fields if they have values
      if (form.price && form.price.trim()) {
        purchasePayload.price = parseFloat(form.price);
      }
      if (form.notes && form.notes.trim()) {
        purchasePayload.notes = form.notes.trim();
      }

      console.log('Creating purchase with payload:', purchasePayload);
      const purchaseRes = await createPurchase(purchasePayload);
      console.log('Purchase response:', purchaseRes);
      
      // apiFetch throws error if !res.ok, so if we reach here, it's successful
      if (!purchaseRes || !purchaseRes.success) {
        throw new Error(purchaseRes?.error?.message || purchaseRes?.message || 'Gagal membuat transaksi');
      }

      toast.success('Member dan transaksi berhasil disimpan');
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Submit error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        error: error,
      });
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
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
            <input
              name="nik"
              value={form.nik}
              onChange={handleChange}
              onInput={onlyNumber}
              placeholder="NIK"
              className={base}
              required
            />

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
              <DateField
                name="membershipDate"
                label="Membership Date"
                value={form.membershipDate}
                onChange={handleChange}
              />
              <DateField
                name="expiredDate"
                label="Expired Date"
                value={form.expiredDate}
                onChange={handleChange}
              />
            </SectionCard>

            {/* Purchase Information */}
            <SectionCard title="Purchase Information">
              <DateField
                name="purchasedDate"
                label="Purchased Date"
                value={form.purchasedDate}
                onChange={handleChange}
              />
              <Field label="FWC Price">
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    onInput={onlyNumber}
                    placeholder="FWC Price"
                    className={`${base} pr-10`}
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

              <DateField
                name="shiftDate"
                label="Shift Date"
                value={form.shiftDate}
                onChange={handleChange}
              />
            </SectionCard>


            {/* No. Reference EDC - Full Width */}
            <div className="md:col-span-2">
              <input
                name="edcReferenceNumber"
                value={form.edcReferenceNumber}
                onChange={handleChange}
                placeholder="No. Reference EDC"
                className={base}
                required
              />
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
              disabled={isSubmitting}
              className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white hover:bg-[#73122E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* SUCCESS MODAL */}
      <SuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.push('/dashboard/superadmin/membership');
        }}
      />
    </>
  );
}
