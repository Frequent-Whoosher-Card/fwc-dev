import axios from '@/lib/axios';
import { StockInDetail, UpdateStockInPayload } from '@/types/stock-in';

// Ambil token dari cookie
export const getTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )session=([^;]+)'));
  return match ? match[2] : null;
};

// Category & Type interfaces
export interface Category {
  id: string;
  categoryName: string;
}

export interface Type {
  id: string;
  typeName: string;
  categoryId: string;
}

export interface StockInData {
  movementAt: string;
  categoryId: string;
  typeId: string;
  startSerial: string;
  endSerial: string;
  note: string;
}

// Fetch categories
// stockIn.service.ts

export const fetchCategories = async () => {
  const res = await axios.get('/card/category');
  return Array.isArray(res.data) ? res.data : res.data.data || [];
};

export const fetchTypes = async () => {
  const res = await axios.get('/card/types');
  return Array.isArray(res.data) ? res.data : res.data.data || [];
};

export const createStockIn = async (payload: StockInData) => {
  const { movementAt, categoryId, typeId, startSerial, endSerial, note } = payload;

  // const startNum = parseInt(startSerial, 10);
  // const endNum = parseInt(endSerial, 10);
  // const width = startSerial.length;

  // const sentSerialNumbers: string[] = [];
  // for (let i = startNum; i <= endNum; i++) {
  //   sentSerialNumbers.push(`${categoryId}_${typeId}${String(i).padStart(width, '0')}`);
  // }

  return axios.post('/stock/in', {
    movementAt: movementAt,
    categoryId: categoryId,
    typeId: typeId,
    startSerial: startSerial,
    endSerial: endSerial,
    note: note,
  });
};

export async function getStockInById(id: string): Promise<StockInDetail> {
  const res = await axios.get(`/stock/in/${id}`);
  return res.data.data;
}

export async function updateStockIn(id: string, payload: UpdateStockInPayload): Promise<void> {
  await axios.patch(`/stock/in/${id}`, payload);
}
