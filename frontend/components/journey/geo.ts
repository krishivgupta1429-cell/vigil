export type LatLng = { lat: number; lng: number };

const R = 6371000; // mean Earth radius, metres
const M_PER_DEG_LAT = 111_320;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle (straight-line) distance in metres. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Shift a point by metres east/north (fine for the short distances we use). */
export function offsetMeters(p: LatLng, east: number, north: number): LatLng {
  return {
    lat: p.lat + north / M_PER_DEG_LAT,
    lng: p.lng + east / (M_PER_DEG_LAT * Math.cos(rad(p.lat))),
  };
}

/** Move `meters` from `from` straight toward `to` (never overshoots). */
export function moveToward(from: LatLng, to: LatLng, meters: number): LatLng {
  const d = distanceMeters(from, to);
  if (d <= meters || d === 0) return to;
  const f = meters / d;
  return { lat: from.lat + (to.lat - from.lat) * f, lng: from.lng + (to.lng - from.lng) * f };
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

export function formatEta(seconds: number): string {
  if (seconds < 60) return "< 1 min";
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

export function formatAge(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 5) return "just now";
  if (s < 60) return `${s} seconds ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ago`;
}
