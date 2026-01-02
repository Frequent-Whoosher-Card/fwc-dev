'use client';

export function StockFilter() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* ALL */}
      <select className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none" defaultValue="all">
        <option value="all">All</option>
      </select>

      {/* FILTER STATION */}
      <select className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none" defaultValue="all">
        <option value="all">All Station</option>
        <option value="halim">Halim</option>
        <option value="karawang">Karawang</option>
        <option value="padalarang">Padalarang</option>
        <option value="tegalluar">Tegalluar</option>
      </select>

      {/* FILTER CATEGORY */}
      <select className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none" defaultValue="all">
        <option value="all">All Category</option>
        <option value="gold">Gold</option>
        <option value="silver">Silver</option>
        <option value="kai">KAI</option>
      </select>

      {/* FILTER TYPE */}
      <select className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none" defaultValue="all">
        <option value="all">All Type</option>
        <option value="jaban">JaBan</option>
        <option value="jaka">JaKa</option>
        <option value="kaban">KaBan</option>
      </select>
    </div>
  );
}
