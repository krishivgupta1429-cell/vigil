// Place search using OpenStreetMap's Nominatim.
// Usage policy (https://operations.osmfoundation.org/policies/nominatim/):
//  - max 1 request/second, no search-as-you-type, so we only search on submit
//  - identify the app: browsers send our origin as the Referer header
//    (a browser cannot set User-Agent)

import type { LatLng } from "./geo";

export type Place = LatLng & { name: string; fullName: string };

const MIN_GAP_MS = 1100;
let lastRequestAt = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const wait = lastRequestAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  if (signal?.aborted) return [];
  lastRequestAt = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "in");

  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  } catch {
    if (signal?.aborted) return [];
    throw new Error("Couldn't reach the place search. Check your connection, or tap the map instead.");
  }
  if (res.status === 429) throw new Error("Place search is busy. Wait a few seconds and try again.");
  if (!res.ok) throw new Error("Place search failed. You can still tap the map to set a destination.");

  const rows = (await res.json()) as { lat: string; lon: string; name?: string; display_name: string }[];
  return rows.map((r) => ({
    lat: Number(r.lat),
    lng: Number(r.lon),
    name: r.name || r.display_name.split(",")[0],
    fullName: r.display_name,
  }));
}
