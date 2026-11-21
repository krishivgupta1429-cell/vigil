"use client";

// Loaded only in the browser (see JourneyMap.tsx): Leaflet touches `window`.

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "./geo";

export type MapFocus = LatLng & { zoom?: number };

export type LeafletMapProps = {
  center: LatLng;
  zoom?: number;
  destination?: LatLng | null;
  position?: LatLng | null;
  path?: LatLng[];
  /** Tapping the map reports the point (planning mode). */
  onPick?: (p: LatLng) => void;
  /** Change this object to re-centre the map. */
  focus?: MapFocus | null;
  /** Keep the live position inside the view. */
  follow?: boolean;
  /** Fit everything into view once whenever this key changes. */
  fitKey?: string | number | null;
};

// divIcon (not an image) so we don't depend on Leaflet's bundled marker PNGs.
const destinationIcon = L.divIcon({
  className: "",
  iconSize: [26, 26],
  iconAnchor: [13, 31],
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#FF4D7E;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45)"></div>`,
});

const ll = (p: LatLng): [number, number] => [p.lat, p.lng];

function Controller({
  focus,
  follow,
  position,
  fitKey,
  fitPoints,
  onPick,
}: Pick<LeafletMapProps, "focus" | "follow" | "fitKey" | "onPick"> & {
  position: LatLng | null;
  fitPoints: LatLng[];
}) {
  const map = useMap();
  const fittedKey = useRef<string | number | null | undefined>(undefined);

  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  useEffect(() => {
    if (focus) map.setView(ll(focus), focus.zoom ?? 15);
  }, [focus, map]);

  useEffect(() => {
    if (fitKey == null || fittedKey.current === fitKey || fitPoints.length === 0) return;
    fittedKey.current = fitKey;
    if (fitPoints.length === 1) map.setView(ll(fitPoints[0]), 16);
    else map.fitBounds(L.latLngBounds(fitPoints.map(ll)), { padding: [40, 40], maxZoom: 17 });
  }, [fitKey, fitPoints, map]);

  useEffect(() => {
    if (!follow || !position) return;
    if (!map.getBounds().pad(-0.2).contains(ll(position))) map.panTo(ll(position));
  }, [follow, position, map]);

  return null;
}

export default function LeafletMap({
  center,
  zoom = 14,
  destination = null,
  position = null,
  path = [],
  onPick,
  focus = null,
  follow = false,
  fitKey = null,
}: LeafletMapProps) {
  const fitPoints = [...path, ...(position ? [position] : []), ...(destination ? [destination] : [])];

  return (
    <MapContainer center={ll(center)} zoom={zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      />
      <Controller
        focus={focus}
        follow={follow}
        position={position}
        fitKey={fitKey}
        fitPoints={fitPoints}
        onPick={onPick}
      />
      {path.length > 1 && (
        <Polyline positions={path.map(ll)} pathOptions={{ color: "#3B82F6", weight: 5, opacity: 0.9 }} />
      )}
      {position && destination && (
        <Polyline
          positions={[ll(position), ll(destination)]}
          pathOptions={{ color: "#FF4D7E", weight: 2, opacity: 0.8, dashArray: "6 8" }}
        />
      )}
      {destination && <Marker position={ll(destination)} icon={destinationIcon} interactive={false} />}
      {position && (
        <>
          <CircleMarker
            center={ll(position)}
            radius={17}
            interactive={false}
            pathOptions={{ stroke: false, fillColor: "#3B82F6", fillOpacity: 0.25 }}
          />
          <CircleMarker
            center={ll(position)}
            radius={8}
            interactive={false}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#3B82F6", fillOpacity: 1 }}
          />
        </>
      )}
    </MapContainer>
  );
}
