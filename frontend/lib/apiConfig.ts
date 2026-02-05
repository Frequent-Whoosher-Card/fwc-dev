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
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(token && !skipAuth
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...(headers || {}),
      },
    }
  );

  // ✅ PARSE RESPONSE (JSON / TEXT)
  let json: any = null;
  let textBody: string | null = null;
  
  try {
    const text = await res.text();
    textBody = text;
    if (text) {
        json = JSON.parse(text);
    }
  } catch {
    // Not valid JSON, stick with textBody
    json = null;
  }

  // ❌ HANDLE ERROR GLOBAL
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fwc_token');
        localStorage.removeItem('fwc_user');
        window.location.href = '/login';
      }

      // 🚨 WAJIB Error Format
      const message =
        json?.error?.message ||
        json?.message ||
        (typeof json?.error === 'string' ? json.error : null) ||
        textBody || // Fallback to raw text
        `API Error (${res.status})`;

      throw new Error(message);
    }

    let message = `API Error (${res.status})`;

    if (json) {
        if (typeof json.message === 'string') {
          message = json.message;
        } else if (typeof json.error === 'string') {
          message = json.error;
        } else if (json.error?.message) {
          message = json.error.message;
        } else if (Array.isArray(json.error)) {
          message = json.error.join(', ');
        } else {
            // Fallback: If JSON exists but unknown structure, stringify it
             message = JSON.stringify(json);
        }
    } else if (textBody) {
        // Fallback: Raw Text
        message = textBody;
    }

    throw new Error(message);
  }


  return json;
}

/**
 * Update FCM Token to server (Database)
 */
export async function updateFcmToken(token: string) {
  return apiFetch('/notification/token', {
    method: 'POST',
    body: JSON.stringify({ token, deviceInfo: navigator.userAgent }), // Send User Agent as device info
  });
}
