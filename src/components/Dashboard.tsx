"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  RefreshCw,
  Mountain,
  Sunset,
  MapPin,
  ChevronDown,
} from "lucide-react";
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
      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-6">
        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mountain className="w-5 h-5 text-white/50" aria-hidden="true" />
            <div>
              <h1 className="font-display font-bold text-white text-[15px] leading-tight">
                IsTheMountainOut
              </h1>
              <p className="text-xs text-white/25">
                Mt. Rainier &middot; {timeStr} PT
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GlobalStreakBadge />
            <a
              href="/almanac"
              className="text-xs text-white/25 hover:text-white/50 transition-colors hidden sm:inline"
            >
              Almanac
            </a>
            <button
              onClick={() => mutate()}
              disabled={isValidating}
              className="p-2 rounded-full hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={`w-4 h-4 text-white/25 ${isValidating ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </header>

        {/* ── Neighborhood Selector ── */}
        <NeighborhoodSelector
          selected={neighborhood}
          onSelect={setNeighborhood}
          scores={allNeighborhoodScores}
        />

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

        {/* ── Quick info strip ── */}
        <section className="space-y-0">
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

        {/* ── Share ── */}
        <section className="space-y-3">
          {adjustedIsVisible && topViewpoint && (
            <p className="text-sm text-white/30">
              <MapPin className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-white/20" />
              Best view: <span className="text-white/60">{topViewpoint.name}</span>
              <span className="text-white/15"> ({topViewpoint.distanceMiles}mi)</span>
            </p>
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

        {/* ── Alpenglow Alert ── */}
        {data.alpenglow &&
          data.alpenglow.probability >= 40 &&
          data.alpenglow.minutesToSunset > 0 &&
          data.alpenglow.minutesToSunset <= 60 && (
            <section className="py-4 border-y border-orange-400/10">
              <div className="flex items-center gap-3">
                <Sunset className="w-5 h-5 text-orange-400 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-orange-300">
                    Alpenglow {data.alpenglow.probability}% likely in ~{data.alpenglow.minutesToSunset}min
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {data.alpenglow.isLikely
                      ? "Clear sightline + high cirrus. The mountain could turn pink."
                      : "Conditions are favorable, keep watching."}
                  </p>
                </div>
              </div>
            </section>
          )}

        {/* ── Featured Webcam ── */}
        <section
          data-reveal-index="1"
          className={`transition-all duration-700 delay-100 ${
            isRevealed(1) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <FeaturedWebcam />
        </section>

        {/* ── Photo Drop (UGC — promoted from bottom) ── */}
        <section
          data-reveal-index="1"
          className={`transition-all duration-700 delay-200 ${
            isRevealed(1) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <PhotoDrop neighborhood={neighborhood} />
        </section>

        {/* ── Live Cameras ── */}
        <section
          data-reveal-index="2"
          className={`transition-all duration-700 ${
            isRevealed(2) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <LiveWebcams feeds={WEBCAM_FEEDS} />
        </section>

        {/* ── Night Sky (only at night) ── */}
        {isNight && (
          <section
            data-reveal-index="2"
            className={`transition-all duration-700 ${
              isRevealed(2) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <NightSky
              sunrise={data.weather.sunrise || ""}
              isDay={data.weather.isDay}
            />
          </section>
        )}

        {/* ── Notify ── */}
        <section
          data-reveal-index="3"
          className={`py-6 border-t border-white/[0.06] transition-all duration-700 ${
            isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <NotifyCard />
        </section>

        {/* ── Forecast Hub (24h / 7-Day / Calendar + Weekend + Golden Hour) ── */}
        <section
          data-reveal-index="3"
          className={`transition-all duration-700 ${
            isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <ForecastHub
            hourlyTimeline={data.hourlyTimeline}
            currentScore={data.visibility.score}
            isVisible={adjustedIsVisible}
            weeklyForecast={data.weeklyForecast}
            sunset={data.weather.sunset}
          />
        </section>

        {/* ── Conditions (collapsible) ── */}
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

        {/* ── Viewpoints (collapsed — show 3, expand for more) ── */}
        <section
          data-reveal-index="4"
          className={`transition-all duration-700 ${
            isRevealed(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-lg font-bold text-white mb-4">
            {adjustedIsVisible ? "Best Viewpoints" : "Viewpoints"}
          </h2>
          <div className="divide-y divide-white/[0.04]" role="list">
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
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
            >
              <span>{showAllViewpoints ? "Show fewer" : `Show all ${Math.min(8, data.viewpoints.length)} viewpoints`}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-300 ${showAllViewpoints ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </section>

        {/* ── Community Games (Hood Wars / Guess / Pool) ── */}
        <section
          data-reveal-index="5"
          className={`transition-all duration-700 ${
            isRevealed(5) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <CommunityGames
            selectedHood={neighborhood}
            onSelectHood={setNeighborhood}
            fallbackScores={allNeighborhoodScores}
            fallbackLabels={NEIGHBORHOOD_LABELS}
          />
        </section>

        {/* ── About ── */}
        <section className="pt-8 border-t border-white/[0.06] space-y-5">
          <PrivacyCommitment />
          <p className="text-sm text-white/25 leading-relaxed">
            Scores Mt. Rainier visibility using real-time cloud layers,
            atmospheric visibility, and PM2.5. Free public data from Open-Meteo.
            No cookies, no login, no tracking.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/40">
              Jatin Batra
            </span>
            <span className="text-white/10">&middot;</span>
            <a
              href="https://x.com/jatin_batra1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/25 hover:text-white/50 transition-colors"
            >
              @jatin_batra1
            </a>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="py-10 text-center space-y-3 text-xs text-white/15">
          <div className="flex items-center justify-center gap-4">
            <a href="/almanac" className="hover:text-white/40 transition-colors">Almanac</a>
            <a href="/embed" className="hover:text-white/40 transition-colors">Embed</a>
            <a href="/api/stats.json" className="hover:text-white/40 transition-colors">API</a>
          </div>
          <p>
            Data from{" "}
            <a
              href="https://open-meteo.com/"
              className="underline hover:text-white/40 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open-Meteo
            </a>
            {" "}&middot; Refreshes every 15 min
          </p>
        </footer>
      </div>
    </main>
  );
}
