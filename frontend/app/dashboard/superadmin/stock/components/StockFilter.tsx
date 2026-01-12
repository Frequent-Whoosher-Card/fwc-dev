'use client';

import { RefreshCcw } from 'lucide-react';

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
  const handleRefresh = () => {
    onChange({
      station: 'all',
      category: 'all',
      type: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const baseClass = `
    rounded-md border px-4 py-2 text-sm
    bg-white text-black
    focus:bg-[#8D1231] focus:text-white
    focus:outline-none focus:ring-0
    transition-colors duration-150
  `;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* MODE BUTTON */}
      <div className="flex rounded-md border overflow-hidden">
        <button className={`px-4 py-2 text-sm ${mode === 'all' ? 'bg-[#8D1231] text-white' : 'bg-white'}`} onClick={() => onModeChange('all')}>
          All Stock
        </button>

        <button className={`px-4 py-2 text-sm ${mode === 'station' ? 'bg-[#8D1231] text-white' : 'bg-white'}`} onClick={() => onModeChange('station')}>
          By Station
        </button>
      </div>

      {/* STATION */}
      {mode === 'station' && (
        <select className={baseClass} value={filters.station} onChange={(e) => onChange({ ...filters, station: e.target.value })}>
          <option value="all">All Station</option>
          <option value="halim">Halim</option>
          <option value="karawang">Karawang</option>
          <option value="padalarang">Padalarang</option>
          <option value="tegalluar">Tegalluar</option>
        </select>
      )}

      {/* CATEGORY */}
      <select className={baseClass} value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })}>
        <option value="all">All Category</option>
        <option value="Silver">Silver</option>
        <option value="Gold">Gold</option>
        <option value="KAI">KAI</option>
      </select>

      {/* TYPE */}
      <select className={baseClass} value={filters.type} onChange={(e) => onChange({ ...filters, type: e.target.value })}>
        <option value="all">All Type</option>
        <option value="JaBan">JaBan</option>
        <option value="JaKa">JaKa</option>
        <option value="KaBan">KaBan</option>
      </select>
      <button
        onClick={handleRefresh}
        className="
    flex items-center gap-2
    rounded-md border
    px-4 py-2 text-sm
    bg-white text-black
    hover:bg-[#8D1231] hover:text-white
    transition-colors
  "
      >
        <RefreshCcw size={14} />
        Refresh
      </button>
    </div>
  );
}
