'use client';
import StatusBadge from './StatusBadge';

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
}

export interface InboxDetail {
  id: string;
  status: 'accepted' | 'damaged' | 'missing';
  message: string;
  date_label: string;
  time_label: string;
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
    data.sender?.fullName?.trim().charAt(0).toUpperCase() ?? '?';

  const isSerialCase =
    data.status === 'damaged' || data.status === 'missing';

  const createdAt = new Date(`${data.date_label} ${data.time_label}`);

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
                {data.sender.fullName}
              </p>
              <p className="text-xs text-gray-500">
                {data.sender.station ?? '-'}
              </p>
            </div>
          </div>

          <div className="flex flex-col text-right whitespace-nowrap">
            <span className="text-xs text-gray-500 font-medium">
              {data.date_label}
            </span>
            <span className="text-xs text-gray-400">
              {data.time_label}
            </span>
      </div>
        </div>

        {/* ===== Body ===== */}
        <div className="space-y-4 px-6 py-6">
          <Row label="Batch Card:" value={data.sender.batch_card ?? '-'} />
          <Row label="Card Category:" value={data.sender.card_category ?? '-'} />
          <Row label="Card Type:" value={data.sender.card_type ?? '-'} />
          <Row label="Amount Card:" value={data.sender.amount_card ?? '-'} />
          <Row label="Station:" value={data.sender.station ?? '-'} />

          <div className="grid grid-cols-[180px_1fr] items-center gap-4">
            <span className="text-sm text-gray-700">Card Condition:</span>
            <StatusBadge status={data.status} />
          </div>

          {isSerialCase &&
            data.payload?.serials?.map((sn, i) => (
              <Row
                key={sn}
                label={i === 0 ? 'Serial Number Card:' : ''}
                value={`${i + 1}. ${sn}`}
              />
            ))}

          <div className="grid grid-cols-[180px_1fr] items-start gap-4">
            <span className="text-sm text-gray-700">Messages:</span>
            <textarea
              disabled
              value={data.message}
              className="min-h-[80px] w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>
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
