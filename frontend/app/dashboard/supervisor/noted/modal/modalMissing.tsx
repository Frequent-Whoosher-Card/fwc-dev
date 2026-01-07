'use client';

import { useState } from 'react';
// import { submitSupervisor } from '../lib/supervisorApi';

export default function ModalMissing({
  inboxId,
  onClose,
  onSuccess,
}: any) {
  const [amount, setAmount] = useState(1);
  const [message, setMessage] = useState('');

  const submit = async () => {
    // await submitSupervisor({
    //   inbox_id: inboxId,
    //   status: 'missing',
    //   amount_card: amount,
    //   message,
    // });

    onSuccess();
    onClose();
  };

  return (
    <div className="p-6 bg-white rounded-2xl">
      <h3 className="mb-4 font-semibold">Missing</h3>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={submit}>Send</button>
    </div>
  );
}
