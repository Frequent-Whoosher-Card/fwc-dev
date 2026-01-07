import { API_BASE_URL } from '../apiConfig';

/* =========================
   TYPES
========================= */
interface LoginPayload {
  username: string;
  password: string;
}

/* =========================
   LOGIN
========================= */
export async function login(payload: LoginPayload) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Login failed');
  }

  return res.json();
}

/* =========================
   GET CURRENT USER
========================= */
export async function getAuthMe() {
  const token = localStorage.getItem('fwc_token');

  if (!token) {
    throw new Error('No auth token');
  }

  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Failed to fetch user');
  }

  return res.json();
}

/* =========================
   LOGOUT (CLIENT)
========================= */
export function logout() {
  localStorage.removeItem('fwc_token');
  localStorage.removeItem('fwc_user');
}
