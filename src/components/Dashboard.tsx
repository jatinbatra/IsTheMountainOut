"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { RefreshCw, ChevronDown } from "lucide-react";
import HeroStatus from "@/components/HeroStatus";
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
import { useAmbientColor } from "@/hooks/useAmbientColor";

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

  const webcamColorUrl = data.weather.isDay ? "/api/webcam/usgs-longmire" : null;
  const ambientColors = useAmbientColor(webcamColorUrl);

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

  return (
    <main
      className={`flex-1 relative bg-[var(--background)] transition-colors duration-1000 ${
        adjustedIsVisible ? "theme-clear" : "theme-overcast"
      }`}
      ref={containerRef}
      role="main"
      aria-label="Mountain visibility dashboard"
    >
      <div
        className="ambient-bg"
        aria-hidden="true"
        style={{
          "--ambient-primary": ambientColors.dominant,
          "--ambient-secondary": ambientColors.secondary,
          "--ambient-accent": ambientColors.accent,
        } as React.CSSProperties}
      />

      <PWAInstallPrompt />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-6 sm:pb-10 space-y-3">
        {/* ── Header Bar ── */}
        <header className="flex items-center justify-between py-5 border-b border-[var(--rule)]">
          <div>
            <h1 className="font-display font-medium text-[color:var(--type-1)] text-[17px] leading-none tracking-tight">
              Is the Mountain Out?
            </h1>
            <p className="font-mono text-[9px] text-[color:var(--type-4)] mt-1 tracking-wider uppercase">
              Mt. Rainier &middot; {timeStr} PT
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GlobalStreakBadge />
            <button
              onClick={() => mutate()}
              disabled={isValidating}
              className="p-2 hover:bg-[var(--ink-deep)] transition-colors disabled:opacity-50"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={`w-4 h-4 text-[color:var(--type-4)] ${isValidating ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </header>

        {/* ── Neighborhood Selector ── */}
        <div className="stagger-2 animate-fade-up">
          <NeighborhoodSelector
            selected={neighborhood}
            onSelect={setNeighborhood}
            scores={allNeighborhoodScores}
          />
        </div>

        {/* ── Hero ── */}
        <HeroStatus
          isVisible={adjustedIsVisible}
          score={neighborhoodAdjustedScore}
          confidence={data.visibility.confidence}
          durationMessage={data.visibility.durationMessage}
          isNight={isNight}
          sunrise={data.weather.sunrise}
          scoreBreakdown={{
            cloudLow: data.weather.cloudLow,
            cloudMid: data.weather.cloudMid,
            cloudHigh: data.weather.cloudHigh,
            visibilityMeters: data.weather.visibilityMeters,
            pm25: data.weather.pm25,
            weatherCode: data.weather.weatherCode,
          }}
        />

        {/* ── Right Now ── */}
        <section className="space-y-3">
          <SpotterButton
            isVisible={adjustedIsVisible}
            score={neighborhoodAdjustedScore}
          />
          <CountdownStrip
            sunrise={data.weather.sunrise}
            sunset={data.weather.sunset}
            alpenglow={data.alpenglow ?? null}
          />
          <NextClearWindow
            hourlyTimeline={data.hourlyTimeline}
            weeklyForecast={data.weeklyForecast}
            currentScore={neighborhoodAdjustedScore}
          />
        </section>

        {/* ── Share + Best View ── */}
        <section className="space-y-3">
          {adjustedIsVisible && topViewpoint && (
            <div className="flex items-center gap-3 py-3 border-t border-[var(--rule)]">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="font-mono text-xs text-[color:var(--type-4)]">1</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[color:var(--type-3)] uppercase tracking-wider">Best vantage</p>
                <p className="font-display text-[16px] font-medium text-[color:var(--type-1)] leading-tight truncate">
                  {topViewpoint.name}
                  <span className="font-mono text-xs text-[color:var(--type-3)] ml-1.5 tabular">
                    {topViewpoint.distanceMiles}mi
                  </span>
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <MountainMoment
              isVisible={adjustedIsVisible}
              score={neighborhoodAdjustedScore}
              neighborhoodLabel={neighborhoodLabel}
              durationMessage={data.visibility.durationMessage}
            />
            <SmsShareButton
              score={neighborhoodAdjustedScore}
              neighborhoodLabel={neighborhoodLabel}
            />
          </div>
        </section>

        {/* ── Alpenglow Bulletin ── */}
        {data.alpenglow &&
          data.alpenglow.probability >= 40 &&
          data.alpenglow.minutesToSunset > 0 &&
          data.alpenglow.minutesToSunset <= 60 && (
            <section className="py-4 border-t border-[var(--rule)]">
              <p className="text-[10px] text-[color:var(--accent-pink)] uppercase tracking-wider font-mono font-medium mb-1">Alpenglow Alert</p>
              <p className="font-display text-[18px] text-[color:var(--type-1)] leading-snug">
                The mountain could turn pink in ~{data.alpenglow.minutesToSunset} minutes.
              </p>
              <p className="text-sm text-[color:var(--type-3)] mt-1">
                {data.alpenglow.probability}% probability.{" "}
                {data.alpenglow.isLikely
                  ? "Clear sightline plus high cirrus."
                  : "Conditions are favorable."}
              </p>
            </section>
          )}

        {/* ── The View ── */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-medium text-[color:var(--type-1)]">The View</h2>
          <div
            data-reveal-index="1"
            className={`transition-all duration-700 ${
              isRevealed(1) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <FeaturedWebcam />
          </div>

          <div
            data-reveal-index="1"
            className={`transition-all duration-700 delay-200 ${
              isRevealed(1) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <PhotoDrop neighborhood={neighborhood} />
          </div>

          <div
            data-reveal-index="2"
            className={`transition-all duration-700 ${
              isRevealed(2) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <LiveWebcams feeds={WEBCAM_FEEDS} />
          </div>

          {isNight && (
            <div
              data-reveal-index="2"
              className={`transition-all duration-700 ${
                isRevealed(2) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <NightSky
                sunrise={data.weather.sunrise || ""}
                isDay={data.weather.isDay}
              />
            </div>
          )}
        </section>

        {/* ── Alerts ── */}
        <section
          data-reveal-index="3"
          className={`transition-all duration-700 border-t border-[var(--rule)] pt-5 ${
            isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <NotifyCard />
        </section>

        {/* ── Forecast ── */}
        <section
          data-reveal-index="3"
          className={`transition-all duration-700 ${
            isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-lg font-medium text-[color:var(--type-1)] mb-4">Forecast</h2>
          <ForecastHub
            hourlyTimeline={data.hourlyTimeline}
            currentScore={data.visibility.score}
            isVisible={adjustedIsVisible}
            weeklyForecast={data.weeklyForecast}
            sunset={data.weather.sunset}
          />
        </section>

        {/* ── Conditions ── */}
        <section
          data-reveal-index="4"
          className={`transition-all duration-700 ${
            isRevealed(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <WeatherDetails
            weather={data.weather}
            reasons={data.visibility.reasons}
          />
        </section>

        {/* ── Viewpoints ── */}
        <section
          data-reveal-index="4"
          className={`transition-all duration-700 ${
            isRevealed(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg font-medium text-[color:var(--type-1)]">Vantage Points</h2>
            <span className="font-mono text-[10px] text-[color:var(--type-4)] tabular">
              {Math.min(8, data.viewpoints.length)} stations
            </span>
          </div>
          <div className="divide-y divide-[var(--rule)]" role="list">
            {visibleViewpoints.map((vp, i) => (
              <ViewpointCard
                key={vp.id}
                viewpoint={vp}
                rank={i + 1}
                isVisible={adjustedIsVisible}
                isSelected={selectedViewpoint === i}
                onSelect={() => setSelectedViewpoint(i)}
              />
            ))}
          </div>
          {data.viewpoints.length > 3 && (
            <button
              onClick={() => setShowAllViewpoints((v) => !v)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[color:var(--accent)] font-medium hover:text-[color:var(--type-1)] transition-colors"
            >
              <span>{showAllViewpoints ? "Show fewer" : `+${Math.min(8, data.viewpoints.length) - 3} more vantage points`}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-300 ${showAllViewpoints ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </section>

        {/* ── Community ── */}
        <section
          data-reveal-index="5"
          className={`transition-all duration-700 ${
            isRevealed(5) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-lg font-medium text-[color:var(--type-1)] mb-4">Community</h2>
          <CommunityGames
            selectedHood={neighborhood}
            onSelectHood={setNeighborhood}
            fallbackScores={allNeighborhoodScores}
            fallbackLabels={NEIGHBORHOOD_LABELS}
          />
        </section>

        {/* ── Footer ── */}
        <section className="border-t border-[var(--rule)] pt-5 space-y-3">
          <PrivacyCommitment />
          <p className="text-sm text-[color:var(--type-3)] leading-relaxed">
            A Pacific Northwest field report. Mt. Rainier visibility scored from
            real-time cloud layers, atmospheric clarity, and particulate matter.
            All data public, all code open, no tracking, no login.
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[color:var(--type-3)] tabular uppercase tracking-wider">Editor</span>
            <span className="text-sm font-medium text-[color:var(--type-1)]">
              Jatin Batra
            </span>
            <a
              href="https://x.com/jatin_batra1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[color:var(--accent)] hover:text-[color:var(--type-1)] transition-colors"
            >
              @jatin_batra1
            </a>
          </div>
        </section>

        <footer className="py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <a href="/almanac" className="text-xs text-[color:var(--type-3)] hover:text-[color:var(--type-1)] transition-colors font-medium">Almanac</a>
              <a href="/embed" className="text-xs text-[color:var(--type-3)] hover:text-[color:var(--type-1)] transition-colors font-medium">Embed</a>
              <a href="/api/stats.json" className="text-xs text-[color:var(--type-3)] hover:text-[color:var(--type-1)] transition-colors font-medium">API</a>
            </div>
            <p className="font-mono text-[9px] text-[color:var(--type-4)] tabular tracking-wider">
              DATA / Open-Meteo &middot; REFRESH 15min
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
