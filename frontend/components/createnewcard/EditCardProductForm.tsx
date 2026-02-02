"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";

import { CardProduct, CategoryOption, TypeOption } from "@/types/card";
import { cardFWCService } from "@/lib/services/card.fwc.service";

interface Props {
  product: CardProduct;
  categories: CategoryOption[];
  types: TypeOption[];
  onSuccess: () => void;
}

/* ======================
   HELPERS (RUPIAH)
====================== */
const formatRupiah = (value: string) => {
  const number = value.replace(/\D/g, "");
  if (!number) return "";
  return `Rp ${number.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

const parseRupiah = (value: string) => {
  return Number(value.replace(/Rp|\s|\./g, ""));
};

export default function EditCardProductForm({
  product,
  categories,
  types,
  onSuccess,
}: Props) {
  const router = useRouter();

  const [validityDays, setValidityDays] = useState(String(product.masaBerlaku));
  const [price, setPrice] = useState(formatRupiah(String(product.price)));
  const [quota, setQuota] = useState(String(product.totalQuota));
  const [isActive, setIsActive] = useState(product.isActive);
  const [loading, setLoading] = useState(false);

  /* ======================
     DERIVED (DISPLAY ONLY)
  ====================== */
  const categoryName = useMemo(
    () =>
      categories.find((c) => c.id === product.categoryId)?.categoryName || "-",
    [categories, product.categoryId],
  );

  const typeName = useMemo(
    () => types.find((t) => t.id === product.typeId)?.typeName || "-",
    [types, product.typeId],
  );

  /* ======================
     SUBMIT
  ====================== */
  const submit = async () => {
    if (!validityDays || !price || !quota) {
      return toast.error("Semua field wajib diisi");
    }

    /**
     * BACKEND WAJIB:
     * - programType
     * - categoryId
     * - typeId
     * - serialTemplate (2 digit saja)
     */
    const serialPrefix = product.serialTemplate.slice(0, 2);

    setLoading(true);
    try {
      // 1. Update Details
      await cardFWCService.updateProduct(product.id, {
        categoryId: product.categoryId,
        typeId: product.typeId,
        programType: "FWC",
        serialTemplate: serialPrefix, // ✅ HANYA 2 DIGIT
        totalQuota: Number(quota),
        masaBerlaku: Number(validityDays),
        price: parseRupiah(price), // ✅ number murni
      });

      // 2. Update Status (if changed)
      if (isActive !== product.isActive) {
        await cardFWCService.toggleActiveStatus(product.id, isActive);
      }

      toast.success("Product berhasil diupdate");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal update product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER + BACK */}
      <div className="flex items-center gap-4 px-4 sm:px-6">
        <button
          onClick={() => router.back()}
          className="rounded-lg border p-2 text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
        </button>

        <h2 className="text-lg font-semibold">Edit Card Product</h2>
      </div>

      {/* FORM */}
      <div className="rounded-xl border bg-white p-6 space-y-4 max-w-xl">
        {/* CATEGORY */}
        <div>
          <label className="text-sm font-medium">Category</label>
          <input
            className="h-11 w-full rounded-lg border px-4 bg-gray-100"
            value={categoryName}
            disabled
          />
        </div>

        {/* TYPE */}
        <div>
          <label className="text-sm font-medium">Type</label>
          <input
            className="h-11 w-full rounded-lg border px-4 bg-gray-100"
            value={typeName}
            disabled
          />
        </div>

        {/* SERIAL */}
        <div>
          <label className="text-sm font-medium">Serial Template</label>
          <input
            className="h-11 w-full rounded-lg border px-4 bg-gray-100 font-mono"
            value={product.serialTemplate}
            disabled
          />
        </div>

        {/* MASA BERLAKU */}
        <div>
          <label className="text-sm font-medium">Masa Berlaku (Hari)</label>
          <input
            className="h-11 w-full rounded-lg border px-4"
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        {/* HARGA */}
        <div>
          <label className="text-sm font-medium">Harga</label>
          <input
            className="h-11 w-full rounded-lg border px-4"
            value={price}
            onChange={(e) => setPrice(formatRupiah(e.target.value))}
          />
        </div>

        {/* KUOTA */}
        <div>
          <label className="text-sm font-medium">Total Kuota</label>
          <input
            className="h-11 w-full rounded-lg border px-4"
            value={quota}
            onChange={(e) => setQuota(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        {/* STATUS */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Status Product</label>
            <div className="text-xs text-muted-foreground">
              {isActive
                ? "Aktif - Bisa diproduksi"
                : "Nonaktif - Tidak muncul di list"}
            </div>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {/* ACTION */}
        <div className="pt-2">
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
