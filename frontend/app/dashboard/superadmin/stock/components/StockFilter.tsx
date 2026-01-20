'use client';

import { RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from '@/lib/axios';

interface Station {
  id: string;
  stationCode: string;
  stationName: string;
}

interface Category {
  id: string;
  categoryCode: string;
  categoryName: string;
}

interface TypeItem {
  id: string;
  typeCode: string;
  typeName: string;
}
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
  const [stations, setStations] = useState<Station[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [loadingStation, setLoadingStation] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingType, setLoadingType] = useState(false);

  /* =======================
      FETCH STATION
  ======================== */
  useEffect(() => {
    if (mode !== 'station') return;

    const fetchStations = async () => {
      try {
        setLoadingStation(true);

        const res = await axios.get('http://localhost:3001/station/');

        const stationData = res.data?.data?.items || [];
        setStations(Array.isArray(stationData) ? stationData : []);
      } catch (error) {
        console.error('Failed to fetch stations:', error);
        setStations([]);
      } finally {
        setLoadingStation(false);
      }
    };

    fetchStations();
  }, [mode]);

  /* =======================
      FETCH CATEGORY
  ======================== */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategory(true);

        const res = await axios.get('http://localhost:3001/card/category/');
        const categoryData = res.data?.data || [];

        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategory(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setLoadingType(true);
        const res = await axios.get('http://localhost:3001/card/types/');
        const data = res.data?.data || [];
        setTypes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Fetch type error:', err);
        setTypes([]);
      } finally {
        setLoadingType(false);
      }
    };

    fetchTypes();
  }, []);

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
        <select className={baseClass} value={filters.station} disabled={loadingStation} onChange={(e) => onChange({ ...filters, station: e.target.value })}>
          <option value="all">{loadingStation ? 'Loading...' : 'All Station'}</option>

          {stations.map((station) => (
            <option key={station.id} value={station.stationCode}>
              {station.stationName}
            </option>
          ))}
        </select>
      )}

      {/* CATEGORY (FROM API) */}
      <select className={baseClass} value={filters.category} disabled={loadingCategory} onChange={(e) => onChange({ ...filters, category: e.target.value })}>
        <option value="all">{loadingCategory ? 'Loading...' : 'All Category'}</option>

        {categories.map((category) => (
          <option key={category.id} value={category.categoryCode}>
            {category.categoryName}
          </option>
        ))}
      </select>

      {/* TYPE */}
      <select className={baseClass} value={filters.type} disabled={loadingType} onChange={(e) => onChange({ ...filters, type: e.target.value })}>
        <option value="all">{loadingType ? 'Loading...' : 'All Type'}</option>

        {types.map((type) => (
          <option key={type.id} value={type.typeCode}>
            {type.typeName}
          </option>
        ))}
      </select>

      {/* REFRESH */}
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
