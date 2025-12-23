"use client";

export default function Pagination() {
  return (
    <div className="flex justify-end gap-2 text-sm">
      <button className="px-3 py-1 border rounded">
        Prev
      </button>
      <button className="px-3 py-1 border rounded">
        Next
      </button>
    </div>
  );
}
