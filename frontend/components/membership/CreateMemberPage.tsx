"use client";

import Select from "react-select";
import { countries } from "countries-list";
import { useMemo, Fragment } from "react";

import SuccessModal from "@/app/dashboard/superadmin/membership/components/ui/SuccessModal";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/apiConfig";
import { createMember } from "@/lib/services/membership.service";
import { createPurchase, createVoucherPurchase } from "@/lib/services/purchase.service";
import { KTPUploadDetect } from "@/components/ui/ktp-upload-detect";
import { useCardSelection } from "@/hooks/useCardSelection";
import { useCategories } from "@/hooks/useCategories";
import { useCategoriesVoucher } from "@/hooks/useCategoriesVoucher";
import { useTypesVoucher } from "@/hooks/useTypesVoucher";
import { useVoucherBulkPurchaseForm } from "@/hooks/useVoucherBulkPurchaseForm";
import { cardVoucherService } from "@/lib/services/card.voucher.service";
import axios from "@/lib/axios";
import {
  getEmployeeTypes,
  EmployeeType,
} from "@/lib/services/employee-type.service";
import { Plus, X } from "lucide-react";

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

interface CreateMemberPageProps {
  /** FWC atau VOUCHER, dari tab yang dipilih di halaman transaksi (query ?programType=) */
  programType?: "FWC" | "VOUCHER";
}

