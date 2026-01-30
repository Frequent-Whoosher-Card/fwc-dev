"use client";

import { useState } from "react";
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
}: {
  data: InboxItem;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  /* STATE */
  const [loading, setLoading] = useState(false);
  const payload = data.payload as Payload;
  const movementId = payload?.movementId;

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

      if (!res.ok) throw new Error("Gagal memproses.");

      // alert(`Berhasil ${action === "APPROVE" ? "disetujui" : "ditolak"}.`); // Optional: Use toast instead
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
        <div className="flex items-center justify-between border-b bg-red-50 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-red-800">Approval Masalah Stok</h3>
            <p className="text-sm text-red-600">
              Laporan dari:{" "}
              {payload?.reporterName &&
              payload.reporterName !== "Supervisor (validatedBy)"
                ? payload.reporterName
                : data.sender.fullName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Pesan Laporan:</p>
            <p className="text-gray-800 italic">"{data.message}"</p>
          </div>

          {hasLost && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Kartu Hilang ({payload.lostSerialNumbers.length})
              </h4>
              <div className="bg-red-50 rounded-lg p-3 border border-red-100 text-sm font-mono text-red-700 max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                 {payload.lostSerialNumbers.map((sn, i) => (
                    <div key={sn}>{i+1}. {sn}</div>
                 ))}
              </div>
            </div>
          )}

          {hasDamaged && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Kartu Rusak ({payload.damagedSerialNumbers.length})
              </h4>
               <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 text-sm font-mono text-orange-700 max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                 {payload.damagedSerialNumbers.map((sn, i) => (
                    <div key={sn}>{i+1}. {sn}</div>
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {/* FOOTER */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
          {(!payload.status || payload.status === "PENDING_APPROVAL") ? (
             <>
                <div /> {/* Spacer */}
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
             <div className="w-full text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    payload.status === "APPROVE" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                }`}>
                    {payload.status === "APPROVE" ? "✅ DISETUJUI" : "❌ DITOLAK"}
                    {/* Optional: Add timestamp or by whom if available in payload */}
                </div>
                <p className="text-xs text-gray-400 mt-1">Laporan ini sudah diproses dan tidak dapat diubah lagi.</p>
             </div>
          )}
        </div>

        {/* CONFIRM MODAL */}
        <ConfirmModal 
            open={confirmState.open}
            title={confirmState.title}
            description={confirmState.desc}
            variant={confirmState.action === "APPROVE" ? "danger" : "info"} // Approve is Danger because it deletes stock permanently (Lost)
            confirmText={confirmState.action === "APPROVE" ? "Ya, Setujui" : "Ya, Tolak"}
            loading={loading}
            onConfirm={handleResolve}
            onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
        />
      </div>
    </div>
  );
}
