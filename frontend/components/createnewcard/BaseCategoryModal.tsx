'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { ProgramType } from '@/lib/services/card.base.service';

interface Props {
    programType: ProgramType;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    service: any;
}

export default function BaseCategoryModal({ programType, open, onClose, onSuccess, service }: Props) {
    const [categoryCode, setCategoryCode] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(false);

    const reset = () => {
        setCategoryCode('');
        setCategoryName('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const submit = async () => {
        if (!categoryCode || !categoryName) return toast.error('Field wajib diisi');

        setLoading(true);
        try {
            await service.createCategory({ categoryCode, categoryName });
            toast.success('Category berhasil ditambahkan');
            onSuccess();
            handleClose();
        } catch {
            toast.error('Gagal tambah category');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h3 className="mb-4 text-lg font-semibold">Tambah Category - {programType}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Code (1 Digit)</label>
                        <input className="h-11 w-full rounded-lg border px-4 font-mono" placeholder="4" maxLength={1} value={categoryCode} onChange={(e) => setCategoryCode(e.target.value.replace(/\D/g, '').slice(0, 1))} />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Nama Category</label>
                        <input className="h-11 w-full rounded-lg border px-4" placeholder="Ekonomi" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={handleClose} className="h-11 rounded-lg px-6 font-medium text-gray-500 hover:bg-gray-50">
                            Batal
                        </button>
                        <button onClick={submit} disabled={loading} className="h-11 rounded-lg bg-[#8D1231] px-6 font-medium text-white disabled:opacity-60">
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
