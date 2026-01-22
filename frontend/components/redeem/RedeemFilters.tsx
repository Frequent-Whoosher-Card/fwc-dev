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
    <div className="rounded-lg border bg-white w-full">
      {/* Responsive filter: grid for tablet/desktop, stack for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:hidden gap-3 p-4 w-full">
        {/* Date filters row */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Start Date</span>
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
                className={`h-9 w-full rounded-md border px-2 pr-8 text-xs appearance-none font-medium cursor-pointer
                    [&::-webkit-calendar-picker-indicator]:hidden
                    ${startDate ? 'border-[#8D1231] bg-red-50 text-[#8D1231]' : 'border-gray-300'}`}
                  disabled={disabled}
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231] cursor-pointer" 
                width="14" 
                height="14" 
                fill="none" 
                viewBox="0 0 24 24"
                onClick={() => { if (!disabled) startDateRef.current?.showPicker(); }}
              >
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">End Date</span>
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
                className={`h-9 w-full rounded-md border px-2 pr-8 text-xs appearance-none font-medium cursor-pointer
                    [&::-webkit-calendar-picker-indicator]:hidden
                    ${endDate ? 'border-[#8D1231] bg-red-50 text-[#8D1231]' : 'border-gray-300'}`}
                  disabled={disabled}
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231] cursor-pointer" 
                width="14" 
                height="14" 
                fill="none" 
                viewBox="0 0 24 24"
                onClick={() => { if (!disabled) endDateRef.current?.showPicker(); }}
              >
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Dropdowns */}
        <select
          value={category}
          onChange={e => onCategoryChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none"
          disabled={disabled}
        >
          <option value="">Kategori</option>
          {categories && categories.length > 0 ? (
            categories.map((cat) => {
              const value = typeof cat === 'object' ? cat[categoryValueKey] : cat;
              const key = typeof cat === 'object' ? cat.id || value : value;
              return (
                <option key={key} value={value}>
                  {value}
                </option>
              );
            })
          ) : (
            <option disabled>Tidak ada data</option>
          )}
        </select>

        <select
          value={cardType}
          onChange={e => onCardTypeChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none"
          disabled={disabled}
        >
          <option value="">Tipe Kartu</option>
          {cardTypes && cardTypes.length > 0 ? (
            cardTypes.map((type) => {
              const value = typeof type === 'object' ? type[cardTypeValueKey] : type;
              const key = typeof type === 'object' ? type.id || value : value;
              return (
                <option key={key} value={value}>
                  {value}
                </option>
              );
            })
          ) : (
            <option disabled>Tidak ada data</option>
          )}
        </select>

        {/* Stasiun dropdown */}
        <select
          value={stationId}
          onChange={e => onStationIdChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none"
          disabled={disabled}
        >
          <option value="">Stasiun</option>
          {stations && stations.length > 0 ? (
            stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.stationName || station.name}
              </option>
            ))
          ) : (
            <option disabled>Tidak ada data</option>
          )}
        </select>

        {/* Reset button */}
        <button
          onClick={onReset}
          title="Reset filter"
          className="flex items-center justify-center h-9 px-3 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition text-sm font-medium"
          disabled={disabled}
        >
          Reset Filter
        </button>
      </div>

      {/* Desktop/Tablet: Responsive horizontal layout */}
      <div className="hidden lg:flex flex-wrap items-center gap-2 px-4 py-3 w-full">
        {/* Start date */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <span className="text-sm text-gray-500">Start</span>
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
              className={`h-9 w-[160px] rounded-md border px-3 pr-9 text-sm appearance-none font-medium cursor-pointer
                [&::-webkit-calendar-picker-indicator]:hidden
                ${startDate ? 'border-[#8D1231] bg-red-50 text-[#8D1231]' : 'border-gray-300'}`}
              placeholder="dd/mm/yyyy"
              disabled={disabled}
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231] cursor-pointer" 
              width="16" 
              height="16" 
              fill="none" 
              viewBox="0 0 24 24"
              onClick={() => startDateRef.current?.showPicker()}
            >
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>

        {/* End date */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <span className="text-sm text-gray-500">End</span>
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
              className={`h-9 w-[160px] rounded-md border px-3 pr-9 text-sm appearance-none font-medium cursor-pointer
                [&::-webkit-calendar-picker-indicator]:hidden
                ${endDate ? 'border-[#8D1231] bg-red-50 text-[#8D1231]' : 'border-gray-300'}`}
              placeholder="dd/mm/yyyy"
              disabled={disabled}
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231] cursor-pointer" 
              width="16" 
              height="16" 
              fill="none" 
              viewBox="0 0 24 24"
              onClick={() => endDateRef.current?.showPicker()}
            >
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>

        {/* Kategori dropdown */}
        <select
          value={category}
          onChange={e => onCategoryChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none min-w-[120px] max-w-[180px]"
          disabled={disabled}
        >
          <option value="">Kategori</option>
          {categories && categories.length > 0 ? (
            categories.map((cat) => {
              const value = typeof cat === 'object' ? cat[categoryValueKey] : cat;
              const key = typeof cat === 'object' ? cat.id || value : value;
              return (
                <option key={key} value={value}>{value}</option>
              );
            })
          ) : (
            <option disabled>Tidak ada data</option>
          )}
        </select>

        {/* Tipe Kartu dropdown */}
        <select
          value={cardType}
          onChange={e => onCardTypeChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none min-w-[120px] max-w-[180px]"
          disabled={disabled}
        >
          <option value="">Tipe Kartu</option>
          {cardTypes && cardTypes.length > 0 ? (
            cardTypes.map((type) => {
              const value = typeof type === 'object' ? type[cardTypeValueKey] : type;
              const key = typeof type === 'object' ? type.id || value : value;
              return (
                <option key={key} value={value}>{value}</option>
              );
            })
          ) : (
            <option disabled>Tidak ada data</option>
          )}
        </select>

        {/* Tipe Perjalanan dropdown */}
        {/* Tipe Perjalanan filter removed (desktop) */}

        {/* Stasiun dropdown */}
        <select
          value={stationId}
          onChange={e => onStationIdChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none min-w-[120px] max-w-[180px]"
          disabled={disabled}
        >
          <option value="">Stasiun</option>
          {stations && stations.length > 0 ? (
            stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.stationName || station.name}
              </option>
            ))
          ) : (
            <option disabled>Tidak ada data</option>
          )}
        </select>

        {/* Reset button */}
        <button
          onClick={onReset}
          title="Reset filter"
          className="flex items-center justify-center h-9 px-3 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition text-sm font-medium min-w-[80px]"
          disabled={disabled}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
