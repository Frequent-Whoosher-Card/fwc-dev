'use client';

import { useParams } from 'next/navigation';
import TransactionForm from '../../components/TransactionForm';

export default function EditTransactionPage() {
  const params = useParams();

  return (
    <div>
      <TransactionForm mode="edit" id={params.id as string} />
    </div>
  );
}
