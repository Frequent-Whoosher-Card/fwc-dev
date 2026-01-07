'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Phone,
  Mail,
  ChevronDown,
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  nip: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  stasiun: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);

  const [form, setForm] = useState<User | null>(null);

  /* LOAD USER */
  useEffect(() => {
    const users: User[] = JSON.parse(
      localStorage.getItem('fwc_users') || '[]'
    );

    const found = users.find(
      (u) => u.id === userId
    );

    if (!found) {
      router.push('/dashboard/superadmin/user');
      return;
    }

    setForm(found);
  }, [userId, router]);

  /* LOADING STATE (PENTING) */
  if (!form) {
    return (
      <div className="rounded-lg border bg-white p-8 text-sm text-gray-500">
        Loading user data...
      </div>
    );
  }

  /* SUBMIT EDIT */
  const handleSubmit = () => {
    const users: User[] = JSON.parse(
      localStorage.getItem('fwc_users') || '[]'
    );

    const updated = users.map((u) =>
      u.id === userId ? form : u
    );

    localStorage.setItem(
      'fwc_users',
      JSON.stringify(updated)
    );

    toast.success('User berhasil diperbarui');

    setTimeout(() => {
      router.push('/dashboard/superadmin/user');
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-8">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">
            Edit Users
          </h2>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="h-11 rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
            placeholder="Name"
          />

          <input
            value={form.nip}
            onChange={(e) =>
              setForm({ ...form, nip: e.target.value })
            }
            className="h-11 rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
            placeholder="NIP"
          />

          <input
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            className="h-11 rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
            placeholder="Username"
          />

          <div className="relative">
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
              className="h-11 w-full appearance-none rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
            >
              <option>Super Admin</option>
              <option>Admin</option>
              <option>Petugas</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative md:col-span-2">
            <input
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              className="h-11 w-full rounded-md border px-4 pr-10 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
              placeholder="Phone Number"
            />
            <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative md:col-span-2">
            <input
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="h-11 w-full rounded-md border px-4 pr-10 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
              placeholder="Email Address"
            />
            <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative md:col-span-2">
            <select
              value={form.stasiun}
              onChange={(e) =>
                setForm({ ...form, stasiun: e.target.value })
              }
              className="h-11 w-full appearance-none rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
            >
              <option>Halim</option>
              <option>Karawang</option>
              <option>Padalarang</option>
              <option>Tegalluar</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* ACTION */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={handleSubmit}
            className="h-11 rounded-md bg-[#7A0C2E] px-10 text-sm font-medium text-white hover:opacity-90"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
