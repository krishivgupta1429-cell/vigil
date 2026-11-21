"use client";

import { useEffect, useRef, useState } from "react";
import { distanceMeters, formatDistance, formatEta, type LatLng } from "./geo";
import { GEO_MESSAGES } from "./geolocation";
import type { Journey } from "./journeyApi";
import { endJourney, type JourneyState } from "./journeyStore";
import JourneyMap from "./JourneyMap";

const MIN_ETA_SPEED_MPS = 0.5;

export default function ActiveView({ s, journey }: { s: JourneyState; journey: Journey }) {
  const [toast, setToast] = useState<string | null>(null);
  const [manualLink, setManualLink] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (toastTimer.current && clearTimeout(toastTimer.current)), []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  const destination: LatLng | null =
    journey.destination_lat != null && journey.destination_lng != null
      ? { lat: journey.destination_lat, lng: journey.destination_lng }
      : null;
  const position: LatLng | null = s.position ? { lat: s.position.lat, lng: s.position.lng } : null;

  const remaining = position && destination ? distanceMeters(position, destination) : null;
  const eta =
    remaining != null && s.avgSpeed != null && s.avgSpeed >= MIN_ETA_SPEED_MPS
      ? formatEta(remaining / s.avgSpeed)
      : null;

  async function share() {
    const url = `${window.location.origin}/track/${journey.share_token}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Follow my journey", text: "Follow my live journey on Vigil:", url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // user closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setManualLink(null);
      showToast("Link copied");
    } catch {
      setManualLink(url); // clipboard needs HTTPS; let them copy by hand
      showToast("Couldn't copy automatically");
    }
  }

  async function end() {
    setEnding(true);
    setEndError(null);
    const err = await endJourney();
    if (err) {
      setEndError(err);
      setEnding(false);
    }
    // On success the store clears the journey and the screen returns to planning.
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journey in progress</h1>
          <p className="mt-1 text-sm text-white/60">
            To {journey.destination_name ?? "your dropped pin"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {s.sim ? (
            <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-wide text-night">
              Simulation
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold text-teal">
              <span aria-hidden className="h-2 w-2 rounded-full bg-teal" />
              Live
            </span>
          )}
          {s.reconnecting && (
            <span role="status" className="rounded-full bg-rose/20 px-3 py-1 text-xs font-semibold text-rose">
              Reconnecting…
            </span>
          )}
        </div>
      </div>

      {s.sim && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-2.5 text-sm text-gold">
          Simulation: this position is fake and for demos only. It is not real tracking.
        </p>
      )}

      {!s.sim && s.gps === "denied" && (
        <div role="alert" className="rounded-2xl border border-rose/40 bg-rose/10 p-4 text-sm text-rose">
          <p className="font-semibold">Location is blocked</p>
          <p className="mt-1">
            {GEO_MESSAGES.denied} Nobody can see your position until it&apos;s allowed. End this journey, then
            start a Demo mode journey if you just want to try the app.
          </p>
        </div>
      )}
      {!s.sim && s.gps === "waiting" && (
        <p role="status" className="text-sm text-white/55">
          Getting your location…
        </p>
      )}
      {!s.sim && s.gps === "unavailable" && (
        <p role="status" className="rounded-xl bg-gold/10 px-3.5 py-2.5 text-sm text-gold">
          Waiting for a GPS signal. Your contacts will see your last known position until it&apos;s back.
        </p>
      )}

      <JourneyMap
        center={position ?? destination ?? { lat: 30.3564, lng: 76.3647 }}
        zoom={15}
        destination={destination}
        position={position}
        path={s.path}
        follow
        fitKey={`${journey.id}:${position ? "pos" : "wait"}`}
      />

      {s.arrived ? (
        <div className="rounded-2xl border border-teal/40 bg-teal/10 p-4 text-center text-sm font-semibold text-teal">
          You&apos;ve reached your destination. End the journey when you&apos;re safe.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-edge bg-card p-4">
            <p className="text-xs text-white/50">Distance remaining</p>
            <p className="mt-1 text-xl font-bold">{remaining != null ? formatDistance(remaining) : "…"}</p>
            <p className="text-xs text-white/40">straight line</p>
          </div>
          <div className="rounded-2xl border border-edge bg-card p-4">
            <p className="text-xs text-white/50">ETA (approx.)</p>
            <p className="mt-1 text-xl font-bold">{eta ? `~${eta}` : "…"}</p>
            <p className="text-xs text-white/40">{eta ? "from recent speed" : "needs movement"}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-edge bg-card p-4">
        <button
          type="button"
          onClick={share}
          className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-night transition active:scale-[0.98]"
        >
          Share live link
        </button>
        <p className="mt-2.5 text-xs leading-relaxed text-white/55">
          Anyone with this link can see your live location for this journey only. It stops updating when you
          end the journey.
        </p>
        {manualLink && (
          <input
            readOnly
            value={manualLink}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Live tracking link"
            className="mt-2.5 w-full rounded-lg border border-edge bg-night px-3 py-2 text-xs text-white/80"
          />
        )}
        {!s.wakeLock && !s.sim && (
          <p className="mt-2 text-xs text-white/40">
            Keep this screen on while travelling: phones can pause tracking when locked.
          </p>
        )}
      </div>

      {endError && (
        <p role="alert" className="rounded-xl bg-rose/15 px-3.5 py-2.5 text-sm text-rose">
          {endError}
        </p>
      )}

      {confirmEnd ? (
        <div className="rounded-2xl border border-rose/40 bg-rose/10 p-4">
          <p className="text-sm font-semibold">End this journey?</p>
          <p className="mt-1 text-xs text-white/60">Your live link will stop working immediately.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirmEnd(false)}
              disabled={ending}
              className="rounded-xl border border-edge py-2.5 text-sm font-semibold"
            >
              Keep going
            </button>
            <button
              type="button"
              onClick={end}
              disabled={ending}
              className="rounded-xl bg-rose py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {ending ? "Ending…" : "Yes, end it"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmEnd(true)}
          className="w-full rounded-2xl border border-rose/50 py-3 text-sm font-semibold text-rose transition active:scale-[0.98]"
        >
          End journey
        </button>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-night shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
