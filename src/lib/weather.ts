// Weather data fetching from Open-Meteo (free, no API key required)
// Coordinates: Seattle (47.6062, -122.3321) and Mount Rainier (46.8523, -121.7603)
// We sample a midpoint between them for representative cloud/visibility data.

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
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  sunrise: string;
  sunset: string;
  pm25?: number;               // µg/m³ air quality
  pm10?: number;
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

// Seattle coordinates for sunrise/sunset
const SEATTLE_LAT = 47.6062;
const SEATTLE_LON = -122.3321;

/**
 * Generate realistic mock data for development/demo when APIs are unreachable.
 */
function getMockWeatherData(): WeatherData {
  const now = new Date();
  // Use Pacific Time for correct day/night in Seattle
  const seattleHour = parseInt(
    now.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Los_Angeles" })
  );
  const hour = seattleHour;
  const isDay = hour >= 6 && hour < 20;
  const today = now.toISOString().split("T")[0];

  const hourlyForecast: HourlyForecast[] = Array.from({ length: 24 }, (_, i) => {
    // Simulate a clear morning that gets cloudy in the afternoon
    const cloudBase = i < 10 ? 10 : i < 14 ? 20 : i < 18 ? 55 : 40;
    return {
      time: `${today}T${String(i).padStart(2, "0")}:00`,
      cloudLow: Math.min(100, cloudBase + Math.round(Math.random() * 15)),
      cloudMid: Math.min(100, Math.round(cloudBase * 0.7 + Math.random() * 10)),
      cloudHigh: Math.min(100, Math.round(cloudBase * 0.4 + Math.random() * 10)),
      visibility: cloudBase < 30 ? 60000 + Math.round(Math.random() * 20000) : 30000 + Math.round(Math.random() * 20000),
      weatherCode: cloudBase > 50 ? 3 : cloudBase > 30 ? 2 : 0,
      temperature: 8 + Math.round(Math.sin((i - 6) * Math.PI / 12) * 6),
      humidity: 65 - Math.round(Math.sin((i - 6) * Math.PI / 12) * 15),
    };
  });

  // Generate 7-day mock daily forecast
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyForecast: DailyForecast[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    // Vary conditions across the week
    const patterns = [15, 65, 80, 30, 10, 45, 25]; // cloud cover pattern
    const cl = patterns[i] + Math.round(Math.random() * 10 - 5);
    return {
      date: dateStr,
      dayLabel: dayNames[d.getDay()],
      cloudLow: Math.max(0, Math.min(100, cl)),
      cloudMid: Math.max(0, Math.min(100, Math.round(cl * 0.6))),
      cloudHigh: Math.max(0, Math.min(100, Math.round(cl * 0.3))),
      visibility: cl < 40 ? 60000 + Math.round(Math.random() * 20000) : 25000 + Math.round(Math.random() * 15000),
      weatherCode: cl > 60 ? 3 : cl > 40 ? 2 : 0,
      tempHigh: 12 + Math.round(Math.random() * 6),
      tempLow: 5 + Math.round(Math.random() * 4),
      humidity: 50 + Math.round(cl * 0.3),
    };
  });

  return {
    currentCloudLow: hourlyForecast[hour]?.cloudLow ?? 15,
    currentCloudMid: hourlyForecast[hour]?.cloudMid ?? 10,
    currentCloudHigh: hourlyForecast[hour]?.cloudHigh ?? 5,
    visibility: hourlyForecast[hour]?.visibility ?? 65000,
    temperature: hourlyForecast[hour]?.temperature ?? 12,
    humidity: hourlyForecast[hour]?.humidity ?? 58,
    windSpeed: 12,
    weatherCode: hourlyForecast[hour]?.weatherCode ?? 0,
    isDay,
    hourlyForecast,
    dailyForecast,
    sunrise: `${today}T06:30`,
    sunset: `${today}T19:45`,
    pm25: 8.2,
    pm10: 15.5,
  };
}

