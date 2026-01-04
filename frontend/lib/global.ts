// lib/global.ts
export const getTokenFromCookie = (cookieName: string = 'session'): string | null => {
  if (typeof document === 'undefined') return null; // aman untuk SSR
  const match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
  if (match) return match[2];
  return null;
};
