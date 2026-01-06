'use client';

interface StockFilterProps {
  mode: 'all' | 'station';
  onModeChange: (mode: 'all' | 'station') => void;

  filters: {
    station: string;
    category: string;
    type: string;
    startDate: string;
    endDate: string;
  };
  onChange: (filters: StockFilterProps['filters']) => void;
}

export function StockFilter({ mode, onModeChange, filters, onChange }: StockFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* MODE BUTTON */}
      <div className="flex rounded-md border overflow-hidden">
        <button className={`px-4 py-2 text-sm ${mode === 'all' ? 'bg-black text-white' : 'bg-white'}`} onClick={() => onModeChange('all')}>
          All Stock
        </button>

        <button className={`px-4 py-2 text-sm ${mode === 'station' ? 'bg-black text-white' : 'bg-white'}`} onClick={() => onModeChange('station')}>
          By Station
        </button>
      </div>

      {/* STATION */}
      {mode === 'station' && (
        <select className="rounded-md border px-4 py-2 text-sm" value={filters.station} onChange={(e) => onChange({ ...filters, station: e.target.value })}>
          <option value="all">All Station</option>
          <option value="halim">Halim</option>
          <option value="karawang">Karawang</option>
          <option value="padalarang">Padalarang</option>
          <option value="tegalluar">Tegalluar</option>
        </select>
      )}

      {/* CATEGORY */}
      <select className="rounded-md border px-4 py-2 text-sm" value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })}>
        <option value="all">All Category</option>
        <option value="Silver">Silver</option>
        <option value="Gold">Gold</option>
        <option value="KAI">KAI</option>
      </select>

      {/* TYPE */}
      <select className="rounded-md border px-4 py-2 text-sm" value={filters.type} onChange={(e) => onChange({ ...filters, type: e.target.value })}>
        <option value="all">All Type</option>
        <option value="JaBan">JaBan</option>
        <option value="JaKa">JaKa</option>
        <option value="KaBan">KaBan</option>
      </select>
    </div>
  );
}
