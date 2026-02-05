"use client";

import { Calendar } from "lucide-react";
import { baseInputClass as base } from "./constants";
import { MemberFormField } from "./MemberFormField";
import { SectionCard } from "./SectionCard";

interface CardValiditySectionProps {
  membershipDate: string;
  expiredDate: string;
  Field?: (props: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => React.ReactElement;
}

export function CardValiditySection({
  membershipDate,
  expiredDate,
  Field = MemberFormField,
}: CardValiditySectionProps) {
  return (
    <SectionCard title="Masa Berlaku Kartu">
      <Field label="Tanggal Mulai Kartu" required>
        <div className="relative">
          <Calendar
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="date"
            name="membershipDate"
            value={membershipDate}
            readOnly
            className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
          />
        </div>
      </Field>
      <Field label="Tanggal Berakhir Kartu" required>
        <div className="relative">
          <Calendar
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="date"
            name="expiredDate"
            value={expiredDate}
            readOnly
            className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
          />
        </div>
      </Field>
    </SectionCard>
  );
}
