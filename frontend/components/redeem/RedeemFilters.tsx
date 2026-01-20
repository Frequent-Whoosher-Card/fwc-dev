'use client';

import { useRef } from 'react';

interface RedeemFiltersProps {
  startDate: string;
  endDate: string;
  category: string;
  cardType: string;
  redeemType: string;
  stationId: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCardTypeChange: (value: string) => void;
  onRedeemTypeChange: (value: string) => void;
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
  redeemType,
  stationId,
  onStartDateChange,
  onEndDateChange,
  onCategoryChange,
  onCardTypeChange,
  onRedeemTypeChange,
  onStationIdChange,
  onReset,
  categories,
  cardTypes,
  stations,
  isLoading,
  categoryValueKey = 'categoryName',
  cardTypeValueKey = 'typeName',
}: RedeemFiltersProps & { categoryValueKey?: string; cardTypeValueKey?: string }) {
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border bg-white">
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col gap-3 p-4 lg:hidden">
        {/* Date filters row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Start Date</span>
            <div className="relative">
              <input
                ref={startDateRef}
                type="date"
                value={startDate}
                onChange={e => onStartDateChange(e.target.value)}
                className={`h-9 w-full rounded-md border px-2 pr-8 text-xs appearance-none font-medium cursor-pointer
                  [&::-webkit-calendar-picker-indicator]:hidden
                  ${startDate ? 'border-[#8D1231] bg-red-50 text-[#8D1231]' : 'border-gray-300'}`}
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231] cursor-pointer" 
                width="14" 
                height="14" 
                fill="none" 
                viewBox="0 0 24 24"
                onClick={() => startDateRef.current?.showPicker()}
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
                value={endDate}
                onChange={e => onEndDateChange(e.target.value)}
                className={`h-9 w-full rounded-md border px-2 pr-8 text-xs appearance-none font-medium cursor-pointer
                  [&::-webkit-calendar-picker-indicator]:hidden
                  ${endDate ? 'border-[#8D1231] bg-red-50 text-[#8D1231]' : 'border-gray-300'}`}
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231] cursor-pointer" 
                width="14" 
                height="14" 
                fill="none" 
                viewBox="0 0 24 24"
                onClick={() => endDateRef.current?.showPicker()}
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
        >
          <option value="">Kategori</option>
          {categories && categories.length > 0 ? (
            categories.map((cat) => (
              <option key={cat.id || cat} value={cat[categoryValueKey] || cat}>
                {cat[categoryValueKey] || cat}
              </option>
            ))
          ) : (
            <option disabled>Tidak ada data</option>
          )}
        </select>

        <select
          value={cardType}
          onChange={e => onCardTypeChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none"
        >
          <option value="">Tipe Kartu</option>
          {cardTypes && cardTypes.length > 0 ? (
            cardTypes.map((type) => (
              <option key={type.id || type} value={type[cardTypeValueKey] || type}>
                {type[cardTypeValueKey] || type}
              </option>
            ))
          ) : (
            <option disabled>Tidak ada data</option>
          )}
        </select>

        <select
          value={redeemType}
          onChange={e => onRedeemTypeChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none"
        >
          <option value="">Tipe Perjalanan</option>
          <option value="SINGLE">Single Trip</option>
          <option value="ROUNDTRIP">Round Trip</option>
        </select>

        <select
          value={stationId}
          onChange={e => onStationIdChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none"
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
        >
          Reset Filter
        </button>
      </div>

      {/* Desktop: Horizontal layout */}
      <div className="hidden lg:flex items-center gap-2 px-4 py-3">
        {/* Start date */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Start</span>
          <div className="relative">
            <input
              ref={startDateRef}
              type="date"
              value={startDate}
              onChange={e => onStartDateChange(e.target.value)}
              className={`h-9 w-[160px] rounded-md border px-3 pr-9 text-sm appearance-none font-medium cursor-pointer
                [&::-webkit-calendar-picker-indicator]:hidden
                ${startDate ? 'border-[#8D1231] bg-red-50 text-[#8D1231]' : 'border-gray-300'}`}
              placeholder="dd/mm/yyyy"
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">End</span>
          <div className="relative">
            <input
              ref={endDateRef}
              type="date"
              value={endDate}
              onChange={e => onEndDateChange(e.target.value)}
              className={`h-9 w-[160px] rounded-md border px-3 pr-9 text-sm appearance-none font-medium cursor-pointer
                [&::-webkit-calendar-picker-indicator]:hidden
                ${endDate ? 'border-[#8D1231] bg-red-50 text-[#8D1231]' : 'border-gray-300'}`}
              placeholder="dd/mm/yyyy"
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
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none min-w-[130px]"
        >
          <option value="">Kategori</option>
          {categories && categories.length > 0 ? (
            categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))
          ) : (
            <option disabled>Tidak ada data</option>
          )}
        </select>

        {/* Tipe Kartu dropdown */}
        <select
          value={cardType}
          onChange={e => onCardTypeChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none min-w-[130px]"
        >
          <option value="">Tipe Kartu</option>
          {cardTypes && cardTypes.length > 0 ? (
            cardTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))
          ) : (
            <option disabled>Tidak ada data</option>
          )}
        </select>

        {/* Tipe Perjalanan dropdown */}
        <select
          value={redeemType}
          onChange={e => onRedeemTypeChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none min-w-[150px]"
        >
          <option value="">Tipe Perjalanan</option>
          <option value="SINGLE">Single Trip</option>
          <option value="ROUNDTRIP">Round Trip</option>
        </select>

        {/* Stasiun dropdown */}
        <select
          value={stationId}
          onChange={e => onStationIdChange(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm font-medium border-[#8D1231] bg-[#8D1231] text-white focus:outline-none min-w-[130px]"
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
        >
          Reset
        </button>
      </div>
    </div>
  );
}
