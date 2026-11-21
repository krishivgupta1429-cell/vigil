"use client";

import dynamic from "next/dynamic";
import type { LeafletMapProps } from "./LeafletMap";

// ssr:false: Leaflet needs `window`, so the map renders only in the browser.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-card text-sm text-white/50">
      Loading map…
    </div>
  ),
});

/** `className` sets the height, e.g. "h-[46dvh]". `isolate` keeps Leaflet's z-indexes below our fixed bars. */
export default function JourneyMap({ className = "h-[46dvh]", ...props }: LeafletMapProps & { className?: string }) {
  return (
    <div className={`isolate overflow-hidden rounded-2xl border border-edge ${className}`}>
      <LeafletMap {...props} />
    </div>
  );
}
