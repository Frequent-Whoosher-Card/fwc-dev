"use client";

import { Calendar } from "lucide-react";
import { baseInputClass as base } from "./constants";
import { MemberFormField } from "./MemberFormField";
import { SectionCard } from "./SectionCard";

interface OperationalSectionProps {
  station: string;
  shiftDate: string;
  Field?: (props: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => React.ReactElement;
}

export function OperationalSection({
  station,
  shiftDate,
  Field = MemberFormField,
}: OperationalSectionProps) {
  return (
    <SectionCard title="Operational Information">
      <Field label="Stasiun" required>
        <input
          type="text"
          name="station"
          value={station}
          readOnly
          className={`${base} bg-gray-50 cursor-not-allowed`}
          placeholder="Auto-filled from your account"
        />
      </Field>
      <Field label="Shift Date" required>
        <div className="relative">
          <Calendar
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="date"
            name="shiftDate"
            value={shiftDate}
            readOnly
            className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
          />
        </div>
      </Field>
    </SectionCard>
  );
}
