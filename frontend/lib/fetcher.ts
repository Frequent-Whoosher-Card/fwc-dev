import { API_BASE_URL } from './apiConfig';

type FetchOptions = RequestInit & {
  auth?: boolean;
};

export async function fetcher(endpoint: string, options: FetchOptions = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include', // 🔥 PENTING
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Fetch error');
  }

  return res.json();
}
