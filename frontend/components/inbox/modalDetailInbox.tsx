"use client";

import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";
import { API_BASE_URL } from "@/lib/apiConfig";

interface Sender {
  fullName: string;
  station?: string;
  batch_card?: string;
  card_category?: string;
  card_type?: string;
  amount_card?: string;
}

interface InboxPayload {
  movementId?: string; // Important: to fetch detail
  serials?: string[];
  quantity?: number;
  serialDate?: string;
  status?: string;
}

export interface InboxDetail {
  id: string;
  title: string;
  status: string;
  message: string;
  dateLabel: string;
  timeLabel: string;
  sender: Sender;
  payload?: InboxPayload;
  programType?: "FWC" | "VOUCHER"; // Needed for fetching
}

export default function ModalDetailInbox({
  data,
  onClose,
}: {
  data: InboxDetail;
  onClose: () => void;
}) {
  const avatarLetter =
    data.sender?.fullName?.trim().charAt(0).toUpperCase() ?? "?";

  // State to hold extra Stock Out Detail
  const [stockDetail, setStockDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Detail if movementId exists
  useEffect(() => {
    const movementId = (data.payload as any)?.movementId;
    if (movementId) {
       fetchStockDetail(movementId, data.programType || "FWC");
    }
  }, [data]);

  const fetchStockDetail = async (id: string, programType: string) => {
    try {
        setLoadingDetail(true);
        const token = localStorage.getItem("fwc_token");
        if(!token) return;

        const path = programType.toLowerCase() === 'voucher' ? 'voucher' : 'fwc';
        const res = await fetch(`${API_BASE_URL}/stock/out/${path}/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.warn("Fetch stock detail failed:", errorText);
            return;
        }

        const json = await res.json();
        if(json.success && json.data) {
            // Backend returns { success: true, data: { movement: { ... } } }
            setStockDetail(json.data.movement || json.data);
        }
    } catch(err) {
        // Silently fail or log to error service
    } finally {
        setLoadingDetail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between border-b px-8 py-5 flex-none bg-white rounded-t-2xl">
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 border border-red-100 text-lg font-bold text-[#8D1231] shadow-sm">
              {avatarLetter}
            </div>

            <div>
              <p className="font-bold text-gray-900 text-lg tracking-tight">
                {data.title}
              </p>
              <p className="text-sm text-gray-400 font-medium">
                Dari: <span className="text-gray-600">{data.sender.fullName}</span> 
                {data.sender.station ? ` (${data.sender.station})` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col text-right whitespace-nowrap">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">
                    Waktu Terima
                </span>
                <span className="text-sm text-gray-600 font-semibold">{data.dateLabel} • {data.timeLabel}</span>
            </div>
            {/* Modern Close Button */}
            <button 
                onClick={onClose} 
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-95"
            >
                <span className="text-2xl font-light">×</span>
            </button>
          </div>
        </div>

        {/* ===== Body ===== */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          
          {/* Main Message */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
             <p className="text-sm text-gray-700 font-medium mb-1">Pesan:</p>
             <p className="text-base text-gray-800">{data.message}</p>
          </div>

          {/* STOCK OUT DETAILS (Nota, BAST, etc.) - If Available */}
          {stockDetail && (
              <div className="bg-gray-50/50 border rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-[10px] text-gray-400 uppercase tracking-[0.1em]">Detail Kiriman</h3>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <DetailItem label="Station" value={stockDetail.station?.name} highlight />
                      <DetailItem label="Card Category" value={stockDetail.cardCategory?.name || stockDetail.category?.categoryName} highlight />
                      <DetailItem label="Card Type" value={stockDetail.cardType?.name || stockDetail.type?.typeName} highlight />
                      <DetailItem label="Total Quantity" value={`${stockDetail.quantity} pcs`} highlight />
                      <DetailItem label="Batch Card" value={stockDetail.batchId} />
                  </div>

                  {/* Serial Numbers Display if available */}
                  {stockDetail.serials && stockDetail.serials.length > 0 && (
                      <div className="pt-4 border-t border-gray-100 space-y-3">
                           <div className="flex flex-col border-l border-gray-100 pl-8">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Kartu</span>
                            <div className="flex items-center">
                                <span className="px-2 py-0.5 rounded-lg bg-red-50 text-[#8D1231] border border-red-100 text-[11px] font-bold tracking-tight">
                                    {stockDetail.serials.length} pcs
                                </span>
                            </div>
                        </div>

                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input 
                                type="text"
                                placeholder="Cari Nomor Seri..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>

                          <div className="bg-gray-50/70 rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 p-4 max-h-60 overflow-y-auto custom-scrollbar">
                              {stockDetail.serials
                                .filter((sn: string) => sn.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((sn: string, i: number) => (
                                  <div key={sn} className="flex items-center gap-4 py-2 px-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></span>
                                      <span className="font-mono text-base text-gray-700 tracking-tight">{sn}</span>
                                  </div>
                              ))}
                            </div>
                          </div>
                      </div>
                  )}

                  {/* Documents Section */}
                  <div className="grid grid-cols-2 gap-6 pt-3 border-t border-gray-100">
                       <div>
                           <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Nota Dinas</p>
                           <p className="font-semibold text-gray-800 text-sm truncate">{stockDetail.notaDinas || "-"}</p>
                           {stockDetail.notaDinasFile && (
                               <a href={stockDetail.notaDinasFile.url} target="_blank" rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                   <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-50">📄</span>
                                   LIHAT NOTA
                               </a>
                           )}
                       </div>
                       <div>
                           <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">BAST</p>
                           <p className="font-semibold text-gray-800 text-sm truncate">{stockDetail.bast || "-"}</p>
                           {stockDetail.bastFile && (
                               <a href={stockDetail.bastFile.url} target="_blank" rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                   <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-50">📄</span>
                                   LIHAT BAST
                               </a>
                           )}
                       </div>
                  </div>
              </div>
          )}

          {/* Loading Indicator for Detail */}
          {loadingDetail && (
              <div className="text-center py-4 text-gray-400 text-sm animate-pulse">
                  Mengambil detail Nota & BAST...
              </div>
          )}

          {/* Validation Status (Lost/Damaged Report) */}
          {(data.payload as any)?.validationResult && (
             <div className="space-y-4">
                {/* Lost Cards */}
                {(data.payload as any).validationResult.lostSerialNumbers?.length > 0 && (
                    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                        <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            Laporan Kartu Hilang ({(data.payload as any).validationResult.lostSerialNumbers.length})
                        </h4>
                        <div className="grid grid-cols-1 gap-1 text-sm font-mono text-red-700 max-h-[150px] overflow-y-auto bg-white/50 p-2 rounded">
                            {(data.payload as any).validationResult.lostSerialNumbers.map((sn: string, i: number) => (
                                <div key={sn} className="flex gap-2">
                                    <span className="w-6 text-right opacity-50">{i+1}.</span>
                                    <span>{sn}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Damaged Cards */}
                {(data.payload as any).validationResult.damagedSerialNumbers?.length > 0 && (
                    <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                            Laporan Kartu Rusak ({(data.payload as any).validationResult.damagedSerialNumbers.length})
                        </h4>
                        <div className="grid grid-cols-1 gap-1 text-sm font-mono text-orange-700 max-h-[150px] overflow-y-auto bg-white/50 p-2 rounded">
                            {(data.payload as any).validationResult.damagedSerialNumbers.map((sn: string, i: number) => (
                                <div key={sn} className="flex gap-2">
                                    <span className="w-6 text-right opacity-50">{i+1}.</span>
                                    <span>{sn}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
          )}
          
          <div className="grid grid-cols-[120px_1fr] items-center gap-4 pt-4 border-t">
            <span className="text-sm font-medium text-gray-500">Status Inbox:</span>
            <div><StatusBadge status={data.status} /></div>
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-8 py-5 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg bg-[#8D1231] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#7a102b] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, highlight = false }: { label: string, value?: string | number, highlight?: boolean }) {
    if (!value) return null;
    return (
        <div className="flex flex-col">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-semibold ${highlight ? 'text-sm text-[#8D1231]' : 'text-gray-700 text-sm'}`}>{value}</p>
        </div>
    );
}
