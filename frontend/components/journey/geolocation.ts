import type { LatLng } from "./geo";

export type GeoSupport = "ok" | "insecure" | "unsupported";

/** Phones only expose GPS on HTTPS (localhost counts as secure). */
export function geoSupport(): GeoSupport {
  if (typeof window === "undefined") return "ok";
  if (!window.isSecureContext) return "insecure";
  if (!("geolocation" in navigator)) return "unsupported";
  return "ok";
}

export class GeoError extends Error {
  constructor(
    public kind: "denied" | "unavailable" | "timeout" | "insecure" | "unsupported",
    message: string,
  ) {
    super(message);
  }
}

export const GEO_MESSAGES = {
  insecure:
    "Your browser only shares location on secure (HTTPS) pages. Open Vigil through the HTTPS link, or use Demo mode to try it without GPS.",
  unsupported: "This browser can't share its location. Try another browser, or use Demo mode.",
  denied:
    "Location access is blocked. Allow location for this site in your browser settings and try again, or use Demo mode to try Vigil without GPS.",
  unavailable: "Couldn't get a GPS signal. Move somewhere with a clearer view of the sky, or use Demo mode.",
  timeout: "Getting your location took too long. Try again, or use Demo mode.",
} as const;

/** One high-accuracy position fix (asks for permission if needed). */
export function getPosition(timeoutMs = 15_000): Promise<LatLng> {
  const support = geoSupport();
  if (support !== "ok") return Promise.reject(new GeoError(support, GEO_MESSAGES[support]));
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => {
        const kind = e.code === 1 ? "denied" : e.code === 3 ? "timeout" : "unavailable";
        reject(new GeoError(kind, GEO_MESSAGES[kind]));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

/** Position only if the user has already granted permission: never shows a prompt. */
export async function silentPosition(): Promise<LatLng | null> {
  try {
    if (geoSupport() !== "ok" || !navigator.permissions) return null;
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state !== "granted") return null;
    return await getPosition(4000);
  } catch {
    return null;
  }
}
