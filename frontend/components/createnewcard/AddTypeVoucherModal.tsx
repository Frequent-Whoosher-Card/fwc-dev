'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { cardVoucherService } from '@/lib/services/card.voucher.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTypeVoucherModal({ open, onClose, onSuccess }: Props) {
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!typeName || !typeCode) {
      return toast.error('Nama dan Code wajib diisi');
    }

    setLoading(true);
    try {
      await cardVoucherService.createType({
        typeName,
        typeCode,
        routeDescription,
      });

      toast.success('Type voucher berhasil ditambahkan');
      onSuccess();
      onClose();

      setTypeName('');
      setTypeCode('');
      setRouteDescription('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4">
        <h3 className="text-lg font-semibold">Tambah Class Voucher</h3>

        <input className="w-full rounded-lg border px-4 py-2" placeholder="Nama Class" value={typeName} onChange={(e) => setTypeName(e.target.value)} />

        <input className="w-full rounded-lg border px-4 py-2" placeholder="Class Code" value={typeCode} onChange={(e) => setTypeCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} />

        <textarea className="w-full rounded-lg border px-4 py-2" placeholder="Deskripsi Class" value={routeDescription} onChange={(e) => setRouteDescription(e.target.value)} />

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
