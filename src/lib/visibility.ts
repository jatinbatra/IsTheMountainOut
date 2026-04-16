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

// ── Neighborhood Scoring ────────────────────────────────────────────
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

function scoreRawWeather(
  cloudLow: number,
  cloudMid: number,
  cloudHigh: number,
  visibilityM: number,
  weatherCode: number,
  pm25?: number
): { score: number; flags: VisibilityFlag[] } {
  const flags: VisibilityFlag[] = [];
  let score = 0;

  // Low clouds (0-2km)
  score += WEIGHTS.LOW_CLOUDS * (1 - cloudLow / 100);
  if (cloudLow <= 20) flags.push("clear_low_clouds");
  else if (cloudLow <= 50) flags.push("partial_low_clouds");
  else flags.push("heavy_low_clouds");

  // Mid clouds (2-6km)
  score += WEIGHTS.MID_CLOUDS * (1 - cloudMid / 100);
  if (cloudMid > 60) flags.push("heavy_mid_clouds");

  // High clouds (6km+)
  score += WEIGHTS.HIGH_CLOUDS * (1 - cloudHigh / 100);
  if (cloudHigh > 80) flags.push("heavy_high_clouds");

  // Visibility distance
  const visMiles = visibilityM / 1609.34;
  const visNorm = Math.min(visibilityM / TARGET_VISIBILITY_M, 1);
  score += WEIGHTS.VISIBILITY * visNorm;
  if (visMiles < 20) flags.push("low_visibility");
  else if (visMiles >= 40) flags.push("excellent_visibility");

  // Air quality
  if (pm25 !== undefined) {
    score += WEIGHTS.AIR_QUALITY * Math.max(0, 1 - pm25 / PM25_FULL_PENALTY);
    if (pm25 > 35) flags.push("poor_air_quality");
    else if (pm25 <= 12) flags.push("clean_air");
  } else {
    score += DEFAULT_AQ_SCORE;
  }

  // Weather code penalty
  const penalty = getWeatherPenalty(weatherCode);
  if (penalty > 0) {
    score -= penalty;
    if (weatherCode >= WMO.FOG_MIN && weatherCode <= WMO.FOG_MAX) flags.push("fog");
    else if (weatherCode >= WMO.DRIZZLE_MIN && weatherCode <= WMO.RAIN_MAX) flags.push("rain");
    else if (weatherCode >= WMO.SNOW_MIN && weatherCode <= WMO.SNOW_MAX) flags.push("snow");
    else if (weatherCode >= WMO.SHOWERS_MIN) flags.push("showers");
  }

  return { score: clampScore(score), flags };
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
  const isVisible = score >= 50;

  const { durationHours, nextChangeHour } = estimateDuration(
    weather.hourlyForecast,
    isVisible
  );
  const durationMessage = buildDurationMessage(isVisible, durationHours, nextChangeHour);

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
  return { score, isVisible: score >= 50 };
}

export function scoreDailyForecast(d: DailyForecast): { score: number; isVisible: boolean } {
  const score = scoreRawWeather(
    d.cloudLow, d.cloudMid, d.cloudHigh,
    d.visibility, d.weatherCode
  ).score;
  return { score, isVisible: score >= 50 };
}

// ── Duration Estimation ─────────────────────────────────────────────
function estimateDuration(
  forecast: HourlyForecast[],
  currentlyVisible: boolean
): { durationHours: number; nextChangeHour: string | null } {
  const now = new Date();
  const currentHourIndex = now.getHours();
  const futureHours = forecast.slice(currentHourIndex);
  let consecutiveHours = 0;
  let nextChangeHour: string | null = null;

  for (const hour of futureHours) {
    const hourVisible = scoreHour(hour) >= 50;
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
  nextChangeHour: string | null
): string {
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
