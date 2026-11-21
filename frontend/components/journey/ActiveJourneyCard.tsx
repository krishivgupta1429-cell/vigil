"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ensureLoaded, useJourney } from "./journeyStore";

/** Shown on Home while a journey is running. Also resumes tracking after a page reload. */
export default function ActiveJourneyCard() {
  const s = useJourney();

  useEffect(() => {
    void ensureLoaded();
  }, []);

  if (!s.journey) return null;

  return (
    <Link
      href="/journey"
      className="flex items-center justify-between gap-3 rounded-2xl border border-teal/40 bg-teal/10 p-4 transition active:scale-[0.99]"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-teal">
          <span aria-hidden className="h-2 w-2 rounded-full bg-teal" />
          Journey in progress
          {s.sim && (
            <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-night">
              Simulation
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-white/60">
          To {s.journey.destination_name ?? "your dropped pin"}
          {s.reconnecting ? " · Reconnecting…" : ""}
        </p>
      </div>
      <span aria-hidden className="text-teal">
        →
      </span>
    </Link>
  );
}
