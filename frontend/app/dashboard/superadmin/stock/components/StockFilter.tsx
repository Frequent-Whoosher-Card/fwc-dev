'use client';

interface StockFilterProps {
  filters: {
    station: string;
    category: string;
    type: string;
  };
  onChange: (filters: { station: string; category: string; type: string }) => void;
}

export function StockFilter({ filters, onChange }: StockFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* FILTER STATION */}
      <select className="rounded-md border px-4 py-2 text-sm" value={filters.station} onChange={(e) => onChange({ ...filters, station: e.target.value })}>
        <option value="all">All Station</option>
        <option value="halim">Halim</option>
        <option value="karawang">Karawang</option>
        <option value="padalarang">Padalarang</option>
        <option value="tegalluar">Tegalluar</option>
      </select>

      {/* FILTER CATEGORY */}
      <select className="rounded-md border px-4 py-2 text-sm" value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })}>
        <option value="all">All Category</option>
        <option value="Silver">Silver</option>
        <option value="Gold">Gold</option>
        <option value="KAI">KAI</option>
      </select>

      {/* FILTER TYPE */}
      <select className="rounded-md border px-4 py-2 text-sm" value={filters.type} onChange={(e) => onChange({ ...filters, type: e.target.value })}>
        <option value="all">All Type</option>
        <option value="JaBan">JaBan</option>
        <option value="JaKa">JaKa</option>
        <option value="KaBan">KaBan</option>
      </select>
    </div>
  );
}
