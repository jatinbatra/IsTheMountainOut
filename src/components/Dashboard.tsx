"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { RefreshCw } from "lucide-react";
import MountainMoment from "@/components/MountainMoment";
import WeatherDetails from "@/components/WeatherDetails";
import ViewpointCard from "@/components/ViewpointCard";
import LiveWebcams from "@/components/LiveWebcams";
import NightSky from "@/components/NightSky";
import FeaturedWebcam from "@/components/FeaturedWebcam";
import NeighborhoodSelector from "@/components/NeighborhoodSelector";
import NotifyCard from "@/components/NotifyCard";
import ForecastHub from "@/components/ForecastHub";
import CommunityGames from "@/components/CommunityGames";
import PhotoDrop from "@/components/PhotoDrop";
import GlobalStreakBadge from "@/components/GlobalStreakBadge";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NextClearWindow from "@/components/NextClearWindow";
import SpotterButton from "@/components/SpotterButton";
import CountdownStrip from "@/components/CountdownStrip";
import SmsShareButton from "@/components/SmsShareButton";
import PrivacyCommitment from "@/components/PrivacyCommitment";
import { WEBCAM_FEEDS } from "@/lib/webcams";
import { registerSW } from "@/lib/notifications";
import {
  getNeighborhoodAdjustedScore,
  getAllNeighborhoodScores,
  NEIGHBORHOOD_LABELS,
} from "@/lib/visibility";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useAutoLocation } from "@/hooks/useAutoLocation";

// ── Type Definitions ────────────────────────────────────────────────

interface ViewpointData {
  id: string;
  name: string;
  description: string;
  distanceMiles: number;
  direction: string;
  elevation: number;
  bestFor: string;
  lat: number;
  lon: number;
  region: string;
  mapsUrl: string;
  locationScore: number;
  locationConfidence: string;
  skyDescription: string;
}

export interface WeeklyForecastDay {
  date: string;
  dayLabel: string;
  score: number;
  isVisible: boolean;
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  visibility: number;
  weatherCode: number;
  tempHigh: number;
  tempLow: number;
  humidity: number;
}

interface HourlyTimelineData {
  time: string;
  score: number;
  isVisible: boolean;
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  temperature: number;
  humidity: number;
  visibility: number;
  weatherCode: number;
}

export interface MountainData {
  visibility: {
    isVisible: boolean;
    score: number;
    confidence: string;
    reasons: string[];
    durationHours: number;
    durationMessage: string;
  };
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    isDay: boolean;
    cloudLow: number;
    cloudMid: number;
    cloudHigh: number;
    visibilityMeters: number;
    pm25?: number;
    pm10?: number;
    sunrise?: string;
    sunset?: string;
  };
  viewpoints: ViewpointData[];
  skyTheme: {
    skyGradient: string;
    mountainFill: string;
    snowFill: string;
    cloudOpacity: number;
    sunMoonColor: string;
    showSun: boolean;
    showMoon: boolean;
    showStars: boolean;
    glowColor: string;
    fogOpacity: number;
    label: string;
  };
  hourlyTimeline: HourlyTimelineData[];
  weeklyForecast?: WeeklyForecastDay[];
  alpenglow?: {
    probability: number;
    isLikely: boolean;
    minutesToSunset: number;
  };
  lastUpdated: string;
}

interface Props {
  initialData: MountainData;
}

// ── SWR Fetcher ─────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Component ───────────────────────────────────────────────────────

