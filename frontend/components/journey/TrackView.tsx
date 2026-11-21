"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { distanceMeters, formatAge, formatDistance, type LatLng } from "./geo";
import { journeyApi, type TrackData } from "./journeyApi";
import JourneyMap from "./JourneyMap";

const POLL_MS = 5000;
const STALE_AFTER_S = 30;

type Problem = "invalid" | "network" | null;

/** PUBLIC page for people who were sent a live link. No bottom nav, no contacts. */
export default function TrackView({ token }: { token: string }) {
  const [data, setData] = useState<TrackData | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [problem, setProblem] = useState<Problem>(null);
  const [now, setNow] = useState(() => Date.now());

  // Poll every 5 s (one request at a time) until the journey ends or the link is invalid.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ctrl = new AbortController();

    async function poll() {
      try {
        const d = await journeyApi.track(token, ctrl.signal);
        if (stopped) return;
        setData(d);
        setFetchedAt(Date.now());
        setProblem(null);
        if (d.status !== "active") return; // ended: nothing more to follow
      } catch (e) {
        if (stopped) return;
        if (e instanceof ApiError && e.status === 404) {
          setProblem("invalid");
          return;
        }
        setProblem("network");
      }
      timer = setTimeout(poll, POLL_MS);
    }
    void poll();

    return () => {
      stopped = true;
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [token]);

  // 1 Hz clock so "Last updated" counts up between polls.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const hideNav = <style>{`nav[aria-label="Main"]{display:none !important}`}</style>;

  if (problem === "invalid") {
    return (
      <>
        {hideNav}
        <Message
          title="This link isn't valid"
          body="It may have been mistyped or copied incompletely. Ask the person to share it again."
        />
      </>
    );
  }

  if (!data) {
    return (
      <>
        {hideNav}
        <Header status={null} />
        <p role="status" className="mt-4 text-sm text-white/55">
          {problem === "network" ? "Can't reach the server. Retrying…" : "Loading…"}
        </p>
      </>
    );
  }

  if (data.status !== "active") {
    return (
      <>
        {hideNav}
        <Message
          title="This journey has ended"
          body="Live location is no longer being shared. The link stops working once a journey is over."
          tone="teal"
        />
      </>
    );
  }

  const latest = data.latest;
  const position: LatLng | null = latest ? { lat: latest.lat, lng: latest.lng } : null;
  const destination: LatLng | null =
    data.destination.lat != null && data.destination.lng != null
      ? { lat: data.destination.lat, lng: data.destination.lng }
      : null;
  const path: LatLng[] = data.pings.map((p) => ({ lat: p.lat, lng: p.lng }));

  // Age is measured against the SERVER clock at fetch time, then counted up locally,
  // so a wrong clock on this phone can't make a fresh position look stale.
  const ageS = latest
    ? (Date.parse(data.server_time) - Date.parse(latest.ts)) / 1000 + Math.max(0, now - fetchedAt) / 1000
    : null;
  const stale = ageS != null && ageS > STALE_AFTER_S;
  const remaining = position && destination ? distanceMeters(position, destination) : null;

  return (
    <div className="space-y-4">
      {hideNav}
      <Header status="active" />

      {problem === "network" && (
        <p role="status" className="rounded-xl bg-gold/10 px-3.5 py-2 text-sm text-gold">
          Connection problem. Showing the last update, retrying…
        </p>
      )}

      <JourneyMap
        center={position ?? destination ?? { lat: 30.3564, lng: 76.3647 }}
        zoom={15}
        destination={destination}
        position={position}
        path={path}
        follow
        fitKey={position ? "pos" : "wait"}
        className="h-[55dvh]"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-2xl border p-4 ${stale ? "border-gold/50 bg-gold/10" : "border-edge bg-card"}`}>
          <p className="text-xs text-white/50">Last updated</p>
          <p className={`mt-1 text-base font-bold ${stale ? "text-gold" : ""}`}>
            {ageS != null ? formatAge(ageS) : "Waiting for first location…"}
          </p>
          {stale && <p className="text-xs text-gold/80">Signal may be weak</p>}
        </div>
        <div className="rounded-2xl border border-edge bg-card p-4">
          <p className="text-xs text-white/50">To destination</p>
          <p className="mt-1 text-base font-bold">{remaining != null ? formatDistance(remaining) : "…"}</p>
          <p className="truncate text-xs text-white/40">{data.destination.name ?? "straight line"}</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-white/45">
        You are seeing the live location for this one journey only. It refreshes every few seconds and stops when
        the journey ends.
      </p>
    </div>
  );
}

function Header({ status }: { status: "active" | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose">Vigil</p>
        <h1 className="text-2xl font-bold tracking-tight">Live journey</h1>
      </div>
      {status === "active" && (
        <span className="flex items-center gap-1.5 rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold text-teal">
          <span aria-hidden className="h-2 w-2 rounded-full bg-teal" />
          In progress
        </span>
      )}
    </div>
  );
}

function Message({ title, body, tone = "rose" }: { title: string; body: string; tone?: "rose" | "teal" }) {
  const cls = tone === "teal" ? "border-teal/40 bg-teal/10 text-teal" : "border-rose/40 bg-rose/10 text-rose";
  return (
    <div className="space-y-4">
      <Header status={null} />
      <div role="status" className={`rounded-2xl border p-5 ${cls}`}>
        <p className="text-lg font-bold">{title}</p>
        <p className="mt-1 text-sm text-white/70">{body}</p>
      </div>
    </div>
  );
}
