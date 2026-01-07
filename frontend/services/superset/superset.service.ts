export async function getSupersetGuestToken(dashboardId: string) {
  const res = await fetch(
    `/api/superset/guest-token?dashboardId=${dashboardId}`
  );

  if (!res.ok) {
    throw new Error("Failed to get Superset guest token");
  }

  const data = await res.json();
  return data.token;
}