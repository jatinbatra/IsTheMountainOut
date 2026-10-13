// Weather data fetching from Open-Meteo (free, no API key required)
// Coordinates: Seattle (47.6062, -122.3321) and Mount Rainier (46.8523, -121.7603)
// We sample a midpoint between them for representative cloud/visibility data.
//
// All timestamps returned here carry an explicit UTC offset
// ("2026-10-13T18:22-07:00") so they parse correctly on any machine — Open-Meteo
// itself returns offset-less local times, which `new Date()` would misread on
// UTC servers by 7-8 hours.

import { formatOffset, ptDate, ptHour, ptOffset, withOffset } from "@/lib/time";

export interface WeatherData {
  currentCloudLow: number;     // 0-100%
  currentCloudMid: number;     // 0-100%
  currentCloudHigh: number;    // 0-100%
  visibility: number;          // meters
  temperature: number;         // °C
  humidity: number;            // %
  windSpeed: number;           // km/h
  weatherCode: number;         // WMO weather code
  isDay: boolean;
  /** Today's hours, local midnight → 23:00 (index = Seattle hour). */
  hourlyForecast: HourlyForecast[];
  /** Every forecast hour (7 days). Server-side use; not sent to the client. */
  hourlyAll: HourlyForecast[];
  dailyForecast: DailyForecast[];
  sunrise: string;             // today
  sunset: string;              // today
  sunriseNext: string;         // tomorrow
  sunsetNext: string;          // tomorrow
  pm25?: number;               // µg/m³ air quality
  pm10?: number;
  /** When the provider says the "current" values were measured/modelled. */
  observedAt: string;
  /** Fields the provider did not return, so a default was substituted. */
  missing: string[];
  /** True when the live APIs failed and these numbers are a local estimate. */
  isFallback?: boolean;
}

export interface HourlyForecast {
  time: string;
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  visibility: number;
  weatherCode: number;
  temperature: number;
  humidity: number;
}

export interface DailyForecast {
  date: string;           // YYYY-MM-DD
  dayLabel: string;       // "Mon", "Tue", etc.
  cloudLow: number;       // avg 0-100
  cloudMid: number;
  cloudHigh: number;
  visibility: number;     // avg meters
  weatherCode: number;    // worst (max) code for the day
  tempHigh: number;
  tempLow: number;
  humidity: number;       // avg
}

// Midpoint between Seattle and Mt Rainier for representative atmospheric conditions
const MIDPOINT_LAT = 47.23;
const MIDPOINT_LON = -122.05;

// Seattle coordinates for air quality
const SEATTLE_LAT = 47.6062;
const SEATTLE_LON = -122.3321;

