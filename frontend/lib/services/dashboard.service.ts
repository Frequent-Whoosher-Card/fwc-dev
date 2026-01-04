import { fetcher } from '@/lib/fetcher';

export const getDailySales = () => fetcher('/sales/daily-grouped?startDate=&endDate=&stationId=');

export const getStationSales = () => fetcher('/sales/per-station?startDate=&endDate=');
