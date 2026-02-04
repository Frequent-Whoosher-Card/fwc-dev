"use client";

import { Plus, X, Loader2, Trash2 } from "lucide-react";
import { baseInputClass as base, SERIAL_PREFIX_LEN } from "./constants";
import { MemberFormField } from "./MemberFormField";
import { SectionCard } from "./SectionCard";

interface VoucherCategory {
  id: string;
  categoryName: string;
}

interface VoucherType {
  id: string;
  typeName: string;
}

interface VoucherCardItem {
  id: string;
  serialNumber: string;
}

interface SelectedCard {
  cardId: string;
  serialNumber: string;
  price: number;
}

interface BulkDiscount {
  id: number;
  minQuantity: number;
  maxQuantity: number | null;
  discount: number | string;
}

interface VoucherCardSectionProps {
  inputMode: "" | "manual" | "range";
  setInputMode: (mode: "" | "manual" | "range") => void;
  voucherCardSerialNumber: string;
  handleVoucherCardSearch: (query: string) => void;
  selectedVoucherCardId: string;
  handleVoucherCardSelect: (card: VoucherCardItem) => void;
  handleAddSelectedVoucherCard: () => void;
  isSearchingVoucherCards: boolean;
  voucherCardSearchResults: VoucherCardItem[];
  voucherCategories: VoucherCategory[];
  loadingVoucherCategories: boolean;
  selectedVoucherCategoryId: string;
  handleVoucherCategoryChange: (categoryId: string) => void;
  selectedVoucherTypeId: string;
  handleVoucherTypeChange: (typeId: string) => void;
  voucherProducts: any[];
  voucherTypes: VoucherType[];
  loadingVoucherTypes: boolean;
  rangeStartSerial: string;
  handleRangeSerialSearch: (query: string) => void;
  isSearchingRange: boolean;
  rangeSearchResults: VoucherCardItem[];
  handleRangeCardSelect: (card: VoucherCardItem) => void;
  rangeQuantity: string;
  setRangeQuantity: (val: string) => void;
  handleAddRange: () => void;
  isAddingRange: boolean;
  selectedCards: SelectedCard[];
  removeVoucherCard: (cardId: string) => void;
  clearAllVoucherCards: () => void;
  bulkDiscounts: BulkDiscount[];
  selectedBulkDiscountId: number | undefined;
  handleBulkDiscountChange: (id: number | undefined) => void;
  voucherDiscountAmount: number;
  voucherTotalPrice: number;
  Field?: (props: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => React.ReactElement;
}

export function VoucherCardSection({
  inputMode,
  setInputMode,
  voucherCardSerialNumber,
  handleVoucherCardSearch,
  selectedVoucherCardId,
  handleVoucherCardSelect,
  handleAddSelectedVoucherCard,
  isSearchingVoucherCards,
  voucherCardSearchResults,
  voucherCategories,
  loadingVoucherCategories,
  selectedVoucherCategoryId,
  handleVoucherCategoryChange,
  selectedVoucherTypeId,
  handleVoucherTypeChange,
  voucherProducts,
  voucherTypes,
  loadingVoucherTypes,
  rangeStartSerial,
  handleRangeSerialSearch,
  isSearchingRange,
  rangeSearchResults,
  handleRangeCardSelect,
  rangeQuantity,
  setRangeQuantity,
  handleAddRange,
  isAddingRange,
  selectedCards,
  removeVoucherCard,
  clearAllVoucherCards,
  bulkDiscounts,
  selectedBulkDiscountId,
  handleBulkDiscountChange,
  voucherDiscountAmount,
  voucherTotalPrice,
  Field = MemberFormField,
}: VoucherCardSectionProps) {
  const voucherTypeOptions =
    voucherProducts.length > 0
      ? voucherProducts.reduce((acc: any[], product: any) => {
          if (product.type && !acc.find((t: any) => t.id === product.type.id)) {
            acc.push(product.type);
          }
          return acc;
        }, [])
      : voucherTypes.filter((t) =>
          voucherProducts.some((p: any) => p.type?.id === t.id)
        );

  const handleClearAllVouchers = () => {
    clearAllVoucherCards();
  };

  // Calculate prefix and suffix for range start serial
  const rangeSerialPrefix = rangeStartSerial.slice(0, SERIAL_PREFIX_LEN);
  const rangeSerialSuffix =
    rangeStartSerial.length > SERIAL_PREFIX_LEN
      ? rangeStartSerial.slice(SERIAL_PREFIX_LEN)
      : "";

  return (
    <>
      {/* Left Column - All Input Fields */}
      <div className="flex flex-col gap-4">
        <Field label="Mode Input Serial Number" required>
          <select
            className={base}
            value={inputMode}
            onChange={(e) => {
              const mode = e.target.value as
                | ""
                | "manual"
                | "range";
              setInputMode(mode);
            }}
          >
            <option value="">Pilih Mode Input</option>
            <option value="manual">
              Input Manual / Scan Barcode (Satu per Satu)
            </option>
            <option value="range">
              Range (Bulk - Serial Number Awal + Quantity)
            </option>
          </select>
        </Field>

        {/* Conditional Input Fields */}
        {inputMode === "manual" && (
        <Field label="Serial Number (Bisa Multiple)" required>
          <div className="relative">
            <input
              type="text"
              className={base}
              value={voucherCardSerialNumber}
              onChange={(e) => handleVoucherCardSearch(e.target.value)}
              placeholder="Masukkan atau scan serial number..."
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
                      setTimeout(() => handleAddSelectedVoucherCard(), 100);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    {card.serialNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
          {voucherCardSerialNumber.length > 0 && 
           voucherCardSearchResults.length === 0 && 
           !isSearchingVoucherCards &&
           voucherCardSerialNumber.length >= 6 && (
            <p className="mt-1 text-xs text-red-600">
              Voucher {voucherCardSerialNumber} tidak tersedia
            </p>
          )}
        </Field>
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
              disabled={
                !selectedVoucherCategoryId || loadingVoucherTypes
              }
            >
              <option value="">
                {loadingVoucherTypes ? "Loading..." : "Select"}
              </option>
              {voucherTypeOptions.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.typeName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Serial Number Awal" required>
            <div className="relative">
              <div className="flex">
                <div
                  className={`flex h-10 items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-3 text-sm font-medium text-gray-600 shrink-0 ${
                    !selectedVoucherTypeId ? "opacity-60" : ""
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
                  disabled={!selectedVoucherTypeId}
                />
              </div>
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
          </Field>
          <Field label="Quantity (Jumlah Voucher)" required>
            <div className="flex gap-2">
              <input
                type="number"
                className={base}
                value={rangeQuantity}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (
                    val === "" ||
                    (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100)
                  ) {
                    setRangeQuantity(val);
                  }
                }}
                placeholder="Contoh: 10"
                min={1}
                max={100}
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
                className="whitespace-nowrap rounded-md bg-[#8B1538] px-4 py-2 text-sm font-medium text-white hover:bg-[#73122E] disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      {/* Right Column - Selected Vouchers Only */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500">
            {selectedCards.length > 0 ? `Selected Vouchers (${selectedCards.length})` : "Selected Vouchers"}
          </label>
          {selectedCards.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllVouchers}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
              title="Hapus semua vouchers"
            >
              <Trash2 size={14} />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>
        {selectedCards.length > 0 ? (
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
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50">
            <p className="text-sm text-gray-400 text-center py-4">
              Belum ada voucher dipilih
            </p>
          </div>
        )}
      </div>

      {selectedCards.length > 0 && (
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="rounded-md border border-gray-200 p-4 w-full">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Bulk Discount</h3>
            <Field label="Bulk Discount">
              <select
                className={base}
                value={selectedBulkDiscountId ?? ""}
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
              {bulkDiscounts.filter((discount) => {
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
          </div>

          <div className="rounded-md border border-gray-200 p-4 w-full">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Price Summary</h3>
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
                    <span>
                      - Rp {voucherDiscountAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span>Rp {voucherTotalPrice.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </Field>
          </div>
        </div>
      )}
    </>
  );
}
