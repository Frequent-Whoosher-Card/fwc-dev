import axios from "axios";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
});

instance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // 🔑 AMBIL TOKEN YANG BENAR
      const token = localStorage.getItem("fwc_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Belum login");
    }

    // Extract message from backend response
    const backendMessage =
      error.response?.data?.error?.message || error.response?.data?.message;

    if (backendMessage) {
      error.message = backendMessage;
    }

    return Promise.reject(error);
  },
);

export default instance;
