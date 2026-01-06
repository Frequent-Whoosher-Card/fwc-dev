'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

/* =========================
   DUMMY DATA (SIMULASI API)
========================= */
const dummyMember = {
  name: 'Jessica Wongso',
  nik: '121213132131321',
  card_category: 'Gold',
  card_type: 'JaBan',
  remaining_quota: 6,
};

/* =========================
   MODAL VERIFIKASI
========================= */
function VerifyModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[420px] rounded-xl bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle className="text-green-600" />
          <h2 className="text-lg font-semibold">
            Card Verification Success
          </h2>
        </div>

        <div className="space-y-2 text-sm">
          <p><b>Name:</b> {dummyMember.name}</p>
          <p><b>NIK:</b> {dummyMember.nik}</p>
          <p><b>Card Category:</b> {dummyMember.card_category}</p>
          <p><b>Card Type:</b> {dummyMember.card_type}</p>
          <p><b>Remaining Quota:</b> {dummyMember.remaining_quota}</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-md bg-red-700 px-4 py-2 text-sm text-white"
          >
            Confirm Redeem
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   PAGE
========================= */
export default function RedeemKuotaCreatePage() {
  const router = useRouter();

  const [serialNumber, setSerialNumber] = useState('');
  const [redeemType, setRedeemType] = useState<'single' | 'pp'>('single');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-xl space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Redeem Kuota</h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:underline"
        >
          Back
        </button>
      </div>

      {/* FORM */}
      <div className="rounded-lg border bg-white p-6 space-y-4">
        {/* SERIAL NUMBER */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Serial Number
          </label>
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Input serial number"
            className="h-10 w-full rounded-md border px-3 text-sm"
          />
        </div>

        {/* REDEEM TYPE */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Redeem Type
          </label>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={redeemType === 'single'}
                onChange={() => setRedeemType('single')}
              />
              Single Journey (1 Kuota)
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={redeemType === 'pp'}
                onChange={() => setRedeemType('pp')}
              />
              PP / Round Trip (2 Kuota)
            </label>
          </div>
        </div>

        {/* ACTION */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={() => setShowModal(true)}
            disabled={!serialNumber}
            className="rounded-md bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Verify Serial Number
          </button>
        </div>
      </div>

      {/* MODAL */}
      <VerifyModal 
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          setShowModal(false);
          alert('Redeem success (dummy)');
        }}
      />
    </div>
  );
}