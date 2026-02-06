"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

import SuccessModal from "@/app/dashboard/superadmin/membership/components/ui/SuccessModal";
import {
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { KTPUploadDetect } from "@/components/ui/ktp-upload-detect";
import { useCardSelection } from "@/hooks/useCardSelection";
import { useCategories } from "@/hooks/useCategories";
import { useCategoriesVoucher } from "@/hooks/useCategoriesVoucher";
import { useTypesVoucher } from "@/hooks/useTypesVoucher";
import { useVoucherBulkPurchaseForm } from "@/hooks/useVoucherBulkPurchaseForm";

import {
  useCreateMemberForm,
} from "@/components/membership/create-member/useCreateMemberForm";
import { useFwcManualSerialCheck } from "@/components/membership/create-member/useFwcManualSerialCheck";
import { useVoucherCardHandlers } from "@/components/membership/create-member/useVoucherCardHandlers";
import { useCreateMemberSubmit } from "@/components/membership/create-member/useCreateMemberSubmit";
import { useKtpOcr } from "@/components/membership/create-member/useKtpOcr";
import { useExpiredDateCalculation } from "@/components/membership/create-member/useExpiredDateCalculation";
import { SERIAL_PREFIX_LEN } from "@/components/membership/create-member/constants";
import type { CardProduct, CreateMemberPageProps } from "@/components/membership/create-member/types";
import { MemberFormField as Field } from "@/components/membership/create-member/MemberFormField";
import { SectionCard } from "@/components/membership/create-member/SectionCard";
import { MemberPersonalSection } from "@/components/membership/create-member/MemberPersonalSection";
import { MemberContactSection } from "@/components/membership/create-member/MemberContactSection";
import { FwcCardSection } from "@/components/membership/create-member/FwcCardSection";
import { VoucherCardSection } from "@/components/membership/create-member/VoucherCardSection";
import { CardValiditySection } from "@/components/membership/create-member/CardValiditySection";
import { PurchaseInfoSection } from "@/components/membership/create-member/PurchaseInfoSection";
import { OperationalSection } from "@/components/membership/create-member/OperationalSection";
import { PaymentSection } from "@/components/membership/create-member/PaymentSection";
import { buildSuccessModalData } from "@/components/membership/create-member/successModalData";

export default function AddMemberPage({ programType: programTypeProp }: CreateMemberPageProps = {}) {
  const router = useRouter();
  const programType: "FWC" | "VOUCHER" = programTypeProp ?? "FWC";

  const {
    form,
    setForm,
    fieldError,
    setFieldError,
    checking,
    identityType,
    setIdentityType,
    operatorName,
    employeeTypes,
    loadingEmployeeTypes,
    paymentMethods,
    loadingPaymentMethods,
    loadingCities,
    cityOptions,
    countryOptions,
    cardProducts,
    getFullPhoneNumber,
    handleChange,
    checkUniqueField,
  } = useCreateMemberForm();

  const nippKaiRef = useRef<HTMLInputElement>(null);
  const birthDateInputRef = useRef<HTMLInputElement>(null);

  // Input mode state — FWC: default "manual" (Serial Number) agar input langsung tampil
  const [inputMode, setInputMode] = useState<"" | "manual" | "recommendation" | "range">(
    programType === "FWC" ? "manual" : "",
  );

  // Card Selection Hook (FWC)
  const { categories, loading: loadingCategories } = useCategories();
  const {
    cardCategory,
    categoryId,
    cardTypes,
    cardTypeId,
    cardId,
    setCardId,
    price,
    setPrice,
    serialNumber,
    setSerialNumber,
    searchResults,
    isSearching,
    loadingTypes,
    handleCategoryChange,
    handleTypeChange,
    handleCardSearch,
    handleCardSelect,
  } = useCardSelection();

  const serialPrefix = serialNumber.slice(0, SERIAL_PREFIX_LEN);
  const serialSuffix =
    serialNumber.length > SERIAL_PREFIX_LEN
      ? serialNumber.slice(SERIAL_PREFIX_LEN)
      : "";

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
    clearAllCards: clearAllVoucherCards,
    bulkDiscounts,
    selectedBulkDiscountId,
    handleBulkDiscountChange,
    totalPrice: voucherTotalPrice,
    discountAmount: voucherDiscountAmount,
  } = useVoucherBulkPurchaseForm();

  // Voucher card handlers hook
  const voucherHandlers = useVoucherCardHandlers({
    inputMode,
    selectedCards,
    addVoucherCard,
    addVoucherCards,
  });

  // Check if selected card product is KAI category
  const isKAIProduct = cardCategory === "KAI" || 
    (cardTypeId && categoryId && cardProducts.some(
      (p) => p.typeId === cardTypeId && 
             p.categoryId === categoryId && 
             p.category?.categoryName === "KAI"
    ));

  // FWC manual serial check hook
  const {
    manualSerialChecking,
    manualSerialResult,
    manualSerialMessage,
    manualFwcPrice,
  } = useFwcManualSerialCheck({
    programType,
    inputMode,
    serialNumber,
    setCardId,
    setPrice,
    setSerialNumber,
    handleCardSelect,
  });

  // Harga FWC yang ditampilkan: manual mode pakai manualFwcPrice dari API, selain itu dari hook
  const displayFwcPrice =
    programType === "FWC" &&
    inputMode === "manual" &&
    manualSerialResult === "available"
      ? manualFwcPrice
      : price;

  // Expired date calculation hook
  useExpiredDateCalculation({
    programType,
    form,
    setForm,
    cardTypeId,
    categoryId,
    cardProducts,
    selectedVoucherTypeId: voucherHandlers.selectedVoucherTypeId,
    voucherProducts: voucherHandlers.voucherProducts,
  });



  const onlyNumber = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
  };

  // KTP OCR hook
  const { isExtractingOCR, handleExtractOCR } = useKtpOcr({
    setForm,
    setIdentityType,
  });

  // Submit hook
  const {
    showSuccess,
    setShowSuccess,
    isSubmitting,
    handleSubmit,
    handleConfirmSubmit,
  } = useCreateMemberSubmit({
    programType,
    form,
    identityType,
    cardId,
    cardCategory,
    displayFwcPrice,
    selectedCards,
    voucherForm,
    voucherTotalPrice,
    operatorName,
    getFullPhoneNumber,
    nippKaiRef,
  });

  const handleKTPImageChange = (_file: File | null) => {
    // Image is handled by KTPUploadDetect component
  };

  const handleKTPDetectionComplete = (
    _sessionId: string,
    _croppedImageBase64: string,
  ) => {
    // Detection is handled by KTPUploadDetect component
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

            <MemberPersonalSection
              programType={programType}
              form={form}
              setForm={setForm}
              fieldError={fieldError}
              setFieldError={setFieldError}
              checking={checking}
              identityType={identityType}
              setIdentityType={setIdentityType}
              checkUniqueField={checkUniqueField}
              handleChange={handleChange}
              employeeTypes={employeeTypes}
              loadingEmployeeTypes={loadingEmployeeTypes}
              isKAIProduct={isKAIProduct}
              nippKaiRef={nippKaiRef}
              birthDateInputRef={birthDateInputRef}
              onlyNumber={onlyNumber}
            />

            <MemberContactSection
              programType={programType}
              form={form}
              setForm={setForm}
              handleChange={handleChange}
              countryOptions={countryOptions}
              cityOptions={cityOptions}
              loadingCities={loadingCities}
            />

            {/* Card Information */}
            <SectionCard title={programType === "VOUCHER" ? "Select Vouchers (Bulk)" : "Card Information"} gridCols={1} className="w-full">
              {programType === "FWC" ? (
                <FwcCardSection
                  inputMode={inputMode === "range" ? "" : (inputMode as "" | "manual" | "recommendation")}
                  setInputMode={(mode) => {
                    setInputMode(mode as "" | "manual" | "recommendation" | "range");
                  }}
                  serialNumber={serialNumber}
                  setSerialNumber={setSerialNumber}
                  manualSerialChecking={manualSerialChecking}
                  manualSerialResult={manualSerialResult}
                  manualSerialMessage={manualSerialMessage}
                  cardCategory={cardCategory}
                  cardTypeId={cardTypeId}
                  cardTypes={cardTypes}
                  categories={categories}
                  loadingCategories={loadingCategories}
                  loadingTypes={loadingTypes}
                  serialPrefix={serialPrefix}
                  serialSuffix={serialSuffix}
                  searchResults={searchResults}
                  isSearching={isSearching}
                  cardId={cardId}
                  price={displayFwcPrice}
                  handleCategoryChange={handleCategoryChange}
                  handleTypeChange={handleTypeChange}
                  handleCardSearch={handleCardSearch}
                  handleCardSelect={handleCardSelect}
                  Field={Field}
                />
              ) : (
                <VoucherCardSection
                  inputMode={(inputMode === "recommendation" ? "" : inputMode) as "" | "manual" | "range"}
                  setInputMode={(mode) => setInputMode(mode as "" | "manual" | "recommendation" | "range")}
                  voucherCardSerialNumber={voucherHandlers.voucherCardSerialNumber}
                  handleVoucherCardSearch={voucherHandlers.handleVoucherCardSearch}
                  selectedVoucherCardId={voucherHandlers.selectedVoucherCardId}
                  handleVoucherCardSelect={voucherHandlers.handleVoucherCardSelect}
                  handleAddSelectedVoucherCard={voucherHandlers.handleAddSelectedVoucherCard}
                  isSearchingVoucherCards={voucherHandlers.isSearchingVoucherCards}
                  voucherCardSearchResults={voucherHandlers.voucherCardSearchResults}
                  voucherCategories={voucherCategories}
                  loadingVoucherCategories={loadingVoucherCategories}
                  selectedVoucherCategoryId={voucherHandlers.selectedVoucherCategoryId}
                  handleVoucherCategoryChange={voucherHandlers.handleVoucherCategoryChange}
                  selectedVoucherTypeId={voucherHandlers.selectedVoucherTypeId}
                  handleVoucherTypeChange={voucherHandlers.handleVoucherTypeChange}
                  voucherProducts={voucherHandlers.voucherProducts}
                  voucherTypes={voucherTypes}
                  loadingVoucherTypes={loadingVoucherTypes}
                  rangeStartSerial={voucherHandlers.rangeStartSerial}
                  handleRangeSerialSearch={voucherHandlers.handleRangeSerialSearch}
                  isSearchingRange={voucherHandlers.isSearchingRange}
                  rangeSearchResults={voucherHandlers.rangeSearchResults}
                  handleRangeCardSelect={voucherHandlers.handleRangeCardSelect}
                  rangeQuantity={voucherHandlers.rangeQuantity}
                  setRangeQuantity={voucherHandlers.setRangeQuantity}
                  handleAddRange={voucherHandlers.handleAddRange}
                  isAddingRange={voucherHandlers.isAddingRange}
                  selectedCards={selectedCards}
                  removeVoucherCard={removeVoucherCard}
                  clearAllVoucherCards={clearAllVoucherCards}
                  bulkDiscounts={bulkDiscounts}
                  selectedBulkDiscountId={selectedBulkDiscountId}
                  handleBulkDiscountChange={handleBulkDiscountChange}
                  voucherDiscountAmount={voucherDiscountAmount}
                  voucherTotalPrice={voucherTotalPrice}
                  Field={Field}
                />
              )}
            </SectionCard>

            <CardValiditySection
              membershipDate={form.membershipDate}
              expiredDate={form.expiredDate}
              Field={Field}
            />

            <PurchaseInfoSection
              programType={programType}
              purchasedDate={form.purchasedDate}
              displayFwcPrice={displayFwcPrice}
              selectedCards={selectedCards}
              voucherDiscountAmount={voucherDiscountAmount}
              voucherTotalPrice={voucherTotalPrice}
              Field={Field}
            />

            <OperationalSection
              station={form.station}
              shiftDate={form.shiftDate}
              Field={Field}
            />

            <PaymentSection
              programType={programType}
              edcReferenceNumber={form.edcReferenceNumber}
              onEdcChange={(e) => {
                      handleChange(e);
                      setFieldError((p) => ({
                        ...p,
                        edcReferenceNumber: undefined,
                      }));
                    }}
              onEdcInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value
                          .replace(/\D/g, "")
                          .slice(0, 12);
                      }}
              onEdcBlur={() => {
                      if (form.edcReferenceNumber.length >= 6) {
                        checkUniqueField(
                          "edcReferenceNumber",
                    form.edcReferenceNumber
                        );
                      }
                    }}
              edcFieldError={fieldError.edcReferenceNumber}
              edcChecking={checking.edcReferenceNumber}
              voucherEdcRegister={voucherForm.register("edcReferenceNumber")}
              paymentMethodId={form.paymentMethodId}
              onPaymentMethodChange={handleChange}
              paymentMethods={paymentMethods}
              loadingPaymentMethods={loadingPaymentMethods}
              Field={Field}
            />

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
        data={buildSuccessModalData({
          form,
          programType,
          getFullPhoneNumber,
          paymentMethodName:
            paymentMethods.find((m) => m.id === form.paymentMethodId)?.name ||
            "-",
          cardCategory,
          cardTypeName:
            cardTypes.find((t) => t.id === cardTypeId)?.typeName || "-",
          serialNumber,
          selectedCardsCount: selectedCards.length,
          voucherSubtotal: `Rp ${selectedCards
                  .reduce((sum, card) => sum + (card.price || 0), 0)
                  .toLocaleString("id-ID")}`,
          voucherDiscountLabel:
                  voucherDiscountAmount > 0
                    ? `Rp ${voucherDiscountAmount.toLocaleString("id-ID")}`
                    : "None",
          voucherTotalPrice: `Rp ${voucherTotalPrice.toLocaleString("id-ID")}`,
          displayFwcPrice,
          cardProductTotalQuota: cardProducts.find(
            (p) => p.typeId === cardTypeId
          )?.totalQuota,
          edcReferenceNumber:
            programType === "FWC"
              ? form.edcReferenceNumber
              : voucherForm.getValues("edcReferenceNumber") || "-",
        })}
        onClose={() => setShowSuccess(false)}
        onConfirm={handleConfirmSubmit}
        loading={isSubmitting}
      />
    </>
  );
}
