"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle, CreditCard, Tag, DollarSign, Calendar } from "lucide-react";
import axios from "@/lib/axios";
import toast from "react-hot-toast";

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

import { usePurchaseForm } from "@/hooks/usePurchaseForm";
import { useCardSelection } from "@/hooks/useCardSelection";
import { useCategories } from "@/hooks/useCategories";
import { useMemberSearch } from "@/hooks/useMemberSearch";
import { getPaymentMethods, type PaymentMethod } from "@/lib/services/payment-method.service";
import { SERIAL_PREFIX_LEN } from "@/components/membership/create-member/constants";

const baseInputClass =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

type Role = "superadmin" | "admin" | "supervisor" | "petugas";

interface CreatePurchasePageProps {
  role: Role;
}

export default function CreatePurchasePage({ role }: CreatePurchasePageProps) {
  const router = useRouter();
  const { categories, loading: loadingCategories } = useCategories();

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Input mode state — default "manual" seperti membership/create (FWC)
  const [inputMode, setInputMode] = useState<"" | "manual" | "recommendation">(
    "manual",
  );

  // Validasi serial manual (GET /cards/serial/{serialNumber}) — sama seperti membership/create
  const [manualSerialChecking, setManualSerialChecking] = useState(false);
  const [manualSerialResult, setManualSerialResult] = useState<
    null | "available" | "unavailable" | "not_found"
  >(null);
  const [manualSerialMessage, setManualSerialMessage] = useState("");
  const [manualFwcPrice, setManualFwcPrice] = useState<number>(0);
  const manualSerialDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Card info state
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [loadingCardInfo, setLoadingCardInfo] = useState(false);

  const {
    form,
    isSubmitting,
    showConfirm,
    setShowConfirm,
    openConfirmDialog,
    handleConfirm,
  } = usePurchaseForm();

  const {
    query: memberQuery,
    setQuery: setMemberQuery,
    members,
    loading: loadingMembers,
    selectedMember,
    setSelectedMember,
    reset: resetMemberSearch,
  } = useMemberSearch();

  const {
    cardCategory,
    cardTypes,
    cardTypeId,
    cards,
    cardId,
    price,
    setPrice,
    serialNumber,
    setSerialNumber,
    setCardId,
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

  // Calculate serial prefix and suffix for split input display
  const serialPrefix = serialNumber.slice(0, SERIAL_PREFIX_LEN);
  const serialSuffix =
    serialNumber.length > SERIAL_PREFIX_LEN
      ? serialNumber.slice(SERIAL_PREFIX_LEN)
      : "";

  // FWC price: manual mode pakai manualFwcPrice dari API, selain itu dari hook
  const displayFwcPrice =
    inputMode === "manual" && manualSerialResult === "available"
      ? manualFwcPrice
      : price;

  useEffect(() => {
    form.setValue("cardCategory", (cardCategory || "") as any);
  }, [cardCategory, form]);

  useEffect(() => {
    form.setValue("cardTypeId", cardTypeId || "");
  }, [cardTypeId, form]);

  useEffect(() => {
    // When serialNumber changes, find the card with matching serial number
    const findCard = async () => {
      if (serialNumber && cardId) {
        form.setValue("cardId", cardId);
      }
    };
    findCard();
  }, [serialNumber, cardId, form]);

  useEffect(() => {
    form.setValue("price", price);
  }, [price, form]);

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

  // Validasi serial manual via GET /cards/serial/{serialNumber} (sama seperti membership/create)
  useEffect(() => {
    if (inputMode !== "manual") {
      setManualSerialResult(null);
      setManualSerialMessage("");
      return;
    }

    const sn = serialNumber.trim();
    if (!sn) {
      setCardId("");
      setPrice(0);
      setManualFwcPrice(0);
      setManualSerialResult(null);
      setManualSerialMessage("");
      return;
    }

    if (manualSerialDebounceRef.current) {
      clearTimeout(manualSerialDebounceRef.current);
    }

    manualSerialDebounceRef.current = setTimeout(async () => {
      setManualSerialResult(null);
      setManualSerialMessage("");
      setManualSerialChecking(true);
      try {
        const response = await axios.get(
          `/cards/serial/${encodeURIComponent(sn)}`
        );
        const data = response.data?.data;
        if (!data) {
          setCardId("");
          setPrice(0);
          setManualFwcPrice(0);
          setManualSerialResult("not_found");
          setManualSerialMessage("Serial number tidak ditemukan");
          return;
        }
        if (data.status === "Stasiun") {
          // Hanya set cardId & price — jangan setSerialNumber agar effect tidak re-run (request terus)
          setCardId(data.id);
          const rawPrice = data.cardProduct?.price;
          const cardPrice =
            rawPrice != null && rawPrice !== ""
              ? Number(rawPrice)
              : 0;
          setPrice(cardPrice);
          setManualFwcPrice(cardPrice);
          setManualSerialResult("available");
          setManualSerialMessage("Kartu tersedia untuk dibeli");
        } else {
          setCardId("");
          setPrice(0);
          setManualFwcPrice(0);
          setManualSerialResult("unavailable");
          setManualSerialMessage(
            `Kartu tidak tersedia (status: ${data.status || "unknown"})`
          );
        }
      } catch (err: any) {
        setCardId("");
        setPrice(0);
        setManualFwcPrice(0);
        setManualSerialResult("not_found");
        setManualSerialMessage(
          err?.response?.data?.error?.message ||
            "Serial number tidak ditemukan"
        );
      } finally {
        setManualSerialChecking(false);
      }
    }, 400);

    return () => {
      if (manualSerialDebounceRef.current) {
        clearTimeout(manualSerialDebounceRef.current);
      }
    };
  }, [inputMode, serialNumber]);

  // Fetch card details when cardId changes
  useEffect(() => {
    if (!cardId || cardId === "") {
      setCardInfo(null);
      return;
    }

    const fetchCardInfo = async () => {
      try {
        setLoadingCardInfo(true);
        const response = await axios.get(`/cards/${cardId}`);
        const data = response.data?.data;
        if (data) {
          setCardInfo(data);
        }
      } catch (error) {
        console.error("Error fetching card info:", error);
        setCardInfo(null);
      } finally {
        setLoadingCardInfo(false);
      }
    };

    fetchCardInfo();
  }, [cardId]);

  const formatPrice = (priceValue: number | string | undefined) => {
    if (!priceValue) return "Rp 0";
    const numPrice = typeof priceValue === "string" ? Number(priceValue) : priceValue;
    return `Rp ${numPrice.toLocaleString("id-ID")}`;
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      "Stasiun": "Tersedia",
      "IN_STATION": "Tersedia",
      "ACTIVE": "Aktif",
      "INACTIVE": "Tidak Aktif",
      "DAMAGED": "Rusak",
    };
    return statusMap[status] || status;
  };

  // Card Info Component
  const CardInfoDisplay = () => {
    if (!cardId || (!cardInfo && !loadingCardInfo)) return null;

    return (
      <div className="flex flex-col w-full">
        {loadingCardInfo ? (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : cardInfo ? (
          <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Serial Number</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">
                    {cardInfo.serialNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Kategori</p>
                    <p className="text-sm font-medium text-gray-900">
                      {cardInfo.cardProduct?.category?.categoryName || cardCategory || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Tipe</p>
                    <p className="text-sm font-medium text-gray-900">
                      {cardInfo.cardProduct?.type?.typeName || 
                       cardTypes.find(t => t.id === cardTypeId)?.typeName || 
                       "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Harga</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatPrice(cardInfo.cardProduct?.price || displayFwcPrice)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium text-green-600">
                      {formatStatus(cardInfo.status)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            className="rounded p-1 hover:bg-gray-100"
            type="button"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Add Purchase</h1>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            openConfirmDialog();
          }}
          className="space-y-4 rounded-lg border bg-white p-6"
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
                  placeholder={
                    cardCategory === "KAI"
                      ? "Cari NIPP KAI (min 3 karakter)..."
                      : "Cari NIK Customer (min 3 karakter)..."
                  }
                />
                <FieldError
                  errors={
                    errors.identityNumber ? [errors.identityNumber] : undefined
                  }
                />
              </FieldContent>
            </Field>
          </SectionCard>

          <SectionCard title="Card Information" gridCols={1} className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {/* Left Column - All Input Fields */}
              <div className="flex flex-col gap-4 w-full">
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
                          | "recommendation";
                        setInputMode(mode);
                        setSerialNumber("");
                        setManualSerialResult(null);
                        setManualSerialMessage("");
                        setManualFwcPrice(0);
                      }}
                    >
                      <option value="">Pilih Mode Input</option>
                      <option value="manual">Input Manual / Scan Barcode</option>
                      <option value="recommendation">Rekomendasi</option>
                    </select>
                    {inputMode === "" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Pilih mode input serial number terlebih dahulu
                    </p>
                    )}
                  </FieldContent>
                </Field>

                {inputMode === "manual" && (
                  <Field>
                    <FieldLabel>
                      Serial Number
                      <span className="ml-1 text-red-500">*</span>
                    </FieldLabel>
                    <FieldContent>
                      <input
                        type="text"
                        className={baseInputClass}
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="Masukkan atau scan serial number lengkap..."
                        autoComplete="off"
                      />
                      {manualSerialChecking && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" size={14} />
                          Mengecek ketersediaan kartu...
                        </p>
                      )}
                      {!manualSerialChecking && manualSerialResult === "available" && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={14} />
                          {manualSerialMessage}
                        </p>
                      )}
                      {!manualSerialChecking &&
                        (manualSerialResult === "unavailable" || manualSerialResult === "not_found") && (
                          <p className="mt-1 text-xs text-red-600">
                            {manualSerialMessage}
                          </p>
                        )}
                      <FieldError
                        errors={errors.cardId ? [errors.cardId] : undefined}
                      />
                    </FieldContent>
                  </Field>
                )}

                {inputMode === "recommendation" && (
                  <>
                    <Field>
                      <FieldLabel>Card Category</FieldLabel>
                      <FieldContent>
                        <select
                          className={baseInputClass}
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
                            Pilih kategori kartu (opsional)
                          </p>
                        )}
                        <FieldError
                          errors={
                            errors.cardCategory ? [errors.cardCategory] : undefined
                          }
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel>Card Type</FieldLabel>
                      <FieldContent>
                        <select
                          className={baseInputClass}
                          value={cardTypeId}
                          onChange={(e) => handleTypeChange(e.target.value)}
                          disabled={loadingTypes}
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
                              
                            </p>
                          )
                        )}
                        <FieldError
                          errors={
                            errors.cardTypeId ? [errors.cardTypeId] : undefined
                          }
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel>
                        Serial Number
                        <span className="ml-1 text-red-500">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <div className="relative">
                          <div className="flex">
                            <div className="flex h-10 items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-3 text-sm font-medium text-gray-600 shrink-0">
                              {serialPrefix || "----"}
                            </div>
                            <div className="flex h-10 items-center border-y border-gray-300 bg-gray-100 px-2 text-gray-400 shrink-0">
                              |
                            </div>
                            <input
                              type="text"
                              className="h-10 w-full min-w-0 rounded-r-md border border-l-0 border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
                              value={serialSuffix}
                              onChange={(e) => {
                                handleCardSearch(`${serialPrefix}${e.target.value}`);
                              }}
                              placeholder="Masukkan nomor (min 2 digit)..."
                              autoComplete="off"
                            />
                          </div>
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
                        {cardId && serialNumber && (
                          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle size={14} />
                            Kartu tersedia untuk dibeli
                          </p>
                        )}
                        {serialNumber &&
                          searchResults.length === 0 &&
                          !isSearching &&
                          serialNumber.length >= 6 &&
                          !cardId && (
                            <p className="mt-1 text-xs text-red-600">
                              Tidak ada kartu ditemukan dengan serial number ini
                            </p>
                          )}
                        {serialNumber.length > 0 && serialNumber.length < 6 && !cardId && (
                          <p className="mt-1 text-xs text-gray-500">
                            Masukkan 2 digit tahun kartu dibuat untuk menampilkan
                            rekomendasi
                          </p>
                        )}
                        <FieldError
                          errors={errors.cardId ? [errors.cardId] : undefined}
                        />
                      </FieldContent>
                    </Field>
                  </>
                )}

                <Field>
                  <FieldLabel>FWC Price</FieldLabel>
                  <FieldContent>
                    <Input
                      className={`${baseInputClass} bg-gray-50`}
                      readOnly
                      value={displayFwcPrice}
                    />
                  </FieldContent>
                </Field>
              </div>

              {/* Right Column - Card Info */}
              <div className="w-full">
                <CardInfoDisplay />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="System Info">
            <Field>
              <FieldLabel>Purchase Date</FieldLabel>
              <FieldContent>
                <Input
                  {...register("purchaseDate")}
                  className={`${baseInputClass} bg-gray-50`}
                  readOnly
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Shift Date</FieldLabel>
              <FieldContent>
                <Input
                  {...register("shiftDate")}
                  className={`${baseInputClass} bg-gray-50`}
                  readOnly
                />
              </FieldContent>
            </Field>
          </SectionCard>

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
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>

      <SuccessModal
        open={showConfirm}
        title="Transaction Data"
        message="Please review the transaction data before continuing"
        data={{
          // Customer
          "Member Name": selectedMember?.name || "-",
          "Identity Number": selectedMember?.identityNumber || "-",

          // Card Info
          "Card Category": cardCategory || "-",
          "Card Type":
            cardTypes.find((t) => t.id === cardTypeId)?.typeName || "-",
          "Serial Number": serialNumber || "-",

          // Transaction
          "Purchase Date": form.getValues("purchaseDate") || "-",
          "Shift Date": form.getValues("shiftDate") || "-",
          "FWC Price": `Rp ${form.getValues("price")?.toLocaleString("id-ID") || 0}`,
          "No. Reference EDC": form.getValues("edcReferenceNumber") || "-",
          "Payment Method": paymentMethods.find((m) => m.id === form.getValues("paymentMethodId"))?.name || "-",
        }}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
