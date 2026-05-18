import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import { 
  calculateVisibility, 
  calculateLineOfSightVisibility,
  scoreHourForTimeline, 
  scoreDailyForecast 
} from "@/lib/visibility";
import { rankViewpoints, VIEWPOINTS } from "@/lib/viewpoints";
import { getSkyTheme } from "@/lib/sky";
import { predictAlpenglow } from "@/lib/alpenglow";

// Cache for standard (midpoint) weather
let cachedMidpointResult: { data: ReturnType<typeof buildResponse>; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const RAINIER_LAT = 46.8523;
const RAINIER_LON = -121.7603;

function buildResponse(
  weather: Awaited<ReturnType<typeof fetchWeatherData>>,
  visibilityOverride?: ReturnType<typeof calculateVisibility>
) {
  const visibility = visibilityOverride ?? calculateVisibility(weather);
  const viewpoints = rankViewpoints(
    visibility.score,
    visibility.isVisible,
    weather.visibility / 1609.34,
    weather.pm25
  );

  // Alpenglow prediction
  const alpenglowData = weather.sunset
    ? predictAlpenglow(
        weather.currentCloudLow,
        weather.currentCloudMid,
        weather.currentCloudHigh,
        weather.sunset,
        visibility.score
      )
    : null;

  const skyTheme = getSkyTheme(weather, alpenglowData?.probability ?? 0);

  // Build hourly timeline data for the forecast scrubber
  const hourlyTimeline = weather.hourlyForecast.map((h) => {
    const hourScore = scoreHourForTimeline(h);
    return {
      time: h.time,
      score: hourScore.score,
      isVisible: hourScore.isVisible,
      cloudLow: h.cloudLow,
      cloudMid: h.cloudMid,
      cloudHigh: h.cloudHigh,
      temperature: h.temperature,
      humidity: h.humidity,
      visibility: h.visibility,
      weatherCode: h.weatherCode,
    };
  });

  // Build 7-day weekly forecast from daily data
  const weeklyForecast = weather.dailyForecast.map((d) => {
    const dayScore = scoreDailyForecast(d);
    return {
      date: d.date,
      dayLabel: d.dayLabel,
      score: dayScore.score,
      isVisible: dayScore.isVisible,
      cloudLow: d.cloudLow,
      cloudMid: d.cloudMid,
      cloudHigh: d.cloudHigh,
      visibility: d.visibility,
      weatherCode: d.weatherCode,
      tempHigh: d.tempHigh,
      tempLow: d.tempLow,
      humidity: d.humidity,
    };
  });

  return {
    visibility,
    weather: {
      temperature: weather.temperature,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      weatherCode: weather.weatherCode,
      isDay: weather.isDay,
      cloudLow: weather.currentCloudLow,
      cloudMid: weather.currentCloudMid,
      cloudHigh: weather.currentCloudHigh,
      visibilityMeters: weather.visibility,
      pm25: weather.pm25,
      pm10: weather.pm10,
      sunrise: weather.sunrise,
      sunset: weather.sunset,
    },
    viewpoints,
    skyTheme,
    hourlyTimeline,
    weeklyForecast,
    alpenglow: alpenglowData
      ? {
          probability: alpenglowData.probability,
          isLikely: alpenglowData.isLikely,
          minutesToSunset: alpenglowData.minutesToSunset,
        }
      : undefined,
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hood = searchParams.get("hood");
    const now = Date.now();

    // Standard midpoint request (can be cached)
    if (!hood) {
      if (cachedMidpointResult && now - cachedMidpointResult.timestamp < CACHE_TTL) {
        return NextResponse.json(cachedMidpointResult.data);
      }
      const weather = await fetchWeatherData();
      const data = buildResponse(weather);
      cachedMidpointResult = { data, timestamp: now };
      return NextResponse.json(data);
    }

    // Hyper-local line-of-sight request
    const viewpoint = VIEWPOINTS.find(v => v.id === hood);
    if (!viewpoint) {
      // Fallback to standard if hood not found
      const weather = await fetchWeatherData();
      return NextResponse.json(buildResponse(weather));
    }

    // Fetch weather at neighborhood AND Rainier
    const [localWeather, mountainWeather] = await Promise.all([
      fetchWeatherData({ lat: viewpoint.lat, lon: viewpoint.lon }),
      fetchWeatherData({ lat: RAINIER_LAT, lon: RAINIER_LON })
    ]);

    const visibility = calculateLineOfSightVisibility(localWeather, mountainWeather);
    const data = buildResponse(localWeather, visibility);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch mountain status:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data. Please try again." },
      { status: 500 }
    );
  }
}
