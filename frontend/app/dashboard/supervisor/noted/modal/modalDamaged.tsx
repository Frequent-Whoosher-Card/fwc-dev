'use client';

import { useState } from 'react';
// import { submitSupervisor } from '../../../../../lib/services/';

export default function ModalDamaged({
  inboxId,
  onClose,
  onSuccess,
}: any) {
  const [amount, setAmount] = useState(1);
  const [serials, setSerials] = useState(['']);
  const [message, setMessage] = useState('');

  const submit = async () => {
    // await submitSupervisor({
    //   inbox_id: inboxId,
    //   status: 'damaged',
    //   amount_card: amount,
    //   serial_numbers: serials,
    //   message,
    // });

    onSuccess();
    onClose();
  };

  return (
    <div className="p-6 bg-white rounded-2xl">
      <h3 className="mb-4 font-semibold">Damaged</h3>

      <input
        type="number"
        value={amount}
        onChange={(e) => {
          const val = Number(e.target.value);
          setAmount(val);
          setSerials(Array(val).fill(''));
        }}
      />

      {serials.map((v, i) => (
        <input
          key={i}
          placeholder={`Serial ${i + 1}`}
          value={v}
          onChange={(e) => {
            const next = [...serials];
            next[i] = e.target.value;
            setSerials(next);
          }}
        />
      ))}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={submit}>Send</button>
    </div>
  );
}