export default function AddMemberPage({ programType: programTypeProp }: CreateMemberPageProps = {}) {
  const router = useRouter();
  const programType: "FWC" | "VOUCHER" = programTypeProp ?? "FWC";

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
  const [ktpSessionId, setKtpSessionId] = useState<string>("");

  // Input mode state
  const [inputMode, setInputMode] = useState<"" | "manual" | "recommendation" | "range">(
    "",
  );

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

  // Card Selection Hook (FWC)
  const { categories, loading: loadingCategories } = useCategories();
  const {
    cardCategory,
    categoryId,
    cardTypes,
    cardTypeId,
    cards,
    cardId,
    price,
    serialNumber,
    setSerialNumber,
    searchResults,
    isSearching,
    loadingTypes,
    loadingCards,
    handleCategoryChange,
    handleTypeChange,
    handleCardChange,
    handleCardSearch,
    handleCardSelect,
  } = useCardSelection();

  // Voucher hooks
  const { data: voucherCategories, loading: loadingVoucherCategories } = useCategoriesVoucher();
  const { data: voucherTypes, loading: loadingVoucherTypes } = useTypesVoucher();
  const {
    form: voucherForm,
    isSubmitting: isSubmittingVoucher,
    selectedCards,
    addCard: addVoucherCard,
    addCards: addVoucherCards,
    removeCard: removeVoucherCard,
    bulkDiscounts,
    selectedBulkDiscountId,
    handleBulkDiscountChange,
    totalPrice: voucherTotalPrice,
    discountAmount: voucherDiscountAmount,
  } = useVoucherBulkPurchaseForm();

  // Voucher-specific state
  const [selectedVoucherCategoryId, setSelectedVoucherCategoryId] = useState<string>("");
  const [selectedVoucherTypeId, setSelectedVoucherTypeId] = useState<string>("");
  const [voucherProducts, setVoucherProducts] = useState<any[]>([]);
  const [voucherCards, setVoucherCards] = useState<any[]>([]);
  const [selectedVoucherCardId, setSelectedVoucherCardId] = useState<string>("");
  const [voucherCardPrice, setVoucherCardPrice] = useState<number>(0);
  const [voucherCardSerialNumber, setVoucherCardSerialNumber] = useState<string>("");
  const [voucherCardSearchResults, setVoucherCardSearchResults] = useState<any[]>([]);
  const [isSearchingVoucherCards, setIsSearchingVoucherCards] = useState(false);
  const [loadingVoucherCards, setLoadingVoucherCards] = useState(false);
  
  // Range input state
  const [rangeStartSerial, setRangeStartSerial] = useState<string>("");
  const [rangeQuantity, setRangeQuantity] = useState<string>("");
  const [isAddingRange, setIsAddingRange] = useState(false);
  const [rangeSearchResults, setRangeSearchResults] = useState<any[]>([]);
  const [isSearchingRange, setIsSearchingRange] = useState(false);
  const [selectedRangeCardId, setSelectedRangeCardId] = useState<string>("");

  // Card Products (old - will be removed)
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

  // Employee Types
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [loadingEmployeeTypes, setLoadingEmployeeTypes] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    nik: "",
    nippKai: "",
    employeeTypeId: "",
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
        const token = localStorage.getItem("fwc_token");

        // Get operator name from localStorage
        const userStr = localStorage.getItem("fwc_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log("[DEBUG] User data:", user);
          setOperatorName(user.fullName || user.username || "");

          // Auto-fetch and set station name from user's stationId
          if (user.stationId) {
            console.log("[DEBUG] Fetching station ID:", user.stationId);
            try {
              const stationRes = await fetch(
                `${API_BASE_URL}/station/${user.stationId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              // Load employee types
              setLoadingEmployeeTypes(true);
              try {
                const employeeTypesRes = await getEmployeeTypes();
                setEmployeeTypes(employeeTypesRes.data || []);
              } catch (error) {
                console.error("Failed to load employee types:", error);
                toast.error("Gagal memuat tipe pegawai");
              } finally {
                setLoadingEmployeeTypes(false);
              }

              console.log(
                "[DEBUG] Station response status:",
                stationRes.status,
              );

              if (stationRes.ok) {
                const stationData = await stationRes.json();
                console.log("[DEBUG] Station data:", stationData);
                const stationName = stationData.data?.stationName || "";
                console.log("[DEBUG] Setting station name:", stationName);

                setForm((prev) => ({
                  ...prev,
                  station: stationName,
                }));
              } else {
                console.error(
                  "[DEBUG] Station fetch failed:",
                  await stationRes.text(),
                );
              }
            } catch (error) {
              console.error("Failed to load station data:", error);
            }
          } else {
            console.warn("[DEBUG] User has no stationId");
          }
        }

        // Load card products
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
            },
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

  // Auto-calculate expired date when cardTypeId or purchasedDate changes
  useEffect(() => {
    if (!cardTypeId || !form.membershipDate) return;

    // Find the selected card product based on categoryId and typeId
    const selectedProduct = cardProducts.find(
      (p) => p.typeId === cardTypeId && p.categoryId === categoryId,
    );

    if (selectedProduct && selectedProduct.masaBerlaku) {
      const expDate = calculateExpiredDate(
        form.membershipDate,
        selectedProduct.masaBerlaku,
      );
      setForm((prev) => ({
        ...prev,
        expiredDate: expDate,
      }));
    }
  }, [cardTypeId, categoryId, form.membershipDate, cardProducts]);

  // Auto-calculate expired date for VOUCHER when voucher type and membership date are set
  useEffect(() => {
    if (programType !== "VOUCHER" || !selectedVoucherTypeId || !form.membershipDate) return;

    const matchedProduct = voucherProducts.find(
      (p: any) => p.type?.id === selectedVoucherTypeId
    );

    if (matchedProduct && matchedProduct.masaBerlaku) {
      const expDate = calculateExpiredDate(
        form.membershipDate,
        Number(matchedProduct.masaBerlaku),
      );
      setForm((prev) => ({
        ...prev,
        expiredDate: expDate,
      }));
    }
  }, [programType, selectedVoucherTypeId, form.membershipDate, voucherProducts]);

  // Auto-fill range start serial when switching to range mode and type is already selected
  useEffect(() => {
    if (programType === "VOUCHER" && inputMode === "range" && selectedVoucherTypeId && selectedVoucherCategoryId && voucherProducts.length > 0) {
      const matchedProduct = voucherProducts.find(
        (p: any) => p.type?.id === selectedVoucherTypeId
      );
      if (matchedProduct && matchedProduct.serialTemplate) {
        const serialTemplate = matchedProduct.serialTemplate;
        setRangeStartSerial(serialTemplate);
        // Trigger search to show dropdown if serial template is long enough
        if (serialTemplate.length >= 6) {
          setTimeout(() => {
            handleRangeSerialSearch(serialTemplate);
          }, 100);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programType, inputMode, selectedVoucherTypeId, selectedVoucherCategoryId, voucherProducts]);

  // DEPRECATED: Old useEffect and handlers (kept for reference, will be removed)
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
          },
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
                a.serialNumber.localeCompare(b.serialNumber),
              );

            setAvailableCards(sortedCards);

            console.log(
              `✅ Loaded ${sortedCards.length} available cards for product ${selectedCardProductId}`,
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
              "⚠️ Cards endpoint returned 404. Make sure backend is restarted and endpoint is registered.",
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
        selectedCardProduct.masaBerlaku,
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
          expiredDate.getDate() + selectedCardProduct.masaBerlaku,
        );
        setForm((prev) => ({
          ...prev,
          expiredDate: expiredDate.toISOString().split("T")[0],
        }));
      }
    }
  };

  // Voucher-specific handlers
  const handleVoucherCategoryChange = async (categoryId: string) => {
    try {
      setSelectedVoucherCategoryId(categoryId);
      setSelectedVoucherTypeId("");
      setSelectedVoucherCardId("");
      setVoucherCards([]);
      setVoucherCardPrice(0);
      setVoucherCardSerialNumber("");
      setVoucherCardSearchResults([]);
      setRangeStartSerial("");

      if (!categoryId) {
        setVoucherProducts([]);
        return;
      }

      // Load voucher products for this category
      const products = await cardVoucherService.getProducts();
      const filteredProducts = products.filter(
        (p: any) => p.categoryId === categoryId
      );
      setVoucherProducts(filteredProducts);

      if (filteredProducts.length === 0) {
        toast.error("Tidak ada produk voucher tersedia untuk kategori ini");
      }
    } catch (error) {
      toast.error("Gagal memuat produk voucher");
      console.error(error);
    }
  };

  const handleVoucherTypeChange = async (typeId: string) => {
    try {
      setSelectedVoucherTypeId(typeId);
      setSelectedVoucherCardId("");
      setVoucherCardSearchResults([]);

      if (!typeId || !selectedVoucherCategoryId) {
        setVoucherCards([]);
        setVoucherCardPrice(0);
        setVoucherCardSerialNumber("");
        setRangeStartSerial("");
        return;
      }

      // Set price from product
      const matchedProduct = voucherProducts.find(
        (p: any) => p.type?.id === typeId
      );
      if (matchedProduct) {
        setVoucherCardPrice(Number(matchedProduct.price) || 0);
        
        // Auto-fill serial number from serialTemplate
        const serialTemplate = matchedProduct?.serialTemplate || "";
        setVoucherCardSerialNumber(serialTemplate);
        
        // Also auto-fill range start serial if in range mode
        if (inputMode === "range") {
          setRangeStartSerial(serialTemplate);
          // Trigger search to show dropdown after a short delay
          if (serialTemplate.length >= 6) {
            setTimeout(() => {
              handleRangeSerialSearch(serialTemplate);
            }, 200);
          }
        }
      } else {
        setVoucherCardSerialNumber("");
        if (inputMode === "range") {
          setRangeStartSerial("");
        }
      }

      // Load available cards
      setLoadingVoucherCards(true);
      const userStr = localStorage.getItem("fwc_user");
      let userStationId: string | null = null;
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userStationId = user.stationId || null;
        } catch (err) {
          console.error("Failed to parse user data:", err);
        }
      }

      const params: any = {
        categoryId: selectedVoucherCategoryId,
        typeId: typeId,
        status: "IN_STATION",
        limit: 100,
        programType: "VOUCHER",
      };

      if (userStationId) {
        params.stationId = userStationId;
      }

      const response = await axios.get("/cards", { params });
      const availableCards = response.data?.data?.items || [];
      setVoucherCards(availableCards);

      if (availableCards.length === 0) {
        toast.error("Tidak ada voucher tersedia untuk tipe ini");
      }
    } catch (error) {
      toast.error("Gagal memuat voucher");
      console.error(error);
    } finally {
      setLoadingVoucherCards(false);
    }
  };

  const handleVoucherCardSearch = async (query: string) => {
    setVoucherCardSerialNumber(query);

    if (!query || query.length < 6) {
      setVoucherCardSearchResults([]);
      return;
    }

    try {
      setIsSearchingVoucherCards(true);

      const userStr = localStorage.getItem("fwc_user");
      let userStationId: string | null = null;
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userStationId = user.stationId || null;
        } catch (err) {
          console.error("Failed to parse user data:", err);
        }
      }

      const params: any = {
        search: query,
        status: "IN_STATION",
        limit: 10,
        programType: "VOUCHER",
        sortBy: "serialNumber",
        sortOrder: "asc",
      };

      if (selectedVoucherCategoryId) params.categoryId = selectedVoucherCategoryId;
      if (selectedVoucherTypeId) params.typeId = selectedVoucherTypeId;
      if (userStationId) params.stationId = userStationId;

      const response = await axios.get("/cards", { params });
      const results = response.data?.data?.items || [];
      const sortedResults = results.sort((a: any, b: any) =>
        a.serialNumber.localeCompare(b.serialNumber)
      );
      setVoucherCardSearchResults(sortedResults);
    } catch (error) {
      console.error("Error searching voucher cards:", error);
      setVoucherCardSearchResults([]);
    } finally {
      setIsSearchingVoucherCards(false);
    }
  };

  const handleVoucherCardSelect = (card: any) => {
    setSelectedVoucherCardId(card.id);
    setVoucherCardSerialNumber(card.serialNumber);
    setVoucherCardSearchResults([]);
  };

  // Handle range serial number search
  const handleRangeSerialSearch = async (query: string) => {
    setRangeStartSerial(query);

    if (!query || query.length < 6) {
      setRangeSearchResults([]);
      return;
    }

    if (!selectedVoucherCategoryId || !selectedVoucherTypeId) {
      setRangeSearchResults([]);
      return;
    }

    try {
      setIsSearchingRange(true);

      const userStr = localStorage.getItem("fwc_user");
      let userStationId: string | null = null;
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userStationId = user.stationId || null;
        } catch (err) {
          console.error("Failed to parse user data:", err);
        }
      }

      const params: any = {
        search: query,
        status: "IN_STATION",
        limit: 1000,
        programType: "VOUCHER",
        categoryId: selectedVoucherCategoryId,
        typeId: selectedVoucherTypeId,
        sortBy: "serialNumber",
        sortOrder: "asc",
      };

      if (userStationId) {
        params.stationId = userStationId;
      }

      const response = await axios.get("/cards", { params });
      const results = response.data?.data?.items || [];
      const sortedResults = results.sort((a: any, b: any) =>
        a.serialNumber.localeCompare(b.serialNumber)
      );
      setRangeSearchResults(sortedResults);
    } catch (error) {
      console.error("Error searching range voucher cards:", error);
      setRangeSearchResults([]);
    } finally {
      setIsSearchingRange(false);
    }
  };

  const handleRangeCardSelect = (card: any) => {
    setSelectedRangeCardId(card.id);
    setRangeStartSerial(card.serialNumber);
    setRangeSearchResults([]);
  };

  // Handle card selection for bulk purchase
  const handleAddSelectedVoucherCard = () => {
    const cardToAdd = selectedVoucherCardId 
      ? (voucherCardSearchResults.find((c) => c.id === selectedVoucherCardId) ||
         voucherCards.find((c) => c.id === selectedVoucherCardId))
      : null;

    if (!cardToAdd || !voucherCardSerialNumber) {
      return;
    }

    addVoucherCard({
      cardId: cardToAdd.id,
      serialNumber: cardToAdd.serialNumber,
      price: voucherCardPrice || 0,
    });
    
    // Reset selection
    setVoucherCardSerialNumber("");
    setSelectedVoucherCardId("");
  };

  // Generate serial numbers from range
  const generateSerialNumbers = (startSerial: string, quantity: number): string[] => {
    const serials: string[] = [];
    const match = startSerial.match(/^(.+?)(\d+)$/);
    
    if (!match) {
      return [startSerial];
    }
    
    const prefix = match[1];
    const startNumber = parseInt(match[2], 10);
    const padding = match[2].length;
    
    for (let i = 0; i < quantity; i++) {
      const number = startNumber + i;
      const paddedNumber = number.toString().padStart(padding, '0');
      serials.push(`${prefix}${paddedNumber}`);
    }
    
    return serials;
  };

  // Handle range input and add multiple cards
  const handleAddRange = async () => {
    if (!rangeStartSerial || !rangeQuantity) {
      toast.error("Serial number awal dan quantity wajib diisi");
      return;
    }

    const quantity = parseInt(rangeQuantity, 10);
    if (isNaN(quantity) || quantity < 1 || quantity > 100) {
      toast.error("Quantity harus antara 1-100");
      return;
    }

    if (!selectedVoucherCategoryId || !selectedVoucherTypeId) {
      toast.error("Pilih Category dan Type terlebih dahulu");
      return;
    }

    setIsAddingRange(true);
    try {
      const serialNumbers = generateSerialNumbers(rangeStartSerial, quantity);
      
      // Get price from product
      const product = voucherProducts.find(
        (p: any) => p.categoryId === selectedVoucherCategoryId && p.type?.id === selectedVoucherTypeId
      );
      const pricePerCard = product ? Number(product.price) || 0 : 0;

      // Validate and fetch all cards
      const userStr = localStorage.getItem("fwc_user");
      let userStationId: string | null = null;
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userStationId = user.stationId || null;
        } catch (err) {
          console.error("Failed to parse user data:", err);
        }
      }

      const params: any = {
        status: "IN_STATION",
        programType: "VOUCHER",
        categoryId: selectedVoucherCategoryId,
        typeId: selectedVoucherTypeId,
        limit: 1000,
      };

      if (userStationId) {
        params.stationId = userStationId;
      }

      // Search for all serial numbers
      const searchPromises = serialNumbers.map(async (serial) => {
        try {
          const response = await axios.get("/cards", {
            params: { ...params, search: serial },
          });
          const results = response.data?.data?.items || [];
          const exactMatch = results.find((card: any) => card && card.serialNumber === serial);
          return exactMatch || null;
        } catch (error) {
          console.error(`Error searching card ${serial}:`, error);
          return null;
        }
      });

      const foundCards = await Promise.all(searchPromises);
      const validCards = foundCards.filter((card) => card !== null);

      if (validCards.length === 0) {
        toast.error("Tidak ada voucher ditemukan untuk serial numbers tersebut");
        return;
      }

      if (validCards.length < serialNumbers.length) {
        const missing = serialNumbers.filter(
          (serial) => !validCards.some((c: any) => c.serialNumber === serial)
        );
        toast.error(
          `Hanya ${validCards.length} dari ${serialNumbers.length} voucher yang ditemukan. Missing: ${missing.join(", ")}`,
          { duration: 5000 }
        );
      }

      // Add all valid cards at once
      const existingCardIds = new Set(selectedCards.map((c) => c.cardId));
      const newCardsToAdd = validCards.filter(
        (card) => !existingCardIds.has(card.id)
      );
      
      const skippedCount = validCards.length - newCardsToAdd.length;

      if (newCardsToAdd.length > 0) {
        const cardsToAdd = newCardsToAdd.map((card) => ({
          cardId: card.id,
          serialNumber: card.serialNumber,
          price: pricePerCard,
        }));
        addVoucherCards(cardsToAdd);
      }

      if (skippedCount > 0) {
        toast.error(`${newCardsToAdd.length} voucher berhasil ditambahkan, ${skippedCount} sudah ada sebelumnya`, { duration: 4000 });
      } else {
        toast.success(`${newCardsToAdd.length} voucher berhasil ditambahkan`);
      }
      
      // Reset range inputs
      setRangeStartSerial("");
      setRangeQuantity("");
    } catch (error) {
      toast.error("Gagal menambahkan voucher range");
      console.error("Error adding range:", error);
    } finally {
      setIsAddingRange(false);
    }
  };

  const onlyNumber = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
  };

  const handleKTPImageChange = (file: File | null) => {
    setKtpImage(file);
  };

  const handleKTPDetectionComplete = (
    sessionId: string,
    croppedImageBase64: string,
  ) => {
    setKtpSessionId(sessionId);
    // Detection sudah selesai, user bisa klik "Ekstrak Data KTP" untuk OCR
  };

  const handleExtractOCR = async (sessionId: string) => {
    setIsExtractingOCR(true);
    try {
      const token = localStorage.getItem("fwc_token");
      if (!token) {
        throw new Error("Session expired. Silakan login kembali.");
      }

      const formData = new FormData();
      formData.append("session_id", sessionId);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${API_BASE_URL}/members/ocr-extract`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message || result.error || "Gagal mengekstrak data KTP",
        );
      }

      if (result.data) {
        const data = result.data;

        // Auto-fill form dengan data dari OCR (NIK, Nama, Jenis Kelamin, dan Alamat)
        setForm((prev) => ({
          ...prev,
          nik: data.identityNumber || prev.nik,
          name: data.name || prev.name,
          gender:
            data.gender === "Laki-laki" || data.gender === "L"
              ? "L"
              : data.gender === "Perempuan" || data.gender === "P"
                ? "P"
                : prev.gender,
          address: data.alamat || prev.address,
        }));

        toast.success("Data KTP berhasil diekstrak!");
      } else {
        toast.error("Gagal mengekstrak data KTP. Silakan isi manual.");
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      toast.error(
        error.message || "Gagal mengekstrak data KTP. Silakan isi manual.",
      );
    } finally {
      setIsExtractingOCR(false);
    }
  };

  const checkUniqueField = async (
    field: "nik" | "edcReferenceNumber",
    value: string,
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
    >,
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

    if (programType === "FWC") {
      if (!cardCategory) {
        toast.error("Card Category wajib dipilih");
        return;
      }

      if (!cardTypeId) {
        toast.error("Card Type wajib dipilih");
        return;
      }

      if (!cardId) {
        toast.error("Serial Number wajib dipilih");
        return;
      }
    } else {
      // Voucher validation
      if (selectedCards.length === 0) {
        toast.error("Minimal 1 voucher wajib dipilih");
        return;
      }

      if (!voucherForm.getValues("edcReferenceNumber")?.trim()) {
        toast.error("No. Reference EDC wajib diisi");
        return;
      }
    }

    if (cardCategory === "KAI" && !form.nippKai.trim()) {
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

    if (programType === "FWC" && !price) {
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

    // EDC Reference Number validation - hanya untuk FWC (untuk voucher sudah dicek di atas)
    if (programType === "FWC" && !form.edcReferenceNumber.trim()) {
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
      if (!meData.data?.station?.id) {
        toast.error(
          "User tidak memiliki stasiun. Silakan hubungi administrator.",
          { duration: 5000 },
        );
        return;
      }
      const stationIdFromMe = meData.data.station.id;

      // 3. VALIDATION
      if (programType === "FWC") {
        if (!cardCategory) {
          toast.error("Card Category wajib dipilih");
          return;
        }
        if (!cardTypeId) {
          toast.error("Card Type wajib dipilih");
          return;
        }
        if (!cardId) {
          toast.error("Serial Number wajib dipilih");
          return;
        }
        if (!form.edcReferenceNumber.trim()) {
          toast.error("No. Reference EDC wajib diisi");
          return;
        }
      } else {
        // Voucher validation
        if (selectedCards.length === 0) {
          toast.error("Minimal 1 voucher wajib dipilih");
          return;
        }
        const edcRef = voucherForm.getValues("edcReferenceNumber")?.trim();
        if (!edcRef) {
          toast.error("No. Reference EDC wajib diisi");
          return;
        }
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
        employeeTypeId: form.employeeTypeId || undefined,
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
      if (programType === "FWC") {
        const purchaseRes = await createPurchase({
          cardId: cardId,
          memberId,
          edcReferenceNumber: form.edcReferenceNumber.trim(),
          purchasedDate: form.membershipDate,
          expiredDate: form.expiredDate,
          shiftDate: form.shiftDate,
          // price: price ? parseFloat(price) : undefined,
          operatorName,
          stationId: stationIdFromMe,
        });

        if (!purchaseRes) {
          throw new Error("Gagal membuat transaksi");
        }
      } else {
        // Voucher bulk purchase
        const voucherFormData = voucherForm.getValues();
        const voucherPayload = {
          memberId,
          cards: selectedCards.map((c) => ({
            cardId: c.cardId,
            price: c.price,
          })),
          edcReferenceNumber: voucherFormData.edcReferenceNumber.trim(),
          programType: "VOUCHER" as const,
          bulkDiscountId: voucherFormData.bulkDiscountId,
          price: voucherTotalPrice,
          notes: voucherFormData.notes || "",
          employeeTypeId: form.employeeTypeId || memberRes.data?.employeeTypeId || undefined,
        };

        await createVoucherPurchase(voucherPayload);
      }

      router.push("/dashboard/superadmin/transaksi");
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
            <Field label="NIK / Passport" required>
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
                        nik: "Identity Number maksimal 20 karakter",
                      }));
                    } else {
                      setFieldError((p) => ({ ...p, nik: undefined }));
                    }
                  }}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value
                      .replace(/[^a-zA-Z0-9]/g, "")
                      .toUpperCase()
                      .slice(0, 20);
                  }}
                  onBlur={() => {
                    if (form.nik.length >= 6) {
                      checkUniqueField("nik", form.nik);
                    }
                  }}
                  placeholder="NIK / Passport (max 20 karakter)"
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

            <Field label="Employee Type" required>
              <div className="relative">
                <select
                  name="employeeTypeId"
                  value={form.employeeTypeId}
                  onChange={handleChange}
                  className={`${base} appearance-none pr-10`}
                  required
                  disabled={loadingEmployeeTypes}
                >
                  <option value="">
                    {loadingEmployeeTypes ? "Loading..." : "Pilih Tipe Pegawai"}
                  </option>
                  {employeeTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </Field>

            {/* NIP / NIPP KAI - Only show if NOT Umum */}
            {form.employeeTypeId &&
              employeeTypes.find((t) => t.id === form.employeeTypeId)?.code !==
                "UMUM" && (
                <Field label="NIP / NIPP KAI" required={isKAIProduct}>
                  <input
                    ref={nippKaiRef}
                    name="nippKai"
                    value={form.nippKai}
                    onChange={handleChange}
                    onInput={onlyNumber}
                    placeholder="Nomor Induk Pegawai (KAI)"
                    className={base}
                    maxLength={5}
                  />

                  <p className="text-[11px] text-gray-400">
                    Diisi jika member merupakan pegawai KAI (maksimal 5 digit)
                  </p>
                </Field>
              )}

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
                  maxLength={15}
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
            <SectionCard title={programType === "VOUCHER" ? "Select Vouchers (Bulk)" : "Card Information"}>
              {programType === "FWC" ? (
                <div>
                  <Field label="Mode Input Serial Number" required>
                    <select
                      className={base}
                      value={inputMode}
                      onChange={(e) => {
                        const mode = e.target.value as
                          | ""
                          | "manual"
                          | "recommendation";
                        setInputMode(mode);
                        // Reset serial number and card states
                        setSerialNumber("");
                      }}
                    >
                      <option value="">Pilih Mode Input</option>
                      <option value="manual">Input Manual / Scan Barcode</option>
                      <option value="recommendation">Rekomendasi</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Pilih mode input serial number terlebih dahulu
                    </p>
                  </Field>

                  {inputMode === "manual" && (
                    <Field label="Serial Number" required>
                      <input
                        type="text"
                        className={base}
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="Masukkan atau scan serial number lengkap..."
                        autoComplete="off"
                      />
                    </Field>
                  )}

                  {inputMode === "recommendation" && (
                    <Fragment>
                      <Field label="Card Category" required>
                    <select
                      className={base}
                      value={cardCategory}
                      onChange={(e) =>
                        handleCategoryChange(e.target.value as any)
                      }
                      disabled={loadingCategories}
                    >
                        <option value="">
                          {loadingCategories ? "Loading..." : "Select"}
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      {!cardCategory && (
                        <p className="mt-1 text-xs text-gray-500">
                          Pilih kategori kartu terlebih dahulu
                        </p>
                      )}
                      </Field>

                      <Field label="Card Type" required>
                        <select
                          className={base}
                          value={cardTypeId}
                          onChange={(e) => handleTypeChange(e.target.value)}
                          disabled={!cardCategory || loadingTypes}
                        >
                          <option value="">
                            {loadingTypes ? "Loading..." : "Select"}
                          </option>
                          {cardTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.typeName}
                            </option>
                          ))}
                        </select>
                        {!cardCategory ? (
                          <p className="mt-1 text-xs text-amber-600">
                            ⚠ Pilih Card Category terlebih dahulu
                          </p>
                        ) : (
                          cardCategory &&
                          !cardTypeId && (
                            <p className="mt-1 text-xs text-gray-500">
                              Pilih tipe kartu
                            </p>
                          )
                        )}
                      </Field>

                      <Field label="Serial Number" required>
                        <div className="relative">
                          <input
                            type="text"
                            className={base}
                            value={serialNumber}
                            onChange={(e) => handleCardSearch(e.target.value)}
                            placeholder="Masukkan 2 digit tahun kartu dibuat + nomor (min 6 karakter)..."
                            autoComplete="off"
                            disabled={!cardTypeId}
                          />
                          {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                            </div>
                          )}
                          {searchResults.length > 0 && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                              {searchResults.map((card) => (
                                <button
                                  key={card.id}
                                  type="button"
                                  onClick={() => handleCardSelect(card)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                  {card.serialNumber}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {serialNumber &&
                          searchResults.length === 0 &&
                          !isSearching &&
                          serialNumber.length >= 6 &&
                          !cardId && (
                            <p className="mt-1 text-xs text-red-600">
                              Tidak ada kartu ditemukan dengan serial number ini
                            </p>
                          )}
                        {serialNumber.length > 0 && serialNumber.length < 6 && (
                          <p className="mt-1 text-xs text-gray-500">
                            Masukkan 2 digit tahun kartu dibuat + nomor (minimal 6
                            karakter total)
                          </p>
                        )}
                      </Field>
                    </Fragment>
                  )}
                </div>
              ) : (
                <div>
                  {/* Voucher Bulk Purchase UI */}
                  <Field label="Mode Input Serial Number" required>
                    <select
                      className={base}
                      value={inputMode}
                      onChange={(e) => {
                        const mode = e.target.value as
                          | ""
                          | "manual"
                          | "recommendation"
                          | "range";
                        setInputMode(mode);
                        setVoucherCardSerialNumber("");
                        setRangeStartSerial("");
                        setRangeQuantity("");
                      }}
                    >
                      <option value="">Pilih Mode Input</option>
                      <option value="manual">Input Manual / Scan Barcode (Satu per Satu)</option>
                      <option value="recommendation">Rekomendasi (Satu per Satu)</option>
                      <option value="range">Range (Bulk - Serial Number Awal + Quantity)</option>
                    </select>
                  </Field>

                  {inputMode === "manual" && (
                    <Field label="Serial Number (Bisa Multiple)" required>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              className={base}
                              value={voucherCardSerialNumber}
                              onChange={(e) => handleVoucherCardSearch(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && selectedVoucherCardId && voucherCardSerialNumber) {
                                  e.preventDefault();
                                  handleAddSelectedVoucherCard();
                                }
                              }}
                              placeholder="Masukkan atau scan serial number (tekan Enter untuk tambah)..."
                              autoComplete="off"
                            />
                            {isSearchingVoucherCards && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                              </div>
                            )}
                            {voucherCardSearchResults.length > 0 && (
                              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                                {voucherCardSearchResults.map((card) => (
                                  <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => {
                                      handleVoucherCardSelect(card);
                                      setTimeout(() => {
                                        handleAddSelectedVoucherCard();
                                      }, 100);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                  >
                                    {card.serialNumber}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleAddSelectedVoucherCard}
                            disabled={!selectedVoucherCardId || !voucherCardSerialNumber}
                            className="whitespace-nowrap rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Plus size={16} className="inline mr-1" />
                            Add
                          </button>
                        </div>
                      </div>
                    </Field>
                  )}

                  {inputMode === "recommendation" && (
                    <>
                      <Field label="Voucher Category" required>
                        <select
                          className={base}
                          value={selectedVoucherCategoryId}
                          onChange={(e) => handleVoucherCategoryChange(e.target.value)}
                          disabled={loadingVoucherCategories}
                        >
                          <option value="">
                            {loadingVoucherCategories ? "Loading..." : "Select"}
                          </option>
                          {voucherCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.categoryName}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Voucher Type" required>
                        <select
                          className={base}
                          value={selectedVoucherTypeId}
                          onChange={(e) => handleVoucherTypeChange(e.target.value)}
                          disabled={!selectedVoucherCategoryId || loadingVoucherTypes}
                        >
                          <option value="">
                            {loadingVoucherTypes ? "Loading..." : "Select"}
                          </option>
                          {voucherProducts.length > 0
                            ? voucherProducts
                                .reduce((acc: any[], product: any) => {
                                  if (
                                    product.type &&
                                    !acc.find((t) => t.id === product.type.id)
                                  ) {
                                    acc.push(product.type);
                                  }
                                  return acc;
                                }, [])
                                .map((t: any) => (
                                  <option key={t.id} value={t.id}>
                                    {t.typeName}
                                  </option>
                                ))
                            : voucherTypes
                                .filter((t) => {
                                  if (!selectedVoucherCategoryId) return false;
                                  return voucherProducts.some(
                                    (p: any) => p.type?.id === t.id
                                  );
                                })
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.typeName}
                                  </option>
                                ))}
                        </select>
                      </Field>

                      <Field label="Serial Number (Bisa Multiple)" required>
                        <div className="relative">
                          <input
                            type="text"
                            className={base}
                            value={voucherCardSerialNumber}
                            onChange={(e) => handleVoucherCardSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && selectedVoucherCardId && voucherCardSerialNumber) {
                                e.preventDefault();
                                handleAddSelectedVoucherCard();
                              }
                            }}
                            placeholder="Masukkan 2 digit tahun kartu dibuat + nomor (tekan Enter untuk tambah)..."
                            autoComplete="off"
                            disabled={!selectedVoucherTypeId}
                          />
                          {isSearchingVoucherCards && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                            </div>
                          )}
                          {voucherCardSearchResults.length > 0 && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                              {voucherCardSearchResults.map((card) => (
                                <button
                                  key={card.id}
                                  type="button"
                                  onClick={() => {
                                    handleVoucherCardSelect(card);
                                    setTimeout(() => {
                                      handleAddSelectedVoucherCard();
                                    }, 100);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                  {card.serialNumber}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </Field>
                    </>
                  )}

                  {inputMode === "range" && (
                    <>
                      <Field label="Voucher Category" required>
                        <select
                          className={base}
                          value={selectedVoucherCategoryId}
                          onChange={(e) => handleVoucherCategoryChange(e.target.value)}
                          disabled={loadingVoucherCategories}
                        >
                          <option value="">
                            {loadingVoucherCategories ? "Loading..." : "Select"}
                          </option>
                          {voucherCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.categoryName}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Voucher Type" required>
                        <select
                          className={base}
                          value={selectedVoucherTypeId}
                          onChange={(e) => handleVoucherTypeChange(e.target.value)}
                          disabled={!selectedVoucherCategoryId || loadingVoucherTypes}
                        >
                          <option value="">
                            {loadingVoucherTypes ? "Loading..." : "Select"}
                          </option>
                          {voucherProducts.length > 0
                            ? voucherProducts
                                .reduce((acc: any[], product: any) => {
                                  if (
                                    product.type &&
                                    !acc.find((t) => t.id === product.type.id)
                                  ) {
                                    acc.push(product.type);
                                  }
                                  return acc;
                                }, [])
                                .map((t: any) => (
                                  <option key={t.id} value={t.id}>
                                    {t.typeName}
                                  </option>
                                ))
                            : voucherTypes
                                .filter((t) => {
                                  if (!selectedVoucherCategoryId) return false;
                                  return voucherProducts.some(
                                    (p: any) => p.type?.id === t.id
                                  );
                                })
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.typeName}
                                  </option>
                                ))}
                        </select>
                      </Field>

                      <Field label="Serial Number Awal" required>
                        <div className="relative">
                          <input
                            type="text"
                            className={base}
                            value={rangeStartSerial}
                            onChange={(e) => handleRangeSerialSearch(e.target.value)}
                            placeholder="Masukkan 2 digit tahun kartu dibuat + nomor..."
                            autoComplete="off"
                            disabled={!selectedVoucherTypeId}
                          />
                          {isSearchingRange && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                            </div>
                          )}
                          {rangeSearchResults.length > 0 && (
                            <div className="absolute z-10 mt-1 max-h-96 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                              <div className="sticky top-0 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 border-b">
                                {rangeSearchResults.length} voucher ditemukan
                              </div>
                              {rangeSearchResults.map((card) => (
                                <button
                                  key={card.id}
                                  type="button"
                                  onClick={() => handleRangeCardSelect(card)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none font-mono"
                                >
                                  {card.serialNumber}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </Field>

                      <Field label="Quantity (Jumlah Voucher)" required>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            className={base}
                            value={rangeQuantity}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val === "" || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100)) {
                                setRangeQuantity(val);
                              }
                            }}
                            placeholder="Contoh: 10"
                            min="1"
                            max="100"
                            disabled={!selectedVoucherTypeId || !rangeStartSerial}
                          />
                          <button
                            type="button"
                            onClick={handleAddRange}
                            disabled={
                              !selectedVoucherTypeId ||
                              !rangeStartSerial ||
                              !rangeQuantity ||
                              isAddingRange
                            }
                            className="whitespace-nowrap rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                          >
                            {isAddingRange ? (
                              <>
                                <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus size={16} className="inline mr-1" />
                                Add Range
                              </>
                            )}
                          </button>
                        </div>
                      </Field>
                    </>
                  )}

                  {/* Selected Cards List */}
                  {selectedCards.length > 0 && (
                    <Field label={`Selected Vouchers (${selectedCards.length})`}>
                      <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                        {selectedCards.map((card) => (
                          <div
                            key={card.cardId}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm">{card.serialNumber}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                Rp {card.price.toLocaleString("id-ID")}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeVoucherCard(card.cardId)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Field>
                  )}

                  {/* Bulk Discount Section */}
                  {selectedCards.length > 0 && (
                    <SectionCard title="Bulk Discount">
                      <Field label="Bulk Discount">
                        <select
                          className={base}
                          value={selectedBulkDiscountId || ""}
                          onChange={(e) =>
                            handleBulkDiscountChange(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                        >
                          <option value="">No Discount</option>
                          {bulkDiscounts
                            .filter((discount) => {
                              const quantity = selectedCards.length;
                              return (
                                quantity >= discount.minQuantity &&
                                (discount.maxQuantity === null ||
                                  quantity <= discount.maxQuantity)
                              );
                            })
                            .map((discount) => (
                              <option key={discount.id} value={discount.id}>
                                {discount.minQuantity}
                                {discount.maxQuantity
                                  ? `-${discount.maxQuantity}`
                                  : "+"}{" "}
                                items: {Number(discount.discount)}%
                              </option>
                            ))}
                        </select>
                        {selectedCards.length > 0 &&
                          bulkDiscounts.filter((discount) => {
                            const quantity = selectedCards.length;
                            return (
                              quantity >= discount.minQuantity &&
                              (discount.maxQuantity === null ||
                                quantity <= discount.maxQuantity)
                            );
                          }).length === 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              Tidak ada bulk discount tersedia untuk {selectedCards.length}{" "}
                              item
                            </p>
                          )}
                      </Field>
                    </SectionCard>
                  )}

                  {/* Price Summary */}
                  {selectedCards.length > 0 && (
                    <SectionCard title="Price Summary">
                      <Field label="Price Summary">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal ({selectedCards.length} items):</span>
                          <span>
                            Rp{" "}
                            {selectedCards
                              .reduce((sum, card) => sum + (card.price || 0), 0)
                              .toLocaleString("id-ID")}
                          </span>
                        </div>
                        {voucherDiscountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount:</span>
                            <span>- Rp {voucherDiscountAmount.toLocaleString("id-ID")}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Total:</span>
                          <span>Rp {voucherTotalPrice.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                      </Field>
                    </SectionCard>
                  )}
                </div>
              )}
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
              {programType === "FWC" ? (
                <>
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
                        value={price || ""}
                        readOnly
                        placeholder="FWC Price"
                        className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
                        required
                      />
                    </div>
                  </Field>
                </>
              ) : (
                <>
                  {/* Voucher Price Summary */}
                  {selectedCards.length > 0 && (
                    <>
                      <Field label="Subtotal">
                        <div className="relative">
                          <DollarSign
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                          <input
                            value={`Rp ${selectedCards.reduce((sum, card) => sum + (card.price || 0), 0).toLocaleString("id-ID")}`}
                            readOnly
                            className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
                          />
                        </div>
                      </Field>
                      {voucherDiscountAmount > 0 && (
                        <Field label="Discount">
                          <div className="relative">
                            <DollarSign
                              size={16}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                              value={`- Rp ${voucherDiscountAmount.toLocaleString("id-ID")}`}
                              readOnly
                              className={`${base} pr-10 bg-gray-50 cursor-not-allowed text-green-600`}
                            />
                          </div>
                        </Field>
                      )}
                      <Field label="Total Price" required>
                        <div className="relative">
                          <DollarSign
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                          <input
                            value={`Rp ${voucherTotalPrice.toLocaleString("id-ID")}`}
                            readOnly
                            className={`${base} pr-10 bg-gray-50 cursor-not-allowed font-semibold`}
                            required
                          />
                        </div>
                      </Field>
                    </>
                  )}
                </>
              )}
            </SectionCard>

            {/* Operational Information */}
            <SectionCard title="Operational Information">
              {/* Stasiun - Auto-filled from user account */}
              <Field label="Stasiun" required>
                <input
                  type="text"
                  name="station"
                  value={form.station}
                  readOnly
                  className={`${base} bg-gray-50 cursor-not-allowed`}
                  placeholder="Auto-filled from your account"
                />
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
                {programType === "FWC" ? (
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
                      if (form.edcReferenceNumber.length >= 6) {
                        checkUniqueField(
                          "edcReferenceNumber",
                          form.edcReferenceNumber,
                        );
                      }
                    }}
                    placeholder="No. Reference EDC"
                    className={`${base} pr-40 ${
                      fieldError.edcReferenceNumber ? "border-red-500" : ""
                    }`}
                    maxLength={20}
                    required
                  />
                ) : (
                  <input
                    {...voucherForm.register("edcReferenceNumber")}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value
                        .replace(/\D/g, "")
                        .slice(0, 20);
                    }}
                    placeholder="No. Reference EDC"
                    className={`${base} pr-40`}
                    maxLength={20}
                    required
                  />
                )}

                {/* ERROR DI DALAM FIELD */}
                {programType === "FWC" && fieldError.edcReferenceNumber && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-600">
                    {fieldError.edcReferenceNumber}
                  </span>
                )}

                {/* CHECKING */}
                {programType === "FWC" &&
                  !fieldError.edcReferenceNumber &&
                  checking.edcReferenceNumber && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      Checking...
                    </span>
                  )}
              </div>
            </Field>

            {/* Notes - Only for Voucher */}
            {programType === "VOUCHER" && (
              <Field label="Notes (Optional)">
                <div className="relative md:col-span-2">
                  <textarea
                    {...voucherForm.register("notes")}
                    className={`${base} min-h-[80px]`}
                    maxLength={500}
                    placeholder="Tambahkan catatan jika perlu..."
                  />
                </div>
              </Field>
            )}

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
                isSubmittingVoucher ||
                checking.nik ||
                (programType === "FWC" && checking.edcReferenceNumber) ||
                !!fieldError.nik ||
                (programType === "FWC" && !!fieldError.edcReferenceNumber) ||
                (programType === "VOUCHER" && selectedCards.length === 0)
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

          // PROGRAM TYPE
          "Program Type": programType,

          // CARD / VOUCHER
          ...(programType === "FWC"
            ? {
                "Card Category": cardCategory || "-",
                "Card Type":
                  cardTypes.find((t) => t.id === cardTypeId)?.typeName || "-",
                "Serial Number": serialNumber || "-",
              }
            : {
                "Number of Vouchers": selectedCards.length.toString(),
                "Voucher Subtotal": `Rp ${selectedCards
                  .reduce((sum, card) => sum + (card.price || 0), 0)
                  .toLocaleString("id-ID")}`,
                "Discount":
                  voucherDiscountAmount > 0
                    ? `Rp ${voucherDiscountAmount.toLocaleString("id-ID")}`
                    : "None",
                "Total Price": `Rp ${voucherTotalPrice.toLocaleString("id-ID")}`,
              }),

          // MEMBERSHIP
          "Membership Date": form.membershipDate,
          "Expired Date": form.expiredDate,

          // PURCHASE
          "Purchased Date": form.purchasedDate,
          ...(programType === "FWC"
            ? {
                "FWC Price": price
                  ? `Rp ${Number(price).toLocaleString("id-ID")}`
                  : "-",
                "Total Quota (Trips)":
                  cardProducts.find((p) => p.typeId === cardTypeId)
                    ?.totalQuota || "-",
              }
            : {}),

          // OPERATIONAL
          Stasiun: form.station,
          "Shift Date": form.shiftDate,

          // TRANSACTION
          "No. Reference EDC":
            programType === "FWC"
              ? form.edcReferenceNumber
              : voucherForm.getValues("edcReferenceNumber") || "-",
          ...(programType === "VOUCHER"
            ? {
                Notes: voucherForm.getValues("notes") || "-",
              }
            : {}),
        }}
        onClose={() => setShowSuccess(false)}
        onConfirm={handleConfirmSubmit}
      />
    </>
  );
}
