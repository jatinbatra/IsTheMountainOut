import { ptHour } from "@/lib/time";
import { WeatherData, HourlyForecast, DailyForecast } from "./weather";

// ── WMO Weather Code Constants ──────────────────────────────────────
// https://open-meteo.com/en/docs#weathervariables (WMO Code Table 4677)
export const WMO = {
  CLEAR: 0,
  MAINLY_CLEAR: 1,
  PARTLY_CLOUDY: 2,
  OVERCAST: 3,
  FOG_MIN: 45,
  FOG_MAX: 48,
  DRIZZLE_MIN: 51,
  RAIN_MAX: 67,
  SNOW_MIN: 71,
  SNOW_MAX: 77,
  SHOWERS_MIN: 80,
  // 80-82 rain showers, 85-86 snow showers, 95-99 thunderstorms
} as const;

// ── Scoring Weights ─────────────────────────────────────────────────
export const WEIGHTS = {
  LOW_CLOUDS: 40,    // most critical — directly block view of mountain
  MID_CLOUDS: 20,    // partially obscure, especially when thick
  HIGH_CLOUDS: 10,   // thin cirrus rarely blocks but dense layers can
  VISIBILITY: 20,    // haze, fog, mist
  AIR_QUALITY: 10,   // PM2.5 / PM10 haze
} as const;

export const VISIBLE_THRESHOLD = 50;

export type VisibilityStatus = "hiding" | "peeking" | "out";

export function getVisibilityStatus(score: number): VisibilityStatus {
  if (score >= 76) return "out";
  if (score >= 41) return "peeking";
  return "hiding";
}

// Mt. Rainier is ~90km from Seattle — target visibility distance
const TARGET_VISIBILITY_M = 90_000;
// PM2.5 threshold for full penalty
const PM25_FULL_PENALTY = 50;
// Default AQ score when no data available
const DEFAULT_AQ_SCORE = 5;

// ── Weather Code Penalties ──────────────────────────────────────────
const WEATHER_PENALTIES: { min: number; max: number; penalty: number }[] = [
  { min: WMO.FOG_MIN, max: WMO.FOG_MAX, penalty: 25 },
  { min: WMO.DRIZZLE_MIN, max: WMO.RAIN_MAX, penalty: 15 },
  { min: WMO.SNOW_MIN, max: WMO.SNOW_MAX, penalty: 15 },
  { min: WMO.SHOWERS_MIN, max: 99, penalty: 20 },
];

function getWeatherPenalty(code: number): number {
  for (const { min, max, penalty } of WEATHER_PENALTIES) {
    if (code >= min && code <= max) return penalty;
  }
  return 0;
}

// ── Visibility Condition Flags ──────────────────────────────────────
// Pure data flags — no UI strings in business logic
export type VisibilityFlag =
  | "clear_low_clouds"
  | "partial_low_clouds"
  | "heavy_low_clouds"
  | "heavy_mid_clouds"
  | "heavy_high_clouds"
  | "low_visibility"
  | "excellent_visibility"
  | "poor_air_quality"
  | "clean_air"
  | "fog"
  | "rain"
  | "snow"
  | "showers";

// Map flags → user-facing strings (view layer concern, but co-located for convenience)
export const FLAG_LABELS: Record<VisibilityFlag, string> = {
  clear_low_clouds: "Clear skies at low altitudes, great for mountain views",
  partial_low_clouds: "Some low clouds may partially obscure the base",
  heavy_low_clouds: "Heavy low cloud cover is blocking the view",
  heavy_mid_clouds: "Mid-level clouds are reducing visibility of the peak",
  heavy_high_clouds: "High cirrus clouds creating a hazy sky",
  low_visibility: "Low visibility due to fog or haze",
  excellent_visibility: "Excellent visibility for mountain views",
  poor_air_quality: "Poor air quality is creating haze",
  clean_air: "Clean air with minimal haze",
  fog: "Fog detected, mountain is not visible",
  rain: "Rain/drizzle reducing visibility",
  snow: "Snowfall reducing visibility",
  showers: "Showers or storms, mountain is obscured",
};

export interface VisibilityResult {
  isVisible: boolean;
  score: number; // 0-100
  confidence: string;
  flags: VisibilityFlag[];
  reasons: string[]; // human-readable, derived from flags
  durationHours: number;
  durationMessage: string;
  nextChangeHour: string | null;
}

