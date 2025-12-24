const fallbackBaseUrl =
  process.env.NODE_ENV === "production"
    ? undefined
    : "http://localhost:3000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || fallbackBaseUrl || "";

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[apiConfig] NEXT_PUBLIC_API_BASE_URL is not set. API_BASE_URL is empty."
  );
}