export default function Dashboard({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: swrData, isValidating, mutate } = useSWR<MountainData>(
    "/api/mountain-status",
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 15 * 60 * 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const data = swrData!;

  const [neighborhood, setNeighborhoodState] = useState<string | null>(
    searchParams.get("hood") || null
  );
  const [selectedViewpoint, setSelectedViewpoint] = useState(0);
  const [showAllViewpoints, setShowAllViewpoints] = useState(false);

  const setNeighborhood = useCallback(
    (hood: string | null) => {
      setNeighborhoodState(hood);
      if (hood) {
        router.push(`?hood=${encodeURIComponent(hood)}`, { scroll: false });
      } else {
        router.push("/", { scroll: false });
      }
    },
    [router]
  );

  useEffect(() => {
    registerSW();
    fetch("/api/beacon", {
      method: "POST",
      body: JSON.stringify({ hood: searchParams.get("hood") || "" }),
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useAutoLocation(neighborhood, setNeighborhood);

  const sectionCount = 6;
  const { containerRef, isRevealed } = useScrollReveal(sectionCount);

  const neighborhoodAdjustedScore = useMemo(
    () =>
      neighborhood
        ? getNeighborhoodAdjustedScore(data.visibility.score, neighborhood, data.weather.humidity)
        : data.visibility.score,
    [data.visibility.score, neighborhood, data.weather.humidity]
  );

  const adjustedIsVisible = neighborhoodAdjustedScore >= 50;

  const allNeighborhoodScores = useMemo(
    () => getAllNeighborhoodScores(data.visibility.score, data.weather.humidity),
    [data.visibility.score, data.weather.humidity]
  );

  const topViewpoint = data.viewpoints[0];
  const neighborhoodLabel = neighborhood ? NEIGHBORHOOD_LABELS[neighborhood] ?? null : null;

  const lastUpdate = new Date(data.lastUpdated);
  const timeStr = lastUpdate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });

  const isNight = !data.weather.isDay;

  const visibleViewpoints = showAllViewpoints
    ? data.viewpoints.slice(0, 8)
    : data.viewpoints.slice(0, 3);

  const visMiles = Math.round(data.weather.visibilityMeters / 1609.34);
  const tempF = Math.round((data.weather.temperature * 9) / 5 + 32);

  const scoreColor = neighborhoodAdjustedScore >= 70
    ? "var(--status-good)"
    : neighborhoodAdjustedScore >= 50
      ? "var(--status-warning)"
      : "var(--text-tertiary)";

  const statusWord = adjustedIsVisible
    ? (isNight ? "CLEAR TONIGHT" : "MOUNTAIN OUT")
    : "MOUNTAIN HIDING";

  return (
    <main
      className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]"
      ref={containerRef}
      role="main"
      aria-label="Mountain visibility dashboard"
    >
      <PWAInstallPrompt />

      {/* ─── HERO SECTION: Photo-first ─── */}
      <section className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] overflow-hidden bg-gradient-to-b from-[var(--bg-tertiary)] to-[var(--bg-secondary)]">
        {/* Featured Webcam as Hero */}
        <div className="absolute inset-0">
          <FeaturedWebcam />
        </div>

        {/* Score Overlay - subtle card on top */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent pt-20 pb-8 px-4 sm:px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end gap-4 sm:gap-6">
              <div
                className="font-display text-white leading-none select-none"
                style={{ fontSize: "clamp(4rem, 15vw, 8rem)" }}
                aria-label={`Visibility score: ${neighborhoodAdjustedScore} out of 100`}
              >
                {neighborhoodAdjustedScore}
              </div>
              <div className="pb-2 sm:pb-4">
                <p className="text-xs sm:text-sm font-light text-white/80">/100</p>
                <p className="text-sm sm:text-base font-light text-white/90 mt-1" style={{ color: "white" }}>
                  {statusWord}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top bar with controls - overlay on photo */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center justify-between py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-white/80 font-light">RAINIER / SEA</span>
                <span className="text-xs sm:text-sm text-white/70 font-light">{timeStr} PT</span>
              </div>
              <div className="flex items-center gap-2">
                <NeighborhoodSelector selected={neighborhood} onSelect={setNeighborhood} scores={allNeighborhoodScores} />
                <GlobalStreakBadge />
                <button
                  onClick={() => mutate()}
                  disabled={isValidating}
                  className="p-2 rounded hover:bg-white/10 transition-colors disabled:opacity-30"
                  aria-label="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${isValidating ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="w-full bg-[var(--bg-primary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">

          {/* ─── Score Details Card ─── */}
          <div className="mb-8 sm:mb-12 p-6 sm:p-8 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {[
                { label: "Clouds", value: `${data.weather.cloudLow}%`, icon: "☁️" },
                { label: "Visibility", value: `${visMiles} mi`, icon: "👁️" },
                { label: "Humidity", value: `${data.weather.humidity}%`, icon: "💧" },
                { label: "Temp", value: `${tempF}°F`, icon: "🌡️" },
                { label: "Wind", value: `${Math.round(data.weather.windSpeed)} km/h`, icon: "💨" },
                { label: "PM2.5", value: data.weather.pm25 !== undefined ? `${data.weather.pm25.toFixed(0)} µg` : "—", icon: "🌫️" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl mb-2">{stat.icon}</p>
                  <p className="text-xs sm:text-sm text-[var(--text-tertiary)] uppercase font-light tracking-wide">{stat.label}</p>
                  <p className="text-sm sm:text-base text-[var(--text-primary)] font-light mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Duration message */}
            <p className="text-sm text-[var(--text-secondary)] mt-6 sm:mt-8 text-center border-t border-[var(--border-lighter)] pt-4 sm:pt-6">
              {data.visibility.durationMessage}
            </p>
          </div>

          {/* ─── Quick Actions ─── */}
          <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <SpotterButton isVisible={adjustedIsVisible} score={neighborhoodAdjustedScore} />
            <MountainMoment isVisible={adjustedIsVisible} score={neighborhoodAdjustedScore} neighborhoodLabel={neighborhoodLabel} durationMessage={data.visibility.durationMessage} />
            <SmsShareButton score={neighborhoodAdjustedScore} neighborhoodLabel={neighborhoodLabel} />
          </div>

          {/* ─── Alpenglow Alert ─── */}
          {data.alpenglow && data.alpenglow.probability >= 40 && data.alpenglow.minutesToSunset > 0 && data.alpenglow.minutesToSunset <= 60 && (
            <div className="mb-8 p-4 sm:p-6 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-display text-[var(--status-warning)]">Alpenglow incoming</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">~{data.alpenglow.minutesToSunset}min — {data.alpenglow.probability}% chance</p>
            </div>
          )}

          {/* ─── Countdown and Next Clear ─── */}
          <div className="mb-8 sm:mb-12">
            <CountdownStrip sunrise={data.weather.sunrise} sunset={data.weather.sunset} alpenglow={data.alpenglow ?? null} />
            <div className="mt-4">
              <NextClearWindow hourlyTimeline={data.hourlyTimeline} weeklyForecast={data.weeklyForecast} currentScore={neighborhoodAdjustedScore} />
            </div>
          </div>

          {/* ─── TWO COLUMN: Content + Sidebar ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 sm:gap-10 mb-8 sm:mb-12">
            {/* Left column: Webcams and photos */}
            <div className="space-y-6 sm:space-y-8">
              <div className="rounded-lg overflow-hidden border border-[var(--border-light)] shadow-sm">
                <LiveWebcams feeds={WEBCAM_FEEDS} />
              </div>
              <div>
                <PhotoDrop neighborhood={neighborhood} />
              </div>
              {isNight && (
                <div className="rounded-lg overflow-hidden border border-[var(--border-light)] shadow-sm">
                  <NightSky sunrise={data.weather.sunrise || ""} isDay={data.weather.isDay} />
                </div>
              )}
            </div>

            {/* Right column: Sidebar */}
            <div className="space-y-6 sm:space-y-8">
              {adjustedIsVisible && topViewpoint && (
                <div className="p-4 sm:p-6 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)] font-light mb-2">Best Vantage</p>
                  <p className="font-display text-lg text-[var(--text-primary)]">{topViewpoint.name}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{topViewpoint.distanceMiles} miles away</p>
                </div>
              )}
              <div className="p-4 sm:p-6 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg shadow-sm">
                <NotifyCard />
              </div>
              <div className="rounded-lg overflow-hidden border border-[var(--border-light)] shadow-sm">
                <WeatherDetails weather={data.weather} reasons={data.visibility.reasons} />
              </div>
            </div>
          </div>

          {/* ─── Forecast Section ─── */}
          <section
            data-reveal-index="3"
            className={`mb-8 sm:mb-12 transition-all duration-700 ${isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h2 className="font-display text-2xl sm:text-3xl mb-6 text-[var(--text-primary)]">Forecast</h2>
            <div className="rounded-lg overflow-hidden border border-[var(--border-light)] shadow-sm">
              <ForecastHub hourlyTimeline={data.hourlyTimeline} currentScore={data.visibility.score} isVisible={adjustedIsVisible} weeklyForecast={data.weeklyForecast} sunset={data.weather.sunset} />
            </div>
          </section>

          {/* ─── Vantage Points Section ─── */}
          <section
            data-reveal-index="4"
            className={`mb-8 sm:mb-12 transition-all duration-700 ${isRevealed(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-2xl sm:text-3xl text-[var(--text-primary)]">Vantage Points</h2>
              <span className="text-sm text-[var(--text-tertiary)]">{Math.min(8, data.viewpoints.length)} stations</span>
            </div>
            <div role="list" className="space-y-3 sm:space-y-4">
              {visibleViewpoints.map((vp, i) => (
                <div key={vp.id} className="rounded-lg border border-[var(--border-light)] shadow-sm overflow-hidden">
                  <ViewpointCard viewpoint={vp} rank={i + 1} isVisible={adjustedIsVisible} isSelected={selectedViewpoint === i} onSelect={() => setSelectedViewpoint(i)} />
                </div>
              ))}
            </div>
            {data.viewpoints.length > 3 && (
              <button
                onClick={() => setShowAllViewpoints((v) => !v)}
                className="mt-4 text-sm text-[var(--status-good)] hover:text-[var(--text-primary)] transition-colors font-light"
              >
                {showAllViewpoints ? "Show Fewer" : `+ ${Math.min(8, data.viewpoints.length) - 3} More`}
              </button>
            )}
          </section>

          {/* ─── Community Section ─── */}
          <section
            data-reveal-index="5"
            className={`mb-12 sm:mb-16 transition-all duration-700 ${isRevealed(5) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h2 className="font-display text-2xl sm:text-3xl mb-6 text-[var(--text-primary)]">Community</h2>
            <div className="rounded-lg overflow-hidden border border-[var(--border-light)] shadow-sm">
              <CommunityGames selectedHood={neighborhood} onSelectHood={setNeighborhood} fallbackScores={allNeighborhoodScores} fallbackLabels={NEIGHBORHOOD_LABELS} />
            </div>
          </section>

          {/* ─── Footer ─── */}
          <footer className="border-t border-[var(--border-light)] pt-8 sm:pt-12 space-y-4 sm:space-y-6 text-[var(--text-secondary)]">
            <PrivacyCommitment />
            <p className="text-sm font-light leading-relaxed">
              Mt. Rainier visibility scored from real-time cloud layers, atmospheric clarity, and particulate matter. All data public, all code open.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-xs font-light">
              <span>By Jatin Batra</span>
              <a href="https://x.com/jatin_batra1" target="_blank" rel="noopener noreferrer" className="text-[var(--status-good)] hover:text-[var(--text-primary)] transition-colors">
                @jatin_batra1
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-[var(--border-lighter)] text-xs font-light">
              <a href="/almanac" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Almanac</a>
              <a href="/embed" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Embed</a>
              <a href="/api/stats.json" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">API</a>
              <span className="text-[var(--text-quaternary)] ml-auto">Open-Meteo · 15min</span>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
