'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import { ArrowLeft } from 'lucide-react';

interface SerialItem {
  serial: string;
  barcodeUrl?: string;
}

interface BatchData {
  id: string;
  date: string;
  productLabel: string;
  start: string;
  end: string;
  serials: SerialItem[];
}

// ✅ SESUAI PERMINTAAN
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ViewGeneratedPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH DETAIL
  // =========================
  useEffect(() => {
    axios
      .get(`/cards/generate/history/${id}`)
      .then((res) => {
        const data = res.data?.data;

        if (!data || !data.movement) {
          throw new Error('Invalid response');
        }

        const movement = data.movement;
        const cards = data.cards || [];

        const serials: SerialItem[] = movement.serialNumbers.map((serial: string) => {
          const card = cards.find((c: any) => c.serialNumber === serial);

          return {
            serial,
            barcodeUrl: card?.barcodeUrl,
          };
        });

        setBatch({
          id: movement.id,
          date: new Date(movement.movementAt).toLocaleDateString('id-ID').replace(/\//g, '-'),
          productLabel: `${movement.category.name} - ${movement.type.name}`,
          start: movement.serialNumbers[0],
          end: movement.serialNumbers[movement.serialNumbers.length - 1],
          serials,
        });
      })
      .catch(() => toast.error('Gagal mengambil data generate'))
      .finally(() => setLoading(false));
  }, [id]);

  // =========================
  // EXPORT ZIP
  // =========================
  const handleExportZip = async () => {
    if (!batch || !batch.serials.length) {
      toast.error('Tidak ada barcode untuk diexport');
      return;
    }

    const safeLabel = batch.productLabel.replace(/\s+/g, '');
    const zip = new JSZip();
    const folder = zip.folder(`barcode-${safeLabel}`);

    for (const item of batch.serials) {
      if (!item.barcodeUrl) continue;

      try {
        const res = await fetch(`${API_BASE_URL}${item.barcodeUrl}`, {
          credentials: 'include',
        });

        if (!res.ok) continue;

        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) continue;

        const cleanSerial = item.serial.replace(/^_+/, '');
        folder?.file(`${safeLabel}-${cleanSerial}.png`, blob);
      } catch (err) {
        console.error('Error fetch barcode:', err);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    saveAs(zipBlob, `barcode-${safeLabel}-${timestamp}.zip`);
    toast.success('Export ZIP berhasil');
  };

  // =========================
  // LOADING / ERROR
  // =========================
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!batch) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-red-500">Data tidak ditemukan</p>
        <button onClick={() => router.back()} className="underline text-[#8D1231]">
          Kembali
        </button>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="space-y-6 px-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 px-6">
          <button onClick={() => router.back()} className="rounded-lg border p-2 hover:bg-gray-100">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold">Detail Serial Number + Barcode</h2>
        </div>

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
          <b>Range:</b> {batch.start} – {batch.end}
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
            {batch.serials.map((item, index) => (
              <tr key={item.serial} className="border-b">
                <td className="px-4 py-2 text-center">{index + 1}</td>
                <td className="px-4 py-2 font-mono">{item.serial}</td>
                <td className="px-4 py-2">{item.barcodeUrl ? <img src={`${API_BASE_URL}${item.barcodeUrl}`} alt={item.serial} className="h-12" /> : <span className="text-gray-400 text-xs">Barcode tidak tersedia</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 text-sm text-gray-500">Total: {batch.serials.length}</div>
      </div>
    </div>
  );
}