const DEFAULT_VISIBILITY_M = 50000;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayLabelFor(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Small deterministic PRNG (mulberry32) so fallback data is stable per hour. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate realistic mock data for development/demo when APIs are unreachable.
 * Deterministic within an hour so server and client renders agree.
 */
function getMockWeatherData(): WeatherData {
  const now = new Date();
  const hour = ptHour(now);
  const isDay = hour >= 7 && hour < 19;
  const today = ptDate(now);
  const off = ptOffset(now);
  const random = seededRandom(Number(today.replace(/-/g, "")) * 24 + hour);

  const hourlyAll: HourlyForecast[] = Array.from({ length: 24 * 7 }, (_, i) => {
    const h = i % 24;
    const day = addDays(today, Math.floor(i / 24));
    // Simulate a clear morning that gets cloudy in the afternoon
    const cloudBase = h < 10 ? 10 : h < 14 ? 20 : h < 18 ? 55 : 40;
    return {
      time: `${day}T${String(h).padStart(2, "0")}:00${off}`,
      cloudLow: Math.min(100, cloudBase + Math.round(random() * 15)),
      cloudMid: Math.min(100, Math.round(cloudBase * 0.7 + random() * 10)),
      cloudHigh: Math.min(100, Math.round(cloudBase * 0.4 + random() * 10)),
      visibility: cloudBase < 30 ? 60000 + Math.round(random() * 20000) : 30000 + Math.round(random() * 20000),
      weatherCode: cloudBase > 50 ? 3 : cloudBase > 30 ? 2 : 0,
      temperature: 8 + Math.round(Math.sin(((h - 6) * Math.PI) / 12) * 6),
      humidity: 65 - Math.round(Math.sin(((h - 6) * Math.PI) / 12) * 15),
    };
  });
  const hourlyForecast = hourlyAll.slice(0, 24);

  const patterns = [15, 65, 80, 30, 10, 45, 25]; // cloud cover pattern
  const dailyForecast: DailyForecast[] = patterns.map((p, i) => {
    const date = addDays(today, i);
    const cl = Math.max(0, Math.min(100, p + Math.round(random() * 10 - 5)));
    return {
      date,
      dayLabel: dayLabelFor(date),
      cloudLow: cl,
      cloudMid: Math.round(cl * 0.6),
      cloudHigh: Math.round(cl * 0.3),
      visibility: cl < 40 ? 60000 + Math.round(random() * 20000) : 25000 + Math.round(random() * 15000),
      weatherCode: cl > 60 ? 3 : cl > 40 ? 2 : 0,
      tempHigh: 12 + Math.round(random() * 6),
      tempLow: 5 + Math.round(random() * 4),
      humidity: 50 + Math.round(cl * 0.3),
    };
  });

  const cur = hourlyForecast[hour];
  const tomorrow = addDays(today, 1);
  return {
    currentCloudLow: cur.cloudLow,
    currentCloudMid: cur.cloudMid,
    currentCloudHigh: cur.cloudHigh,
    visibility: cur.visibility,
    temperature: cur.temperature,
    humidity: cur.humidity,
    windSpeed: 12,
    weatherCode: cur.weatherCode,
    isDay,
    hourlyForecast,
    hourlyAll,
    dailyForecast,
    sunrise: `${today}T07:00${off}`,
    sunset: `${today}T19:00${off}`,
    sunriseNext: `${tomorrow}T07:01${off}`,
    sunsetNext: `${tomorrow}T18:58${off}`,
    pm25: 8.2,
    pm10: 15.5,
    observedAt: now.toISOString(),
    missing: [],
    isFallback: true,
  };
}

export async function fetchWeatherData(options?: {
  lat?: number;
  lon?: number;
  noCache?: boolean;
}): Promise<WeatherData> {
  const targetLat = options?.lat ?? MIDPOINT_LAT;
  const targetLon = options?.lon ?? MIDPOINT_LON;

  // Fetch weather data from Open-Meteo (midpoint or specific location)
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", targetLat.toString());
  weatherUrl.searchParams.set("longitude", targetLon.toString());
  weatherUrl.searchParams.set(
    "current",
    "cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day"
  );
  weatherUrl.searchParams.set(
    "hourly",
    "cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,weather_code,temperature_2m,relative_humidity_2m"
  );
  weatherUrl.searchParams.set("daily", "sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min");
  weatherUrl.searchParams.set("timezone", "America/Los_Angeles");
  weatherUrl.searchParams.set("forecast_days", "7");

  // Fetch air quality from Open-Meteo Air Quality API
  const aqUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  aqUrl.searchParams.set("latitude", SEATTLE_LAT.toString());
  aqUrl.searchParams.set("longitude", SEATTLE_LON.toString());
  aqUrl.searchParams.set("current", "pm2_5,pm10");
  aqUrl.searchParams.set("timezone", "America/Los_Angeles");

  let weatherRes: Response;
  let aqRes: Response;

  const fetchOpts = options?.noCache
    ? { cache: "no-store" as RequestCache }
    : { next: { revalidate: 900 } };

  try {
    [weatherRes, aqRes] = await Promise.all([
      fetch(weatherUrl.toString(), fetchOpts),
      fetch(aqUrl.toString(), fetchOpts),
    ]);
  } catch {
    // Never throw here: this runs during static prerender and ISR revalidation.
    // Throwing would crash the build / blank the page. ISR keeps serving the
    // last good page during real outages, so mock is only hit on cold builds.
    console.warn("Weather APIs unreachable, using mock data");
    return getMockWeatherData();
  }

  if (!weatherRes.ok) {
    console.warn(`Weather API returned ${weatherRes.status}, falling back to mock`);
    return getMockWeatherData();
  }

  const weather = await weatherRes.json();
  const off = formatOffset(Number(weather.utc_offset_seconds ?? 0));
  const missing: string[] = [];

  let pm25: number | undefined;
  let pm10: number | undefined;
  if (aqRes.ok) {
    const aq = await aqRes.json().catch(() => null);
    pm25 = typeof aq?.current?.pm2_5 === "number" ? aq.current.pm2_5 : undefined;
    pm10 = typeof aq?.current?.pm10 === "number" ? aq.current.pm10 : undefined;
  }
  if (pm25 === undefined) missing.push("pm25");

  const h = weather.hourly ?? {};
  const num = (arr: unknown, i: number, fallback: number) => {
    const v = Array.isArray(arr) ? arr[i] : undefined;
    return typeof v === "number" ? v : fallback;
  };
  const hourlyAll: HourlyForecast[] = (h.time ?? []).map((time: string, i: number) => ({
    time: withOffset(time, off),
    cloudLow: num(h.cloud_cover_low, i, 0),
    cloudMid: num(h.cloud_cover_mid, i, 0),
    cloudHigh: num(h.cloud_cover_high, i, 0),
    visibility: num(h.visibility, i, DEFAULT_VISIBILITY_M),
    weatherCode: num(h.weather_code, i, 0),
    temperature: num(h.temperature_2m, i, 0),
    humidity: num(h.relative_humidity_2m, i, 0),
  }));

  // Today's 24 hours (Open-Meteo's hourly series starts at local midnight).
  const hourlyForecast = hourlyAll.slice(0, 24);

  // Aggregate hourly data into daily forecasts
  const d = weather.daily ?? {};
  const dailyDates: string[] = d.time ?? [];
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const dailyForecast: DailyForecast[] = dailyDates.map((date: string, dayIdx: number) => {
    const dayHours = hourlyAll.filter((x) => x.time.startsWith(date));
    return {
      date,
      dayLabel: dayLabelFor(date),
      cloudLow: Math.round(avg(dayHours.map((x) => x.cloudLow))),
      cloudMid: Math.round(avg(dayHours.map((x) => x.cloudMid))),
      cloudHigh: Math.round(avg(dayHours.map((x) => x.cloudHigh))),
      visibility: Math.round(avg(dayHours.map((x) => x.visibility))),
      weatherCode: num(d.weather_code, dayIdx, Math.max(0, ...dayHours.map((x) => x.weatherCode))),
      tempHigh: num(d.temperature_2m_max, dayIdx, Math.max(...dayHours.map((x) => x.temperature))),
      tempLow: num(d.temperature_2m_min, dayIdx, Math.min(...dayHours.map((x) => x.temperature))),
      humidity: Math.round(avg(dayHours.map((x) => x.humidity))),
    };
  });

  const c = weather.current ?? {};
  const cur = (key: string, fallback: number) => {
    if (typeof c[key] === "number") return c[key] as number;
    missing.push(key);
    return fallback;
  };

  return {
    currentCloudLow: cur("cloud_cover_low", 0),
    currentCloudMid: cur("cloud_cover_mid", 0),
    currentCloudHigh: cur("cloud_cover_high", 0),
    visibility: cur("visibility", DEFAULT_VISIBILITY_M),
    temperature: cur("temperature_2m", 0),
    humidity: cur("relative_humidity_2m", 0),
    windSpeed: cur("wind_speed_10m", 0),
    weatherCode: cur("weather_code", 0),
    isDay: cur("is_day", 1) === 1,
    hourlyForecast,
    hourlyAll,
    dailyForecast,
    sunrise: withOffset(d.sunrise?.[0], off),
    sunset: withOffset(d.sunset?.[0], off),
    sunriseNext: withOffset(d.sunrise?.[1], off),
    sunsetNext: withOffset(d.sunset?.[1], off),
    pm25,
    pm10,
    observedAt: c.time ? new Date(withOffset(c.time, off)).toISOString() : new Date().toISOString(),
    missing,
  };
}
