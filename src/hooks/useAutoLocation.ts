"use client";

import { useEffect, useRef } from "react";

/**
 * Neighborhood centroids in the Puget Sound area.
 * Used to snap GPS coordinates to the nearest supported neighborhood.
 */
const NEIGHBORHOOD_COORDS: { id: string; lat: number; lon: number }[] = [
  { id: "capitol-hill", lat: 47.6253, lon: -122.3222 },
  { id: "queen-anne", lat: 47.6372, lon: -122.3571 },
  { id: "ballard", lat: 47.6677, lon: -122.3841 },
  { id: "fremont", lat: 47.6513, lon: -122.3500 },
  { id: "downtown", lat: 47.6062, lon: -122.3321 },
  { id: "beacon-hill", lat: 47.5791, lon: -122.3113 },
  { id: "west-seattle", lat: 47.5613, lon: -122.3868 },
  { id: "columbia-city", lat: 47.5596, lon: -122.2869 },
  { id: "greenwood", lat: 47.6928, lon: -122.3556 },
  { id: "u-district", lat: 47.6588, lon: -122.3130 },
  { id: "bellevue", lat: 47.6101, lon: -122.2015 },
  { id: "kirkland", lat: 47.6815, lon: -122.2087 },
  { id: "tacoma", lat: 47.2529, lon: -122.4443 },
  { id: "renton", lat: 47.4829, lon: -122.2171 },
];

/** Max distance in km — beyond this, user is too far from any neighborhood */
const MAX_DISTANCE_KM = 15;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestNeighborhood(lat: number, lon: number): string | null {
  let nearest: string | null = null;
  let minDist = Infinity;

  for (const hood of NEIGHBORHOOD_COORDS) {
    const dist = haversineKm(lat, lon, hood.lat, hood.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = hood.id;
    }
  }

  return minDist <= MAX_DISTANCE_KM ? nearest : null;
}

/**
 * Auto-detect user location and snap to nearest neighborhood.
 * Only fires once on mount, only if no neighborhood is already selected,
 * and only if the URL doesn't have a ?hood= param.
 *
 * Silent fail — if geolocation is denied or unavailable, nothing happens.
 */
export function useAutoLocation(
  currentNeighborhood: string | null,
  onDetect: (neighborhood: string) => void
): void {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (currentNeighborhood) return; // User already has a neighborhood selected
    if (typeof window === "undefined") return;
    if (!("geolocation" in navigator)) return;

    // Don't override URL-specified hood
    const urlHood = new URLSearchParams(window.location.search).get("hood");
    if (urlHood) return;

    hasRun.current = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = findNearestNeighborhood(
          position.coords.latitude,
          position.coords.longitude
        );
        if (nearest) {
          onDetect(nearest);
        }
      },
      () => {
        // Permission denied or error — silent fail
      },
      { timeout: 5000, maximumAge: 300000 } // 5s timeout, 5min cache
    );
  }, [currentNeighborhood, onDetect]);
}
