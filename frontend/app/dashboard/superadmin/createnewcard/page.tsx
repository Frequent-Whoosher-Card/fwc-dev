'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateNewCardPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/superadmin/createnewcard/fwc');
    }, [router]);

    return null;
}
