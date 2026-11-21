"use client";

import { useEffect, useState } from "react";
import { distanceMeters, type LatLng } from "./geo";
import { GeoError, geoSupport, getPosition, GEO_MESSAGES, silentPosition } from "./geolocation";
import { dismissNotice, startJourney } from "./journeyStore";
import JourneyMap from "./JourneyMap";
import type { MapFocus } from "./LeafletMap";
import PlaceSearch from "./PlaceSearch";

// Thapar Institute, Patiala: the demo area.
const DEFAULT_CENTER: LatLng = { lat: 30.3564, lng: 76.3647 };
const DEMO_USE_REAL_START_WITHIN_M = 5000;

export default function PlanView({ notice }: { notice: string | null }) {
  const [support] = useState(geoSupport);
  const [demo, setDemo] = useState(() => new URLSearchParams(window.location.search).get("sim") === "1");
  const [dest, setDest] = useState<LatLng | null>(null);
  const [destName, setDestName] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [me, setMe] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If location is already allowed, centre on the user without prompting.
  useEffect(() => {
    let cancelled = false;
    silentPosition().then((p) => {
      if (p && !cancelled) {
        setMe(p);
        setFocus({ ...p, zoom: 15 });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function locateMe() {
    setLocating(true);
    setError(null);
    try {
      const p = await getPosition();
      setMe(p);
      setFocus({ ...p, zoom: 16 });
    } catch (e) {
      setError(e instanceof GeoError ? e.message : "Couldn't get your location.");
    } finally {
      setLocating(false);
    }
  }

  async function start() {
    if (!dest || busy) return;
    setBusy(true);
    setError(null);
    try {
      let startPoint: LatLng | null;
      if (demo) {
        // Demo: only use the real position as the start if it is near the destination.
        const p = await silentPosition();
        startPoint = p && distanceMeters(p, dest) <= DEMO_USE_REAL_START_WITHIN_M ? p : null;
      } else {
        startPoint = await getPosition(); // also triggers the permission prompt
      }
      const err = await startJourney({ destination: dest, name: destName, sim: demo, startPoint });
      if (err) setError(err);
    } catch (e) {
      setError(e instanceof GeoError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const blocked = support !== "ok" && !demo;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Journey</h1>
        <p className="mt-1 text-sm text-white/60">
          Choose where you&apos;re going, then share a live link with someone you trust.
        </p>
      </div>

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-gold/15 px-3.5 py-2.5 text-sm text-gold">
          <span>{notice}</span>
          <button type="button" onClick={dismissNotice} aria-label="Dismiss" className="font-semibold">
            ×
          </button>
        </div>
      )}

      {support !== "ok" && !demo && (
        <div role="alert" className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold">
          <p className="font-semibold">
            {support === "insecure" ? "Location needs a secure (HTTPS) page" : "Location isn't available here"}
          </p>
          <p className="mt-1 text-gold/90">{GEO_MESSAGES[support]}</p>
          <button
            type="button"
            onClick={() => setDemo(true)}
            className="mt-3 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-night"
          >
            Turn on Demo mode
          </button>
        </div>
      )}

      <PlaceSearch
        onSelect={(p) => {
          setDest({ lat: p.lat, lng: p.lng });
          setDestName(p.name);
          setFocus({ lat: p.lat, lng: p.lng, zoom: 16 });
        }}
      />

      <div className="relative">
        <JourneyMap
          center={me ?? DEFAULT_CENTER}
          zoom={14}
          destination={dest}
          position={me}
          focus={focus}
          onPick={(p) => {
            setDest(p);
            setDestName(null);
          }}
        />
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="absolute right-2 top-2 z-10 rounded-lg bg-night/90 px-3 py-1.5 text-xs font-semibold text-white shadow disabled:opacity-60"
        >
          {locating ? "Locating…" : "My location"}
        </button>
      </div>

      <p className="text-sm text-white/60">
        {dest ? (
          <>
            <span className="font-medium text-white">Destination:</span>{" "}
            {destName ?? `Dropped pin (${dest.lat.toFixed(4)}, ${dest.lng.toFixed(4)})`}
          </>
        ) : (
          "Tap the map to drop your destination pin."
        )}
      </p>

      <button
        type="button"
        role="switch"
        aria-checked={demo}
        onClick={() => setDemo((d) => !d)}
        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-edge bg-card p-4 text-left"
      >
        <span>
          <span className="block text-sm font-semibold">Demo mode</span>
          <span className="block text-xs text-white/55">
            Simulates a walk to your destination instead of using GPS. For demos only: nothing real is tracked.
          </span>
        </span>
        <span
          aria-hidden
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${demo ? "bg-gold" : "bg-white/20"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${demo ? "left-[22px]" : "left-0.5"}`}
          />
        </span>
      </button>

      {error && (
        <p role="alert" className="rounded-xl bg-rose/15 px-3.5 py-2.5 text-sm text-rose">
          {error}
          {!demo && (
            <button
              type="button"
              onClick={() => setDemo(true)}
              className="ml-2 font-semibold underline underline-offset-2"
            >
              Use Demo mode
            </button>
          )}
        </p>
      )}

      <button
        type="button"
        onClick={start}
        disabled={!dest || busy || blocked}
        className="w-full rounded-2xl bg-rose py-3.5 text-base font-bold text-white shadow-[0_8px_24px_-8px_rgba(255,77,126,0.7)] transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        {busy ? "Starting…" : demo ? "Start demo journey" : "Start journey"}
      </button>
    </div>
  );
}
