'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { cardVoucherService } from '@/lib/services/card.voucher.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCategoryVoucherModal({ open, onClose, onSuccess }: Props) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!categoryName || !categoryCode) {
      return toast.error('Nama dan Code wajib diisi');
    }

    setLoading(true);
    try {
      await cardVoucherService.createCategory({
        categoryName,
        categoryCode,
        description,
      });

      toast.success('Category voucher berhasil ditambahkan');
      onSuccess();
      onClose();

      setCategoryName('');
      setCategoryCode('');
      setDescription('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4">
        <h3 className="text-lg font-semibold">Tambah Category Voucher</h3>

        <input className="w-full rounded-lg border px-4 py-2" placeholder="Nama Category" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />

        <input className="w-full rounded-lg border px-4 py-2" placeholder="Category Code" value={categoryCode} onChange={(e) => setCategoryCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} />

        <textarea className="w-full rounded-lg border px-4 py-2" placeholder="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2">
            Batal
          </button>
          <button onClick={submit} disabled={loading} className="rounded-lg bg-[#8D1231] px-4 py-2 text-white disabled:opacity-60">
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
