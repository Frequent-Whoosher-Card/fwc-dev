'use client';

import { useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import { redeemService, RedeemFilterParams } from '@/lib/services/redeem/redeemService';
import { UserContext } from '@/app/dashboard/superadmin/dashboard/dashboard-layout'; // Fallback path, works for admin too usually if layout shared
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';

interface ExportRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: 'FWC' | 'VOUCHER';
  currentFilters?: RedeemFilterParams; // Filters from the parent page
  isSuperadmin?: boolean;
}

type ExportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'IMAGE';

export default function ExportRedeemModal({
  isOpen,
  onClose,
  product = 'FWC',
  currentFilters,
  isSuperadmin: isSuperadminProp,
}: ExportRedeemModalProps) {
  const [format, setFormat] = useState<ExportFormat>('PDF');
  const [isLoading, setIsLoading] = useState(false);
  const [keterangan, setKeterangan] = useState('');

  // Get user context
  // Note: We might need to adjust import path if UserContext is not exported from there or if using different layout
  // Assuming a generic way to get user info if Context fails, but let's try reading from localStorage as fallback
  const [user, setUser] = useState<{ role: string; fullName: string } | null>(null);

  useEffect(() => {
    // Try getting from localStorage since Context might be tricky across different layouts without a common provider export
    const storedUser = localStorage.getItem('fwc_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  const isSuperadmin = isSuperadminProp ?? user?.role === 'superadmin';

  const getExportFilters = () => {
    // Base filters
    let filters: RedeemFilterParams = {
      limit: 1000, // Reasonable limit for export
      product,
    };

    if (isSuperadmin) {
      // Use page filters
      if (currentFilters) {
        filters = { ...filters, ...currentFilters, limit: 1000 };
      }
    } else {
      // Restrict to TODAY and CURRENT USER
      const today = new Date().toISOString().split('T')[0];
      filters = {
        ...filters,
        startDate: today,
        endDate: today,
        // Operator filtering will be done client-side if backend doesn't support 'operatorId' strict filtering for self
        // But we will filter the RESULT array to be safe
      };
    }
    return filters;
  };

  const fetchData = async () => {
    const filters = getExportFilters();
    const res = await redeemService.listRedeems(filters);
    let items = res.data || [];

    // Client-side filtering for non-superadmin (security layer)
    if (!isSuperadmin && user?.fullName) {
      items = items.filter(item => item.operator?.fullName === user.fullName);
    }

    // Also filter by Product if not strictly handled by backend
    // Also filter by Product if not strictly handled by backend
    if (product) {
      items = items.filter(item => {
        const cardProduct = item.card?.cardProduct as any;
        const progType = cardProduct?.programType || 'FWC';
        return progType === product;
      });
    }

    return items;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getTableData = (items: any[]) => {
    return items.map((item, index) => ({
      no: index + 1,
      date: formatDate(item.createdAt),
      customer: item.card?.member?.name || '-',
      nik: item.card?.member?.identityNumber ? `'${item.card.member.identityNumber}` : '-', // Quote for Excel to prevent scientific notation
      trxNumber: item.transactionNumber || '-',
      serial: item.card?.serialNumber || '-',
      category: item.card?.cardProduct?.category?.categoryName || '-',
      type: item.card?.cardProduct?.type?.typeName || '-',
      journey: product === 'VOUCHER' ? '-' : (item.redeemType === 'SINGLE' ? 'Single Journey' : 'Roundtrip'),
      quota: item.remainingQuota ?? 0,
      operator: item.operator?.fullName || '-',
      station: item.station?.stationName || '-',
    }));
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const items = await fetchData();

      if (items.length === 0) {
        toast.error('Tidak ada data untuk diexport');
        setIsLoading(false);
        return;
      }

      const data = getTableData(items);
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `Redeem_Report_${product}_${dateStr}`;

      switch (format) {
        case 'PDF': await generatePDF(data, filename); break;
        case 'EXCEL': await generateExcel(data, filename); break;
        case 'CSV': generateCSV(data, filename); break;
        case 'IMAGE': await generateImage(data, filename); break;
      }

      toast.success(`Export ${format} berhasil`);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal export data');
    } finally {
      setIsLoading(false);
    }
  };

  /* GENERATORS */

  const getFormattedDate = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const generatePDF = (data: any[], filename: string) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`LAPORAN REDEEM ${product}`, pageWidth / 2, 15, { align: 'center' });

    // Header Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let startY = 25;

    doc.text(`Operator : ${user?.fullName || '-'}`, 14, startY);
    startY += 5;
    doc.text(`Shift : ${getFormattedDate()}`, 14, startY);
    startY += 5;
    doc.text(`Jumlah transaksi redeem : ${data.length}`, 14, startY);
    startY += 10;

    if (keterangan) {
      doc.setFontSize(9);
      doc.text(`Keterangan: ${keterangan}`, 14, startY);
      startY += 5;
    }

    const headers = [['No', 'Tgl Redeem', 'Pelanggan', 'NIK', 'No. Trx', 'Serial', 'Kategori', 'Tipe', 'Perjalanan', 'Sisa', 'Operator', 'Stasiun']];
    const body = data.map(row => [
      row.no, row.date, row.customer, row.nik.replace(/'/g, ''), row.trxNumber, row.serial, row.category, row.type, row.journey, row.quota, row.operator, row.station
    ]);

    // Remove Journey column if Voucher
    if (product === 'VOUCHER') {
      headers[0].splice(8, 1);
      body.forEach(row => row.splice(8, 1));
    }

    autoTable(doc, {
      head: headers,
      body: body,
      startY: startY,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [141, 18, 49], textColor: 255 },
      theme: 'grid',
    });

    doc.save(`${filename}.pdf`);
  };

  const generateExcel = async (data: any[], filename: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Redeem');

    // Title
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `LAPORAN REDEEM ${product}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Header Info
    worksheet.mergeCells('A2:L2');
    worksheet.getCell('A2').value = `Operator : ${user?.fullName || '-'}`;

    worksheet.mergeCells('A3:L3');
    worksheet.getCell('A3').value = `Shift : ${getFormattedDate()}`;

    worksheet.mergeCells('A4:L4');
    worksheet.getCell('A4').value = `Jumlah transaksi redeem : ${data.length}`;

    if (keterangan) {
      worksheet.mergeCells('A5:L5');
      worksheet.getCell('A5').value = `Keterangan: ${keterangan}`;
    }

    const headerRowIndex = keterangan ? 7 : 6;

    worksheet.getRow(headerRowIndex).values = [
      'No', 'Tgl Redeem', 'Nama Pelanggan', 'NIK', 'No. Transaksi', 'Serial Kartu',
      'Kategori', 'Tipe', 'Tipe Perjalanan', 'Sisa Kuota', 'Operator', 'Stasiun'
    ];

    // Column widths
    worksheet.columns = [
      { key: 'no', width: 5 },
      { key: 'date', width: 20 },
      { key: 'customer', width: 25 },
      { key: 'nik', width: 20 },
      { key: 'trxNumber', width: 20 },
      { key: 'serial', width: 15 },
      { key: 'category', width: 15 },
      { key: 'type', width: 15 },
      { key: 'journey', width: 15 },
      { key: 'quota', width: 10 },
      { key: 'operator', width: 20 },
      { key: 'station', width: 15 },
    ];

    if (product === 'VOUCHER') {
      worksheet.spliceColumns(9, 1); // Remove journey column
      // Re-set header row because spliceColumns might shift it weirdly if values were set manually
      worksheet.getRow(headerRowIndex).values = [
        'No', 'Tgl Redeem', 'Nama Pelanggan', 'NIK', 'No. Transaksi', 'Serial Kartu',
        'Kategori', 'Tipe', 'Sisa Kuota', 'Operator', 'Stasiun'
      ];
    }

    // Add rows
    data.forEach(row => {
      const values = [
        row.no, row.date, row.customer, row.nik, row.trxNumber, row.serial,
        row.category, row.type, row.journey, row.quota, row.operator, row.station
      ];
      if (product === 'VOUCHER') {
        values.splice(8, 1);
      }
      worksheet.addRow(values);
    });

    // Style header
    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8D1231' } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xlsx`;
    link.click();
  };

  const generateCSV = (data: any[], filename: string) => {
    let csv = `LAPORAN REDEEM ${product}\n`;
    csv += `Operator : ${user?.fullName || '-'}\n`;
    csv += `Shift : ${getFormattedDate()}\n`;
    csv += `Jumlah transaksi redeem : ${data.length}\n`;
    if (keterangan) csv += `Keterangan: ${keterangan}\n`;
    csv += '\n';

    let headers = 'No,Tanggal Redeem,Nama Pelanggan,NIK,Nomor Transaksi,Serial Kartu,Kategori Kartu,Tipe Kartu,Tipe Perjalanan,Sisa Kuota,Operator,Stasiun';
    if (product === 'VOUCHER') {
      headers = 'No,Tanggal Redeem,Nama Pelanggan,NIK,Nomor Transaksi,Serial Kartu,Kategori Kartu,Tipe Kartu,Sisa Kuota,Operator,Stasiun';
    }
    csv += headers + '\n';

    csv += data.map(row => {
      let fields = [
        row.no, `"${row.date}"`, `"${row.customer}"`, `"${row.nik.replace(/'/g, '')}"`, `"${row.trxNumber}"`, `"${row.serial}"`,
        `"${row.category}"`, `"${row.type}"`, `"${row.journey}"`, row.quota, `"${row.operator}"`, `"${row.station}"`
      ];
      if (product === 'VOUCHER') {
        fields.splice(8, 1); // Remove journey
      }
      return fields.join(',');
    }).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const generateImage = async (data: any[], filename: string) => {
    // Create temp container
    const container = document.createElement('div');
    // Use specific styles to avoid inheritance issues
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 1200px;
        background-color: white;
        padding: 40px;
        font-family: Arial, sans-serif;
        color: black;
        z-index: 9999;
      `;

    let html = `
        <div style="margin-bottom: 20px;">
            <h2 style="text-align: center; color: #8D1231; margin-bottom: 20px; font-size: 24px;">LAPORAN REDEEM ${product}</h2>
            <div style="font-size: 14px; line-height: 1.6;">
                <div><strong>Operator :</strong> ${user?.fullName || '-'}</div>
                <div><strong>Shift :</strong> ${getFormattedDate()}</div>
                <div><strong>Jumlah transaksi redeem :</strong> ${data.length}</div>
                ${keterangan ? `<div style="margin-top: 10px; background: #f9f9f9; padding: 10px; border: 1px solid #eee;"><strong>Keterangan:</strong> ${keterangan}</div>` : ''}
            </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
                <tr style="background-color: #8D1231; color: white;">
                    <th style="padding: 10px; border: 1px solid #ddd;">No</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Tanggal</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Pelanggan</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">NIK</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">No. Trx</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Serial</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Kategori</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Tipe</th>
                    ${product !== 'VOUCHER' ? '<th style="padding: 10px; border: 1px solid #ddd;">Perjalanan</th>' : ''}
                    <th style="padding: 10px; border: 1px solid #ddd;">Sisa</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Operator</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Stasiun</th>
                </tr>
            </thead>
            <tbody>
      `;

    data.forEach(row => {
      html += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${row.no}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.date}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.customer}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.nik.replace(/'/g, '')}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.trxNumber}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.serial}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.category}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.type}</td>
                ${product !== 'VOUCHER' ? `<td style="padding: 8px; border: 1px solid #ddd;">${row.journey}</td>` : ''}
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${row.quota}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.operator}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.station}</td>
            </tr>
          `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Strip all computed styles that might contain lab() colors to fix html2canvas error
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.style) {
              const computedStyle = window.getComputedStyle(el);
              // Force override any color property with standard rgb if it uses modern color functions
              ['color', 'background-color', 'border-color', 'outline-color'].forEach(prop => {
                const value = computedStyle.getPropertyValue(prop);
                if (value && (value.includes('lab(') || value.includes('lch(') || value.includes('oklab('))) {
                  el.style.setProperty(prop, prop === 'color' || prop === 'outline-color' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)', 'important');
                }
              });
            }
          });
        },
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg');
      link.download = `${filename}.jpg`;
      link.click();
    } catch (error) {
      console.error("Image export error:", error);
      toast.error("Gagal export gambar");
    } finally {
      document.body.removeChild(container);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-[#8D1231] mb-4">Export Laporan Redeem</h3>

        <div className="mb-4 bg-gray-50 p-3 rounded text-sm text-gray-700">
          <p><strong>Mode:</strong> {isSuperadmin ? 'Superadmin (Filter Halaman)' : 'Operator (Data Hari Ini)'}</p>
          {!isSuperadmin && <p className="text-xs text-gray-500 mt-1">Hanya menampilkan data yang Anda proses hari ini.</p>}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format Export</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-[#8D1231] focus:border-[#8D1231]"
            >
              <option value="PDF">PDF Document (.pdf)</option>
              <option value="EXCEL">Microsoft Excel (.xlsx)</option>
              <option value="CSV">CSV (.csv)</option>
              <option value="IMAGE">Image/Gambar (.jpg)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (Opsional)</label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm h-20 resize-none focus:ring-[#8D1231] focus:border-[#8D1231]"
              placeholder="Catatan tambahan untuk laporan..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50"
              disabled={isLoading}
            >
              Batal
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-[#8D1231] text-white rounded-md text-sm hover:bg-[#73122E] disabled:opacity-50 flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : (
                `Export ${format}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
