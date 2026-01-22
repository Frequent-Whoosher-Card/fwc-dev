'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { redeemService } from '@/lib/services/redeem/redeemService';

interface ExportRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: 'FWC' | 'VOUCHER';
}

export default function ExportRedeemModal({
  isOpen,
  onClose,
  product = 'FWC',
}: ExportRedeemModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [format, setFormat] = useState<'CSV' | 'XLSX' | 'PDF' | 'JPG'>('CSV');
  const [isLoading, setIsLoading] = useState(false);

  const formatOptions = [
    {
      value: 'CSV',
      label: 'CSV (.csv)',
      description: 'Format spreadsheet universal',
    },
    {
      value: 'XLSX',
      label: 'Excel (.xlsx)',
      description: 'Format spreadsheet dengan formatting',
    },
    {
      value: 'PDF',
      label: 'PDF (.pdf)',
      description: 'Format dokumen yang siap cetak',
    },
    {
      value: 'JPG',
      label: 'Gambar (.jpg)',
      description: 'Format gambar 1200x800px',
    },
  ];

  const handleExport = async () => {
    if (!date) {
      toast.error('Silakan pilih tanggal');
      return;
    }

    setIsLoading(true);
    try {
      const blob = await redeemService.exportReport(date, format);
      const fileExtension = format.toLowerCase();
      const filename = `Redeem_Report_${date}.${fileExtension}`;
      redeemService.downloadFile(blob, filename);

      toast.success(`Laporan berhasil diexport sebagai ${format}`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengexport laporan');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Export Laporan Redeem</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="mb-2">
          <span className="text-xs text-gray-500 mr-2">Produk:</span>
          <span className="px-2 py-1 rounded bg-red-50 text-[#8D1231] font-semibold border border-[#8D1231] text-xs">{product}</span>
        </div>
        <div className="space-y-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Laporan akan dihasilkan untuk satu hari penuh (00:00 - 23:59)
            </p>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="space-y-2">
              {formatOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={format === option.value}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-600">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
