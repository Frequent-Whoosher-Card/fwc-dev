'use client';

export function StockFilter() {
  return (
    <select
      className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none"
      defaultValue="all"
    >
      <option value="all">All Station</option>
      <option value="halim">Halim</option>
      <option value="bandung">Bandung</option>
      <option value="padalarang">Padalarang</option>
    </select>
  );
}