export async function fetchWeatherData(): Promise<WeatherData> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Fetch weather data from Open-Meteo (midpoint for cloud/visibility)
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", MIDPOINT_LAT.toString());
  weatherUrl.searchParams.set("longitude", MIDPOINT_LON.toString());
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

  try {
    [weatherRes, aqRes] = await Promise.all([
      fetch(weatherUrl.toString(), { next: { revalidate: 900 } }),
      fetch(aqUrl.toString(), { next: { revalidate: 900 } }),
    ]);
  } catch {
    // APIs unreachable (e.g. no internet in dev sandbox), use mock data
    console.warn("Weather APIs unreachable, using mock data");
    return getMockWeatherData();
  }

  if (!weatherRes.ok) {
    console.warn(`Weather API returned ${weatherRes.status}, falling back to mock`);
    return getMockWeatherData();
  }

  const weather = await weatherRes.json();
  let pm25: number | undefined;
  let pm10: number | undefined;

  if (aqRes.ok) {
    const aq = await aqRes.json();
    pm25 = aq.current?.pm2_5;
    pm10 = aq.current?.pm10;
  }

  const allHourly: HourlyForecast[] = (weather.hourly?.time ?? []).map(
    (time: string, i: number) => ({
      time,
      cloudLow: weather.hourly.cloud_cover_low[i] ?? 0,
      cloudMid: weather.hourly.cloud_cover_mid[i] ?? 0,
      cloudHigh: weather.hourly.cloud_cover_high[i] ?? 0,
      visibility: weather.hourly.visibility[i] ?? 50000,
      weatherCode: weather.hourly.weather_code[i] ?? 0,
      temperature: weather.hourly.temperature_2m[i] ?? 0,
      humidity: weather.hourly.relative_humidity_2m[i] ?? 0,
    })
  );

  // Today's hourly forecast (first 24 hours)
  const hourlyForecast = allHourly.slice(0, 24);

  // Aggregate hourly data into daily forecasts
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyDates = weather.daily?.time ?? [];
  const dailyForecast: DailyForecast[] = dailyDates.map((date: string, dayIdx: number) => {
    const dayHours = allHourly.filter((h) => h.time.startsWith(date));
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const d = new Date(date + "T12:00:00");
    return {
      date,
      dayLabel: dayNames[d.getDay()],
      cloudLow: Math.round(avg(dayHours.map((h) => h.cloudLow))),
      cloudMid: Math.round(avg(dayHours.map((h) => h.cloudMid))),
      cloudHigh: Math.round(avg(dayHours.map((h) => h.cloudHigh))),
      visibility: Math.round(avg(dayHours.map((h) => h.visibility))),
      weatherCode: weather.daily?.weather_code?.[dayIdx] ?? Math.max(...dayHours.map((h) => h.weatherCode), 0),
      tempHigh: weather.daily?.temperature_2m_max?.[dayIdx] ?? Math.max(...dayHours.map((h) => h.temperature)),
      tempLow: weather.daily?.temperature_2m_min?.[dayIdx] ?? Math.min(...dayHours.map((h) => h.temperature)),
      humidity: Math.round(avg(dayHours.map((h) => h.humidity))),
    };
  });

  return {
    currentCloudLow: weather.current?.cloud_cover_low ?? 0,
    currentCloudMid: weather.current?.cloud_cover_mid ?? 0,
    currentCloudHigh: weather.current?.cloud_cover_high ?? 0,
    visibility: weather.current?.visibility ?? 50000,
    temperature: weather.current?.temperature_2m ?? 0,
    humidity: weather.current?.relative_humidity_2m ?? 0,
    windSpeed: weather.current?.wind_speed_10m ?? 0,
    weatherCode: weather.current?.weather_code ?? 0,
    isDay: weather.current?.is_day === 1,
    hourlyForecast,
    dailyForecast,
    sunrise: weather.daily?.sunrise?.[0] ?? "",
    sunset: weather.daily?.sunset?.[0] ?? "",
    pm25,
    pm10,
  };
}
