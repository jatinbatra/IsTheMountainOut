import type { Metadata } from "next";
import { fetchWeatherData } from "@/lib/weather";
import {
  calculateVisibility,
  scoreHourForTimeline,
  scoreDailyForecast,
  getNeighborhoodAdjustedScore,
  NEIGHBORHOOD_LABELS,
} from "@/lib/visibility";
import { rankViewpoints } from "@/lib/viewpoints";
import { getSkyTheme } from "@/lib/sky";
import Dashboard from "@/components/Dashboard";
import type { MountainData } from "@/components/Dashboard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://is-the-mountain-out.vercel.app";

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

// Dynamic metadata: reads ?hood= to personalize OG image per neighborhood
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ hood?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const hood = params.hood || "";
  const hoodLabel = NEIGHBORHOOD_LABELS[hood];

  // getMountainData() is ISR-cached (revalidate=900), so this doesn't
  // make extra API calls — it reuses the same cached weather data.
  const data = await getMountainData();

  let score = data.visibility.score;
  let isVisible = data.visibility.isVisible;

  if (hood && hoodLabel) {
    score = getNeighborhoodAdjustedScore(
      data.visibility.score,
      hood,
      data.weather.humidity
    );
    isVisible = score >= 50;
  }

  const title = hoodLabel
    ? `Is the Mountain Out from ${hoodLabel}?`
    : "Is the Mountain Out? | Mt. Rainier Visibility from Seattle";

  const description = hoodLabel
    ? `Mt. Rainier visibility from ${hoodLabel}: ${isVisible ? "YES" : "NO"} (${score}/100). Live score, webcams, 7-day forecast.`
    : "Real-time prediction of whether Mt. Rainier is visible from Seattle. No cookies, no tracking, 100% free.";

  const ogImageUrl = `${SITE_URL}/api/og?score=${score}&visible=${isVisible}&hood=${encodeURIComponent(hood)}`;

  return {
    title,
    description,
    openGraph: {
      title: hoodLabel
        ? `Is the Mountain Out from ${hoodLabel}?`
        : "Is the Mountain Out?",
      description,
      type: "website",
      url: hood ? `${SITE_URL}?hood=${encodeURIComponent(hood)}` : SITE_URL,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Mt. Rainier visibility${hoodLabel ? ` from ${hoodLabel}` : ""}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: hoodLabel
        ? `Mountain is ${isVisible ? "OUT" : "hiding"} from ${hoodLabel}`
        : "Is the Mountain Out?",
      description,
      images: [ogImageUrl],
    },
  };
}

import { Suspense } from "react";

function DashboardFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#050b18]">
      <div className="text-white/20 text-sm font-medium">Loading...</div>
    </div>
  );
}

export default async function Home() {
  const data = await getMountainData();
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Dashboard initialData={data} />
    </Suspense>
  );
}
