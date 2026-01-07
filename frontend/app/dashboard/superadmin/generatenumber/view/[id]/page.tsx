'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import JsBarcode from 'jsbarcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

interface BatchData {
  id: string;
  date: string;
  productLabel: string;
  serialTemplate: string;
  start: string;
  end: string;
  serials: string[];
}

export default function ViewGeneratedPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // 🔑 Ambil data dari sessionStorage
  const raw = typeof window !== 'undefined' ? sessionStorage.getItem(id) : null;

  if (!raw) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-red-500">Data generate tidak ditemukan</p>
        <button onClick={() => router.back()} className="underline text-[#8D1231]">
          Kembali
        </button>
      </div>
    );
  }

  const batch: BatchData = JSON.parse(raw);
  const barcodeRefs = useRef<Record<string, SVGSVGElement | null>>({});

  // =========================
  // RENDER BARCODE
  // =========================
  useEffect(() => {
    batch.serials.forEach((serial) => {
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
  }, [batch.serials]);

  // =========================
  // EXPORT ZIP (PNG)
  // =========================
  const handleExportZip = async () => {
    if (!batch.serials.length) {
      toast.error('Tidak ada barcode untuk diexport');
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder(`barcode-${batch.productLabel.replace(/\s/g, '_')}`);

    const scale = 4;

    for (const serial of batch.serials) {
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

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));

      folder?.file(`${serial}.png`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `barcode-${batch.date}.zip`);
    toast.success('Export ZIP berhasil');
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="space-y-6 px-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="underline text-[#8D1231]">
          ← Kembali
        </button>

        <button onClick={handleExportZip} className="rounded-lg bg-[#8D1231] px-6 py-2 text-white">
          Export ZIP
        </button>
      </div>

      {/* INFO */}
      <div className="rounded-xl border bg-white p-4 text-sm space-y-1">
        <p>
          <b>Tanggal:</b> {batch.date}
        </p>
        <p>
          <b>Product:</b> {batch.productLabel}
        </p>
        <p>
          <b>Range:</b> {batch.serialTemplate}
          {batch.start} – {batch.serialTemplate}
          {batch.end}
        </p>
        <p>
          <b>Total:</b> {batch.serials.length}
        </p>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 w-16 text-center">No</th>
              <th className="px-4 py-3 text-left">Serial</th>
              <th className="px-4 py-3 text-left">Barcode</th>
            </tr>
          </thead>
          <tbody>
            {batch.serials.map((serial, index) => (
              <tr key={serial} className="border-b">
                <td className="px-4 py-2 text-center">{index + 1}</td>
                <td className="px-4 py-2 font-mono">{serial}</td>
                <td className="px-4 py-2">
                  <svg ref={(el) => (barcodeRefs.current[serial] = el)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 text-sm text-gray-500">Total: {batch.serials.length}</div>
      </div>
    </div>
  );
}
