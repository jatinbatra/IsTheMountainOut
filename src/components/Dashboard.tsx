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
    ? "var(--hud-green)"
    : neighborhoodAdjustedScore >= 50
      ? "var(--hud-amber)"
      : "var(--hud-dim)";

  const statusWord = adjustedIsVisible
    ? (isNight ? "CLEAR TONIGHT" : "MOUNTAIN OUT")
    : "MOUNTAIN HIDING";

  return (
    <main
      className="min-h-screen bg-[var(--background)] text-[var(--type-1)]"
      ref={containerRef}
      role="main"
      aria-label="Mountain visibility dashboard"
    >
      <PWAInstallPrompt />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between py-3 border-b border-[var(--rule)]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[var(--type-4)] uppercase tracking-[0.15em]">RAINIER / SEA</span>
            <span className="font-mono text-[10px] text-[var(--type-4)]">{timeStr} PT</span>
          </div>
          <div className="flex items-center gap-2">
            <NeighborhoodSelector selected={neighborhood} onSelect={setNeighborhood} scores={allNeighborhoodScores} />
            <GlobalStreakBadge />
            <button onClick={() => mutate()} disabled={isValidating} className="p-2 rounded hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-30" aria-label="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 text-[var(--type-4)] ${isValidating ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Score Hero ── */}
        <div className="py-8 sm:py-12 border-b border-[var(--rule)]">
          <div className="flex items-end gap-8">
            <div
              className="font-mono font-bold leading-[0.85] tabular-nums select-none"
              style={{ fontSize: "clamp(6rem, 20vw, 14rem)", color: scoreColor }}
              aria-label={`Visibility score: ${neighborhoodAdjustedScore} out of 100`}
            >
              {neighborhoodAdjustedScore}
            </div>
            <div className="pb-3 sm:pb-6">
              <p className="font-mono text-[10px] sm:text-xs text-[var(--type-4)] tracking-widest leading-tight">/100</p>
              <p className="font-mono text-sm sm:text-base font-semibold mt-2" style={{ color: scoreColor }}>
                {statusWord}
              </p>
              <p className="font-mono text-[10px] sm:text-[11px] text-[var(--type-3)] mt-2">{data.visibility.durationMessage}</p>
            </div>
          </div>
        </div>

        {/* ── Data Grid ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-[var(--rule)]">
          {[
            { label: "CLOUDS", value: `${data.weather.cloudLow}`, unit: "%" },
            { label: "VISIBILITY", value: `${visMiles}`, unit: "mi" },
            { label: "HUMIDITY", value: `${data.weather.humidity}`, unit: "%" },
            { label: "TEMP", value: `${tempF}`, unit: "°F" },
            { label: "WIND", value: `${Math.round(data.weather.windSpeed)}`, unit: "km/h" },
            { label: "PM2.5", value: data.weather.pm25 !== undefined ? `${data.weather.pm25.toFixed(0)}` : "—", unit: "µg" },
          ].map((stat) => (
            <div key={stat.label} className="py-4 px-2 sm:px-3 border-r border-[var(--rule)] last:border-r-0 text-center">
              <p className="font-mono text-[8px] sm:text-[9px] text-[var(--type-4)] tracking-wider leading-tight">{stat.label}</p>
              <p className="font-mono text-xl sm:text-2xl font-light text-[var(--type-1)] tabular mt-1 leading-tight">
                {stat.value}<span className="text-[11px] text-[var(--type-4)] ml-1">{stat.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* ── Actions Row ── */}
        <div className="flex items-center gap-3 py-3 border-b border-[var(--rule)] flex-wrap">
          <SpotterButton isVisible={adjustedIsVisible} score={neighborhoodAdjustedScore} />
          <MountainMoment isVisible={adjustedIsVisible} score={neighborhoodAdjustedScore} neighborhoodLabel={neighborhoodLabel} durationMessage={data.visibility.durationMessage} />
          <SmsShareButton score={neighborhoodAdjustedScore} neighborhoodLabel={neighborhoodLabel} />
        </div>

        {/* ── Alerts Strip ── */}
        {data.alpenglow && data.alpenglow.probability >= 40 && data.alpenglow.minutesToSunset > 0 && data.alpenglow.minutesToSunset <= 60 && (
          <div className="py-2 border-b border-[var(--rule)] flex items-center gap-3">
            <span className="font-mono text-[9px] text-[var(--hud-pink)] tracking-wider uppercase">ALPENGLOW</span>
            <span className="font-mono text-sm text-[var(--type-2)]">
              ~{data.alpenglow.minutesToSunset}min — {data.alpenglow.probability}% chance
            </span>
          </div>
        )}

        {/* ── Countdown + Next Clear ── */}
        <div className="border-b border-[var(--rule)]">
          <CountdownStrip sunrise={data.weather.sunrise} sunset={data.weather.sunset} alpenglow={data.alpenglow ?? null} />
          <NextClearWindow hourlyTimeline={data.hourlyTimeline} weeklyForecast={data.weeklyForecast} currentScore={neighborhoodAdjustedScore} />
        </div>

        {/* ── Two Column: Webcam + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-0 lg:gap-6">
          <div>
            <div className="py-3 border-b border-[var(--rule)]"><FeaturedWebcam /></div>
            <PhotoDrop neighborhood={neighborhood} />
            <div className="py-3 border-b border-[var(--rule)]"><LiveWebcams feeds={WEBCAM_FEEDS} /></div>
            {isNight && <div className="py-3 border-b border-[var(--rule)]"><NightSky sunrise={data.weather.sunrise || ""} isDay={data.weather.isDay} /></div>}
          </div>
          <div className="lg:border-l lg:border-[var(--rule)] lg:pl-6">
            {adjustedIsVisible && topViewpoint && (
              <div className="py-3 border-b border-[var(--rule)]">
                <p className="font-mono text-[9px] text-[var(--type-4)] tracking-wider uppercase">BEST VANTAGE</p>
                <p className="font-mono text-sm text-[var(--type-1)] mt-1">
                  {topViewpoint.name} <span className="text-[var(--type-4)]">{topViewpoint.distanceMiles}mi</span>
                </p>
              </div>
            )}
            <div className="py-3 border-b border-[var(--rule)]"><NotifyCard /></div>
            <WeatherDetails weather={data.weather} reasons={data.visibility.reasons} />
          </div>
        </div>

        {/* ── Forecast ── */}
        <section
          data-reveal-index="3"
          className={`py-4 border-b border-[var(--rule)] transition-all duration-700 ${isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <p className="font-mono text-[9px] text-[var(--type-4)] tracking-wider uppercase mb-2">FORECAST</p>
          <ForecastHub hourlyTimeline={data.hourlyTimeline} currentScore={data.visibility.score} isVisible={adjustedIsVisible} weeklyForecast={data.weeklyForecast} sunset={data.weather.sunset} />
        </section>

        {/* ── Vantage Points ── */}
        <section
          data-reveal-index="4"
          className={`py-4 border-b border-[var(--rule)] transition-all duration-700 ${isRevealed(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="flex items-baseline justify-between mb-2">
            <p className="font-mono text-[9px] text-[var(--type-4)] tracking-wider uppercase">VANTAGE POINTS</p>
            <span className="font-mono text-[9px] text-[var(--type-4)] tabular">{Math.min(8, data.viewpoints.length)} stations</span>
          </div>
          <div role="list">
            {visibleViewpoints.map((vp, i) => (
              <ViewpointCard key={vp.id} viewpoint={vp} rank={i + 1} isVisible={adjustedIsVisible} isSelected={selectedViewpoint === i} onSelect={() => setSelectedViewpoint(i)} />
            ))}
          </div>
          {data.viewpoints.length > 3 && (
            <button onClick={() => setShowAllViewpoints((v) => !v)} className="mt-2 font-mono text-[11px] text-[var(--hud-green)] hover:text-[var(--type-1)] transition-colors">
              [{showAllViewpoints ? "SHOW FEWER" : `+${Math.min(8, data.viewpoints.length) - 3} MORE`}]
            </button>
          )}
        </section>

        {/* ── Community ── */}
        <section
          data-reveal-index="5"
          className={`py-4 border-b border-[var(--rule)] transition-all duration-700 ${isRevealed(5) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <p className="font-mono text-[9px] text-[var(--type-4)] tracking-wider uppercase mb-2">COMMUNITY</p>
          <CommunityGames selectedHood={neighborhood} onSelectHood={setNeighborhood} fallbackScores={allNeighborhoodScores} fallbackLabels={NEIGHBORHOOD_LABELS} />
        </section>

        {/* ── Footer ── */}
        <footer className="py-4 space-y-2">
          <PrivacyCommitment />
          <p className="font-mono text-[11px] text-[var(--type-4)] leading-relaxed">
            Mt. Rainier visibility scored from real-time cloud layers, atmospheric clarity, and particulate matter. All data public, all code open.
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] text-[var(--type-4)] uppercase tracking-wider">By</span>
            <span className="font-mono text-[11px] text-[var(--type-1)]">Jatin Batra</span>
            <a href="https://x.com/jatin_batra1" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-[var(--hud-green)] hover:text-[var(--type-1)] transition-colors">@jatin_batra1</a>
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-[var(--rule)]">
            <a href="/almanac" className="font-mono text-[11px] text-[var(--type-4)] hover:text-[var(--type-1)] transition-colors">Almanac</a>
            <a href="/embed" className="font-mono text-[11px] text-[var(--type-4)] hover:text-[var(--type-1)] transition-colors">Embed</a>
            <a href="/api/stats.json" className="font-mono text-[11px] text-[var(--type-4)] hover:text-[var(--type-1)] transition-colors">API</a>
            <span className="font-mono text-[9px] text-[var(--type-4)] ml-auto tabular">Open-Meteo · 15min</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
