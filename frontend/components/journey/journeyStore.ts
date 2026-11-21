// Module-level store for the active journey. Because it lives outside React,
// tracking keeps running when the user moves between tabs (client-side
// navigation does not reload modules). A full page reload resumes it as soon
// as the Journey page or the Home card mounts and calls ensureLoaded().

import { useSyncExternalStore } from "react";
import { ApiError } from "@/lib/api";
import type { LatLng } from "./geo";
import { journeyApi, type Journey } from "./journeyApi";
import { startTracker, type Fix, type GpsStatus } from "./tracker";

export type JourneyState = {
  loaded: boolean;
  loadError: string | null;
  journey: Journey | null;
  sim: boolean;
  position: Fix | null;
  path: LatLng[];
  avgSpeed: number | null; // m/s over the last ~30 s
  gps: GpsStatus;
  reconnecting: boolean;
  wakeLock: boolean;
  arrived: boolean;
  notice: string | null;
};

const INITIAL: JourneyState = {
  loaded: false,
  loadError: null,
  journey: null,
  sim: false,
  position: null,
  path: [],
  avgSpeed: null,
  gps: "waiting",
  reconnecting: false,
  wakeLock: false,
  arrived: false,
  notice: null,
};

const SIM_KEY = "vigil:sim";
const MAX_PATH = 2000;

let state: JourneyState = INITIAL;
const listeners = new Set<() => void>();
let stopTracker: (() => void) | null = null;
let loading: Promise<void> | null = null;

function set(patch: Partial<JourneyState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useJourney(): JourneyState {
  return useSyncExternalStore(subscribe, () => state, () => INITIAL);
}

function destinationOf(j: Journey): LatLng | null {
  return j.destination_lat != null && j.destination_lng != null
    ? { lat: j.destination_lat, lng: j.destination_lng }
    : null;
}

function beginTracking(journey: Journey, sim: boolean, startPoint: LatLng | null, path: LatLng[]) {
  stopTracker?.();
  stopTracker = null;
  const destination = destinationOf(journey);
  set({
    journey,
    sim,
    path,
    position: startPoint ? { ...startPoint, speed: null, t: Date.now() } : null,
    avgSpeed: null,
    gps: "waiting",
    reconnecting: false,
    wakeLock: false,
    arrived: false,
    notice: null,
  });
  if (!destination) return;
  stopTracker = startTracker({
    journeyId: journey.id,
    destination,
    sim,
    simStart: startPoint ?? undefined,
    onFix: (fix, avgSpeed) => set({ position: fix, avgSpeed }),
    onPoint: (p) => set({ path: [...state.path, p].slice(-MAX_PATH) }),
    onGps: (gps) => gps !== state.gps && set({ gps }),
    onReconnecting: (b) => b !== state.reconnecting && set({ reconnecting: b }),
    onWakeLock: (b) => b !== state.wakeLock && set({ wakeLock: b }),
    onArrived: () => set({ arrived: true }),
    onEnded: () => {
      clearJourney("This journey had already been ended.");
    },
  });
}

function clearJourney(notice: string | null) {
  stopTracker?.();
  stopTracker = null;
  try {
    sessionStorage.removeItem(SIM_KEY);
  } catch {}
  set({
    journey: null,
    sim: false,
    position: null,
    path: [],
    avgSpeed: null,
    gps: "waiting",
    reconnecting: false,
    wakeLock: false,
    arrived: false,
    notice,
  });
}

function wantsSim(): boolean {
  try {
    return (
      new URLSearchParams(window.location.search).get("sim") === "1" ||
      sessionStorage.getItem(SIM_KEY) === "1"
    );
  } catch {
    return false;
  }
}

/** Fetch the active journey once and resume tracking if there is one. */
export function ensureLoaded(): Promise<void> {
  if (state.loaded) return Promise.resolve();
  if (loading) return loading;
  loading = (async () => {
    try {
      const journey = await journeyApi.active();
      if (journey) {
        // Rebuild the path from what the server already has, then carry on.
        let path: LatLng[] = [];
        try {
          const t = await journeyApi.track(journey.share_token);
          path = t.pings.map((p) => ({ lat: p.lat, lng: p.lng }));
        } catch {}
        beginTracking(journey, wantsSim(), path.at(-1) ?? null, path);
      }
      set({ loaded: true, loadError: null });
    } catch (e) {
      set({ loadError: e instanceof ApiError ? e.message : "Couldn't load your journey." });
    } finally {
      loading = null;
    }
  })();
  return loading;
}

export async function startJourney(args: {
  destination: LatLng;
  name: string | null;
  sim: boolean;
  /** Real mode: the fix from the permission check. Demo mode: where the fake walk starts (optional). */
  startPoint: LatLng | null;
}): Promise<string | null> {
  if (state.journey) return "A journey is already in progress.";
  try {
    const journey = await journeyApi.start({
      destination_lat: args.destination.lat,
      destination_lng: args.destination.lng,
      destination_name: args.name ?? undefined,
    });
    try {
      if (args.sim) sessionStorage.setItem(SIM_KEY, "1");
    } catch {}
    beginTracking(journey, args.sim, args.startPoint, []);
    set({ loaded: true });
    return null;
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      // Another journey is already running on the server: pick it up instead.
      set({ loaded: false });
      void ensureLoaded();
    }
    return e instanceof ApiError ? e.message : "Couldn't start the journey.";
  }
}

export async function endJourney(): Promise<string | null> {
  const j = state.journey;
  if (!j) return null;
  try {
    await journeyApi.end(j.id);
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) {
      return e instanceof ApiError ? e.message : "Couldn't end the journey.";
    }
  }
  clearJourney(null);
  return null;
}

export function dismissNotice() {
  set({ notice: null });
}
