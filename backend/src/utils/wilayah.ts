/**
 * Data fetching utility for Indonesian provinces and regencies (kota/kabupaten)
 * using the public API https://wilayah.id
 */

const PROVINCES_URL = "https://wilayah.id/api/provinces.json";
const REGENCIES_URL = "https://wilayah.id/api/regencies";

export type RegencyType = "KOTA" | "KABUPATEN";

export interface RegencyItem {
  provinceCode: string;
  provinceName: string;
  regencyCode: string;
  regencyName: string;
  type: RegencyType;
}

interface ProvincesResponse {
  data: Array<{ code: string; name: string }>;
}

interface RegenciesResponse {
  data: Array<{ code: string; name: string }>;
}

function getRegencyType(regencyName: string): RegencyType {
  const trimmed = regencyName.trim();
  if (trimmed.startsWith("Kota ")) return "KOTA";
  if (trimmed.startsWith("Kabupaten ")) return "KABUPATEN";
  return "KABUPATEN";
}

/**
 * Fetches all Indonesian provinces, then all regencies (kota + kabupaten) per province,
 * and returns a single flat array with normalized structure.
 * Uses parallel requests; continues on per-province errors.
 */
export async function fetchAllRegenciesIndonesia(): Promise<RegencyItem[]> {
  const provincesRes = await fetch(PROVINCES_URL);
  if (!provincesRes.ok) {
    throw new Error(`Provinces fetch failed: ${provincesRes.status} ${provincesRes.statusText}`);
  }
  const provincesJson = (await provincesRes.json()) as ProvincesResponse;
  const provinces = provincesJson?.data ?? [];
  if (provinces.length === 0) {
    throw new Error("Provinces response has no data");
  }

  const results: RegencyItem[] = [];
  const regencyPromises = provinces.map(async (province) => {
    try {
      const url = `${REGENCIES_URL}/${encodeURIComponent(province.code)}.json`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      const json = (await res.json()) as RegenciesResponse;
      const regencies = json?.data ?? [];
      return regencies.map((r) => ({
        provinceCode: province.code,
        provinceName: province.name,
        regencyCode: r.code,
        regencyName: r.name,
        type: getRegencyType(r.name),
      }));
    } catch (err) {
      console.error(
        `[wilayah] Failed to fetch regencies for province ${province.code} (${province.name}):`,
        err
      );
      return [];
    }
  });

  const regencyArrays = await Promise.all(regencyPromises);
  for (const arr of regencyArrays) {
    results.push(...arr);
  }
  return results;
}
