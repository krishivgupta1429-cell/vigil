import { api } from "@/lib/api";

// Mirrors backend/app/routers/journeys.py

export type Journey = {
  id: number;
  status: "active" | "completed" | string;
  destination_lat: number | null;
  destination_lng: number | null;
  destination_name: string | null;
  started_at: string;
  ended_at: string | null;
  share_token: string;
};

export type TrackPing = { lat: number; lng: number; speed: number | null; ts: string };

/** The PUBLIC shape served to people holding a share link. */
export type TrackData = {
  status: "active" | "completed" | string;
  destination: { lat: number | null; lng: number | null; name: string | null };
  started_at: string;
  ended_at: string | null;
  pings: TrackPing[];
  latest: TrackPing | null;
  server_time: string;
};

export type PingBody = { lat: number; lng: number; speed?: number | null; age_ms?: number };

export const journeyApi = {
  active: () => api<Journey | null>("/journeys/active"),
  start: (body: { destination_lat: number; destination_lng: number; destination_name?: string }) =>
    api<Journey>("/journeys", { method: "POST", body: JSON.stringify(body) }),
  ping: (id: number, body: PingBody) =>
    api<{ ok: boolean }>(`/journeys/${id}/ping`, { method: "POST", body: JSON.stringify(body) }),
  end: (id: number) => api<Journey>(`/journeys/${id}/end`, { method: "POST" }),
  track: (token: string, signal?: AbortSignal) =>
    api<TrackData>(`/track/${encodeURIComponent(token)}`, { signal, cache: "no-store" }),
};