// ── Neighborhood Labels & Scoring ───────────────────────────────────
export const NEIGHBORHOOD_LABELS: Record<string, string> = {
  "capitol-hill": "Capitol Hill",
  "queen-anne": "Queen Anne",
  "ballard": "Ballard",
  "fremont": "Fremont",
  "downtown": "Downtown",
  "beacon-hill": "Beacon Hill",
  "west-seattle": "West Seattle",
  "columbia-city": "Columbia City",
  "greenwood": "Greenwood",
  "u-district": "U-District",
  "bellevue": "Bellevue",
  "kirkland": "Kirkland",
  "tacoma": "Tacoma",
  "renton": "Renton",
};

interface NeighborhoodModifiers {
  elevationBonus: number;
  fogPenalty: number;
  obstructionPenalty: number;
}

const NEIGHBORHOOD_MODIFIERS: Record<string, NeighborhoodModifiers> = {
  "capitol-hill": { elevationBonus: 3, fogPenalty: -5, obstructionPenalty: -8 },
  "queen-anne": { elevationBonus: 8, fogPenalty: -2, obstructionPenalty: -3 },
  "ballard": { elevationBonus: 0, fogPenalty: -8, obstructionPenalty: -5 },
  "fremont": { elevationBonus: 1, fogPenalty: -6, obstructionPenalty: -6 },
  "downtown": { elevationBonus: 2, fogPenalty: -4, obstructionPenalty: -10 },
  "beacon-hill": { elevationBonus: 6, fogPenalty: -3, obstructionPenalty: -2 },
  "west-seattle": { elevationBonus: 5, fogPenalty: -4, obstructionPenalty: -1 },
  "columbia-city": { elevationBonus: 4, fogPenalty: -5, obstructionPenalty: -4 },
  "greenwood": { elevationBonus: 2, fogPenalty: -7, obstructionPenalty: -5 },
  "u-district": { elevationBonus: 1, fogPenalty: -6, obstructionPenalty: -7 },
  "bellevue": { elevationBonus: 4, fogPenalty: -3, obstructionPenalty: -5 },
  "kirkland": { elevationBonus: 2, fogPenalty: -5, obstructionPenalty: -6 },
  "tacoma": { elevationBonus: 1, fogPenalty: -4, obstructionPenalty: 0 },
  "renton": { elevationBonus: 3, fogPenalty: -5, obstructionPenalty: -3 },
};

export function getNeighborhoodAdjustedScore(
  baseScore: number,
  neighborhood: string,
  humidity: number
): number {
  const mod = NEIGHBORHOOD_MODIFIERS[neighborhood];
  if (!mod) return baseScore;

  let adjusted = baseScore + mod.elevationBonus + mod.obstructionPenalty;
  if (humidity > 85) {
    adjusted += mod.fogPenalty;
  }
  return Math.max(0, Math.min(100, Math.round(adjusted)));
}

export function getAllNeighborhoodScores(
  baseScore: number,
  humidity: number
): { id: string; score: number }[] {
  return Object.keys(NEIGHBORHOOD_MODIFIERS)
    .map((id) => ({ id, score: getNeighborhoodAdjustedScore(baseScore, id, humidity) }))
    .sort((a, b) => b.score - a.score);
}

// ── Core Scoring ────────────────────────────────────────────────────
function clampScore(s: number): number {
  return Math.max(0, Math.min(100, Math.round(s)));
}

export interface ScoreBreakdown {
  /** Points earned per factor; maxima are WEIGHTS.* (40/20/10/20/10). */
  lowClouds: number;
  midClouds: number;
  highClouds: number;
  visibility: number;
  airQuality: number;
  /** Points subtracted for fog / rain / snow / showers (0 if none). */
  weatherPenalty: number;
  /** Highest score possible given the cloud deck (see CLOUD_CEILING). */
  ceiling: number;
  /** Which cloud layer limited the score, if the ceiling applied. */
  cappedBy: "low_clouds" | "mid_clouds" | null;
  /** Final 0-100 score: min(sum − penalty, ceiling). */
  total: number;
}

/**
 * Cloud ceilings. Points alone let a sky that is 100% overcast at low level
 * still score 60 ("out") on the strength of clear upper air and good air
 * quality — but a solid low deck hides the mountain no matter what's above
 * it. So thick cloud *caps* the score instead of only costing points:
 *   low clouds  (<2 km, between Seattle and the mountain): 100 − 0.9 × cover
 *   mid clouds  (2–6 km, Rainier's summit is 4.4 km):      100 − 0.6 × cover
 * Clear/partly-cloudy days (≤ ~25% low cloud) are unaffected.
 */
const CLOUD_CEILING = { LOW: 0.9, MID: 0.6 } as const;

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Exact per-factor contributions of the base visibility score. This is the
 * single source of truth: scoreRawWeather() sums these, and the UI / telemetry
 * show them, so what's displayed always matches what's scored.
 */
