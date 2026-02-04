"use client";

import { Fragment } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { baseInputClass as base } from "./constants";
import { MemberFormField } from "./MemberFormField";

interface CategoryOption {
  id: string;
  value: string;
  label: string;
}

interface CardTypeOption {
  id: string;
  typeName: string;
}

interface SearchResultCard {
  id: string;
  serialNumber: string;
}

interface FwcCardSectionProps {
  inputMode: "" | "manual" | "recommendation";
  setInputMode: (mode: "" | "manual" | "recommendation") => void;
  serialNumber: string;
  setSerialNumber: (value: string) => void;
  manualSerialChecking: boolean;
  manualSerialResult: "available" | "unavailable" | "not_found" | null;
  manualSerialMessage: string;
  cardCategory: string;
  cardTypeId: string;
  cardTypes: CardTypeOption[];
  categories: CategoryOption[];
  loadingCategories: boolean;
  loadingTypes: boolean;
  serialPrefix: string;
  serialSuffix: string;
  searchResults: SearchResultCard[];
  isSearching: boolean;
  cardId: string;
  handleCategoryChange: (value: string) => void;
  handleTypeChange: (typeId: string) => void;
  handleCardSearch: (query: string) => void;
  handleCardSelect: (card: SearchResultCard) => void;
  Field?: (props: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => React.ReactElement;
}

export function FwcCardSection({
  inputMode,
  setInputMode,
  serialNumber,
  setSerialNumber,
  manualSerialChecking,
  manualSerialResult,
  manualSerialMessage,
  cardCategory,
  cardTypeId,
  cardTypes,
  categories,
  loadingCategories,
  loadingTypes,
  serialPrefix,
  serialSuffix,
  searchResults,
  isSearching,
  cardId,
  handleCategoryChange,
  handleTypeChange,
  handleCardSearch,
  handleCardSelect,
  Field = MemberFormField,
}: FwcCardSectionProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <Field label="Mode Input Serial Number" required>
        <select
          className={base}
          value={inputMode}
          onChange={(e) => {
            const mode = e.target.value as "" | "manual" | "recommendation";
            setInputMode(mode);
            setSerialNumber("");
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
          {manualSerialChecking && (
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" size={14} />
              Mengecek ketersediaan kartu...
            </p>
          )}
          {!manualSerialChecking && manualSerialResult === "available" && (
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle size={14} />
              {manualSerialMessage}
            </p>
          )}
          {!manualSerialChecking &&
            (manualSerialResult === "unavailable" ||
              manualSerialResult === "not_found") && (
              <p className="mt-1 text-xs text-red-600">
                {manualSerialMessage}
              </p>
            )}
        </Field>
      )}

      {inputMode === "recommendation" && (
        <Fragment>
          <div className="flex flex-col gap-4">
            <Field label="Card Category">
              <select
                className={base}
                value={cardCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
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

            <Field label="Card Type">
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
                <div className="flex">
                  <div
                    className={`flex h-10 items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-3 text-sm font-medium text-gray-600 shrink-0 ${
                      !cardTypeId ? "opacity-60" : ""
                    }`}
                  >
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
                    disabled={!cardTypeId}
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
                  Masukkan 2 digit tahun kartu dibuat untuk menampilkan
                  rekomendasi
                </p>
              )}
            </Field>
          </div>
        </Fragment>
      )}
    </div>
  );
}
