"use client";

import Select from "react-select";
import { countries } from "countries-list";
import { useMemo } from "react";

import SuccessModal from "../components/ui/SuccessModal";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
import { createMember } from '@/lib/services/membership.service';
import { createPurchase } from '@/lib/services/purchase.service';
import { KTPUploadDetect } from '@/components/ui/ktp-upload-detect';

/* ======================
   BASE INPUT STYLE
====================== */
const base =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

/* ======================
   FIELD WRAPPER
====================== */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
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
const calculateExpiredDate = (purchasedDate: string, masaBerlaku: number) => {
  if (!purchasedDate || !masaBerlaku) return "";

  const date = new Date(purchasedDate);
  date.setDate(date.getDate() + masaBerlaku);

  return date.toISOString().split("T")[0];
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

const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


export default function AddMemberPage() {
  const router = useRouter();
  const nippKaiRef = useRef<HTMLInputElement>(null);
  const lastCheckRef = useRef<{
    nik?: string;
    edcReferenceNumber?: string;
  }>({});

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatorName, setOperatorName] = useState("");
  const [ktpImage, setKtpImage] = useState<File | null>(null);
  const [isExtractingOCR, setIsExtractingOCR] = useState(false);
  const [ktpSessionId, setKtpSessionId] = useState<string>('');
  const countryOptions = useMemo(() => {
    return Object.entries(countries).map(([code, c]) => ({
      value: code,
      label: `${c.name} (+${Array.isArray(c.phone) ? c.phone[0] : c.phone})`,
      phone: Array.isArray(c.phone) ? c.phone[0] : c.phone, // ✅ STRING ONLY
    }));
  }, []);

  // ======================
  // LOCAL DATE HELPER (ANTI UTC BUG)
  // ======================
  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`; // YYYY-MM-DD
  };

  // Card Products
  const [cardProducts, setCardProducts] = useState<CardProduct[]>([]);
  const [selectedCardProductId, setSelectedCardProductId] = useState("");
  const [selectedCardProduct, setSelectedCardProduct] =
    useState<CardProduct | null>(null);

  // ✅ Flag: apakah Card Product KAI
  const isKAIProduct = selectedCardProduct?.category?.categoryName === "KAI";

  // Available Cards (IN_STATION)
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
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
    name: "",
    nik: "",
    nippKai: "",
    nationality: "",
    phone: "",
    gender: "",
    email: "",
    address: "",
    membershipDate: "",
    expiredDate: "",
    purchasedDate: "",
    price: "",
    cardProductId: "",
    station: "",
    shiftDate: "",
    serialNumber: "",
    edcReferenceNumber: "",
  });

  // ======================
  // PHONE HELPER (WAJIB DI SINI)
  // ======================
  const getFullPhoneNumber = () => {

    
    if (!form.nationality || !form.phone) return "";

    const country = countryOptions.find((c) => c.value === form.nationality);

    if (!country?.phone) return "";

    // buang 0 di depan (contoh: 0812 → 812)
    const local = form.phone.replace(/^0+/, "");

    return `+${country.phone}${local}`;
  };
  

  // Load operator name and card categories/types
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get operator name from localStorage
        const userStr = localStorage.getItem("fwc_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setOperatorName(user.fullName || user.username || "");
        }

        // Load card products
        // Load card products
        const token = localStorage.getItem("fwc_token");
        const productsRes = await fetch(`${API_BASE_URL}/card/product`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (productsRes.ok) {
          const productsData = await productsRes.json();

          const sortedProducts = (productsData.data || []).sort(
            (a: CardProduct, b: CardProduct) => {
              const nameA = `${a.category.categoryName} - ${a.type.typeName}`;
              const nameB = `${b.category.categoryName} - ${b.type.typeName}`;
              return nameA.localeCompare(nameB);
            }
          );

          setCardProducts(sortedProducts);
        }

        /* ======================
   ✅ SET DEFAULT DATE (WAJIB)
====================== */
        const todayStr = getTodayLocalDate();

        setForm((prev) => ({
          ...prev,
          membershipDate: todayStr,
          purchasedDate: todayStr,
          shiftDate: todayStr,
        }));
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };

    loadInitialData();
  }, []);


  
  // Load available cards when card product is selected
  useEffect(() => {
    if (!selectedCardProductId) {
      setAvailableCards([]);
      setSelectedCard(null);
      setSelectedCardId("");
      setForm((prev) => ({ ...prev, serialNumber: "", price: "" }));
      return;
    }

    const loadAvailableCards = async () => {
      setIsLoadingCards(true);
      try {
        const token = localStorage.getItem("fwc_token");

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
              "Content-Type": "application/json",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          // Parse cards from response
          // Response format: { success: true, data: { items: [...], pagination: {...} } }
          if (data.success && data.data) {
            const cards = data.data.items || [];

            const sortedCards = cards
              .filter((c) => c.serialNumber)
              .sort((a: Card, b: Card) =>
                a.serialNumber.localeCompare(b.serialNumber)
              );

            setAvailableCards(sortedCards);

            console.log(
              `✅ Loaded ${sortedCards.length} available cards for product ${selectedCardProductId}`
            );
          } else {
            setAvailableCards([]);
            console.warn("⚠️ Unexpected response format:", data);
          }
        } else {
          // Handle error responses
          const errorData = await res.json().catch(() => ({}));
          setAvailableCards([]);
          console.error(`❌ Error loading cards (${res.status}):`, errorData);

          if (res.status === 404) {
            console.warn(
              "⚠️ Cards endpoint returned 404. Make sure backend is restarted and endpoint is registered."
            );
          } else if (res.status === 401) {
            console.error("❌ Unauthorized. Check authentication token.");
          } else if (res.status === 403) {
            console.error("❌ Forbidden. Check user permissions.");
          }
        }
      } catch (error) {
        console.error("Failed to load available cards:", error);
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
    setSelectedCardId("");
    setForm((prev) => ({
      ...prev,
      serialNumber: "",
      price: product ? product.price : "",
      expiredDate: product
        ? calculateExpiredDate(prev.purchasedDate, product.masaBerlaku)
        : "",
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
        expiredDate.setDate(
          expiredDate.getDate() + selectedCardProduct.masaBerlaku
        );
        setForm((prev) => ({
          ...prev,
          expiredDate: expiredDate.toISOString().split("T")[0],
        }));
      }
    }
  };

  const onlyNumber = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
  };

  const handleKTPImageChange = (file: File | null) => {
    setKtpImage(file);
  };

  const handleKTPDetectionComplete = (sessionId: string, croppedImageBase64: string) => {
    setKtpSessionId(sessionId);
    // Detection sudah selesai, user bisa klik "Ekstrak Data KTP" untuk OCR
  };

  const handleExtractOCR = async (sessionId: string) => {
    setIsExtractingOCR(true);
    try {
      const token = localStorage.getItem('fwc_token');
      if (!token) {
        throw new Error('Session expired. Silakan login kembali.');
      }

      const formData = new FormData();
      formData.append('session_id', sessionId);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
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

      if (result.data) {
        const data = result.data;
        
        // Auto-fill form dengan data dari OCR (NIK, Nama, Jenis Kelamin, dan Alamat)
        setForm((prev) => ({
          ...prev,
          nik: data.identityNumber || prev.nik,
          name: data.name || prev.name,
          gender: data.gender === 'Laki-laki' || data.gender === 'L' ? 'L' : data.gender === 'Perempuan' || data.gender === 'P' ? 'P' : prev.gender,
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
  };

  const checkUniqueField = async (
    field: "nik" | "edcReferenceNumber",
    value: string
  ) => {
    if (!value) return;

    // 🔐 tandai request terakhir
    lastCheckRef.current[field] = value;
    setChecking((p) => ({ ...p, [field]: true }));

    try {
      const token = localStorage.getItem("fwc_token");

      const url =
        field === "nik"
          ? `${API_BASE_URL}/members?identityNumber=${value}`
          : `${API_BASE_URL}/purchases?edcReferenceNumber=${value}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();

      // ❌ response lama → buang
      if (lastCheckRef.current[field] !== value) return;

      const items = data.data?.items || [];

      const isExactMatch = items.some((item: any) => {
        if (field === "nik") {
          return item.identityNumber === value;
        }
        if (field === "edcReferenceNumber") {
          return item.edcReferenceNumber === value;
        }
        return false;
      });

      if (isExactMatch) {
        setFieldError((p) => ({
          ...p,
          [field]:
            field === "nik"
              ? "NIK sudah terdaftar"
              : "No. Reference EDC sudah digunakan",
        }));
      } else {
        setFieldError((p) => ({
          ...p,
          [field]: undefined,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (lastCheckRef.current[field] === value) {
        setChecking((p) => ({ ...p, [field]: false }));
      }
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

    if (!form.name.trim()) {
      toast.error("Membership Name wajib diisi");
      return;
    }

    if (!form.nik.trim()) {
      toast.error("NIK wajib diisi");
      return;
    }

    if (!selectedCardProductId) {
      toast.error("Card Product wajib dipilih");
      return;
    }

    if (!selectedCard) {
      toast.error("Serial Number wajib dipilih");
      return;
    }

    if (isKAIProduct && !form.nippKai.trim()) {
      toast.error("Isi NIP / NIPP KAI untuk melanjutkan", {
        icon: "⚠️",
      });

      nippKaiRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      nippKaiRef.current?.focus();

      return;
    }

    if (form.nik.length < 6 || form.nik.length > 20) {
      toast.error("Identity Number harus 6–20 digit");
      return;
    }

    if (!form.nationality.trim()) {
      toast.error("Nationality wajib diisi");
      return;
    }

    if (!form.gender) {
      toast.error("Gender wajib dipilih");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Phone Number wajib diisi");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email Address wajib diisi");
      return;
    }

    if (!form.address.trim()) {
      toast.error("Alamat wajib diisi");
      return;
    }

    if (!selectedCardProductId) {
      toast.error("Card Product wajib dipilih");
      return;
    }

    if (!selectedCard) {
      toast.error("Serial Number wajib dipilih");
      return;
    }

    if (!form.membershipDate) {
      toast.error("Membership Date tidak valid");
      return;
    }

    if (!form.expiredDate) {
      toast.error("Expired Date belum terisi");
      return;
    }

    if (!form.purchasedDate) {
      toast.error("Purchased Date tidak valid");
      return;
    }

    if (!form.price) {
      toast.error("FWC Price belum terisi");
      return;
    }

    if (!form.station) {
      toast.error("Stasiun wajib dipilih");
      return;
    }

    if (!form.shiftDate) {
      toast.error("Shift Date tidak valid");
      return;
    }

    if (!form.edcReferenceNumber.trim()) {
      toast.error("No. Reference EDC wajib diisi");
      return;
    }

    // ✅ LULUS SEMUA VALIDASI
    setShowSuccess(true);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. TOKEN
      const token = localStorage.getItem("fwc_token");
      if (!token) {
        toast.error("Session expired. Silakan login kembali.");
        return;
      }

      // 2. GET STATION
      const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) throw new Error("Gagal mengambil data user");

      const meData = await meRes.json();
      if (!meData.data?.stationId) {
        toast.error(
          "User tidak memiliki stasiun. Silakan hubungi administrator.",
          { duration: 5000 }
        );
        return;
      }
      const stationIdFromMe = meData.data.stationId;

      // 3. VALIDATION
      if (!selectedCardProductId) {
        toast.error("Card Product wajib dipilih");
        return;
      }
      if (!selectedCard) {
        toast.error("Serial Number wajib dipilih");
        return;
      }
      if (!form.edcReferenceNumber.trim()) {
        toast.error("No. Reference EDC wajib diisi");
        return;
      }

      // 4. CREATE MEMBER
      const memberPayload: any = {
        name: form.name,
        identityNumber: form.nik,
        nationality: form.nationality || undefined,
        email: form.email || undefined,
        phone: getFullPhoneNumber() || undefined, // ✅ FIX DI SINI
        gender: form.gender || undefined,
        alamat: form.address || undefined,
      };

      // ✅ HANYA KIRIM nippKai JIKA ADA ISINYA
      if (form.nippKai && form.nippKai.trim()) {
        memberPayload.nippKai = form.nippKai;
      }

      const memberRes = await createMember(memberPayload);

      if (!memberRes.success) {
        throw new Error(memberRes.error?.message || "Gagal membuat member");
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
        throw new Error(purchaseRes?.message || "Gagal membuat transaksi");
      }

      router.push("/dashboard/superadmin/membership");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menyimpan data");
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
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-white p-6"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* KTP Upload dengan Auto Detection - Full Width */}
            <div className="md:col-span-2">
              <Field label="Upload Gambar KTP (Opsional - untuk auto-fill)">
                <KTPUploadDetect
                  onImageChange={handleKTPImageChange}
                  onDetectionComplete={handleKTPDetectionComplete}
                  onExtractOCR={handleExtractOCR}
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
              <Field label="Membership Name" required>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama member"
                  className={base}
                  required
                />
              </Field>
            </div>

            {/* NIK & Nationality */}
            <Field label="NIK" required>
              <div className="relative">
                <input
                  name="nik"
                  value={form.nik}
                  onChange={(e) => {
                    const value = e.target.value;

                    setForm((prev) => ({ ...prev, nik: value }));

                    if (value.length > 0 && value.length > 20) {
                      setFieldError((p) => ({
                        ...p,
                        nik: "Identity Number maksimal 20 digit",
                      }));
                    } else {
                      setFieldError((p) => ({ ...p, nik: undefined }));
                    }
                  }}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value
                      .replace(/\D/g, "")
                      .slice(0, 20);
                  }}
                  onBlur={() => {
                    if (form.nik.length >= 6) {
                      checkUniqueField("nik", form.nik);
                    }
                  }}
                  placeholder="Identity Number (max 20 digit)"
                  className={`${base} pr-32 ${
                    fieldError.nik ? "border-red-500" : ""
                  }`}
                  required
                />

                {/* ERROR */}
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
            </Field>

            <Field label="NIP / NIPP KAI" required={isKAIProduct}>
              <input
                ref={nippKaiRef}
                name="nippKai"
                value={form.nippKai}
                onChange={handleChange}
                onInput={onlyNumber}
                placeholder="Nomor Induk Pegawai (KAI)"
                className={base}
              />

              <p className="text-[11px] text-gray-400">
                Diisi jika member merupakan pegawai KAI
              </p>
            </Field>

            <Field label="Nationality" required>
              <Select
                options={countryOptions}
                placeholder="Pilih negara"
                value={countryOptions.find((c) => c.value === form.nationality)}
                onChange={(option) => {
                  if (!option) return;

                  setForm((prev) => ({
                    ...prev,
                    nationality: option.value,
                    phone: "", // ✅ RESET NOMOR LOKAL
                  }));
                }}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "40px",
                    height: "40px",
                    fontSize: "14px",
                    borderColor: "#d1d5db",
                    boxShadow: "none",
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "0 12px",
                  }),
                  input: (base) => ({
                    ...base,
                    margin: 0,
                    padding: 0,
                  }),
                  indicatorsContainer: (base) => ({
                    ...base,
                    height: "40px",
                  }),
                }}
              />
            </Field>

            {/* Gender & Phone */}
            <Field label="Gender" required>
              <div className="relative">
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className={`${base} appearance-none pr-10`}
                  required
                >
                  <option value="">Pilih gender</option>
                  <option value="L">Laki - Laki</option>
                  <option value="P">Perempuan</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </Field>

            <Field label="Phone Number" required>
              <div className="flex">
                {/* PREFIX */}
                <div className="flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-3 text-sm text-gray-600 min-w-[60px] justify-center">
                  {form.nationality
                    ? `+${
                        countryOptions.find((c) => c.value === form.nationality)
                          ?.phone
                      }`
                    : "+"}
                </div>

                {/* DIVIDER */}
                <div className="flex items-center border-y border-gray-300 bg-gray-100 px-2 text-gray-400">
                  |
                </div>

                {/* LOCAL NUMBER */}
                <input
                  value={form.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setForm((prev) => ({ ...prev, phone: val }));
                  }}
                  placeholder="Masukkan nomor telepon"
                  className="h-10 w-full rounded-r-md border border-l-0 border-gray-300 px-3 text-sm focus:outline-none focus:border-gray-400"
                  disabled={!form.nationality}
                  required
                />
              </div>
            </Field>

            {/* Email - Full Width */}
            <Field label="Email Address" required>
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
                  placeholder="Masukkan alamat email"
                  className={`${base} pl-10`}
                  required
                />
              </div>
            </Field>

            {/* Alamat - Full Width */}
            <Field label="Alamat" required>
              <div className="relative md:col-span-2">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap"
                  className={`${base} pl-10`}
                  required
                />
              </div>
            </Field>

            {/* Card Information */}
            <SectionCard title="Card Information">
              <Field label="Card Product" required>
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
                        {product.category.categoryName} -{" "}
                        {product.type.typeName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </Field>

              <Field label="Serial Number" required>
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
                        ? "Loading..."
                        : !selectedCardProductId
                        ? "Pilih Card Product terlebih dahulu"
                        : availableCards.length === 0
                        ? "Tidak ada kartu tersedia"
                        : "Pilih Serial Number"}
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

                {selectedCardProductId &&
                  availableCards.length === 0 &&
                  !isLoadingCards && (
                    <p className="text-xs text-yellow-600 mt-1">
                      {isLoadingCards
                        ? "Memuat kartu..."
                        : "Tidak ada kartu tersedia untuk product ini dengan status IN_STATION. Pastikan ada kartu yang tersedia di sistem."}
                    </p>
                  )}
              </Field>
            </SectionCard>

            {/* Membership Period */}
            <SectionCard title="Membership Period">
              <Field label="Membership Date" required>
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

              <Field label="Expired Date" required>
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
              <Field label="Purchased Date" required>
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
              <Field label="FWC Price" required>
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

            {/* Operational Information */}
            <SectionCard title="Operational Information">
              {/* Stasiun */}
              <Field label="Stasiun" required>
                <select
                  name="station"
                  value={form.station}
                  onChange={handleChange}
                  className={base}
                  required
                >
                  <option value="">Select</option>
                  <option value="Halim">Halim</option>
                  <option value="Karawang">Karawang</option>
                  <option value="Padalarang">Padalarang</option>
                  <option value="Tegalluar">Tegalluar</option>
                </select>
              </Field>

              {/* Shift Date - READ ONLY */}
              <Field label="Shift Date" required>
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
            <Field label="No. Reference EDC" required>
              <div className="relative md:col-span-2">
                <input
                  name="edcReferenceNumber"
                  value={form.edcReferenceNumber}
                  onChange={(e) => {
                    handleChange(e);
                    setFieldError((p) => ({
                      ...p,
                      edcReferenceNumber: undefined,
                    }));
                  }}
                  onInput={onlyNumber}
                  onBlur={() => {
                    // ✅ cek hanya kalau panjang masuk akal
                    if (form.edcReferenceNumber.length >= 6) {
                      checkUniqueField(
                        "edcReferenceNumber",
                        form.edcReferenceNumber
                      );
                    }
                  }}
                  placeholder="No. Reference EDC"
                  className={`${base} pr-40 ${
                    fieldError.edcReferenceNumber ? "border-red-500" : ""
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
            </Field>

            {/* Operator Name - Full Width, Read-only */}
            <div className="md:col-span-2">
              <input
                name="operatorName"
                value={
                  operatorName ||
                  "Operator Name (akan diisi otomatis dari akun Anda)"
                }
                readOnly
                className={`${base} bg-gray-50`}
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
              {isSubmitting ? "Menyimpan..." : "Save"}
            </button>
          </div>
        </form>
      </div>

      <SuccessModal
        open={showSuccess}
        title="Data Member"
        message="Please review the member data before continuing"
        data={{
          // MEMBER
          "Membership Name": form.name,
          "Identity Number": form.nik,
          "NIP / NIPP KAI": form.nippKai || "-",
          Nationality: form.nationality || "Indonesia",
          Gender:
            form.gender === "L"
              ? "Laki - Laki"
              : form.gender === "P"
              ? "Perempuan"
              : "-",
          "Phone Number": getFullPhoneNumber(),
          "Email Address": form.email,
          Address: form.address,

          // CARD
          "Card Category": selectedCardProduct?.category.categoryName,
          "Card Type": selectedCardProduct?.type.typeName,
          "Serial Number": selectedCard?.serialNumber,

          // MEMBERSHIP
          "Membership Date": form.membershipDate,
          "Expired Date": form.expiredDate,

          // PURCHASE
          "Purchased Date": form.purchasedDate,
          "FWC Price": form.price,
          "Total Quota (Trips)": selectedCardProduct?.totalQuota,

          // OPERATIONAL
          Stasiun: form.station,
          "Shift Date": form.shiftDate,

          // TRANSACTION
          "No. Reference EDC": form.edcReferenceNumber,
        }}
        onClose={() => setShowSuccess(false)}
        onConfirm={handleConfirmSubmit}
      />
    </>
  );
}
