'use client';

import { useState } from 'react';
// import { submitSupervisor } from '../lib/supervisorApi';

export default function ModalNoted({
  inboxId,
  onClose,
  onSuccess,
}: any) {
  const [message, setMessage] = useState('');

  const submit = async () => {
    // await submitSupervisor({
    //   inbox_id: inboxId,
    //   status: 'noted',
    //   message,
    // });

    onSuccess();
    onClose();
  };

  return (
    <div className="p-6 bg-white rounded-2xl">
      <h3 className="mb-4 font-semibold">Noted</h3>

      <textarea
        className="w-full border rounded-lg p-2"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={submit}>Send</button>
    </div>
  );
}
