'use client';

export function StockPagination() {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
      <span>Showing 1–10 of 78</span>

      <div className="flex items-center gap-2">
        <button className="rounded px-3 py-1 hover:bg-gray-100">Prev</button>
        <button className="rounded bg-[#8D1231] px-3 py-1 text-white">1</button>
        <button className="rounded px-3 py-1 hover:bg-gray-100">2</button>
        <button className="rounded px-3 py-1 hover:bg-gray-100">3</button>
        <button className="rounded px-3 py-1 hover:bg-gray-100">Next</button>
      </div>
    </div>
  );
}
