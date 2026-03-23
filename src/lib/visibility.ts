import { WeatherData, HourlyForecast } from "./weather";

export interface VisibilityResult {
  isVisible: boolean;
  score: number; // 0-100
  confidence: string;
  reasons: string[];
  durationHours: number;
  durationMessage: string;
  nextChangeHour: string | null;
}

/**
 * Heuristic visibility scoring algorithm.
 *
 * Mt. Rainier is ~90 km (56 miles) from Seattle.  For it to be visible
 * we need: low cloud cover (especially low-level clouds which block the
 * view), good atmospheric visibility, and decent air quality.
 *
 * Scoring weights:
 *   - Low clouds:  40 points (most important — these block the mountain)
 *   - Mid clouds:  20 points (partially obscure, especially when thick)
 *   - Visibility:  20 points (haze, fog, mist)
 *   - Air quality: 10 points (PM2.5 / PM10 haze)
 *   - High clouds: 10 points (thin cirrus rarely blocks but dense layers can)
 */
export function calculateVisibility(weather: WeatherData): VisibilityResult {
  const reasons: string[] = [];
  let score = 0;

  // --- Low clouds (0-2km) — weight: 40 ---
  const lowScore = Math.round(40 * (1 - weather.currentCloudLow / 100));
  score += lowScore;
  if (weather.currentCloudLow <= 20) {
    reasons.push("Clear skies at low altitudes — great for mountain views");
  } else if (weather.currentCloudLow <= 50) {
    reasons.push("Some low clouds may partially obscure the base");
  } else {
    reasons.push("Heavy low cloud cover is blocking the view");
  }

  // --- Mid clouds (2-6km) — weight: 20 ---
  const midScore = Math.round(20 * (1 - weather.currentCloudMid / 100));
  score += midScore;
  if (weather.currentCloudMid > 60) {
    reasons.push("Mid-level clouds are reducing visibility of the peak");
  }

  // --- High clouds (6km+) — weight: 10 ---
  const highScore = Math.round(10 * (1 - weather.currentCloudHigh / 100));
  score += highScore;
  if (weather.currentCloudHigh > 80) {
    reasons.push("High cirrus clouds creating a hazy sky");
  }

  // --- Visibility distance — weight: 20 ---
  // Mt Rainier is ~90km away. We need at least ~50km visibility ideally.
  const visMiles = weather.visibility / 1609.34;
  const visNorm = Math.min(weather.visibility / 90000, 1); // normalize to 90km
  const visScore = Math.round(20 * visNorm);
  score += visScore;
  if (visMiles < 20) {
    reasons.push(`Visibility only ${visMiles.toFixed(0)} miles — fog or haze likely`);
  } else if (visMiles >= 40) {
    reasons.push(`Excellent visibility at ${visMiles.toFixed(0)}+ miles`);
  }

  // --- Air quality — weight: 10 ---
  if (weather.pm25 !== undefined) {
    // WHO guideline: PM2.5 < 15 µg/m³ is good
    const aqNorm = Math.max(0, 1 - weather.pm25 / 50);
    const aqScore = Math.round(10 * aqNorm);
    score += aqScore;
    if (weather.pm25 > 35) {
      reasons.push("Poor air quality is creating haze");
    } else if (weather.pm25 <= 12) {
      reasons.push("Clean air — minimal haze");
    }
  } else {
    // No AQ data — assume moderate
    score += 5;
  }

  // --- Weather code penalties ---
  // Codes: 0 clear, 1-3 partly cloudy, 45/48 fog, 51-67 drizzle/rain,
  // 71-77 snow, 80-82 showers, 85-86 snow showers, 95-99 thunderstorms
  if (weather.weatherCode >= 45 && weather.weatherCode <= 48) {
    score = Math.max(0, score - 25);
    reasons.push("Fog detected — mountain is not visible");
  } else if (weather.weatherCode >= 51 && weather.weatherCode <= 67) {
    score = Math.max(0, score - 15);
    reasons.push("Rain/drizzle reducing visibility");
  } else if (weather.weatherCode >= 71 && weather.weatherCode <= 77) {
    score = Math.max(0, score - 15);
    reasons.push("Snowfall reducing visibility");
  } else if (weather.weatherCode >= 80) {
    score = Math.max(0, score - 20);
    reasons.push("Showers/storms — mountain is obscured");
  }

  score = Math.max(0, Math.min(100, score));

  const isVisible = score >= 50;

  // --- Duration estimation ---
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
    reasons,
    durationHours,
    durationMessage,
    nextChangeHour,
  };
}

function scoreHour(h: HourlyForecast): number {
  let s = 0;
  s += 40 * (1 - h.cloudLow / 100);
  s += 20 * (1 - h.cloudMid / 100);
  s += 10 * (1 - h.cloudHigh / 100);
  s += 20 * Math.min(h.visibility / 90000, 1);
  s += 5; // assume moderate AQ for hourly
  if (h.weatherCode >= 45 && h.weatherCode <= 48) s -= 25;
  else if (h.weatherCode >= 51 && h.weatherCode <= 67) s -= 15;
  else if (h.weatherCode >= 71 && h.weatherCode <= 77) s -= 15;
  else if (h.weatherCode >= 80) s -= 20;
  return Math.max(0, Math.min(100, Math.round(s)));
}

function estimateDuration(
  forecast: HourlyForecast[],
  currentlyVisible: boolean
): { durationHours: number; nextChangeHour: string | null } {
  const now = new Date();
  const currentHourIndex = now.getHours();

  // Look ahead from current hour
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

function buildDurationMessage(
  isVisible: boolean,
  durationHours: number,
  nextChangeHour: string | null
): string {
  if (isVisible) {
    if (durationHours >= 8) {
      return "The mountain is out! Clear conditions expected for the rest of the day.";
    }
    if (nextChangeHour) {
      const changeTime = new Date(nextChangeHour);
      const timeStr = changeTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Los_Angeles",
      });
      return `The mountain is out! Clear skies expected for the next ${durationHours} hour${durationHours !== 1 ? "s" : ""} before clouds move in around ${timeStr}.`;
    }
    return `The mountain is out! Expect clear views for the next ${durationHours}+ hours.`;
  } else {
    if (nextChangeHour) {
      const changeTime = new Date(nextChangeHour);
      const timeStr = changeTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Los_Angeles",
      });
      return `The mountain is hiding. Conditions may improve around ${timeStr}.`;
    }
    return "The mountain is hiding behind clouds. No clearing expected today.";
  }
}
