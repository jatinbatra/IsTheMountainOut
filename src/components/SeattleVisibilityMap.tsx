"use client";

import { useEffect, useRef } from "react";

interface NeighborhoodScore {
  id: string;
  score: number;
  name: string;
  lat: number;
  lon: number;
}

const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lon: number }> = {
  "capitol-hill":  { lat: 47.6253, lon: -122.3222 },
  "queen-anne":    { lat: 47.6373, lon: -122.3571 },
  downtown:        { lat: 47.6062, lon: -122.3321 },
  ballard:         { lat: 47.6680, lon: -122.3847 },
  fremont:         { lat: 47.6510, lon: -122.3506 },
  "green-lake":    { lat: 47.6801, lon: -122.3267 },
  "u-district":    { lat: 47.6615, lon: -122.3133 },
  wallingford:     { lat: 47.6583, lon: -122.3349 },
  "west-seattle":  { lat: 47.5665, lon: -122.3872 },
  "columbia-city": { lat: 47.5595, lon: -122.2867 },
  "beacon-hill":   { lat: 47.5788, lon: -122.3114 },
  sodo:            { lat: 47.5662, lon: -122.3339 },
  georgetown:      { lat: 47.5418, lon: -122.3223 },
  leschi:          { lat: 47.6003, lon: -122.2877 },
  magnolia:        { lat: 47.6440, lon: -122.3994 },
  "central-district": { lat: 47.6080, lon: -122.2996 },
};

function scoreColor(score: number): string {
  if (score >= 90) return "#2db87a";
  if (score >= 70) return "#4a9060";
  if (score >= 50) return "#d4a373";
  if (score >= 30) return "#c06828";
  return "#ff5cad";
}

interface Props {
  scores: { id: string; score: number }[];
  labels: Record<string, string>;
  baseScore: number;
}

export default function SeattleVisibilityMap({ scores, labels, baseScore }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [47.6062, -122.3321],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 16,
      }).addTo(map);

      // Rainier marker
      const rainierIcon = L.divIcon({
        className: "rainier-marker",
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:rgba(45,184,122,0.15);
          border:2px solid rgba(45,184,122,0.4);
          display:flex;align-items:center;justify-content:center;
          font-size:14px;
        ">🏔️</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([46.8523, -121.7603], { icon: rainierIcon }).addTo(map);

      scores.forEach((ns) => {
        const coords = NEIGHBORHOOD_COORDS[ns.id];
        if (!coords) return;
        const color = scoreColor(ns.score);
        const name = labels[ns.id] ?? ns.id;

        L.circleMarker([coords.lat, coords.lon], {
          radius: 10,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.45,
        })
          .addTo(map)
          .bindTooltip(
            `<div style="font-size:11px;font-weight:600;color:#e8e0d2">${name}</div>
             <div style="font-size:13px;font-weight:700;color:${color}">${ns.score}%</div>`,
            {
              className: "map-tooltip",
              direction: "top",
              offset: [0, -10],
            }
          );
      });

      mapInstance.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove();
        mapInstance.current = null;
      }
    };
  }, [scores, labels, baseScore]);

  return (
    <div className="seattle-map-container">
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "16px" }} />
    </div>
  );
}
