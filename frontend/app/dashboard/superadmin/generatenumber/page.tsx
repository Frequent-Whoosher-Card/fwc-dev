'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import axios from '@/lib/axios';
import JSZip from 'jszip';

interface CardProduct {
  id: string;
  serialTemplate: string;
  category: { categoryName: string };
  type: { typeName: string };
}

interface GeneratedBatch {
  id: string;
  date: string;
  productLabel: string;
  serialTemplate: string;
  start: string;
  end: string;
  serials: string[];
}

export default function GenerateNumberPage() {
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CardProduct | null>(null);
  const [startNumber, setStartNumber] = useState('');
  const [endNumber, setEndNumber] = useState('');
  const [generated, setGenerated] = useState<string[]>([]);
  const [batches, setBatches] = useState<GeneratedBatch[]>([]);
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);

  const barcodeRefs = useRef<Record<string, SVGSVGElement | null>>({});

  const year2 = String(new Date(inputDate).getFullYear()).slice(-2);

  // =========================
  // BARCODE PREVIEW (TETAP)
  // =========================
  useEffect(() => {
    generated.forEach((serial) => {
      const el = barcodeRefs.current[serial];
      if (el) {
        JsBarcode(el, serial, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 0,
        });
      }
    });
  }, [generated]);

  // =========================
  // FETCH PRODUCT (TETAP)
  // =========================
  useEffect(() => {
    axios
      .get('/card/product')
      .then((res) => setProducts(res.data?.data || []))
      .catch(() => toast.error('Gagal mengambil card product'));
  }, []);

  // =========================
  // GENERATE (LOGIC SAJA)
  // =========================
  const handleGenerate = () => {
    if (!selectedProduct) {
      toast.error('Card product wajib dipilih');
      return;
    }

    if (startNumber.length !== 5 || endNumber.length !== 5) {
      toast.error('Serial number harus 5 digit');
      return;
    }

    const start = Number(startNumber);
    const end = Number(endNumber);

    if (start > end) {
      toast.error('Start number tidak boleh lebih besar dari end number');
      return;
    }

    const serials: string[] = [];

    for (let i = start; i <= end; i++) {
      serials.push(`${selectedProduct.serialTemplate}${year2}${String(i).padStart(5, '0')}`);
    }

    setGenerated(serials);

    const batch: GeneratedBatch = {
      id: crypto.randomUUID(),
      date: inputDate,
      productLabel: `${selectedProduct.category.categoryName} - ${selectedProduct.type.typeName}`,
      serialTemplate: `${selectedProduct.serialTemplate}${year2}`,
      start: startNumber,
      end: endNumber,
      serials,
    };

    setBatches((prev) => [batch, ...prev]);
    sessionStorage.setItem(batch.id, JSON.stringify(batch));

    toast.success(`Generate ${serials.length} serial`);
  };

  return (
    <div className="space-y-6 px-6">
      <h2 className="text-lg font-semibold">Generate Number + Barcode</h2>

      {/* ================= FORM (ASLI, TIDAK DIUBAH) ================= */}
      <div className="rounded-xl border bg-white p-6 space-y-4 max-w-xl">
        {/* DATE */}
        <input type="date" className="w-full rounded-lg border px-4 py-2" value={inputDate} onChange={(e) => setInputDate(e.target.value)} />

        {/* CARD PRODUCT */}
        <select
          className="w-full rounded-lg border px-4 py-2"
          value={selectedProductId}
          onChange={(e) => {
            const productId = e.target.value;
            setSelectedProductId(productId);
            setSelectedProduct(products.find((p) => p.id === productId) || null);
          }}
        >
          <option value="">-- Pilih Card Product --</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.category.categoryName} - {product.type.typeName}
            </option>
          ))}
        </select>

        {/* SERIAL TEMPLATE (TETAP ADA) */}
        {selectedProduct && (
          <div className="rounded-lg border bg-gray-50 px-4 py-3 text-sm">
            <p className="text-gray-500">Serial Template</p>
            <p className="font-mono font-medium">
              {selectedProduct.serialTemplate}
              {year2}
              <span className="ml-2 text-gray-500">+ 5 angka serial number</span>
            </p>
          </div>
        )}

        {/* START NUMBER (PREFIX TETAP) */}
        <div className="flex">
          <span className="flex items-center rounded-l-lg border border-r-0 bg-gray-100 px-3 font-mono text-sm text-gray-600">
            {selectedProduct?.serialTemplate}
            {year2}
          </span>
          <input className="w-full rounded-r-lg border px-4 py-2 font-mono" placeholder="00001" value={startNumber} onChange={(e) => setStartNumber(e.target.value)} disabled={!selectedProduct} maxLength={5} />
        </div>

        {/* END NUMBER (PREFIX TETAP) */}
        <div className="flex">
          <span className="flex items-center rounded-l-lg border border-r-0 bg-gray-100 px-3 font-mono text-sm text-gray-600">
            {selectedProduct?.serialTemplate}
            {year2}
          </span>
          <input className="w-full rounded-r-lg border px-4 py-2 font-mono" placeholder="00100" value={endNumber} onChange={(e) => setEndNumber(e.target.value)} disabled={!selectedProduct} maxLength={5} />
        </div>

        {/* ACTION */}
        <button onClick={handleGenerate} disabled={!selectedProduct} className="rounded-lg bg-[#8D1231] px-6 py-2 text-white disabled:opacity-50">
          Generate
        </button>
      </div>

      {/* ================= LIST ================= */}
      {batches.length > 0 && (
        <div className="rounded-xl border bg-white">
          <div className="border-b px-4 py-3 font-medium">Generated List</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Range</th>
                <th className="px-4 py-2 text-center">Qty</th>
                <th className="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="px-4 py-2">{b.date}</td>
                  <td className="px-4 py-2">{b.productLabel}</td>
                  <td className="px-4 py-2 font-mono">
                    {b.serialTemplate}
                    {b.start} – {b.serialTemplate}
                    {b.end}
                  </td>
                  <td className="px-4 py-2 text-center">{b.serials.length}</td>
                  <td className="px-4 py-2 text-center">
                    <a href={`/dashboard/superadmin/generatenumber/view/${b.id}`} className="text-[#8D1231] underline">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
