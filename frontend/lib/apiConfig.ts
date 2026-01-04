export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

if (!API_BASE_URL) {
  console.warn(
    '[apiConfig] NEXT_PUBLIC_API_BASE_URL is not set.'
  );
}

interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {}
) {
  const { skipAuth, headers, ...rest } = options;

  // 🔑 AMBIL TOKEN
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('fwc_token')
      : null;

  // ❌ ENDPOINT PROTECTED TANPA TOKEN
  if (!skipAuth && !token) {
    throw new Error(
      'No authentication token found. Please login.'
    );
  }

  const res = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token && !skipAuth
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...(headers || {}),
      },
    }
  );

  // ✅ PARSE JSON (AMAN)
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  // ❌ HANDLE ERROR GLOBAL
  if (!res.ok) {
    // 401 → token invalid / expired
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fwc_token');
        localStorage.removeItem('fwc_user');
        window.location.href = '/login';
      }
    }

    // 🚨 WAJIB Error instance
    const message =
      json?.message ||
      json?.error ||
      `API Error (${res.status})`;

    throw new Error(message);
  }

  return json;
}
