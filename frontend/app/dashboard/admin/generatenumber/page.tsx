"use client";

import BaseGenerateNumber from "@/components/generatenumber/BaseGenerateNumber";

export default function AdminGenerateNumberPage() {
  return (
    <div className="px-6 space-y-6 py-6">
      <BaseGenerateNumber
        title="Generate Number + Barcode FWC"
        programType="FWC"
      />
    </div>
  );
}
