"use client";

import StatusBadge from "./StatusBadge";

interface Sender {
  fullName: string;
  station?: string;
  batch_card?: string;
  card_category?: string;
  card_type?: string;
  amount_card?: string;
}

interface InboxPayload {
  serials?: string[];
  quantity?: number;
  serialDate?: string;
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

  const isSerialCase =
    data.status === "CARD_DAMAGED" || data.status === "CARD_MISSING";

  const createdAt = new Date(`${data.dateLabel} ${data.timeLabel}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border text-lg font-bold">
              {avatarLetter}
            </div>

            <div>
              <p className="font-semibold text-gray-800">
                {data.title}
              </p>
              <p className="text-xs text-gray-500">
                Dari: {data.sender.fullName}
              </p>
            </div>
          </div>

          <div className="flex flex-col text-right whitespace-nowrap">
            <span className="text-xs text-gray-500 font-medium">
              {data.dateLabel}
            </span>
            <span className="text-xs text-gray-400">{data.timeLabel}</span>
          </div>
        </div>

        {/* ===== Body ===== */}
        <div className="space-y-4 px-6 py-6">
          <Row label="Subject:" value={data.message || "-"} />
          
          {/* Attempt to show payload data if available */}
          {(data.payload as any)?.quantity && (
             <Row label="Total Kartu:" value={`${(data.payload as any).quantity} pcs`} />
          )}
          
          {(data.payload as any)?.serialDate && (
             <Row label="Tanggal Produksi:" value={new Date((data.payload as any).serialDate).toLocaleDateString("id-ID")} />
          )}

          <div className="grid grid-cols-[180px_1fr] items-center gap-4">
            <span className="text-sm text-gray-700">Status:</span>
            <StatusBadge status={data.status} />
          </div>

          {(data.payload as any)?.reporterName && (
             <Row label="Dilaporkan Oleh:" value={(data.payload as any).reporterName} />
          )}

          {(data.payload as any)?.validationResult?.validatedByName && (
             <Row label="Validasi Oleh:" value={(data.payload as any).validationResult.validatedByName} />
          )}

          {/* Show Serials if available */}
          {(data.payload?.serials && (data.payload.serials.length > 0)) && (
            <div className="mt-4">
                <p className="text-sm text-gray-700 mb-2 font-semibold">Serial Numbers:</p>
                <div className="bg-gray-50 rounded-lg p-3 max-h-[200px] overflow-y-auto border text-sm text-gray-600 font-mono">
                    <div className="grid grid-cols-1 gap-1">
                        {data.payload.serials.map((sn, i) => (
                            <div key={sn} className="flex gap-2">
                                <span className="text-gray-400 w-8 text-right">{i + 1}.</span>
                                <span>{sn}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}
          
          {/* Lost Cards Section */}
          {(data.payload as any)?.validationResult?.lostSerialNumbers?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-red-500"></span>
                 Kartu Hilang ({(data.payload as any).validationResult.lostSerialNumbers.length})
              </h4>
              <div className="bg-red-50 rounded-lg p-3 border border-red-100 text-sm font-mono text-red-700 max-h-[150px] overflow-y-auto grid grid-cols-1 gap-1">
                 {(data.payload as any).validationResult.lostSerialNumbers.map((sn: string, i: number) => (
                    <div key={sn} className="flex gap-2">
                        <span className="w-8 text-right opacity-50">{i+1}.</span>
                        <span>{sn}</span>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {/* Damaged Cards Section */}
          {(data.payload as any)?.validationResult?.damagedSerialNumbers?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                 Kartu Rusak ({(data.payload as any).validationResult.damagedSerialNumbers.length})
              </h4>
               <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 text-sm font-mono text-orange-700 max-h-[150px] overflow-y-auto grid grid-cols-1 gap-1">
                 {(data.payload as any).validationResult.damagedSerialNumbers.map((sn: string, i: number) => (
                    <div key={sn} className="flex gap-2">
                        <span className="w-8 text-right opacity-50">{i+1}.</span>
                        <span>{sn}</span>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {/* Fallback for specific DAMAGED/LOST arrays in payload if main serials empty */}
          {/* Note: Validation modal sends back lost/damaged lists, usually inbox payload has 'serials' (all) */}
        </div>

        {/* ===== Footer ===== */}
        <div className="flex justify-end border-t border-gray-200 bg-white px-8 py-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-red-700 px-10 py-3 text-sm font-semibold text-white shadow-md hover:bg-red-800 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Helper Row ===== */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-sm text-gray-600">{value}</span>
    </div>
  );
}
