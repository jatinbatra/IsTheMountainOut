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
      className={`flex-1 relative transition-colors duration-1000 ${
        adjustedIsVisible ? "theme-clear" : "theme-overcast"
      }`}
      ref={containerRef}
      role="main"
      aria-label="Mountain visibility dashboard"
    >
      <div className="topo-bg" aria-hidden="true" />
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
      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-6 sm:py-10 space-y-12 sm:space-y-16">
        {/* ── Editorial Masthead ── */}
        <header className="flex items-end justify-between border-b border-[var(--rule)] pb-4 stagger-1 animate-fade-up">
          <div>
            <p className="ticker mb-1.5">Vol. I &middot; Issue {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
            <h1 className="font-display font-medium text-[color:var(--type-1)] text-[22px] sm:text-[28px] leading-none tracking-[-0.02em]">
              Is the Mountain Out
              <span className="text-[color:var(--accent)]">?</span>
            </h1>
            <p className="font-mono text-[11px] text-[color:var(--type-3)] mt-1.5 tabular">
              MT. RAINIER 14,411FT &middot; {timeStr} PT
            </p>
          </div>
          <div className="flex items-center gap-3">
            <GlobalStreakBadge />
            <a
              href="/almanac"
              className="ticker hover:text-[color:var(--type-1)] transition-colors hidden sm:inline"
            >
              Almanac
            </a>
            <button
              onClick={() => mutate()}
              disabled={isValidating}
              className="p-2 hover:bg-[color:var(--rule)] transition-colors disabled:opacity-50"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[color:var(--type-3)] ${isValidating ? "animate-spin" : ""}`}
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

        {/* ── II / Right Now ── */}
        <section className="space-y-0">
          <p className="dateline mb-4">II &middot; Right Now</p>
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
        <section className="space-y-4">
          {adjustedIsVisible && topViewpoint && (
            <div className="border-l-2 border-[color:var(--accent)] pl-4 py-1">
              <p className="ticker mb-1">Best vantage</p>
              <p className="font-display text-[20px] font-light text-[color:var(--type-1)] leading-tight">
                {topViewpoint.name}
                <span className="font-mono text-xs text-[color:var(--type-3)] ml-2 tabular">
                  {topViewpoint.distanceMiles}mi
                </span>
              </p>
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
            <section className="border-y border-[color:var(--accent-pink)]/30 py-5 bg-[color:var(--accent-pink)]/[0.03]">
              <p className="dateline text-[color:var(--accent-pink)] mb-2">Bulletin &middot; Alpenglow</p>
              <p className="font-display italic text-[20px] text-[color:var(--type-1)] leading-snug max-w-md">
                The mountain could turn pink in ~{data.alpenglow.minutesToSunset} minutes.
              </p>
              <p className="text-sm text-[color:var(--type-3)] mt-1 max-w-md">
                {data.alpenglow.probability}% probability.{" "}
                {data.alpenglow.isLikely
                  ? "Clear sightline plus high cirrus."
                  : "Conditions are favorable."}
              </p>
            </section>
          )}

        {/* ── III / The View ── */}
        <section className="space-y-6">
          <p className="dateline">III &middot; The View</p>
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

        {/* ── IV / Field Notifications ── */}
        <section
          data-reveal-index="3"
          className={`transition-all duration-700 ${
            isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="dateline mb-4">IV &middot; Field Notifications</p>
          <NotifyCard />
        </section>

        {/* ── V / Forecast ── */}
        <section
          data-reveal-index="3"
          className={`transition-all duration-700 ${
            isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="dateline mb-4">V &middot; Forecast</p>
          <ForecastHub
            hourlyTimeline={data.hourlyTimeline}
            currentScore={data.visibility.score}
            isVisible={adjustedIsVisible}
            weeklyForecast={data.weeklyForecast}
            sunset={data.weather.sunset}
          />
        </section>

        {/* ── VI / Conditions ── */}
        <section
          data-reveal-index="4"
          className={`transition-all duration-700 ${
            isRevealed(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="dateline mb-4">VI &middot; Conditions</p>
          <WeatherDetails
            weather={data.weather}
            reasons={data.visibility.reasons}
          />
        </section>

        {/* ── VII / Viewpoints ── */}
        <section
          data-reveal-index="4"
          className={`transition-all duration-700 ${
            isRevealed(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-baseline justify-between mb-4">
            <p className="dateline">VII &middot; Vantage Points</p>
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
              className="mt-4 inline-flex items-center gap-1.5 ticker hover:text-[color:var(--type-1)] transition-colors"
            >
              <span>{showAllViewpoints ? "Show fewer" : `+${Math.min(8, data.viewpoints.length) - 3} more vantage points`}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-300 ${showAllViewpoints ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </section>

        {/* ── VIII / Community ── */}
        <section
          data-reveal-index="5"
          className={`transition-all duration-700 ${
            isRevealed(5) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="dateline mb-4">VIII &middot; Community</p>
          <CommunityGames
            selectedHood={neighborhood}
            onSelectHood={setNeighborhood}
            fallbackScores={allNeighborhoodScores}
            fallbackLabels={NEIGHBORHOOD_LABELS}
          />
        </section>

        {/* ── Colophon ── */}
        <section className="pt-10 border-t border-[var(--rule)] space-y-6">
          <p className="dateline">Colophon</p>
          <PrivacyCommitment />
          <p className="text-[15px] text-[color:var(--type-2)] leading-relaxed font-display font-light italic max-w-xl">
            A Pacific Northwest field report. Mt. Rainier visibility scored from
            real-time cloud layers, atmospheric clarity, and particulate matter.
            All data public, all code open, no tracking, no login.
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-[color:var(--type-3)] tabular">EDITOR</span>
            <span className="font-display text-[15px] text-[color:var(--type-1)]">
              Jatin Batra
            </span>
            <a
              href="https://x.com/jatin_batra1"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[color:var(--type-3)] hover:text-[color:var(--type-1)] transition-colors"
            >
              @jatin_batra1
            </a>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="pt-8 pb-10 border-t border-[var(--rule)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <a href="/almanac" className="ticker hover:text-[color:var(--type-1)] transition-colors">Almanac</a>
              <a href="/embed" className="ticker hover:text-[color:var(--type-1)] transition-colors">Embed</a>
              <a href="/api/stats.json" className="ticker hover:text-[color:var(--type-1)] transition-colors">Press API</a>
            </div>
            <p className="font-mono text-[10px] text-[color:var(--type-4)] tabular">
              DATA / Open-Meteo &middot; REFRESH 15min
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
