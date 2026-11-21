// The tracking engine: plain TypeScript (no React) so it keeps running while
// the user navigates between tabs. It owns the position source (real GPS or
// the demo simulator), the 5-second ping loop, the offline queue and the
// screen wake lock. Real GPS and the simulator go through the SAME ping path.

import { ApiError } from "@/lib/api";
import { distanceMeters, moveToward, offsetMeters, type LatLng } from "./geo";
import { journeyApi } from "./journeyApi";

export type Fix = LatLng & { speed: number | null; t: number };
export type GpsStatus = "waiting" | "tracking" | "denied" | "unavailable";

export type TrackerOptions = {
  journeyId: number;
  destination: LatLng;
  sim: boolean;
  /** Simulator only: where the fake walk begins. */
  simStart?: LatLng;
  onFix: (fix: Fix, avgSpeed: number | null) => void;
  onPoint: (p: LatLng) => void; // a ping was queued: extend the drawn path
  onGps: (s: GpsStatus) => void;
  onReconnecting: (b: boolean) => void;
  onEnded: () => void; // server says the journey is over
  onArrived: () => void;
  onWakeLock: (held: boolean) => void;
};

const SEND_EVERY_MS = 5000;
const STALE_FIX_MS = 30_000; // don't re-send a position older than this
const MAX_QUEUE = 500;
const SPEED_WINDOW_MS = 30_000;

// Simulator: roughly 10x walking speed (1.4 m/s) with a little noise.
const SIM_SPEED_MPS = 14;
const SIM_ARRIVE_M = 35;
const SIM_START_OFFSET_M = 850; // default start ~1.2 km south-west of the destination

type Queued = { lat: number; lng: number; speed: number | null; capturedAt: number };

function averageSpeed(samples: Fix[]): number | null {
  if (samples.length < 2) return null;
  const a = samples[0];
  const b = samples[samples.length - 1];
  const secs = (b.t - a.t) / 1000;
  if (secs < 4) return null;
  return distanceMeters(a, b) / secs; // net displacement: immune to GPS jitter
}

export function defaultSimStart(destination: LatLng): LatLng {
  return offsetMeters(destination, -SIM_START_OFFSET_M, -SIM_START_OFFSET_M);
}

export function startTracker(o: TrackerOptions): () => void {
  let stopped = false;
  let latest: Fix | null = null;
  let firstQueued = false;
  let flushing = false;
  const samples: Fix[] = [];
  const queue: Queued[] = [];
  const cleanups: (() => void)[] = [];

  // ---- sending -----------------------------------------------------------

  function enqueue(capturedAt: number) {
    if (!latest) return;
    queue.push({ lat: latest.lat, lng: latest.lng, speed: latest.speed, capturedAt });
    if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
    o.onPoint({ lat: latest.lat, lng: latest.lng });
  }

  async function flush() {
    if (flushing || stopped) return;
    flushing = true;
    try {
      while (queue.length > 0 && !stopped) {
        const p = queue[0];
        try {
          await journeyApi.ping(o.journeyId, {
            lat: p.lat,
            lng: p.lng,
            speed: p.speed,
            age_ms: Math.max(0, Math.round(Date.now() - p.capturedAt)),
          });
          queue.shift();
          if (!stopped) o.onReconnecting(false);
        } catch (e) {
          if (stopped) return;
          if (e instanceof ApiError && (e.status === 404 || e.status === 409)) {
            stop();
            o.onEnded();
            return;
          }
          if (e instanceof ApiError && e.status >= 400 && e.status < 500) {
            queue.shift(); // the server will never accept this ping: drop it
            continue;
          }
          o.onReconnecting(true); // offline or server error: keep the queue, retry next tick
          return;
        }
      }
    } finally {
      flushing = false;
    }
  }

  function tick() {
    // Re-send the last known position as "now" only while it is still fresh.
    if (latest && Date.now() - latest.t <= STALE_FIX_MS) enqueue(Date.now());
    void flush();
  }

  function handleFix(fix: Fix) {
    if (stopped) return;
    latest = fix;
    samples.push(fix);
    while (samples.length > 1 && fix.t - samples[0].t > SPEED_WINDOW_MS) samples.shift();
    o.onFix(fix, averageSpeed(samples));
    if (!firstQueued) {
      firstQueued = true;
      enqueue(fix.t); // show up on the shared link straight away
      void flush();
    }
  }

  const timer = setInterval(tick, SEND_EVERY_MS);
  cleanups.push(() => clearInterval(timer));

  // ---- position source ---------------------------------------------------

  o.onGps("waiting");

  if (o.sim) {
    let pos = o.simStart ?? defaultSimStart(o.destination);
    let arrived = false;
    const rand = (spread: number) => (Math.random() * 2 - 1) * spread;
    const step = () => {
      let speed = 0;
      if (!arrived) {
        if (distanceMeters(pos, o.destination) <= SIM_ARRIVE_M) {
          arrived = true;
          o.onArrived();
        } else {
          speed = SIM_SPEED_MPS * (0.9 + Math.random() * 0.2);
          pos = moveToward(pos, o.destination, speed); // one tick = 1 s
        }
      }
      const noisy = offsetMeters(pos, rand(3), rand(3));
      o.onGps("tracking");
      handleFix({ ...noisy, speed, t: Date.now() });
    };
    step();
    const simTimer = setInterval(step, 1000);
    cleanups.push(() => clearInterval(simTimer));
  } else {
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        o.onGps("tracking");
        const s = p.coords.speed;
        handleFix({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          speed: s != null && Number.isFinite(s) ? s : null,
          t: Date.now(),
        });
      },
      (e) => {
        if (stopped) return;
        o.onGps(e.code === 1 ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
    );
    cleanups.push(() => navigator.geolocation.clearWatch(watchId));
  }

  // ---- screen wake lock --------------------------------------------------

  let lock: WakeLockSentinel | null = null;
  async function acquireLock() {
    if (stopped || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    if (lock && !lock.released) return;
    try {
      lock = await navigator.wakeLock.request("screen");
      if (stopped) {
        void lock.release();
        return;
      }
      o.onWakeLock(true);
      lock.addEventListener("release", () => !stopped && o.onWakeLock(false));
    } catch {
      o.onWakeLock(false); // denied (e.g. battery saver): tracking still works
    }
  }
  const onVisible = () => {
    if (document.visibilityState === "visible") void acquireLock();
  };
  document.addEventListener("visibilitychange", onVisible);
  cleanups.push(() => document.removeEventListener("visibilitychange", onVisible));
  void acquireLock();
  cleanups.push(() => void lock?.release().catch(() => {}));

  function stop() {
    if (stopped) return;
    stopped = true;
    cleanups.forEach((c) => c());
  }
  return stop;
}
