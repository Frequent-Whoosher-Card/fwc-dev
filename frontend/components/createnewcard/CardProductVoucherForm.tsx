'use client';

import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { CategoryOption, TypeOption } from '@/types/card';
import { cardVoucherService } from '@/lib/services/card.voucher.service';

interface Props {
  categories: CategoryOption[];
  types: TypeOption[];
  onSuccess: () => void;
  onOpenCategory: () => void;
  onOpenType: () => void;
}

/* ======================
   HELPERS (RUPIAH)
====================== */
const formatRupiah = (value: string) => {
  const number = value.replace(/\D/g, '');
  if (!number) return '';
  return `Rp ${number.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

const parseRupiah = (value: string) => Number(value.replace(/Rp|\s|\./g, ''));

/* ======================
   COMPONENT
====================== */
export default function CardProductVoucherForm({ categories, types, onSuccess, onOpenCategory, onOpenType }: Props) {
  const [categoryId, setCategoryId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [serialTemplate, setSerialTemplate] = useState(''); // 👈 2 digit saja

  const [validityDays, setValidityDays] = useState('');
  const [price, setPrice] = useState('');
  const [quota, setQuota] = useState('');
  const [loading, setLoading] = useState(false);

  /* ======================
     DERIVED (DISPLAY ONLY)
  ====================== */
  const selectedCategory = useMemo(() => categories.find((c) => c.id === categoryId), [categoryId, categories]);

  const selectedType = useMemo(() => types.find((t) => t.id === typeId), [typeId, types]);

  // 🔎 Preview saja, TIDAK dikirim ke backend
  const serialPreview = serialTemplate.length === 2 && selectedCategory && selectedType ? `${serialTemplate}${selectedCategory.categoryCode}${selectedType.typeCode}` : '';

  /* ======================
     SUBMIT
  ====================== */
  const submit = async () => {
    if (!categoryId || !typeId || serialTemplate.length !== 2 || !validityDays || !price || !quota) {
      return toast.error('Semua field wajib diisi');
    }

    setLoading(true);
    try {
      await cardVoucherService.createProduct({
        categoryId,
        typeId,
        masaBerlaku: Number(validityDays),
        price: parseRupiah(price),
        totalQuota: Number(quota),
        serialTemplate, // ✅ WAJIB ADA (2 digit)
      });

      toast.success('Voucher berhasil dibuat');
      onSuccess();

      // reset
      setSerialTemplate('');
      setValidityDays('');
      setPrice('');
      setQuota('');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal membuat voucher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl rounded-xl border bg-white p-6">
      <div className="grid grid-cols-12 gap-4">
        {/* CATEGORY */}
        <div className="col-span-10">
          <select className="h-11 w-full rounded-lg border px-4" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">-- Pilih Category --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.categoryName}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <button type="button" onClick={onOpenCategory} className="h-11 w-full rounded-lg border text-xl font-bold">
            +
          </button>
        </div>

        {/* TYPE */}
        <div className="col-span-10">
          <select className="h-11 w-full rounded-lg border px-4" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">-- Pilih Class --</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.typeName}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <button type="button" onClick={onOpenType} className="h-11 w-full rounded-lg border text-xl font-bold">
            +
          </button>
        </div>

        {/* SERIAL TEMPLATE */}
        <div className="col-span-6">
          <label className="mb-1 block text-sm font-medium">Serial Template</label>

          <div className="grid grid-cols-2 gap-2">
            {/* PREFIX (MANUAL – 2 DIGIT) */}
            <input className="h-11 w-full rounded-lg border px-4 text-center font-mono" placeholder="12" maxLength={2} value={serialTemplate} onChange={(e) => setSerialTemplate(e.target.value.replace(/\D/g, '').slice(0, 2))} />

            {/* AUTO (CATEGORY + TYPE) */}
            <input className="h-11 w-full rounded-lg border px-4 text-center font-mono bg-gray-100" value={selectedCategory && selectedType ? `${selectedCategory.categoryCode}${selectedType.typeCode}` : ''} disabled />
          </div>

          {serialPreview && (
            <div className="mt-1 text-xs text-gray-500">
              Preview serial: <b>{serialPreview}</b>
            </div>
          )}
        </div>

        {/* MASA BERLAKU */}
        <div className="col-span-6">
          <label className="mb-1 block text-sm font-medium">Masa Berlaku (Hari)</label>
          <input className="h-11 w-full rounded-lg border px-4" placeholder="0" value={validityDays} onChange={(e) => setValidityDays(e.target.value.replace(/\D/g, ''))} />
        </div>

        {/* HARGA */}
        <div className="col-span-6">
          <label className="mb-1 block text-sm font-medium">Harga</label>
          <input className="h-11 w-full rounded-lg border px-4" placeholder="Rp 0" value={price} onChange={(e) => setPrice(formatRupiah(e.target.value))} />
        </div>

        {/* TOTAL KUOTA */}
        <div className="col-span-6">
          <label className="mb-1 block text-sm font-medium">Total Kuota</label>
          <input className="h-11 w-full rounded-lg border px-4" placeholder="0" value={quota} onChange={(e) => setQuota(e.target.value.replace(/\D/g, ''))} />
        </div>

        {/* SUBMIT */}
        <div className="col-span-12 pt-2">
          <button onClick={submit} disabled={loading} className="h-11 rounded-lg bg-[#8D1231] px-6 text-white disabled:opacity-60">
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
