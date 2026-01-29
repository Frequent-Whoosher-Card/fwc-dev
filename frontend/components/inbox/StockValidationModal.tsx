"use client";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { InboxItemProps } from "./InboxItem";
import { API_BASE_URL } from "@/lib/apiConfig";

export default function StockValidationModal({
  data,
  onClose,
  onSuccess,
}: {
  data: InboxItemProps;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [lostCount, setLostCount] = useState(0);
  const [damagedCount, setDamagedCount] = useState(0);
  // received implicitly = total - lost - damaged? 
  // Wait, backend logic: receives "receviedSerialNumbers", "lostSerialNumbers", "damagedSerialNumbers".
  // Frontend needs valid serials.
  // The 'payload' from inbox usually contains 'serials' (all distibuted serials).
  
  // If payload has serials, we can offer selection.
  // Implementation simple version:
  // Show list of serials. Allow marking specific serials as Lost or Damaged.
  // If no serials in payload, maybe just numeric input?
  // Current backend 'StockOutFwcService.validate' expects SERIAL NUMBERS.
  
  const serials = (data.payload as any)?.serials || [];
  
  // State for each serial: 'RECEIVED' | 'LOST' | 'DAMAGED'
  const [serialStatus, setSerialStatus] = useState<Record<string, string>>({});

  // derived state
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSerials = serials.filter((s: string) => 
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkAllReceived = () => {
    const updates: Record<string, string> = {};
    filteredSerials.forEach((sn: string) => {
        updates[sn] = "RECEIVED";
    });
    setSerialStatus(prev => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
      // confirm?
      if (confirm("Reset semua status validasi?")) {
        setSerialStatus({});
      }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
        // Collect statuses for ALL serials, not just filtered ones
        const received = serials.filter((s: string) => !serialStatus[s] || serialStatus[s] === 'RECEIVED');
        const lost = serials.filter((s: string) => serialStatus[s] === 'LOST');
        const damaged = serials.filter((s: string) => serialStatus[s] === 'DAMAGED');
        
        const movementId = (data.payload as any)?.movementId;
        
        const res = await fetch(`${API_BASE_URL}/stock/out/validate/${movementId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("fwc_token")}`
            },
            body: JSON.stringify({
                receivedSerialNumbers: received,
                lostSerialNumbers: lost,
                damagedSerialNumbers: damaged,
                note: "Validated via Inbox"
            })
        });
        
        const result = await res.json();
        if (result.success) {
            onSuccess();
            onClose();
        } else {
            alert(result.message || "Validation failed");
        }
    } catch(e) {
        console.error(e);
        alert("Error validating");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-start bg-gray-50">
             <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{data.title}</h3>
                    <div className="text-right text-xs text-gray-500">
                        <p>{data.dateLabel}</p>
                        <p>{data.timeLabel}</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{data.message}</p>
                
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-gray-400">Pengirim</span>
                        <span className="font-medium text-gray-700">{data.sender?.fullName || "Unknown"}</span>
                    </div>
                    <div className="flex flex-col border-l pl-4">
                        <span className="text-gray-400">Total Kartu</span>
                        <span className="font-medium text-gray-700">{serials.length} pcs</span>
                    </div>
                    {(data.payload as any)?.serialDate && (
                        <div className="flex flex-col border-l pl-4">
                            <span className="text-gray-400">Tgl Produksi</span>
                            <span className="font-medium text-gray-700">{new Date((data.payload as any).serialDate).toLocaleDateString("id-ID")}</span>
                        </div>
                    )}
                </div>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 ml-4">
                <span className="text-xl">×</span>
             </button>
        </div>
        
        <div className="p-4 border-b space-y-3 bg-white">
            <input 
                type="text" 
                placeholder="Cari Serial Number..." 
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
                <button 
                    onClick={handleMarkAllReceived}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                >
                    ✓ Terima Semua ({filteredSerials.length})
                </button>
                <button 
                    onClick={handleReset}
                    className="px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    Reset
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {filteredSerials.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic">
                    {serials.length === 0 ? "Tidak ada serial number." : "Tidak ditemukan."}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-2">
                    {filteredSerials.map((sn: string) => {
                        const status = serialStatus[sn] || 'RECEIVED'; // Default implicit received
                        return (
                            <div key={sn} className={`flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm transition-all ${status !== 'RECEIVED' ? 'border-amber-200 bg-amber-50' : 'border-gray-100'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${status === 'RECEIVED' ? 'bg-green-500' : status === 'LOST' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                                    <span className="font-mono text-sm font-medium text-gray-700">{sn}</span>
                                </div>
                                <div className="flex gap-1">
                                     <button 
                                        onClick={() => setSerialStatus(prev => ({...prev, [sn]: 'RECEIVED'}))}
                                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${status === 'RECEIVED' ? 'bg-green-100 text-green-700 font-bold ring-1 ring-green-200' : 'text-gray-400 hover:bg-gray-100'}`}
                                     >
                                        Ada
                                     </button>
                                     <button 
                                        onClick={() => setSerialStatus(prev => ({...prev, [sn]: 'LOST'}))}
                                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${status === 'LOST' ? 'bg-red-100 text-red-700 font-bold ring-1 ring-red-200' : 'text-gray-400 hover:bg-gray-100'}`}
                                     >
                                        Hilang
                                     </button>
                                     <button 
                                        onClick={() => setSerialStatus(prev => ({...prev, [sn]: 'DAMAGED'}))}
                                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${status === 'DAMAGED' ? 'bg-orange-100 text-orange-700 font-bold ring-1 ring-orange-200' : 'text-gray-400 hover:bg-gray-100'}`}
                                     >
                                        Rusak
                                     </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        
        <div className="p-4 border-t bg-white flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50">Batal</button>
             <button 
                onClick={handleSubmit} 
                disabled={loading || serials.length === 0}
                className="px-6 py-2 rounded-lg bg-red-700 text-white font-bold hover:bg-red-800 disabled:opacity-50 shadow-sm"
             >
                {loading ? "Menyimpan..." : "Konfirmasi & Simpan"}
             </button>
        </div>
      </div>
    </div>
  );
}