export function scoreBreakdown(input: {
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  visibilityM: number;
  weatherCode: number;
  pm25?: number;
}): ScoreBreakdown {
  const lowClouds = WEIGHTS.LOW_CLOUDS * (1 - input.cloudLow / 100);
  const midClouds = WEIGHTS.MID_CLOUDS * (1 - input.cloudMid / 100);
  const highClouds = WEIGHTS.HIGH_CLOUDS * (1 - input.cloudHigh / 100);
  const visibility = WEIGHTS.VISIBILITY * Math.min(input.visibilityM / TARGET_VISIBILITY_M, 1);
  const airQuality =
    input.pm25 !== undefined
      ? WEIGHTS.AIR_QUALITY * Math.max(0, 1 - input.pm25 / PM25_FULL_PENALTY)
      : DEFAULT_AQ_SCORE;
  const weatherPenalty = getWeatherPenalty(input.weatherCode);
  const raw = clampScore(lowClouds + midClouds + highClouds + visibility + airQuality - weatherPenalty);
  const lowCap = clampScore(100 - CLOUD_CEILING.LOW * input.cloudLow);
  const midCap = clampScore(100 - CLOUD_CEILING.MID * input.cloudMid);
  const ceiling = Math.min(lowCap, midCap);
  return {
    lowClouds: round1(lowClouds),
    midClouds: round1(midClouds),
    highClouds: round1(highClouds),
    visibility: round1(visibility),
    airQuality: round1(airQuality),
    weatherPenalty,
    ceiling,
    cappedBy: raw > ceiling ? (lowCap <= midCap ? "low_clouds" : "mid_clouds") : null,
    total: Math.min(raw, ceiling),
  };
}

function scoreRawWeather(
  cloudLow: number,
  cloudMid: number,
  cloudHigh: number,
  visibilityM: number,
  weatherCode: number,
  pm25?: number
): { score: number; flags: VisibilityFlag[] } {
  const flags: VisibilityFlag[] = [];

  if (cloudLow <= 20) flags.push("clear_low_clouds");
  else if (cloudLow <= 50) flags.push("partial_low_clouds");
  else flags.push("heavy_low_clouds");
  if (cloudMid > 60) flags.push("heavy_mid_clouds");
  if (cloudHigh > 80) flags.push("heavy_high_clouds");

  const visMiles = visibilityM / 1609.34;
  if (visMiles < 20) flags.push("low_visibility");
  else if (visMiles >= 40) flags.push("excellent_visibility");

  if (pm25 !== undefined) {
    if (pm25 > 35) flags.push("poor_air_quality");
    else if (pm25 <= 12) flags.push("clean_air");
  }

  if (getWeatherPenalty(weatherCode) > 0) {
    if (weatherCode >= WMO.FOG_MIN && weatherCode <= WMO.FOG_MAX) flags.push("fog");
    else if (weatherCode >= WMO.DRIZZLE_MIN && weatherCode <= WMO.RAIN_MAX) flags.push("rain");
    else if (weatherCode >= WMO.SNOW_MIN && weatherCode <= WMO.SNOW_MAX) flags.push("snow");
    else if (weatherCode >= WMO.SHOWERS_MIN) flags.push("showers");
  }

  const { total } = scoreBreakdown({ cloudLow, cloudMid, cloudHigh, visibilityM, weatherCode, pm25 });
  return { score: total, flags };
}

export function calculateVisibility(weather: WeatherData): VisibilityResult {
  const { score, flags } = scoreRawWeather(
    weather.currentCloudLow,
    weather.currentCloudMid,
    weather.currentCloudHigh,
    weather.visibility,
    weather.weatherCode,
    weather.pm25
  );

  const reasons = flags.map((f) => FLAG_LABELS[f]);
  const isNight = !weather.isDay;
  const isVisible = isNight ? false : score >= VISIBLE_THRESHOLD;

  const { durationHours, nextChangeHour } = estimateDuration(
    weather.hourlyForecast,
    isVisible
  );
  const durationMessage = buildDurationMessage(isVisible, durationHours, nextChangeHour, isNight);

  const confidence =
    score >= 80 ? "high" : score >= 60 ? "moderate" : score >= 40 ? "low" : "very low";

  return {
    isVisible,
    score,
    confidence,
    flags,
    reasons,
    durationHours,
    durationMessage,
    nextChangeHour,
  };
}

/**
 * Calculate visibility considering both the observer's location and the mountain's location.
 * This is the "Line of Sight" accuracy improvement.
 */
