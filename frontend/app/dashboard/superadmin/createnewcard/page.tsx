'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

/* ======================
   TYPES
====================== */
interface CardProduct {
  id: string;
  categoryId: string;
  typeId: string;
  totalQuota: number;
  masaBerlaku: number;
  price: number;
  serialTemplate: string;
  isActive: boolean;
  createdAt: string;
  category: { id: string; categoryName: string };
  type: { id: string; typeName: string };
}

interface CategoryOption {
  id: string;
  categoryName: string;
}

interface TypeOption {
  id: string;
  typeName: string;
}

/* ======================
   COMPONENT
====================== */
export default function CreateNewCardPage() {
  /* ======================
     STATE
  ====================== */
  const [cardProducts, setCardProducts] = useState<CardProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [types, setTypes] = useState<TypeOption[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [validityDays, setValidityDays] = useState('');
  const [price, setPrice] = useState('');
  const [serialTemplate, setSerialTemplate] = useState('');
  const [quota, setQuota] = useState('');

  const [loading, setLoading] = useState(false);

  // modal category
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [loadingCategory, setLoadingCategory] = useState(false);

  // modal type
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeRoute, setNewTypeRoute] = useState('');
  const [loadingType, setLoadingType] = useState(false);

  /* ======================
     FETCH DATA
  ====================== */
  const fetchCategories = async () => {
    const res = await axios.get('/card/category');
    setCategories(res.data?.data || []);
  };

  const fetchTypes = async () => {
    const res = await axios.get('/card/types');
    setTypes(res.data?.data || []);
  };

  const fetchCardProducts = async () => {
    const res = await axios.get('/card/product');
    setCardProducts(res.data?.data || []);
  };

  useEffect(() => {
    fetchCategories();
    fetchTypes();
    fetchCardProducts();
  }, []);

  /* ======================
     CREATE CATEGORY
  ====================== */
  const handleCreateCategory = async () => {
    if (!newCategoryName) return toast.error('Nama category wajib diisi');

    setLoadingCategory(true);
    try {
      await axios.post('/card/category', {
        categoryCode: newCategoryName.toUpperCase().replace(/\s+/g, '_'),
        categoryName: newCategoryName,
        description: newCategoryDesc,
      });

      toast.success('Category berhasil dibuat');
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      fetchCategories();
    } finally {
      setLoadingCategory(false);
    }
  };

  /* ======================
     CREATE TYPE
  ====================== */
  const handleCreateType = async () => {
    if (!newTypeName) return toast.error('Nama type wajib diisi');

    setLoadingType(true);
    try {
      await axios.post('/card/types', {
        typeCode: newTypeName.toUpperCase().replace(/\s+/g, '_'),
        typeName: newTypeName,
        routeDescription: newTypeRoute,
      });

      toast.success('Type berhasil dibuat');
      setShowTypeModal(false);
      setNewTypeName('');
      setNewTypeRoute('');
      fetchTypes();
    } finally {
      setLoadingType(false);
    }
  };

  /* ======================
     CREATE CARD PRODUCT
  ====================== */
  const handleSubmit = async () => {
    if (!categoryId || !typeId || !validityDays || !price || !serialTemplate || !quota) {
      toast.error('Semua field wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/card/product', {
        categoryId,
        typeId,
        totalQuota: Number(quota),
        masaBerlaku: Number(validityDays),
        price: Number(price),
        serialTemplate,
      });

      toast.success('Card product berhasil dibuat');
      fetchCardProducts();
      setValidityDays('');
      setPrice('');
      setSerialTemplate('');
      setQuota('');
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="px-6 space-y-8 max-w-6xl">
      <h2 className="text-lg font-semibold">Create New Card</h2>

      {/* FORM */}
      <div className="rounded-xl border bg-white p-6 space-y-4 max-w-xl">
        {/* CATEGORY */}
        <div className="flex gap-2">
          <select className="flex-1 rounded-lg border px-4 py-2" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">-- Pilih Category --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.categoryName}
              </option>
            ))}
          </select>
          <button onClick={() => setShowCategoryModal(true)} className="border px-4 rounded-lg font-bold">
            +
          </button>
        </div>

        {/* TYPE */}
        <div className="flex gap-2">
          <select className="flex-1 rounded-lg border px-4 py-2" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">-- Pilih Type --</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.typeName}
              </option>
            ))}
          </select>
          <button onClick={() => setShowTypeModal(true)} className="border px-4 rounded-lg font-bold">
            +
          </button>
        </div>

        <input className="w-full rounded-lg border px-4 py-2" placeholder="Masa berlaku (hari)" value={validityDays} onChange={(e) => setValidityDays(e.target.value.replace(/\D/g, ''))} />
        <input className="w-full rounded-lg border px-4 py-2" placeholder="Harga" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} />
        <input className="w-full rounded-lg border px-4 py-2 font-mono" placeholder="Serial Template" value={serialTemplate} onChange={(e) => setSerialTemplate(e.target.value)} />
        <input className="w-full rounded-lg border px-4 py-2" placeholder="Total Kuota" value={quota} onChange={(e) => setQuota(e.target.value.replace(/\D/g, ''))} />

        <button onClick={handleSubmit} disabled={loading} className="rounded-lg bg-[#8D1231] px-6 py-2 text-white">
          Simpan
        </button>
      </div>

      {/* LIST PRODUCT */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 font-semibold border-b">List Card Product</div>
        <table className="w-full text-sm">
          <tbody>
            {cardProducts.map((p) => (
              <tr key={p.id} className="border-t">
                <td>{p.category.categoryName}</td>
                <td>{p.type.typeName}</td>
                <td>{p.masaBerlaku} hari</td>
                <td>{p.price}</td>
                <td>{p.totalQuota}</td>
                <td className="font-mono text-xs">{p.serialTemplate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CATEGORY */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-lg">Tambah Category</h3>
            <input className="w-full border px-4 py-2 rounded-lg" placeholder="Nama Category" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            <textarea className="w-full border px-4 py-2 rounded-lg" placeholder="Deskripsi singkat" value={newCategoryDesc} onChange={(e) => setNewCategoryDesc(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCategoryModal(false)} className="border px-4 py-2 rounded-lg">
                Batal
              </button>
              <button onClick={handleCreateCategory} disabled={loadingCategory} className="bg-[#8D1231] text-white px-4 py-2 rounded-lg">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TYPE */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-lg">Tambah Type</h3>
            <input className="w-full border px-4 py-2 rounded-lg" placeholder="Nama Type" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
            <input className="w-full border px-4 py-2 rounded-lg" placeholder="Deskripsi Rute (Jakarta - Surabaya)" value={newTypeRoute} onChange={(e) => setNewTypeRoute(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTypeModal(false)} className="border px-4 py-2 rounded-lg">
                Batal
              </button>
              <button onClick={handleCreateType} disabled={loadingType} className="bg-[#8D1231] text-white px-4 py-2 rounded-lg">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
