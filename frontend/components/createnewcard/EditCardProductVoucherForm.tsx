'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

import { CardProduct, CategoryOption, TypeOption } from '@/types/card';
import { cardVoucherService } from '@/lib/services/card.voucher.service';

/* ======================
   HELPERS (RUPIAH)
====================== */
const formatRupiah = (value: string) => {
  const number = value.replace(/\D/g, '');
  if (!number) return '';
  return `Rp ${number.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

const parseRupiah = (value: string) => {
  return Number(value.replace(/Rp|\s|\./g, ''));
};

interface Props {
  product: CardProduct;
  categories: CategoryOption[];
  types: TypeOption[];
  onSuccess: () => void;
}

export default function EditCardProductVoucherForm({ product, categories, types, onSuccess }: Props) {
  const router = useRouter();

  const [validityDays, setValidityDays] = useState(String(product.masaBerlaku));
  const [price, setPrice] = useState(formatRupiah(String(product.price)));
  const [quota, setQuota] = useState(String(product.totalQuota));
  const [loading, setLoading] = useState(false);

  /* ======================
     DERIVED (DISPLAY ONLY)
  ====================== */
  const categoryName = useMemo(() => categories.find((c) => c.id === product.categoryId)?.categoryName || '-', [categories, product.categoryId]);

  const typeName = useMemo(() => types.find((t) => t.id === product.typeId)?.typeName || '-', [types, product.typeId]);

  /* ======================
     SUBMIT
  ====================== */
  const submit = async () => {
    if (!validityDays || !price || !quota) {
      return toast.error('Semua field wajib diisi');
    }

    /**
     * BACKEND VOUCHER:
     * - serialTemplate = 2 digit prefix SAJA
     */
    const serialPrefix = product.serialTemplate.slice(0, 2);

    setLoading(true);
    try {
      await cardVoucherService.updateProduct(product.id, {
        categoryId: product.categoryId,
        typeId: product.typeId,
        programType: 'VOUCHER',
        serialTemplate: serialPrefix, // ✅ 2 DIGIT ONLY
        totalQuota: Number(quota),
        masaBerlaku: Number(validityDays),
        price: parseRupiah(price),
      });

      toast.success('Voucher berhasil diupdate');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal update voucher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER + BACK */}
      <div className="flex items-center gap-4 px-4 sm:px-6">
        <button onClick={() => router.back()} className="rounded-lg border p-2 text-gray-600 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Edit Voucher</h2>
      </div>

      {/* FORM */}
      <div className="rounded-xl border bg-white p-6 space-y-4 max-w-xl">
        {/* CATEGORY */}
        <div>
          <label className="text-sm font-medium">Category</label>
          <input className="h-11 w-full rounded-lg border px-4 bg-gray-100" value={categoryName} disabled />
        </div>

        {/* TYPE */}
        <div>
          <label className="text-sm font-medium">Type</label>
          <input className="h-11 w-full rounded-lg border px-4 bg-gray-100" value={typeName} disabled />
        </div>

        {/* SERIAL (READ ONLY) */}
        <div>
          <label className="text-sm font-medium">Serial Template</label>
          <input className="h-11 w-full rounded-lg border px-4 bg-gray-100 font-mono" value={product.serialTemplate} disabled />
        </div>

        {/* MASA BERLAKU */}
        <div>
          <label className="text-sm font-medium">Masa Berlaku (Hari)</label>
          <input className="h-11 w-full rounded-lg border px-4" value={validityDays} onChange={(e) => setValidityDays(e.target.value.replace(/\D/g, ''))} />
        </div>

        {/* HARGA */}
        <div>
          <label className="text-sm font-medium">Harga</label>
          <input className="h-11 w-full rounded-lg border px-4" value={price} onChange={(e) => setPrice(formatRupiah(e.target.value))} />
        </div>

        {/* KUOTA */}
        <div>
          <label className="text-sm font-medium">Total Kuota</label>
          <input className="h-11 w-full rounded-lg border px-4" value={quota} onChange={(e) => setQuota(e.target.value.replace(/\D/g, ''))} />
        </div>

        {/* ACTION */}
        <button onClick={submit} disabled={loading} className="h-11 rounded-lg bg-[#8D1231] px-6 text-white disabled:opacity-60">
          Simpan
        </button>
      </div>
    </div>
  );
}
