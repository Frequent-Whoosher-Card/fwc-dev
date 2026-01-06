'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';
import ModalAccepted from '../modal/modalAccepted';
import ModalDamaged from '../modal/modalDamaged';
import ModalMissing from '../modal/modalMissing';
import ModalNoted from '../modal/modalNoted';

export default function InboxItem({
  item,
  onRefresh,
}: {
  item: any;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState<
    null | 'accepted' | 'damaged' | 'missing' | 'noted'
  >(null);

  return (
    <>
      <div className="flex justify-between p-4 border-b items-center">
        <div>
          <p className="font-medium">{item.name}</p>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex gap-2">
          <button onClick={() => setOpen('accepted')}>Accepted</button>
          <button onClick={() => setOpen('damaged')}>Damaged</button>
          <button onClick={() => setOpen('missing')}>Missing</button>
          <button onClick={() => setOpen('noted')}>Noted</button>
        </div>
      </div>

      {open === 'accepted' && (
        <ModalAccepted
          inboxId={item.id}
          onClose={() => setOpen(null)}
          onSuccess={onRefresh}
        />
      )}

      {open === 'damaged' && (
        <ModalDamaged
          inboxId={item.id}
          onClose={() => setOpen(null)}
          onSuccess={onRefresh}
        />
      )}

      {open === 'missing' && (
        <ModalMissing
          inboxId={item.id}
          onClose={() => setOpen(null)}
          onSuccess={onRefresh}
        />
      )}

      {open === 'noted' && (
        <ModalNoted
          inboxId={item.id}
          onClose={() => setOpen(null)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
