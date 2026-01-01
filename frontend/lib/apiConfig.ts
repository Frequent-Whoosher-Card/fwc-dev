export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

if (!API_BASE_URL) {
  console.warn(
    '[apiConfig] NEXT_PUBLIC_API_BASE_URL is not set.'
  );
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('access_token'); 
  // sesuaikan kalau token namanya beda

  const res = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
        ...options.headers,
      },
    }
  );

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'API Error');
  }

  return res.json();
}
