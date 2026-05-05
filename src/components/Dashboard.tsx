"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { RefreshCw } from "lucide-react";
import MountainSilhouetteScore from "@/components/MountainSilhouetteScore";
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
import { getCurrentSeason, getSeasonalPalette, getSeasonalStatusWord, getCSSVariables } from "@/lib/seasonal";

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

  const season = getCurrentSeason();
  const palette = getSeasonalPalette(season);
  const seasonalStatus = getSeasonalStatusWord(season, adjustedIsVisible, isNight);
  const seasonVars = getCSSVariables(palette);

  return (
    <main
      className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]"
      ref={containerRef}
      role="main"
      aria-label="Mountain visibility dashboard"
      style={seasonVars as React.CSSProperties}
    >
      <PWAInstallPrompt />

      {/* ── HERO: Mountain photograph + score ── */}
      <section className="hero-section relative w-full min-h-[55vh] sm:min-h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <FeaturedWebcam />
        </div>
        <div className="hero-overlay absolute inset-0" />

        {/* Top nav */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest">Seattle · Pacific Northwest</span>
              <span className="font-mono text-[10px] text-white/40">{timeStr} PT</span>
            </div>
            <div className="flex items-center gap-2">
              <NeighborhoodSelector selected={neighborhood} onSelect={setNeighborhood} scores={allNeighborhoodScores} />
              <GlobalStreakBadge />
              <button onClick={() => mutate()} disabled={isValidating} className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30" aria-label="Refresh">
                <RefreshCw className={`w-4 h-4 text-white/70 ${isValidating ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Score on photo */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 mt-auto pb-8 sm:pb-12 flex items-end min-h-[35vh]">
          <div>
            <MountainSilhouetteScore
              score={neighborhoodAdjustedScore}
              isVisible={adjustedIsVisible}
              isNight={isNight}
              seasonLabel={seasonalStatus}
            />
            <p className="font-mono text-[11px] text-white/50 mt-3">{data.visibility.durationMessage}</p>
          </div>
        </div>
      </section>

      {/* ── Weather Data Strip ── */}
      <div className="pattern-topo border-b border-[var(--border-light)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-[var(--border-light)]">
            {[
              { label: "Clouds", value: `${data.weather.cloudLow}`, unit: "%" },
              { label: "Visibility", value: `${visMiles}`, unit: "mi" },
              { label: "Humidity", value: `${data.weather.humidity}`, unit: "%" },
              { label: "Temp", value: `${tempF}`, unit: "°F" },
              { label: "Wind", value: `${Math.round(data.weather.windSpeed)}`, unit: "km/h" },
              { label: "PM2.5", value: data.weather.pm25 !== undefined ? `${data.weather.pm25.toFixed(0)}` : "—", unit: "µg" },
            ].map((stat) => (
              <div key={stat.label} className="py-4 px-3 text-center">
                <p className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">{stat.label}</p>
                <p className="font-mono text-lg sm:text-xl text-[var(--text-primary)] tabular mt-0.5">
                  {stat.value}<span className="text-xs text-[var(--text-tertiary)] ml-0.5">{stat.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Actions + Alerts */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SpotterButton isVisible={adjustedIsVisible} score={neighborhoodAdjustedScore} />
          <MountainMoment isVisible={adjustedIsVisible} score={neighborhoodAdjustedScore} neighborhoodLabel={neighborhoodLabel} durationMessage={data.visibility.durationMessage} />
          <SmsShareButton score={neighborhoodAdjustedScore} neighborhoodLabel={neighborhoodLabel} />
        </div>

        {data.alpenglow && data.alpenglow.probability >= 40 && data.alpenglow.minutesToSunset > 0 && data.alpenglow.minutesToSunset <= 60 && (
          <div className="alpine-card mb-6" style={{ borderLeftColor: "var(--season-accent-secondary)" }}>
            <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--season-accent-secondary)" }}>Alpenglow Alert</p>
            <p className="font-display text-lg mt-1">Mountain could turn pink in ~{data.alpenglow.minutesToSunset}min</p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{data.alpenglow.probability}% probability</p>
          </div>
        )}

        {/* Countdown + Next Clear */}
        <div className="mb-8 space-y-2">
          <CountdownStrip sunrise={data.weather.sunrise} sunset={data.weather.sunset} alpenglow={data.alpenglow ?? null} />
          <NextClearWindow hourlyTimeline={data.hourlyTimeline} weeklyForecast={data.weeklyForecast} currentScore={neighborhoodAdjustedScore} />
        </div>

        {/* ── Two Column: Webcams + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_3fr] gap-8 mb-10">
          <div className="space-y-6">
            <LiveWebcams feeds={WEBCAM_FEEDS} />
            <PhotoDrop neighborhood={neighborhood} />
            {isNight && <NightSky sunrise={data.weather.sunrise || ""} isDay={data.weather.isDay} />}
          </div>
          <div className="space-y-4">
            {adjustedIsVisible && topViewpoint && (
              <div className="alpine-card">
                <p className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">Best Sightline</p>
                <p className="font-display text-base mt-1">{topViewpoint.name}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{topViewpoint.distanceMiles} mi · {topViewpoint.direction}</p>
              </div>
            )}
            <NotifyCard />
            <WeatherDetails weather={data.weather} reasons={data.visibility.reasons} />
          </div>
        </div>

        {/* ── Forecast ── */}
        <section data-reveal-index="3" className={`mb-10 transition-all duration-700 ${isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="font-display text-xl sm:text-2xl mb-4">Forecast</h2>
          <ForecastHub hourlyTimeline={data.hourlyTimeline} currentScore={data.visibility.score} isVisible={adjustedIsVisible} weeklyForecast={data.weeklyForecast} sunset={data.weather.sunset} />
        </section>

        {/* ── Iconic Sightlines ── */}
        <section data-reveal-index="4" className={`mb-10 transition-all duration-700 ${isRevealed(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl sm:text-2xl">Iconic Sightlines</h2>
            <span className="font-mono text-[10px] text-[var(--text-tertiary)] tabular">{Math.min(8, data.viewpoints.length)} vantage points</span>
          </div>
          <div className="space-y-3" role="list">
            {visibleViewpoints.map((vp, i) => (
              <ViewpointCard key={vp.id} viewpoint={vp} rank={i + 1} isVisible={adjustedIsVisible} isSelected={selectedViewpoint === i} onSelect={() => setSelectedViewpoint(i)} />
            ))}
          </div>
          {data.viewpoints.length > 3 && (
            <button
              onClick={() => setShowAllViewpoints((v) => !v)}
              className="mt-3 font-mono text-xs hover:text-[var(--text-primary)] transition-colors"
              style={{ color: "var(--season-accent)" }}
            >
              {showAllViewpoints ? "Show fewer" : `+ ${Math.min(8, data.viewpoints.length) - 3} more sightlines`}
            </button>
          )}
        </section>

        {/* ── Community ── */}
        <section data-reveal-index="5" className={`mb-10 transition-all duration-700 ${isRevealed(5) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="font-display text-xl sm:text-2xl mb-4">Neighborhood Spotters</h2>
          <CommunityGames selectedHood={neighborhood} onSelectHood={setNeighborhood} fallbackScores={allNeighborhoodScores} fallbackLabels={NEIGHBORHOOD_LABELS} />
        </section>

        {/* ── Footer ── */}
        <footer className="divider-cedar pt-8 space-y-4">
          <PrivacyCommitment />
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            A Pacific Northwest field report. Mt. Rainier visibility scored from real-time cloud layers, atmospheric clarity, and particulate matter across the Puget Sound region.
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[var(--text-tertiary)]">By</span>
            <span className="text-[var(--text-primary)] font-medium">Jatin Batra</span>
            <a href="https://x.com/jatin_batra1" target="_blank" rel="noopener noreferrer" className="text-[var(--season-accent)] hover:text-[var(--text-primary)] transition-colors">@jatin_batra1</a>
          </div>
          <div className="flex items-center gap-5 pt-4 border-t border-[var(--border-light)]">
            <a href="/almanac" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Almanac</a>
            <a href="/embed" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Embed</a>
            <a href="/api/stats.json" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">API</a>
            <span className="font-mono text-[9px] text-[var(--text-tertiary)] ml-auto">Open-Meteo · 15min · {palette.label}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
