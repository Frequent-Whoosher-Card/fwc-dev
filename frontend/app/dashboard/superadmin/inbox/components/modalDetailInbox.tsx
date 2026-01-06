'use client';

export default function ModalDetailInbox({ data, onClose }: { data: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Profil Pengirim */}
        <div className="p-6 border-b border-dashed border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-maroon-700">
            {data.sender.fullName[0]}
          </div>
          <div>
            <h3 className="font-bold text-lg">{data.sender.fullName}</h3>
            <p className="text-xs text-gray-400">Halim — 29 December 2025</p>
          </div>
        </div>

        <div className="p-8 space-y-5">
          {/* Info Utama Laporan */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <InfoBlock label="Batch Card" value="Received Card" />
            <InfoBlock label="Card Category" value="Inventory" />
            <InfoBlock label="Card Type" value="Gold" />
            <InfoBlock label="Station" value="Halim" />
          </div>

          {/* Status Kondisi dengan warna dinamis */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Card Condition</span>
            <p className={`text-sm font-bold mt-1 ${data.type === 'damaged' ? 'text-red-500' : 'text-orange-500'}`}>
              Card {data.type === 'damaged' ? 'Damaged' : 'Missing'}
            </p>
          </div>

          {/* List Serial Number (Hanya muncul jika ada data payload) */}
          {data.payload?.serials && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Serial Number Card :</span>
              <div className="space-y-1 mt-1">
                {data.payload.serials.map((sn: string, i: number) => (
                  <div key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="w-4">{i + 1}.</span>
                    <span className="bg-gray-50 px-3 py-1 rounded-md border border-gray-100 w-full">{sn}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pesan Tambahan */}
          <div className="pt-4 border-t border-gray-50">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Messages</span>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{data.message}</p>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-maroon-800 text-white px-10 py-2.5 rounded-xl font-bold text-sm hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-900/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <p className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-1">{value}</p>
    </div>
  );
}