import { fetchWeatherData } from "@/lib/weather";
import { calculateVisibility, scoreHourForTimeline, scoreDailyForecast } from "@/lib/visibility";
import { rankViewpoints } from "@/lib/viewpoints";
import { getSkyTheme } from "@/lib/sky";
import Dashboard from "@/components/Dashboard";
import type { MountainData } from "@/components/Dashboard";

// ISR: Revalidate every 15 minutes for instant load
export const revalidate = 900;

async function getMountainData(): Promise<MountainData> {
  const weather = await fetchWeatherData();
  const visibility = calculateVisibility(weather);
  const viewpoints = rankViewpoints(
    visibility.score,
    visibility.isVisible,
    weather.visibility / 1609.34,
    weather.pm25
  );
  const skyTheme = getSkyTheme(weather);

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

  // AI Vision is now fetched client-side via SWR (/api/ai-vision)
  // to avoid blocking TTFB with a 30s Gemini timeout.

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

export default async function Home() {
  const data = await getMountainData();
  return <Dashboard initialData={data} />;
}
