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

// Midpoint between Seattle and Mt Rainier for representative atmospheric conditions
const MIDPOINT_LAT = 47.23;
const MIDPOINT_LON = -122.05;

// Seattle coordinates for sunrise/sunset
const SEATTLE_LAT = 47.6062;
const SEATTLE_LON = -122.3321;

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
  weatherUrl.searchParams.set("daily", "sunrise,sunset");
  weatherUrl.searchParams.set("timezone", "America/Los_Angeles");
  weatherUrl.searchParams.set("start_date", today);
  weatherUrl.searchParams.set("end_date", today);
  weatherUrl.searchParams.set("forecast_days", "1");

  // Fetch air quality from Open-Meteo Air Quality API
  const aqUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  aqUrl.searchParams.set("latitude", SEATTLE_LAT.toString());
  aqUrl.searchParams.set("longitude", SEATTLE_LON.toString());
  aqUrl.searchParams.set("current", "pm2_5,pm10");
  aqUrl.searchParams.set("timezone", "America/Los_Angeles");

  const [weatherRes, aqRes] = await Promise.all([
    fetch(weatherUrl.toString(), { next: { revalidate: 900 } }),
    fetch(aqUrl.toString(), { next: { revalidate: 900 } }),
  ]);

  if (!weatherRes.ok) {
    throw new Error(`Weather API error: ${weatherRes.status}`);
  }

  const weather = await weatherRes.json();
  let pm25: number | undefined;
  let pm10: number | undefined;

  if (aqRes.ok) {
    const aq = await aqRes.json();
    pm25 = aq.current?.pm2_5;
    pm10 = aq.current?.pm10;
  }

  const hourlyForecast: HourlyForecast[] = (weather.hourly?.time ?? []).map(
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
    sunrise: weather.daily?.sunrise?.[0] ?? "",
    sunset: weather.daily?.sunset?.[0] ?? "",
    pm25,
    pm10,
  };
}
