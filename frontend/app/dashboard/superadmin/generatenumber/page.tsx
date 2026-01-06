'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import axios from '@/lib/axios';

interface CardProduct {
  id: string;
  serialTemplate: string;
  category: {
    categoryName: string;
  };
  type: {
    typeName: string;
  };
}

export default function GenerateNumberPage() {
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CardProduct | null>(null);
  const [startNumber, setStartNumber] = useState('');
  const [endNumber, setEndNumber] = useState('');
  const [generated, setGenerated] = useState<string[]>([]);

  const barcodeRefs = useRef<Record<string, SVGSVGElement | null>>({});

  // =========================
  // RENDER BARCODE (UI)
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
          textMargin: 4,
          margin: 0,
        });
      }
    });
  }, [generated]);

  // Fetch card product
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/card/product');
        setProducts(res.data?.data || []);
      } catch (err: any) {
        if (err.response?.status === 401) {
          toast.error('Sesi login habis, silakan login ulang');
        } else {
          toast.error('Gagal mengambil card product');
        }
      }
    };

    fetchProducts();
  }, []);

  // =========================
  // GENERATE SERIAL NUMBER
  // =========================
  const handleGenerate = () => {
    if (!selectedProduct) {
      toast.error('Card product wajib dipilih');
      return;
    }

    if (!startNumber || !endNumber) {
      toast.error('Start & end number wajib diisi');
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

    const result: string[] = [];

    for (let i = start; i <= end; i++) {
      result.push(`${selectedProduct.serialTemplate}${String(new Date().getFullYear()).slice(-2)}${String(i).padStart(5, '0')}`);
    }

    setGenerated(result);
    toast.success(`Generate ${result.length} serial`);
  };

  // =========================
  // EXPORT BARCODE TO PDF
  // =========================
  const handleExportPDF = () => {
    if (generated.length === 0) {
      toast.error('Tidak ada barcode untuk diexport');
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 10;
    const marginY = 10;
    const colCount = 2;
    const barcodeWidth = (pageWidth - marginX * 2) / colCount;
    const barcodeHeight = 30;

    let x = marginX;
    let y = marginY;

    // 🔥 SCALE FACTOR (KUNCI TAJAM)
    const scale = 4;

    generated.forEach((serial, index) => {
      // === HI-DPI CANVAS ===
      const canvas = document.createElement('canvas');
      canvas.width = 400 * scale;
      canvas.height = 120 * scale;

      JsBarcode(canvas, serial, {
        format: 'CODE128',
        width: 2 * scale,
        height: 40 * scale,
        displayValue: true,
        fontSize: 14 * scale,
        margin: 10 * scale,
      });

      const imgData = canvas.toDataURL('image/png');

      // === DOWNSCALE KE PDF ===
      doc.addImage(imgData, 'PNG', x, y, barcodeWidth - 5, barcodeHeight);

      x += barcodeWidth;

      if ((index + 1) % colCount === 0) {
        x = marginX;
        y += barcodeHeight + 8;

        if (y > 270) {
          doc.addPage();
          y = marginY;
        }
      }
    });

    doc.save('barcode-serial.pdf');
  };

  return (
    <div className="space-y-6 px-6">
      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold">Generate Number + Barcode</h2>
        <p className="text-sm text-gray-500">Generate serial number beserta barcode</p>
      </div>

      {/* FORM */}
      <div className="rounded-xl border bg-white p-6 space-y-4 max-w-xl">
        {/* CARD PRODUCT */}
        <select
          className="w-full rounded-lg border px-4 py-2"
          value={selectedProductId}
          onChange={(e) => {
            const productId = e.target.value;
            setSelectedProductId(productId);

            const product = products.find((p) => p.id === productId) || null;
            setSelectedProduct(product);
          }}
        >
          <option value="">-- Pilih Card Product --</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.category.categoryName} - {product.type.typeName}
            </option>
          ))}
        </select>

        {/* SERIAL TEMPLATE */}
        {selectedProduct && (
          <div className="rounded-lg border bg-gray-50 px-4 py-3 text-sm space-y-1">
            <p className="text-gray-500">Serial Template</p>

            <p className="font-mono font-medium">
              {selectedProduct.serialTemplate}
              {String(new Date().getFullYear()).slice(-2)}
              <span className="ml-2 text-gray-500">+ 5 angka serial number</span>
            </p>
          </div>
        )}

        {/* START NUMBER */}
        <div className="flex">
          <span className="flex items-center rounded-l-lg border border-r-0 bg-gray-100 px-3 font-mono text-sm text-gray-600">
            {selectedProduct?.serialTemplate}
            {String(new Date().getFullYear()).slice(-2)}
          </span>
          <input className="w-full rounded-r-lg border px-4 py-2 font-mono" placeholder="00001" value={startNumber} onChange={(e) => setStartNumber(e.target.value)} disabled={!selectedProduct} maxLength={5} />
        </div>

        {/* END NUMBER */}
        <div className="flex">
          <span className="flex items-center rounded-l-lg border border-r-0 bg-gray-100 px-3 font-mono text-sm text-gray-600">
            {selectedProduct?.serialTemplate}
            {String(new Date().getFullYear()).slice(-2)}
          </span>
          <input className="w-full rounded-r-lg border px-4 py-2 font-mono" placeholder="00100" value={endNumber} onChange={(e) => setEndNumber(e.target.value)} disabled={!selectedProduct} maxLength={5} />
        </div>

        {/* ACTION */}
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={!selectedProduct} className="rounded-lg bg-[#8D1231] px-6 py-2 text-white disabled:opacity-50">
            Generate
          </button>

          {generated.length > 0 && (
            <button onClick={handleExportPDF} className="rounded-lg border px-6 py-2 text-sm hover:bg-gray-100">
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* RESULT */}
      {generated.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="border-b px-4 py-3 font-medium">Generated Barcode</div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-center w-16">No</th>
                <th className="px-4 py-3 text-left">Serial</th>
                <th className="px-4 py-3 text-left">Barcode</th>
              </tr>
            </thead>
            <tbody>
              {generated.map((serial, index) => (
                <tr key={serial} className="border-b">
                  <td className="px-4 py-2 text-center">{index + 1}</td>
                  <td className="px-4 py-2 font-mono">{serial}</td>
                  <td className="px-4 py-2">
                    <svg
                      ref={(el) => {
                        if (el) {
                          barcodeRefs.current[serial] = el;
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 text-sm text-gray-500">Total: {generated.length}</div>
        </div>
      )}
    </div>
  );
}
