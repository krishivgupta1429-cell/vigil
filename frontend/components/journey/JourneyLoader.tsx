"use client";

import dynamic from "next/dynamic";

// Browser-only: the screen reads window (URL flags, geolocation, Leaflet).
const JourneyScreen = dynamic(() => import("./JourneyScreen"), {
  ssr: false,
  loading: () => <h1 className="text-2xl font-bold tracking-tight">Journey</h1>,
});

export default function JourneyLoader() {
  return <JourneyScreen />;
}
