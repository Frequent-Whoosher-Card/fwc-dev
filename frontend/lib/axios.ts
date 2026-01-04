import axios from 'axios';

// Base URL backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // penting kalau pakai cookie HttpOnly
});

// Interceptor request (opsional)
axiosInstance.interceptors.request.use(
  (config) => {
    // Jika mau pakai token dari cookie
    // const token = getTokenFromCookie();
    // if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor response
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    // Bisa handle global error, misal 401
    if (error.response?.status === 401) {
      console.error('Belum login');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
