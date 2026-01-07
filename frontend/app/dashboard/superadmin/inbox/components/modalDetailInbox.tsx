'use client';
import StatusBadge from './StatusBadge';

interface Sender {
  fullName: string;
  station?: string;
}

interface InboxPayload {
  serials?: string[];
}

export interface InboxDetail {
  id: string;
  type: 'damaged' | 'missing';
  message: string;
  createdAt: string;
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ================= Header ================= */}
        <div className="flex items-center gap-4 border-b border-dashed px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-maroon-700">
            {data.sender.fullName?.[0]}
          </div>

          <div className="flex flex-col">
            <span className="text-base font-semibold text-gray-800">
              {data.sender.fullName}
            </span>
            <span className="text-xs text-gray-400">
              {data.sender.station ?? '-'} •{' '}
              {new Date(data.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* ================= Body ================= */}
        <div className="space-y-8 px-6 py-7">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-6">
            <Info label="Batch Card" value="Received Card" />
            <Info label="Card Category" value="Inventory" />
            <Info label="Card Type" value="Gold" />
            <Info label="Station" value={data.sender.station ?? '-'} />
          </div>

          {/* Condition */}
          <div className="flex flex-col gap-1 items-start">
            <span className="truncate text-sm font-semibold text-gray-900">
              {data.sender.fullName}
            </span>

            <StatusBadge status={data.type} />
          </div>

          {/* Serial Numbers */}
          {data.payload?.serials?.length ? (
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Serial Number
              </span>

              <div className="mt-3 max-h-40 space-y-2 overflow-auto rounded-lg border bg-gray-50 p-3">
                {data.payload.serials.map((sn, i) => (
                  <div
                    key={sn}
                    className="flex items-center gap-3 text-sm text-gray-700"
                  >
                    <span className="w-5 text-right text-gray-400">
                      {i + 1}.
                    </span>
                    <span className="rounded-md border bg-white px-3 py-1.5">
                      {sn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Message */}
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Message
            </span>
            <p className="mt-2 rounded-lg border bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
              {data.message}
            </p>
          </div>
        </div>

        {/* ================= Footer ================= */}
        <div className="flex justify-end border-t border-gray-200 bg-white px-8 py-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-red-700 px-10 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-800 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Helpers ================= */
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <span className="border-b pb-1 text-sm font-medium text-gray-800">
        {value}
      </span>
    </div>
  );
}
