"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/apiConfig";
import ConfirmModal from "../ConfirmModal";

interface Payload {
  movementId: string;
  stationId: string;
  reporterName: string;
  lostCount: number;
  damagedCount: number;
  lostSerialNumbers: string[];
  damagedSerialNumbers: string[];
  status: string;
}

interface InboxItem {
  id: string;
  title: string;
  message: string;
  sender: { fullName: string };
  dateLabel: string;
  timeLabel: string;
  payload?: any;
}

export default function IssueApprovalModal({
  data,
  onClose,
  onSuccess,
  programType = "FWC",
}: {
  data: InboxItem;
  onClose: () => void;
  onSuccess?: () => void;
  programType?: "FWC" | "VOUCHER";
}) {
  /* STATE */
  const [loading, setLoading] = useState(false);
  
  // Rich Data State
  const [stockDetail, setStockDetail] = useState<any | null>(null);
  const [loadingRich, setLoadingRich] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const payload = data.payload as Payload;
  const movementId = payload?.movementId;

  // Fetch Rich Details if movementId exists
  useEffect(() => {
    if (movementId) {
       fetchStockDetail(movementId, programType);
    }
  }, [movementId, programType]);

  const fetchStockDetail = async (id: string, type: string) => {
    try {
        setLoadingRich(true);
        const token = localStorage.getItem("fwc_token");
        if(!token) return;

        const path = type.toLowerCase() === 'voucher' ? 'voucher' : 'fwc';
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
            setStockDetail(json.data.movement || json.data);
        }
    } catch(err) {
        // Silently fail
    } finally {
        setLoadingRich(false);
    }
  };

  /* CONFIRMATION STATE */
  const [confirmState, setConfirmState] = useState<{
        open: boolean;
        action: "APPROVE" | "REJECT" | null;
        title: string;
        desc: string;
  }>({ open: false, action: null, title: "", desc: "" });

  const triggerConfirm = (action: "APPROVE" | "REJECT") => {
      if (action === "APPROVE") {
          setConfirmState({
              open: true,
              action: "APPROVE",
              title: "Setujui Laporan Stok?",
              desc: "Anda akan menyetujui laporan kartu hilang/rusak ini. Kartu yang dilaporkan akan dihapus secara permanen dari stok aktif. Tindakan ini tidak dapat dibatalkan.",
          });
      } else {
          setConfirmState({
              open: true,
              action: "REJECT",
              title: "Tolak Laporan?",
              desc: "Anda akan menolak laporan ini. Status kartu akan dikembalikan dan Laporan ini akan ditandai sebagai ditolak.",
          });
      }
  };

  const handleResolve = async () => {
    const action = confirmState.action;
    if (!movementId || !action) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("fwc_token");
      const res = await fetch(`${API_BASE_URL}/stock/out/issue/${movementId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
          const errorText = await res.text();
          console.warn("Resolve issue failed:", errorText);
          
          if (res.status === 403) {
              alert("Akses Ditolak: Anda tidak memiliki izin untuk memproses laporan ini.");
          } else {
              alert(`Gagal memproses: ${errorText || "Server error"}`);
          }
          return;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      alert("Terjadi kesalahan saat memproses data.");
      console.error(err);
    } finally {
      setLoading(false);
      setConfirmState(prev => ({ ...prev, open: false }));
    }
  };

  const hasLost = (payload?.lostSerialNumbers?.length || 0) > 0;
  const hasDamaged = (payload?.damagedSerialNumbers?.length || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-8 py-5 flex-none bg-white rounded-t-xl">
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 border border-red-100 text-lg font-bold text-[#8D1231] shadow-sm">
              {data.sender?.fullName?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg tracking-tight">Approval Masalah Stok</p>
              <p className="text-sm text-gray-400 font-medium">
                Laporan dari: <span className="text-gray-600">{payload?.reporterName || data.sender.fullName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col text-right whitespace-nowrap">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">
                    Tanggal Laporan
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

        {/* BODY */}
        <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Pesan Laporan</p>
            <p className="text-sm text-gray-800 italic leading-relaxed">"{data.message}"</p>
          </div>

          {/* STOCK OUT DETAILS (Nota, BAST, etc.) - If Available */}
          {stockDetail && (
              <div className="bg-gray-50/50 border rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-[10px] text-gray-400 uppercase tracking-[0.1em]">Detail Referensi Kiriman</h3>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div>
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Station</p>
                          <p className="font-semibold text-sm text-[#8D1231]">{stockDetail.station?.name || "-"}</p>
                      </div>
                      <div>
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Card Product</p>
                          <p className="font-semibold text-sm text-[#8D1231]">
                            {stockDetail.cardCategory?.name || stockDetail.category?.categoryName} - {stockDetail.cardType?.name || stockDetail.type?.typeName}
                          </p>
                      </div>
                      <div>
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Batch Card</p>
                          <p className="font-semibold text-sm text-gray-700">{stockDetail.batchId || "-"}</p>
                      </div>
                      <div className="border-t border-gray-100 pt-2">
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Nota Dinas</p>
                          <p className="font-semibold text-sm text-gray-700">{stockDetail.notaDinas || "-"}</p>
                      </div>
                       <div className="border-t border-gray-100 pt-2">
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">BAST</p>
                          <p className="font-semibold text-sm text-gray-700">{stockDetail.bast || "-"}</p>
                      </div>
                  </div>
              </div>
          )}

          {loadingRich && (
              <div className="text-center py-2 text-gray-400 text-xs animate-pulse">
                  Mengambil detail referensi...
              </div>
          )}

          {(hasLost || hasDamaged) && (
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
          )}

          {hasLost && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-bold text-[11px] text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    Kartu Hilang
                </h4>
                <span className="px-2 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold tracking-tight">
                    {payload.lostSerialNumbers.length} PCS
                </span>
              </div>
              <div className="bg-red-50/40 rounded-2xl border border-red-100/50 overflow-hidden">
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 p-4 max-h-60 overflow-y-auto custom-scrollbar">
                   {payload.lostSerialNumbers
                     .filter(sn => sn.toLowerCase().includes(searchQuery.toLowerCase()))
                     .map((sn, i) => (
                      <div key={sn} className="flex items-center gap-4 py-2 px-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)] shrink-0"></span>
                        <span className="font-mono text-base text-gray-700 tracking-tight">{sn}</span>
                      </div>
                   ))}
                </div>
              </div>
            </div>
          )}

          {hasDamaged && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-bold text-[11px] text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    Kartu Rusak
                </h4>
                <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-bold tracking-tight">
                    {payload.damagedSerialNumbers.length} PCS
                </span>
              </div>
               <div className="bg-orange-50/40 rounded-2xl border border-orange-100/50 overflow-hidden">
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 p-4 max-h-60 overflow-y-auto custom-scrollbar">
                   {payload.damagedSerialNumbers
                     .filter(sn => sn.toLowerCase().includes(searchQuery.toLowerCase()))
                     .map((sn, i) => (
                      <div key={sn} className="flex items-center gap-4 py-2 px-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)] shrink-0"></span>
                        <span className="font-mono text-base text-gray-700 tracking-tight">{sn}</span>
                      </div>
                   ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
          {(!payload.status || payload.status === "PENDING_APPROVAL") ? (
             <>
                <div /> 
                <div className="flex gap-3">
                  <button
                    onClick={() => triggerConfirm("REJECT")}
                    disabled={loading}
                    className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-sm transition-colors"
                  >
                    Tolak / Reset
                  </button>
                  
                  <button
                    onClick={() => triggerConfirm("APPROVE")}
                    disabled={loading}
                    className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium text-sm shadow-md transition-colors"
                  >
                     Setujui Laporan
                  </button>
                </div>
             </>
          ) : (
             <div className="w-full py-4 border-t bg-gray-50/50">
                <div className="flex flex-col items-center gap-2">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider shadow-sm border ${
                        payload.status === "APPROVE" 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}>
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full text-white ${
                             payload.status === "APPROVE" ? "bg-green-500" : "bg-red-500"
                        }`}>
                             {payload.status === "APPROVE" ? "✓" : "!"}
                        </div>
                        <span className="uppercase">
                            {payload.status === "APPROVE" ? "Laporan Disetujui" : "Laporan Ditolak"}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">
                        Laporan ini sudah diproses dan bersifat permanen
                    </p>
                </div>
             </div>
          )}
        </div>

        {/* CONFIRM MODAL */}
        <ConfirmModal 
            open={confirmState.open}
            title={confirmState.title}
            description={confirmState.desc}
            variant={confirmState.action === "APPROVE" ? "danger" : "info"} 
            confirmText={confirmState.action === "APPROVE" ? "Ya, Setujui" : "Ya, Tolak"}
            loading={loading}
            onConfirm={handleResolve}
            onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
        />
      </div>
    </div>
  );
}
