"use client";

import { useEffect } from "react";
import ActiveView from "./ActiveView";
import { ensureLoaded, useJourney } from "./journeyStore";
import PlanView from "./PlanView";

export default function JourneyScreen() {
  const s = useJourney();

  useEffect(() => {
    void ensureLoaded();
  }, []);

  if (!s.loaded) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">Journey</h1>
        {s.loadError ? (
          <div role="alert" className="rounded-2xl border border-rose/40 bg-rose/10 p-4 text-sm text-rose">
            <p>{s.loadError}</p>
            <button
              type="button"
              onClick={() => void ensureLoaded()}
              className="mt-2 rounded-lg bg-rose px-3 py-1.5 text-xs font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : (
          <p className="text-sm text-white/50">Loading…</p>
        )}
      </div>
    );
  }

  return s.journey ? <ActiveView s={s} journey={s.journey} /> : <PlanView notice={s.notice} />;
}
