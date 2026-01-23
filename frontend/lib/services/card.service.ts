import { apiFetch } from '@/lib/apiConfig';
import axios from '@/lib/axios';
export const getCards = async (params?: { page?: number; limit?: number; search?: string; status?: string; categoryId?: string; typeId?: string; stationId?: string }) => {
  const query = new URLSearchParams();

  query.append('page', String(params?.page ?? 1));
  query.append('limit', String(params?.limit ?? 50));

  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);
  if (params?.categoryId) query.append('categoryId', params.categoryId);
  if (params?.typeId) query.append('typeId', params.typeId);
  if (params?.stationId) query.append('stationId', params.stationId);

  return apiFetch(`/cards?${query.toString()}`, {
    method: 'GET',
  });
};

// export const cardService = {
//   getProducts: async () => {
//     const res = await axios.get('/card/product');
//     return res.data?.data || [];
//   },

//   getCategories: async () => {
//     const res = await axios.get('/card/category');
//     return res.data?.data || [];
//   },

//   getTypes: async () => {
//     const res = await axios.get('/card/types');
//     return res.data?.data || [];
//   },

//   createProduct: async (payload: { categoryId: string; typeId: string; totalQuota: number; masaBerlaku: number; price: number; serialTemplate: string }) => {
//     return axios.post('/card/product', payload);
//   },

//   createCategory: async (payload: { categoryCode: string; categoryName: string; description?: string }) => {
//     return axios.post('/card/category', payload);
//   },

//   createType: async (payload: { typeCode: string; typeName: string; routeDescription?: string }) => {
//     return axios.post('/card/types', payload);
//   },
// };
