import type { WeatherData } from "@/lib/weather";
import { scoreBreakdown, scoreHourForTimeline, WMO, type VisibilityResult } from "@/lib/visibility";
import { recordObservation, ptParts } from "@/lib/history";
import { getSpotterCount } from "@/lib/spotters";

// ── Telemetry ────────────────────────────────────────────────────────
// The full signal snapshot stored with every 15-minute reading: every raw
// input the model saw, the per-factor points, the forecast the model made at
// that moment (so it can be validated later against what actually happened),
// live community sightings, and data-quality checks on the inputs.

export const SIGNALS_VERSION = 1;
/** Bump when the scoring formula changes, so logged data can be split by model. */
export const MODEL_VERSION = "2026-10-cloud-ceiling";

export interface Signals {
  v: number;
  model: string;
  observedAt: string; // when the provider's "current" values are from
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  visibilityM: number;
  pm25: number | null;
  pm10: number | null;
  humidity: number;
  tempC: number;
  windKmh: number;
  weatherCode: number;
  isDay: boolean;
  points: { low: number; mid: number; high: number; vis: number; aq: number; penalty: number; ceiling: number; cappedBy: string | null };
  flags: string[];
  confidence: string;
  /** Model's forecast score for 1 / 3 / 6 hours after this reading. */
  forecast: { h1: number | null; h3: number | null; h6: number | null };
  sunrise: string;
  sunset: string;
  /** People who tapped "I see it" in the current + previous hour. */
  spotters: number;
  /** Data-quality issues found in the inputs (empty = passed all checks). */
  qa: string[];
}

const KNOWN_WMO = new Set([
  0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99,
]);
const STALE_MINUTES = 90;

/** Input validation: range, completeness, freshness and consistency checks. */
export function validateSignals(w: WeatherData, at: Date): string[] {
  const issues: string[] = [];
  for (const m of w.missing ?? []) issues.push(`missing:${m}`);

  const inRange = (name: string, v: number | undefined, lo: number, hi: number) => {
    if (v === undefined || v === null) return;
    if (!Number.isFinite(v) || v < lo || v > hi) issues.push(`range:${name}=${v}`);
  };
  inRange("cloud_low", w.currentCloudLow, 0, 100);
  inRange("cloud_mid", w.currentCloudMid, 0, 100);
  inRange("cloud_high", w.currentCloudHigh, 0, 100);
  inRange("humidity", w.humidity, 0, 100);
  inRange("visibility_m", w.visibility, 0, 200_000);
  inRange("temp_c", w.temperature, -40, 50);
  inRange("wind_kmh", w.windSpeed, 0, 250);
  inRange("pm25", w.pm25, 0, 1000);
  if (!KNOWN_WMO.has(w.weatherCode)) issues.push(`range:weather_code=${w.weatherCode}`);

  const ageMin = Math.round((at.getTime() - new Date(w.observedAt).getTime()) / 60_000);
  if (Number.isFinite(ageMin) && ageMin > STALE_MINUTES) issues.push(`stale:${ageMin}m`);

  // Consistency: fog code with long visibility (or the reverse) suggests the
  // provider's fields disagree with each other.
  const isFogCode = w.weatherCode >= WMO.FOG_MIN && w.weatherCode <= WMO.FOG_MAX;
  if (isFogCode && w.visibility > 10_000) issues.push("inconsistent:fog_code_but_visibility>10km");
  if (!isFogCode && w.visibility < 1_000 && w.weatherCode < WMO.DRIZZLE_MIN) {
    issues.push("inconsistent:visibility<1km_without_fog_or_precip");
  }

  // Cross-check: today's sunrise must come before sunset.
  if (w.sunrise && w.sunset && new Date(w.sunrise) >= new Date(w.sunset)) issues.push("inconsistent:sunrise_after_sunset");
  return issues;
}

function forecastAt(w: WeatherData, at: Date, hoursAhead: number): number | null {
  const target = new Date(at.getTime() + hoursAhead * 3_600_000);
  const { day, slot } = ptParts(target);
  const prefix = `${day}T${slot.slice(0, 2)}`;
  const hour = w.hourlyAll?.find((h) => h.time.startsWith(prefix));
  return hour ? scoreHourForTimeline(hour).score : null;
}

export async function buildSignals(w: WeatherData, vis: VisibilityResult, at: Date): Promise<Signals> {
  const b = scoreBreakdown({
    cloudLow: w.currentCloudLow,
    cloudMid: w.currentCloudMid,
    cloudHigh: w.currentCloudHigh,
    visibilityM: w.visibility,
    weatherCode: w.weatherCode,
    pm25: w.pm25,
  });
  return {
    v: SIGNALS_VERSION,
    model: MODEL_VERSION,
    observedAt: w.observedAt,
    cloudLow: w.currentCloudLow,
    cloudMid: w.currentCloudMid,
    cloudHigh: w.currentCloudHigh,
    visibilityM: w.visibility,
    pm25: w.pm25 ?? null,
    pm10: w.pm10 ?? null,
    humidity: w.humidity,
    tempC: w.temperature,
    windKmh: w.windSpeed,
    weatherCode: w.weatherCode,
    isDay: w.isDay,
    points: { low: b.lowClouds, mid: b.midClouds, high: b.highClouds, vis: b.visibility, aq: b.airQuality, penalty: b.weatherPenalty, ceiling: b.ceiling, cappedBy: b.cappedBy },
    flags: vis.flags,
    confidence: vis.confidence,
    forecast: { h1: forecastAt(w, at, 1), h3: forecastAt(w, at, 3), h6: forecastAt(w, at, 6) },
    sunrise: w.sunrise,
    sunset: w.sunset,
    spotters: await getSpotterCount().catch(() => 0),
    qa: validateSignals(w, at),
  };
}

/** Log a live reading with its full signal snapshot. Never throws. */
export async function recordReading(w: WeatherData, vis: VisibilityResult, at: Date = new Date()): Promise<void> {
  await recordObservation({
    score: vis.score,
    isDay: w.isDay,
    isFallback: w.isFallback,
    at,
    buildSignals: () => buildSignals(w, vis, at),
  });
}
