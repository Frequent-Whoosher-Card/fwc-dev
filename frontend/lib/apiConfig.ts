const fallbackBaseUrl = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3001';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

if (!API_BASE_URL) {
  console.warn('[apiConfig] NEXT_PUBLIC_API_BASE_URL is not set.');
}
