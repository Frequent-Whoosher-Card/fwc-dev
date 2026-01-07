'use client';

interface Props {
  mode: 'create' | 'edit';
  id?: string;
}

export default function TransactionForm({ mode }: Props) {
  return (
    <div className="rounded-md border p-4">
      <h2 className="mb-4 text-lg font-semibold">
        {mode === 'create' ? 'Add Transaction' : 'Edit Transaction'}
      </h2>

      <div className="text-sm text-gray-500">
        Form placeholder
      </div>
    </div>
  );
}