export function calculateLineOfSightVisibility(
  localWeather: WeatherData,
  mountainWeather: WeatherData
): VisibilityResult {
  // Use the worst cloud cover from either location
  const combinedCloudLow = Math.max(localWeather.currentCloudLow, mountainWeather.currentCloudLow);
  const combinedCloudMid = Math.max(localWeather.currentCloudMid, mountainWeather.currentCloudMid);
  const combinedCloudHigh = Math.max(localWeather.currentCloudHigh, mountainWeather.currentCloudHigh);
  
  // Use the worst visibility and PM2.5
  const combinedVisibility = Math.min(localWeather.visibility, mountainWeather.visibility);
  const combinedPm25 = (localWeather.pm25 !== undefined && mountainWeather.pm25 !== undefined)
    ? Math.max(localWeather.pm25, mountainWeather.pm25)
    : (localWeather.pm25 ?? mountainWeather.pm25);

  // Use the "worst" weather code (higher generally means worse conditions in WMO)
  const combinedWeatherCode = Math.max(localWeather.weatherCode, mountainWeather.weatherCode);

  const { score, flags } = scoreRawWeather(
    combinedCloudLow,
    combinedCloudMid,
    combinedCloudHigh,
    combinedVisibility,
    combinedWeatherCode,
    combinedPm25
  );

  const reasons = flags.map((f) => FLAG_LABELS[f]);
  const isNight = !localWeather.isDay;
  const isVisible = isNight ? false : score >= VISIBLE_THRESHOLD;

  // For duration, we'll stick to the local forecast for simplicity,
  // as predicting combined line-of-sight for 24h is expensive API-wise.
  const { durationHours, nextChangeHour } = estimateDuration(
    localWeather.hourlyForecast,
    isVisible
  );
  const durationMessage = buildDurationMessage(isVisible, durationHours, nextChangeHour, isNight);

  const confidence =
    score >= 80 ? "high" : score >= 60 ? "moderate" : score >= 40 ? "low" : "very low";

  return {
    isVisible,
    score,
    confidence,
    flags,
    reasons,
    durationHours,
    durationMessage,
    nextChangeHour,
  };
}

// ── Hourly / Daily Scoring (reuses core logic) ─────────────────────
function scoreHour(h: HourlyForecast): number {
  return scoreRawWeather(
    h.cloudLow, h.cloudMid, h.cloudHigh,
    h.visibility, h.weatherCode
  ).score;
}

export function scoreHourForTimeline(h: HourlyForecast): { score: number; isVisible: boolean } {
  const score = scoreHour(h);
  return { score, isVisible: score >= VISIBLE_THRESHOLD };
}

export function scoreDailyForecast(d: DailyForecast): { score: number; isVisible: boolean } {
  const score = scoreRawWeather(
    d.cloudLow, d.cloudMid, d.cloudHigh,
    d.visibility, d.weatherCode
  ).score;
  return { score, isVisible: score >= VISIBLE_THRESHOLD };
}

// ── Duration Estimation ─────────────────────────────────────────────
function estimateDuration(
  forecast: HourlyForecast[],
  currentlyVisible: boolean
): { durationHours: number; nextChangeHour: string | null } {
  const currentHourIndex = ptHour(); // hourly series starts at Seattle midnight
  const futureHours = forecast.slice(currentHourIndex);
  let consecutiveHours = 0;
  let nextChangeHour: string | null = null;

  for (const hour of futureHours) {
    const hourVisible = scoreHour(hour) >= VISIBLE_THRESHOLD;
    if (hourVisible === currentlyVisible) {
      consecutiveHours++;
    } else {
      nextChangeHour = hour.time;
      break;
    }
  }

  return { durationHours: consecutiveHours, nextChangeHour };
}

export function buildDurationMessage(
  isVisible: boolean,
  durationHours: number,
  nextChangeHour: string | null,
  isNight?: boolean
): string {
  if (isNight) {
    if (isVisible) {
      return "Clear skies tonight — conditions look good for sunrise views.";
    }
    return "The mountain is hiding. Check back in the morning.";
  }
  if (isVisible) {
    if (durationHours >= 8) {
      return "The mountain is out! Clear conditions expected for the rest of the day.";
    }
    if (nextChangeHour) {
      const timeStr = new Date(nextChangeHour).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Los_Angeles",
      });
      return `The mountain is out! Clear skies expected for the next ${durationHours} hour${durationHours !== 1 ? "s" : ""} before clouds move in around ${timeStr}.`;
    }
    return `The mountain is out! Expect clear views for the next ${durationHours}+ hours.`;
  } else {
    if (nextChangeHour) {
      const timeStr = new Date(nextChangeHour).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Los_Angeles",
      });
      return `The mountain is hiding. Conditions may improve around ${timeStr}.`;
    }
    return "The mountain is hiding behind clouds. No clearing expected today.";
  }
}
