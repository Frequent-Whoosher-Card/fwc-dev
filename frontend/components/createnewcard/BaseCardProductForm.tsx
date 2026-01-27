"use client";

import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { CategoryOption, TypeOption } from "@/types/card";
import { ProgramType } from "@/lib/services/card.base.service";

interface Props {
  programType: ProgramType;
  categories: CategoryOption[];
  types: TypeOption[];
  onSuccess: () => void;
  onOpenCategory: () => void;
  onOpenType: () => void;
  service: any; // Using service from hook
}

const formatRupiah = (value: string) => {
  const number = value.replace(/\D/g, "");
  if (!number) return "";
  return `Rp ${number.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

const parseRupiah = (value: string) => Number(value.replace(/Rp|\s|\./g, ""));

export default function BaseCardProductForm({
  programType,
  categories,
  types,
  onSuccess,
  onOpenCategory,
  onOpenType,
  service,
}: Props) {
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [serialPrefix, setSerialPrefix] = useState("");
  const [validityDays, setValidityDays] = useState("");
  const [price, setPrice] = useState("");
  const [quota, setQuota] = useState("");
  const [maxLimitType, setMaxLimitType] = useState<"no_max" | "with_max">(
    "no_max",
  );
  const [maxQuantity, setMaxQuantity] = useState("");
  const [isDiscount, setIsDiscount] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categoryId, categories],
  );
  const selectedType = useMemo(
    () => types.find((t) => t.id === typeId),
    [typeId, types],
  );

  const serialPreview =
    serialPrefix.length === 2 && selectedCategory && selectedType
      ? `${serialPrefix}${selectedCategory.categoryCode}${selectedType.typeCode}`
      : "";

  const submit = async () => {
    const isVoucher = programType === "VOUCHER";
    const finalQuota = isVoucher ? 1 : Number(quota);
    const finalMaxQuantity =
      isVoucher && maxLimitType === "with_max" ? Number(maxQuantity) : null;

    if (
      !categoryId ||
      !typeId ||
      serialPrefix.length !== 2 ||
      !validityDays ||
      !price ||
      (!isVoucher && !quota)
    ) {
      return toast.error("Semua field wajib diisi");
    }

    if (isVoucher && maxLimitType === "with_max" && !maxQuantity) {
      return toast.error("Maximum generate wajib diisi");
    }

    setLoading(true);
    try {
      await service.createProduct({
        categoryId,
        typeId,
        masaBerlaku: Number(validityDays),
        price: parseRupiah(price),
        totalQuota: finalQuota,
        serialTemplate: serialPrefix,
        ...(isVoucher && { isDiscount }),
        ...(finalMaxQuantity !== null && { maxQuantity: finalMaxQuantity }),
      });

      toast.success(`${programType} product berhasil dibuat`);
      onSuccess();

      setSerialPrefix("");
      setValidityDays("");
      setPrice("");
      setQuota("");
      setMaxQuantity("");
      setMaxLimitType("no_max");
      setIsDiscount(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || `Gagal membuat ${programType}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-6 max-w-xl">
      <div className="grid grid-cols-12 gap-4">
        {/* CATEGORY */}
        <div className="col-span-10">
          <select
            className="h-11 w-full rounded-lg border px-4"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">-- Pilih Category --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.categoryName}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <button
            type="button"
            onClick={onOpenCategory}
            className="h-11 w-full rounded-lg border text-xl font-bold"
          >
            +
          </button>
        </div>

        {/* TYPE */}
        <div className="col-span-10">
          <select
            className="h-11 w-full rounded-lg border px-4"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
          >
            <option value="">
              -- Pilih {programType === "VOUCHER" ? "Class" : "Type"} --
            </option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.typeName}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <button
            type="button"
            onClick={onOpenType}
            className="h-11 w-full rounded-lg border text-xl font-bold"
          >
            +
          </button>
        </div>

        {/* SERIAL TEMPLATE */}
        <div className="col-span-6">
          <label className="mb-1 block text-sm font-medium">
            Serial Template
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="h-11 w-full rounded-lg border px-4 text-center font-mono"
              placeholder="12"
              maxLength={2}
              value={serialPrefix}
              onChange={(e) =>
                setSerialPrefix(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
            />
            <input
              className="h-11 w-full rounded-lg border px-4 text-center font-mono bg-gray-100"
              value={
                selectedCategory && selectedType
                  ? `${selectedCategory.categoryCode}${selectedType.typeCode}`
                  : ""
              }
              disabled
            />
          </div>
          {serialPreview && (
            <div className="mt-1 text-xs text-gray-500">
              Preview serial: <b>{serialPreview}</b>
            </div>
          )}
        </div>

        {/* MASA BERLAKU */}
        <div className="col-span-6">
          <label className="mb-1 block text-sm font-medium">
            Masa Berlaku (Hari)
          </label>
          <input
            className="h-11 w-full rounded-lg border px-4"
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        {/* OPTIONS (VOUCHER ONLY) */}
        {programType === "VOUCHER" && (
          <div className="col-span-12 grid grid-cols-2 gap-4 border-t pt-4 mt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">
                Discount Setting
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isDiscount"
                    checked={isDiscount === true}
                    onChange={() => setIsDiscount(true)}
                    className="accent-[#8D1231]"
                  />
                  <span className="text-sm">Diskon</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isDiscount"
                    checked={isDiscount === false}
                    onChange={() => setIsDiscount(false)}
                    className="accent-[#8D1231]"
                  />
                  <span className="text-sm">Tidak Diskon</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">
                Generation Limit
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maxLimitType"
                    checked={maxLimitType === "no_max"}
                    onChange={() => setMaxLimitType("no_max")}
                    className="accent-[#8D1231]"
                  />
                  <span className="text-sm">No Max</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maxLimitType"
                    checked={maxLimitType === "with_max"}
                    onChange={() => setMaxLimitType("with_max")}
                    className="accent-[#8D1231]"
                  />
                  <span className="text-sm">With Max</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* HARGA */}
        <div className="col-span-6">
          <label className="mb-1 block text-sm font-medium">Harga</label>
          <input
            className="h-11 w-full rounded-lg border px-4"
            value={price}
            onChange={(e) => setPrice(formatRupiah(e.target.value))}
          />
        </div>

        {/* TOTAL KUOTA / MAXIMUM GENERATE */}
        <div className="col-span-6">
          <label className="mb-1 block text-sm font-medium">
            {programType === "VOUCHER" ? "Maximum Generate" : "Total Kuota"}
          </label>
          {programType === "VOUCHER" ? (
            <input
              className="h-11 w-full rounded-lg border px-4 disabled:bg-gray-100"
              placeholder={maxLimitType === "no_max" ? "No limit" : "e.g. 1000"}
              value={maxQuantity}
              onChange={(e) =>
                setMaxQuantity(e.target.value.replace(/\D/g, ""))
              }
              disabled={maxLimitType === "no_max"}
            />
          ) : (
            <input
              className="h-11 w-full rounded-lg border px-4"
              value={quota}
              onChange={(e) => setQuota(e.target.value.replace(/\D/g, ""))}
            />
          )}
        </div>

        {/* SUBMIT */}
        <div className="col-span-12 pt-2">
          <button
            onClick={submit}
            disabled={loading}
            className="h-11 rounded-lg bg-[#8D1231] px-6 text-white disabled:opacity-60"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
