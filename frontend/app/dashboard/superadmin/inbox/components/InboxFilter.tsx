'use client';
import { useState } from 'react';
import { Filter, RotateCcw, Calendar } from 'lucide-react';

export default function InboxFilter({ onFilter }: { onFilter: (filters: any) => void }) {
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* START DATE */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Start</span>
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 w-[150px] rounded-md border px-3 pr-9 text-sm focus:ring-1 focus:ring-red-500"
          />
          <Calendar
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none"
          />
        </div>
      </div>

      {/* END DATE */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">End</span>
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 w-[150px] rounded-md border px-3 pr-9 text-sm focus:ring-1 focus:ring-red-500"
          />
          <Calendar
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none"
          />
        </div>
      </div>

      {/* STATUS */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 w-[160px] rounded-md border px-3 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="accepted">Accepted</option>
          <option value="missing">Missing</option>
          <option value="damaged">Damaged</option>
        </select>
      </div>

      {/* ACTION */}
      <div className="flex items-center gap-2 ml-auto">
        <button 
          onClick={() => onFilter({ status, startDate, endDate })}
          className="bg-[#E31E24] text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-700 "
        >
          Filter <Filter size={16} />
        </button>
        <button 
          onClick={() => { setStatus(''); setStartDate(''); setEndDate(''); onFilter({}); }}
          className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition-all shadow-sm"
        >
          <RotateCcw size={20} />
        </button>
      </div>

    </div>
  );
}
