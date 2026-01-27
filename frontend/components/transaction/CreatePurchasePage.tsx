"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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

const baseInputClass =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

type Role = "superadmin" | "admin" | "supervisor" | "petugas";

interface CreatePurchasePageProps {
  role: Role;
}

export default function CreatePurchasePage({ role }: CreatePurchasePageProps) {
  const router = useRouter();
  const { categories, loading: loadingCategories } = useCategories();

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

  console.log(cardTypes);

  useEffect(() => {
    if (cardCategory) {
      form.setValue("cardCategory", cardCategory as "GOLD" | "SILVER" | "KAI");
    }
  }, [cardCategory, form]);

  useEffect(() => {
    form.setValue("cardTypeId", cardTypeId);
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

          <SectionCard title="Card">
            <Field>
              <FieldLabel>
                Card Category
                <span className="ml-1 text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <select
                  className={baseInputClass}
                  value={cardCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as any)}
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
                <FieldError
                  errors={
                    errors.cardCategory ? [errors.cardCategory] : undefined
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                Card Type
                <span className="ml-1 text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <select
                  className={baseInputClass}
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
                <FieldError
                  errors={errors.cardTypeId ? [errors.cardTypeId] : undefined}
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
                  <input
                    type="text"
                    className={baseInputClass}
                    value={serialNumber}
                    onChange={(e) => handleCardSearch(e.target.value)}
                    placeholder="Masukkan 2 digit tahun kartu dibuat + nomor (min 6 karakter)..."
                    autoComplete="off"
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
                    Masukkan 2 digit tahun kartu dibuat + nomor (minimal 6 karakter total)
                  </p>
                )}
                <FieldError
                  errors={errors.cardId ? [errors.cardId] : undefined}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>FWC Price</FieldLabel>
              <FieldContent>
                <Input
                  className={`${baseInputClass} bg-gray-50`}
                  readOnly
                  value={price}
                />
              </FieldContent>
            </Field>
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

          <Field>
            <FieldLabel>
              No. Reference EDC
              <span className="ml-1 text-red-500">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                {...register("edcReferenceNumber")}
                className={baseInputClass}
                maxLength={20}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value
                    .replace(/\D/g, "")
                    .slice(0, 20);
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
        }}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
