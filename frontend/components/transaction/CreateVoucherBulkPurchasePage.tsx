"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Trash2 } from "lucide-react";

import SuccessModal from "../../app/dashboard/superadmin/membership/components/ui/SuccessModal";
import { SectionCard } from "@/components/ui/section-card";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";

import { useVoucherBulkPurchaseForm } from "@/hooks/useVoucherBulkPurchaseForm";
import { useCardSelection } from "@/hooks/useCardSelection";
import { useCategoriesVoucher } from "@/hooks/useCategoriesVoucher";
import { useTypesVoucher } from "@/hooks/useTypesVoucher";
import { useMemberSearch } from "@/hooks/useMemberSearch";
import { cardVoucherService } from "@/lib/services/card.voucher.service";
import { getPaymentMethods, type PaymentMethod } from "@/lib/services/payment-method.service";
import { getCardsBySerialNumbers } from "@/lib/services/card.service";
import axios from "@/lib/axios";
import toast from "react-hot-toast";

const baseInputClass =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

const SERIAL_PREFIX_LEN = 4;

type Role = "superadmin" | "admin" | "supervisor" | "petugas";

interface CreateVoucherBulkPurchasePageProps {
  role: Role;
}

export default function CreateVoucherBulkPurchasePage({
  role,
}: CreateVoucherBulkPurchasePageProps) {
  const router = useRouter();
  const { data: categories, loading: loadingCategories } = useCategoriesVoucher();
  const { data: types, loading: loadingTypes } = useTypesVoucher();

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Input mode state
  const [inputMode, setInputMode] = useState<"" | "manual" | "range">(
    ""
  );

  // Voucher-specific state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [voucherProducts, setVoucherProducts] = useState<any[]>([]);
  const [voucherCards, setVoucherCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [cardPrice, setCardPrice] = useState<number>(0);
  const [cardSerialNumber, setCardSerialNumber] = useState<string>("");
  const [cardSearchResults, setCardSearchResults] = useState<any[]>([]);
  const [isSearchingCards, setIsSearchingCards] = useState(false);
  const [loadingVoucherCards, setLoadingVoucherCards] = useState(false);
  
  // Range input state
  const [rangeStartSerial, setRangeStartSerial] = useState<string>("");
  const [rangeQuantity, setRangeQuantity] = useState<string>("");
  const [isAddingRange, setIsAddingRange] = useState(false);
  const [rangeSearchResults, setRangeSearchResults] = useState<any[]>([]);
  const [isSearchingRange, setIsSearchingRange] = useState(false);
  const [selectedRangeCardId, setSelectedRangeCardId] = useState<string>("");

  const {
    form,
    isSubmitting,
    showConfirm,
    setShowConfirm,
    openConfirmDialog,
    handleConfirm,
    selectedCards,
    addCard,
    addCards,
    removeCard,
    clearAllCards,
    bulkDiscounts,
    selectedBulkDiscountId,
    handleBulkDiscountChange,
    totalPrice,
    discountAmount,
  } = useVoucherBulkPurchaseForm();

  const {
    query: memberQuery,
    setQuery: setMemberQuery,
    members,
    loading: loadingMembers,
    selectedMember,
    setSelectedMember,
    reset: resetMemberSearch,
  } = useMemberSearch();

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingPaymentMethods(true);
        const response = await getPaymentMethods();
        setPaymentMethods(response.data || []);
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        toast.error("Gagal memuat payment methods");
      } finally {
        setLoadingPaymentMethods(false);
      }
    };
    fetchPaymentMethods();
  }, []);

  // Set memberId when member is selected
  useEffect(() => {
    if (selectedMember) {
      form.setValue("memberId", selectedMember.id);
      form.setValue("identityNumber", selectedMember.identityNumber);
    } else {
      form.setValue("memberId", "");
      form.setValue("identityNumber", "");
    }
  }, [selectedMember, form]);

  // Auto-fill range start serial when switching to range mode and type is already selected
  useEffect(() => {
    if (inputMode === "range" && selectedTypeId && selectedCategoryId && voucherProducts.length > 0) {
      const matchedProduct = voucherProducts.find(
        (p: any) => p.type?.id === selectedTypeId
      );
      if (matchedProduct && matchedProduct.serialTemplate) {
        const serialTemplate = matchedProduct.serialTemplate;
        setRangeStartSerial(serialTemplate);
        // Trigger search to show dropdown if serial template is long enough
        if (serialTemplate.length >= 6) {
          // Use setTimeout to avoid dependency issues
          setTimeout(() => {
            handleRangeSerialSearch(serialTemplate);
          }, 100);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMode, selectedTypeId, selectedCategoryId, voucherProducts]);

  // Voucher-specific handlers
  const handleVoucherCategoryChange = async (categoryId: string) => {
    try {
      setSelectedCategoryId(categoryId);
      setSelectedTypeId("");
      setSelectedCardId("");
      setVoucherCards([]);
      setCardPrice(0);
      setCardSerialNumber("");
      setCardSearchResults([]);
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
        toast("Tidak ada produk voucher tersedia untuk kategori ini", { icon: "⚠️" });
      }
    } catch (error) {
      toast.error("Gagal memuat produk voucher");
      console.error(error);
    }
  };

  const handleVoucherTypeChange = async (typeId: string) => {
    try {
      setSelectedTypeId(typeId);
      setSelectedCardId("");
      setCardSearchResults([]);

      if (!typeId || !selectedCategoryId) {
        setVoucherCards([]);
        setCardPrice(0);
        setCardSerialNumber("");
        setRangeStartSerial("");
        return;
      }

      // Set price from product
      const matchedProduct = voucherProducts.find(
        (p: any) => p.type?.id === typeId
      );
      if (matchedProduct) {
        setCardPrice(Number(matchedProduct.price) || 0);
        
        // Auto-fill serial number from serialTemplate
        const serialTemplate = matchedProduct?.serialTemplate || "";
        setCardSerialNumber(serialTemplate);
        
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
        setCardSerialNumber("");
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
        categoryId: selectedCategoryId,
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
        toast("Tidak ada voucher tersedia untuk tipe ini", { icon: "⚠️" });
      }
    } catch (error) {
      toast.error("Gagal memuat voucher");
      console.error(error);
    } finally {
      setLoadingVoucherCards(false);
    }
  };

  const handleVoucherCardSearch = async (query: string) => {
    setCardSerialNumber(query);

    if (!query || query.length < 6) {
      setCardSearchResults([]);
      return;
    }

    try {
      setIsSearchingCards(true);

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

      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (selectedTypeId) params.typeId = selectedTypeId;
      if (userStationId) params.stationId = userStationId;

      const response = await axios.get("/cards", { params });
      const results = response.data?.data?.items || [];
      const sortedResults = results.sort((a: any, b: any) =>
        a.serialNumber.localeCompare(b.serialNumber)
      );
      setCardSearchResults(sortedResults);

      // Get price from product if available, otherwise use cardPrice or 0
      const getCardPrice = (card: any) => {
        if (selectedTypeId && voucherProducts.length > 0) {
          const product = voucherProducts.find(
            (p: any) => p.type?.id === selectedTypeId
          );
          if (product) {
            return Number(product.price) || 0;
          }
        }
        return cardPrice || card.price || 0;
      };

      // Auto-add if exact match found
      const exactMatch = sortedResults.find((card: any) => card.serialNumber === query);
      if (exactMatch) {
        addCard({
          cardId: exactMatch.id,
          serialNumber: exactMatch.serialNumber,
          price: getCardPrice(exactMatch),
        });
        setCardSerialNumber("");
        setSelectedCardId("");
        setCardSearchResults([]);
        return;
      }

      // Auto-add if there's a longer match (e.g., user typed "03132602020009" but "031326020200090" exists)
      const longerMatch = sortedResults.find((card: any) => 
        card.serialNumber.startsWith(query) && card.serialNumber.length > query.length
      );
      if (longerMatch && sortedResults.length === 1) {
        // Only auto-add if there's exactly one result that starts with the query
        addCard({
          cardId: longerMatch.id,
          serialNumber: longerMatch.serialNumber,
          price: getCardPrice(longerMatch),
        });
        toast.error(`Voucher ${query} tidak tersedia, ${longerMatch.serialNumber} tersedia dan sudah ditambahkan`);
        setCardSerialNumber("");
        setSelectedCardId("");
        setCardSearchResults([]);
        return;
      }
    } catch (error) {
      console.error("Error searching voucher cards:", error);
      setCardSearchResults([]);
    } finally {
      setIsSearchingCards(false);
    }
  };

  const handleVoucherCardSelect = (card: any) => {
    setSelectedCardId(card.id);
    setCardSerialNumber(card.serialNumber);
    setCardSearchResults([]);
  };

  // Handle range serial number search (same as recommendation mode)
  const handleRangeSerialSearch = async (query: string) => {
    setRangeStartSerial(query);

    if (!query || query.length < 6) {
      setRangeSearchResults([]);
      return;
    }

    if (!selectedCategoryId || !selectedTypeId) {
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
        limit: 1000, // Show all available vouchers, not limited to 10
        programType: "VOUCHER",
        categoryId: selectedCategoryId,
        typeId: selectedTypeId,
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
  const handleAddSelectedCard = () => {
    const cardToAdd = selectedCardId 
      ? (cardSearchResults.find((c) => c.id === selectedCardId) ||
         voucherCards.find((c) => c.id === selectedCardId))
      : null;

    if (!cardToAdd || !cardSerialNumber) {
      return;
    }

    addCard({
      cardId: cardToAdd.id,
      serialNumber: cardToAdd.serialNumber,
      price: cardPrice || 0,
    });
    
    // Reset selection
    setCardSerialNumber("");
    setSelectedCardId("");
  };

  // Generate serial numbers from range
  const generateSerialNumbers = (startSerial: string, quantity: number): string[] => {
    const serials: string[] = [];
    // Match all trailing digits as suffix - use greedy match on digits to capture all trailing digits
    // This ensures we correctly parse serials like "031326020200500" -> prefix: "031326020200", suffix: "500"
    const match = startSerial.match(/^(.+)(\d+)$/);
    
    if (!match) {
      return [startSerial]; // If no number suffix, return as is
    }
    
    const prefix = match[1];
    const startNumber = parseInt(match[2], 10);
    const originalPadding = match[2].length;
    
    // Calculate the maximum number we'll generate to determine required padding upfront
    const endNumber = startNumber + quantity - 1;
    const maxDigits = endNumber.toString().length;
    // Use the larger of original padding or max digits needed
    const requiredPadding = Math.max(originalPadding, maxDigits);
    
    for (let i = 0; i < quantity; i++) {
      const number = startNumber + i;
      // Use consistent padding for all numbers in the batch
      const paddedNumber = number.toString().padStart(requiredPadding, '0');
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
    if (isNaN(quantity) || quantity < 1 || quantity > 10000) {
      toast.error("Quantity harus antara 1-10000");
      return;
    }

    if (!selectedCategoryId || !selectedTypeId) {
      toast.error("Pilih Category dan Type terlebih dahulu");
      return;
    }

    setIsAddingRange(true);
    try {
      const serialNumbers = generateSerialNumbers(rangeStartSerial, quantity);
      
      console.log("=== RANGE ADD DEBUG ===");
      console.log("Start Serial:", rangeStartSerial);
      console.log("Quantity:", quantity);
      console.log("Generated Serial Numbers:", serialNumbers);
      
      // Get price from product
      const product = voucherProducts.find(
        (p: any) => p.categoryId === selectedCategoryId && p.type?.id === selectedTypeId
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

      // Use batch API to fetch all cards in a single request
      const batchResult = await getCardsBySerialNumbers({
        serialNumbers,
        status: "IN_STATION",
        programType: "VOUCHER",
        categoryId: selectedCategoryId,
        typeId: selectedTypeId,
        stationId: userStationId && role !== "superadmin" ? userStationId : undefined,
      });

      // Create a map for quick lookup by serial number
      const cardMap = new Map(
        batchResult.items.map((card) => [card.serialNumber, card])
      );

      // Get cards in the same order as requested serial numbers
      const validCards = serialNumbers
        .map((serial) => cardMap.get(serial))
        .filter((card) => card !== undefined) as any[];

      console.log("Found Cards:", validCards.map((c: any) => c?.serialNumber || "N/A"));
      console.log("Expected Serial Numbers:", serialNumbers);
      console.log("Found Count:", batchResult.foundCount, "Expected Count:", batchResult.requestedCount);

      if (validCards.length === 0) {
        toast.error("Tidak ada voucher ditemukan untuk serial numbers tersebut");
        return;
      }

      if (batchResult.foundCount < batchResult.requestedCount) {
        const missing = serialNumbers.filter(
          (serial) => !cardMap.has(serial)
        );
        console.log("Missing serials:", missing);
        const missingPreview = missing.slice(0, 10).join(", ");
        const missingText =
          missing.length > 10
            ? `${missingPreview}... (dan ${missing.length - 10} lainnya)`
            : missingPreview;
        toast(
          `Hanya ${batchResult.foundCount} dari ${batchResult.requestedCount} voucher yang ditemukan. Missing: ${missingText}`,
          { icon: "⚠️" }
        );
      }

      // Add all valid cards at once to avoid state update issues
      // Filter out cards that already exist
      const existingCardIds = new Set(selectedCards.map((c) => c.cardId));
      const newCardsToAdd = validCards.filter(
        (card) => !existingCardIds.has(card.id)
      );
      
      const skippedCount = validCards.length - newCardsToAdd.length;
      
      console.log(`Cards to add: ${newCardsToAdd.length}, Skipped (duplicates): ${skippedCount}`);
      console.log("New cards serial numbers:", newCardsToAdd.map((c: any) => c.serialNumber));

      // Add all new cards at once using batch add
      if (newCardsToAdd.length > 0) {
        const cardsToAdd = newCardsToAdd.map((card) => ({
          cardId: card.id,
          serialNumber: card.serialNumber,
          price: pricePerCard,
        }));
        addCards(cardsToAdd);
      }

      console.log(`Added: ${newCardsToAdd.length}, Skipped: ${skippedCount}`);
      console.log("===========================");

      if (skippedCount > 0) {
        toast(`${newCardsToAdd.length} voucher berhasil ditambahkan, ${skippedCount} sudah ada sebelumnya`, { icon: "⚠️" });
      } else {
        toast.success(`${newCardsToAdd.length} voucher berhasil ditambahkan`);
      }
      
      // Reset range inputs
      // Keep the prefix, only reset the suffix
      const prefix = rangeStartSerial.slice(0, SERIAL_PREFIX_LEN);
      setRangeStartSerial(prefix);
      setRangeQuantity("");
    } catch (error) {
      toast.error("Gagal menambahkan voucher range");
      console.error("Error adding range:", error);
    } finally {
      setIsAddingRange(false);
    }
  };

  const {
    register,
    formState: { errors },
  } = form;

  const subtotal = selectedCards.reduce((sum, card) => sum + (card.price || 0), 0);

  return (
    <>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            className="rounded p-1 hover:bg-gray-100"
            type="button"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Add Voucher Bulk Purchase</h1>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            openConfirmDialog();
          }}
          className="space-y-4 rounded-lg border bg-white p-6 w-full"
        >
          {/* Customer Section */}
          <SectionCard title="Customer">
            <Field>
              <FieldLabel>
                Identity Number (NIK/NIPP)
                <span className="ml-1 text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <MemberAutocomplete
                  value={memberQuery}
                  onChange={setMemberQuery}
                  onSelectMember={setSelectedMember}
                  members={members}
                  loading={loadingMembers}
                  selectedMember={selectedMember}
                  onClear={resetMemberSearch}
                  placeholder="Cari NIK Customer (min 3 karakter)..."
                />
                <FieldError
                  errors={
                    errors.identityNumber
                      ? [errors.identityNumber]
                      : undefined
                  }
                />
              </FieldContent>
            </Field>
          </SectionCard>

          {/* Card Selection Section */}
          <SectionCard title="Select Vouchers (Bulk)" gridCols={1} className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Left Column - All Input Fields */}
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel>
                    Mode Input Serial Number
                    <span className="ml-1 text-red-500">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <select
                      className={baseInputClass}
                      value={inputMode}
                      onChange={(e) => {
                        const mode = e.target.value as
                          | ""
                          | "manual"
                          | "range";
                        setInputMode(mode);
                        setCardSerialNumber("");
                        setRangeStartSerial("");
                        setRangeQuantity("");
                      }}
                    >
                      <option value="">Pilih Mode Input</option>
                      <option value="manual">Input Manual / Scan Barcode (Satu per Satu)</option>
                      <option value="range">Range (Bulk - Serial Number Awal + Quantity)</option>
                    </select>
                  </FieldContent>
                </Field>

                {inputMode === "manual" && (
                  <Field>
                    <FieldLabel>
                      Serial Number (Bisa Multiple)
                      <span className="ml-1 text-red-500">*</span>
                    </FieldLabel>
                    <FieldContent>
                      <div className="relative">
                        <input
                          type="text"
                          className={baseInputClass}
                          value={cardSerialNumber}
                          onChange={(e) => handleVoucherCardSearch(e.target.value)}
                          placeholder="Masukkan atau scan serial number..."
                          autoComplete="off"
                        />
                        {isSearchingCards && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                          </div>
                        )}
                        {cardSearchResults.length > 0 && (
                          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                            {cardSearchResults.map((card) => (
                              <button
                                key={card.id}
                                type="button"
                                onClick={() => {
                                  handleVoucherCardSelect(card);
                                  setTimeout(() => {
                                    handleAddSelectedCard();
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
                      {cardSerialNumber.length > 0 && 
                       cardSearchResults.length === 0 && 
                       !isSearchingCards &&
                       cardSerialNumber.length >= 6 && (
                        <p className="mt-1 text-xs text-red-600">
                          Voucher {cardSerialNumber} tidak tersedia
                        </p>
                      )}
                    </FieldContent>
                  </Field>
                )}

                {inputMode === "range" && (
                  <>
                    <Field>
                      <FieldLabel>
                        Voucher Category
                        <span className="ml-1 text-red-500">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <select
                          className={baseInputClass}
                          value={selectedCategoryId}
                          onChange={(e) => handleVoucherCategoryChange(e.target.value)}
                          disabled={loadingCategories}
                        >
                          <option value="">
                            {loadingCategories ? "Loading..." : "Select"}
                          </option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.categoryName}
                            </option>
                          ))}
                        </select>
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel>
                        Voucher Type
                        <span className="ml-1 text-red-500">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <select
                          className={baseInputClass}
                          value={selectedTypeId}
                          onChange={(e) => handleVoucherTypeChange(e.target.value)}
                          disabled={!selectedCategoryId || loadingTypes}
                        >
                          <option value="">
                            {loadingTypes ? "Loading..." : "Select"}
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
                            : types
                                .filter((t) => {
                                  if (!selectedCategoryId) return false;
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
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel>
                        Serial Number Awal
                        <span className="ml-1 text-red-500">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <div className="relative">
                          {(() => {
                            const rangeSerialPrefix = rangeStartSerial.slice(0, SERIAL_PREFIX_LEN);
                            const rangeSerialSuffix =
                              rangeStartSerial.length > SERIAL_PREFIX_LEN
                                ? rangeStartSerial.slice(SERIAL_PREFIX_LEN)
                                : "";
                            return (
                              <div className="flex">
                                <div
                                  className={`flex h-10 items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-3 text-sm font-medium text-gray-600 shrink-0 ${
                                    !selectedTypeId ? "opacity-60" : ""
                                  }`}
                                >
                                  {rangeSerialPrefix || "----"}
                                </div>
                                <div className="flex h-10 items-center border-y border-gray-300 bg-gray-100 px-2 text-gray-400 shrink-0">
                                  |
                                </div>
                                <input
                                  type="text"
                                  className="h-10 w-full min-w-0 rounded-r-md border border-l-0 border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
                                  value={rangeSerialSuffix}
                                  onChange={(e) => {
                                    const newSuffix = e.target.value;
                                    handleRangeSerialSearch(`${rangeSerialPrefix}${newSuffix}`);
                                  }}
                                  placeholder="Masukkan nomor (min 2 digit)..."
                                  autoComplete="off"
                                  disabled={!selectedTypeId}
                                />
                              </div>
                            );
                          })()}
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
                          {rangeStartSerial.length > 0 && rangeStartSerial.length < 6 && (
                            <p className="mt-1 text-xs text-gray-500">
                              Masukkan 2 digit tahun kartu dibuat untuk menampilkan rekomendasi
                            </p>
                          )}
                        </div>
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel>
                        Quantity (Jumlah Voucher)
                        <span className="ml-1 text-red-500">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            className={baseInputClass}
                            value={rangeQuantity}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val === "" || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 10000)) {
                                setRangeQuantity(val);
                              }
                            }}
                            placeholder="Contoh: 10"
                            min="1"
                            max="10000"
                            disabled={!selectedTypeId || !rangeStartSerial}
                          />
                          <Button
                            type="button"
                            onClick={handleAddRange}
                            disabled={
                              !selectedTypeId ||
                              !rangeStartSerial ||
                              !rangeQuantity ||
                              isAddingRange
                            }
                            className="whitespace-nowrap rounded-md bg-[#8B1538] px-4 py-2 text-sm font-medium text-white hover:bg-[#73122E] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isAddingRange ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus size={16} className="mr-1" />
                                Add Range
                              </>
                            )}
                          </Button>
                        </div>
                        {rangeStartSerial && rangeQuantity && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-blue-600">
                              📋 Range yang akan ditambahkan:{" "}
                              <span className="font-mono font-semibold">{rangeStartSerial}</span> -{" "}
                              <span className="font-mono font-semibold">
                                {(() => {
                                  const serials = generateSerialNumbers(
                                    rangeStartSerial,
                                    parseInt(rangeQuantity, 10)
                                  );
                                  return serials[serials.length - 1] || rangeStartSerial;
                                })()}
                              </span>{" "}
                              ({rangeQuantity} vouchers)
                            </p>
                            <p className="text-xs text-gray-500">
                              Maksimal 10000 voucher per range. Sistem akan mencari dan menambahkan semua voucher yang tersedia dalam range tersebut.
                            </p>
                          </div>
                        )}
                      </FieldContent>
                    </Field>
                  </>
                )}
              </div>

              {/* Right Column - Selected Vouchers */}
              <div className="flex flex-col">
                {selectedCards.length > 0 && (
                  <Field>
                    <div className="flex items-center justify-between mb-1">
                      <FieldLabel>Selected Vouchers ({selectedCards.length})</FieldLabel>
                      <button
                        type="button"
                        onClick={clearAllCards}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                        title="Hapus semua vouchers"
                      >
                        <Trash2 size={14} />
                        <span>Hapus Semua</span>
                      </button>
                    </div>
                    <FieldContent>
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
                                onClick={() => removeCard(card.cardId)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </FieldContent>
                  </Field>
                )}
              </div>
            </div>

            <FieldError
              errors={errors.cards ? [errors.cards] : undefined}
            />
          </SectionCard>

          {/* Bulk Discount and Price Summary */}
          {selectedCards.length > 0 && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="rounded-md border border-gray-200 p-4 w-full">
                <h3 className="mb-4 text-sm font-semibold text-gray-700">Bulk Discount</h3>
                <Field>
                  <FieldLabel>Bulk Discount</FieldLabel>
                  <FieldContent>
                    <select
                      className={baseInputClass}
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
                  </FieldContent>
                </Field>
              </div>

              <div className="rounded-md border border-gray-200 p-4 w-full">
                <h3 className="mb-4 text-sm font-semibold text-gray-700">Price Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({selectedCards.length} items):</span>
                    <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Information Section */}
          <SectionCard title="Payment Information" gridCols={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <Field>
                <FieldLabel>
                  No. Reference EDC
                  <span className="ml-1 text-red-500">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...register("edcReferenceNumber")}
                    className={baseInputClass}
                    maxLength={12}
                    placeholder="No. Reference EDC (max 12 digit)"
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value
                        .replace(/\D/g, "")
                        .slice(0, 12);
                    }}
                  />
                  <FieldError
                    errors={
                      errors.edcReferenceNumber
                        ? [errors.edcReferenceNumber]
                        : undefined
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>
                  Payment Method
                  <span className="ml-1 text-red-500">*</span>
                </FieldLabel>
                <FieldContent>
                  <select
                    {...register("paymentMethodId")}
                    className={baseInputClass}
                    disabled={loadingPaymentMethods}
                  >
                    <option value="">
                      {loadingPaymentMethods ? "Loading..." : "Pilih metode pembayaran"}
                    </option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    errors={
                      errors.paymentMethodId
                        ? [errors.paymentMethodId]
                        : undefined
                    }
                  />
                </FieldContent>
              </Field>
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white hover:bg-[#6B0F2B]"
              disabled={isSubmitting || selectedCards.length === 0}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>

      <SuccessModal
        open={showConfirm}
        title="Voucher Bulk Purchase Data"
        message="Please review the transaction data before continuing"
        data={{
          "Member Name": selectedMember?.name || "-",
          "Identity Number": selectedMember?.identityNumber || "-",
          "Number of Vouchers": selectedCards.length.toString(),
          "Subtotal": `Rp ${subtotal.toLocaleString("id-ID")}`,
          "Discount": discountAmount > 0 ? `Rp ${discountAmount.toLocaleString("id-ID")}` : "None",
          "Total Price": `Rp ${totalPrice.toLocaleString("id-ID")}`,
          "No. Reference EDC": form.getValues("edcReferenceNumber") || "-",
          "Payment Method": paymentMethods.find((m) => m.id === form.getValues("paymentMethodId"))?.name || "-",
        }}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
