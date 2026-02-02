"use client";
// Helper to get today in YYYY-MM-DD
function getToday() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

import { useRef } from 'react';

interface RedeemFiltersProps {
  startDate: string;
  endDate: string;
  category: string;
  cardType: string;
  stationId: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCardTypeChange: (value: string) => void;
  onStationIdChange: (value: string) => void;
  onReset: () => void;
  categories: any[];
  cardTypes: any[];
  stations: any[];
  isLoading: boolean;
  categoryValueKey?: string;
  cardTypeValueKey?: string;
}

export default function RedeemFilters({
  startDate,
  endDate,
  category,
  cardType,
  stationId,
  onStartDateChange,
  onEndDateChange,
  onCategoryChange,
  onCardTypeChange,
  onStationIdChange,
  onReset,
  categories,
  cardTypes,
  stations,
  isLoading,
  categoryValueKey = 'categoryName',
  cardTypeValueKey = 'typeName',
  product,
  disabled = false,
}: RedeemFiltersProps & { categoryValueKey?: string; cardTypeValueKey?: string; product?: string; disabled?: boolean }) {
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border bg-white p-4 w-full shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
        {/* Start Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Start Date</label>
          <div className="relative">
            <input
              ref={startDateRef}
              type="date"
              value={startDate || getToday()}
              max={endDate || undefined}
              onChange={e => {
                if (endDate && e.target.value > endDate) return;
                onStartDateChange(e.target.value);
              }}
              onClick={(e) => e.currentTarget.showPicker()}
              className={`h-10 w-full rounded-md border px-3 pr-8 text-sm appearance-none font-medium cursor-pointer transition-colors
                  [&::-webkit-calendar-picker-indicator]:hidden
                  ${startDate ? 'border-[#8D1231] bg-red-50 text-[#8D1231]' : 'border-gray-200 hover:border-gray-300'}`}
              disabled={disabled}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8D1231] pointer-events-none"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">End Date</label>
          <div className="relative">
            <input
              ref={endDateRef}
              type="date"
              value={endDate || getToday()}
              min={startDate || undefined}
              onChange={e => {
                if (startDate && e.target.value < startDate) return;
                onEndDateChange(e.target.value);
              }}
              onClick={(e) => e.currentTarget.showPicker()}
              className={`h-10 w-full rounded-md border px-3 pr-8 text-sm appearance-none font-medium cursor-pointer transition-colors
                  [&::-webkit-calendar-picker-indicator]:hidden
                  ${endDate ? 'border-[#8D1231] bg-red-50 text-[#8D1231]' : 'border-gray-200 hover:border-gray-300'}`}
              disabled={disabled}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8D1231] pointer-events-none"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Kategori</label>
          <select
            value={category}
            onChange={e => onCategoryChange(e.target.value)}
            className="h-10 w-full rounded-md border border-[#8D1231] bg-[#8D1231] text-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8D1231]/50 transition-shadow appearance-none cursor-pointer"
            disabled={disabled}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="" className="bg-white text-gray-900">Semua Kategori</option>
            {categories && categories.length > 0 ? (
              categories.map((cat) => {
                const value = typeof cat === 'object' ? cat[categoryValueKey] : cat;
                const key = typeof cat === 'object' ? cat.id || value : value;
                return (
                  <option key={key} value={value} className="bg-white text-gray-900">{value}</option>
                );
              })
            ) : (
              <option disabled className="bg-white text-gray-900">Tidak ada data</option>
            )}
          </select>
        </div>

        {/* Card Types */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Tipe Kartu</label>
          <select
            value={cardType}
            onChange={e => onCardTypeChange(e.target.value)}
            className="h-10 w-full rounded-md border border-[#8D1231] bg-[#8D1231] text-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8D1231]/50 transition-shadow appearance-none cursor-pointer"
            disabled={disabled}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="" className="bg-white text-gray-900">Semua Tipe</option>
            {cardTypes && cardTypes.length > 0 ? (
              cardTypes.map((type) => {
                const value = typeof type === 'object' ? type[cardTypeValueKey] : type;
                const key = typeof type === 'object' ? type.id || value : value;
                return (
                  <option key={key} value={value} className="bg-white text-gray-900">{value}</option>
                );
              })
            ) : (
              <option disabled className="bg-white text-gray-900">Tidak ada data</option>
            )}
          </select>
        </div>

        {/* Stations */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Stasiun</label>
          <select
            value={stationId}
            onChange={e => onStationIdChange(e.target.value)}
            className="h-10 w-full rounded-md border border-[#8D1231] bg-[#8D1231] text-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8D1231]/50 transition-shadow appearance-none cursor-pointer"
            disabled={disabled}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="" className="bg-white text-gray-900">Semua Stasiun</option>
            {stations && stations.length > 0 ? (
              stations.map((station) => (
                <option key={station.id} value={station.id} className="bg-white text-gray-900">
                  {station.stationName || station.name}
                </option>
              ))
            ) : (
              <option disabled className="bg-white text-gray-900">Tidak ada data</option>
            )}
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            title="Reset semua filter"
            className="h-10 w-full rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm transition-colors flex items-center justify-center gap-2"
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
