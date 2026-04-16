import { NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import { calculateVisibility, scoreHourForTimeline, scoreDailyForecast } from "@/lib/visibility";
import { rankViewpoints } from "@/lib/viewpoints";
import { getSkyTheme } from "@/lib/sky";

// Cache the result for 15 minutes
let cachedResult: { data: ReturnType<typeof buildResponse>; timestamp: number } | null =
  null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function buildResponse(
  weather: Awaited<ReturnType<typeof fetchWeatherData>>
) {
  const visibility = calculateVisibility(weather);
  const viewpoints = rankViewpoints(
    visibility.score,
    visibility.isVisible,
    weather.visibility / 1609.34,
    weather.pm25
  );
  const skyTheme = getSkyTheme(weather);

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
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const now = Date.now();

    if (cachedResult && now - cachedResult.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResult.data);
    }

    const weather = await fetchWeatherData();
    const data = buildResponse(weather);

    cachedResult = { data, timestamp: now };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch mountain status:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data. Please try again." },
      { status: 500 }
    );
  }
}
