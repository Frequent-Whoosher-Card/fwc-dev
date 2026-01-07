'use client';
import { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function ModalDetailInbox({ item, onClose }: any) {
  const isNew = item.isNew;

  const [batchCard, setBatchCard] = useState<number | ''>('');
  const [station, setStation] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');

  const [condition, setCondition] = useState('');
  const [amount, setAmount] = useState(1);
  const [serials, setSerials] = useState<string[]>(['']);

  const updateAmount = (value: number) => {
    const newAmount = Math.max(1, value);
    setAmount(newAmount);
    setSerials(
      Array.from({ length: newAmount }, (_, i) => serials[i] || '')
    );
  };

  const handleSerialChange = (index: number, value: string) => {
    const newSerials = [...serials];
    newSerials[index] = value;
    setSerials(newSerials);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      {/* FORM HEADER */}
      <div>
        <h2 className="font-semibold mb-1">
          {isNew ? 'Add Note' : 'Inbox Detail'}
        </h2>

        {!isNew && (
          <div className="text-xs text-gray-400 mb-4">
            {item.date_label} {item.time_label}
          </div>
        )}
      </div>

      {/* FORM INPUT */}
      <div className="bg-white rounded-xl w-full max-w-2xl p-6">
        <h2 className="font-semibold mb-1">
          {isNew ? 'Add Note' : 'Inbox Detail'}
        </h2>

        {!isNew && (
          <div className="text-xs text-gray-400 mb-4">
            {item.date_label} {item.time_label}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* Batch Card */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Batch Card <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={batchCard}
              onChange={(e) => setBatchCard(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Input batch card"
            />
          </div>

          {/* Station */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Station <span className="text-red-500">*</span>
            </label>
            <select
              value={station}
              onChange={(e) => setStation(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Select station</option>
              <option>Halim</option>
              <option>Karawang</option>
              <option>Padalarang</option>
              <option>Tegalluar</option>
            </select>
          </div>

          {/* Card Category */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Card Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              <option>Gold</option>
              <option>Silver</option>
              <option>KAI</option>
            </select>
          </div>

          {/* Card Type */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Card Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Select type</option>
              <option>JaKa</option>
              <option>JaBan</option>
              <option>KaBan</option>
            </select>
          </div>
        </div>

        {/* CARD CONDITION */}
        <div className="mt-6">
          <label className="text-sm font-medium block mb-2">
            Card Condition <span className="text-red-500">*</span>
          </label>

          <div className="flex gap-6 text-sm">
            {['Accepted', 'Damaged', 'Missing'].map((val) => (
              <label key={val} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="condition"
                  checked={condition === val}
                  onChange={() => setCondition(val)}
                />
                {val}
              </label>
            ))}
          </div>
        </div>

        {/* DAMAGED / MISSING */}
        {(condition === 'Damaged' || condition === 'Missing') && (
          <div className="mt-6">
            <p className="text-sm mb-2">
              Please fill this form if the card{' '}
              <span className="font-semibold lowercase">{condition}</span>
            </p>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm">
                Amount Card {condition}
              </span>

              <div className="flex items-center border rounded">
                <button
                  className="px-3 py-1"
                  onClick={() => updateAmount(amount - 1)}
                >
                  -
                </button>
                <span className="px-4">{amount}</span>
                <button
                  className="px-3 py-1"
                  onClick={() => updateAmount(amount + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {serials.map((val, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm w-4">{idx + 1}.</span>
                  <input
                    value={val}
                    onChange={(e) =>
                      handleSerialChange(idx, e.target.value)
                    }
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Serial Number Card"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MESSAGE */}
        <div className="mt-6">
          <textarea
            className="w-full border rounded p-3 text-sm"
            placeholder="Messages"
          />
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-6 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
