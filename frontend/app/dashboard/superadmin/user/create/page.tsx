'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Mail, ChevronDown } from 'lucide-react';

export default function CreateUserPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* CARD — LEBAR MENGIKUTI USER MANAGEMENT */}
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
            Add Users
          </h2>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <input
            placeholder="Name"
            className="h-11 rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
          />

          <input
            placeholder="NIP"
            className="h-11 rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
          />

          <input
            placeholder="Username"
            className="h-11 rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
          />

          <div className="relative">
            <select className="h-11 w-full appearance-none rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]">
              <option value="">Role</option>
              <option>Super Admin</option>
              <option>Admin</option>
              <option>Petugas</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative md:col-span-2">
            <input
              placeholder="Phone Number"
              className="h-11 w-full rounded-md border px-4 pr-10 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
            />
            <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative md:col-span-2">
            <input
              placeholder="Email Address"
              className="h-11 w-full rounded-md border px-4 pr-10 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
            />
            <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative md:col-span-2">
            <select className="h-11 w-full appearance-none rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]">
              <option value="">Stasiun</option>
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
          <button className="h-11 rounded-md bg-[#7A0C2E] px-10 text-sm font-medium text-white hover:opacity-90">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
