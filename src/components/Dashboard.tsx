"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  RefreshCw,
  Mountain,
  Sunset,
  MapPin,
} from "lucide-react";
import HeroStatus from "@/components/HeroStatus";
import MountainMoment from "@/components/MountainMoment";
import MountainScene from "@/components/MountainScene";
import WeatherDetails from "@/components/WeatherDetails";
import ViewpointCard from "@/components/ViewpointCard";
import LiveWebcams from "@/components/LiveWebcams";
import NightSky from "@/components/NightSky";
import ForecastTimeline from "@/components/ForecastTimeline";
import FeaturedWebcam from "@/components/FeaturedWebcam";
import VisibilityHistory from "@/components/VisibilityHistory";
import OutdoorWidget from "@/components/OutdoorWidget";
import NeighborhoodSelector from "@/components/NeighborhoodSelector";
import NotifyButton from "@/components/NotifyButton";
import MountainCalendar from "@/components/MountainCalendar";
import HoodWars from "@/components/HoodWars";
import MountainPool from "@/components/MountainPool";
import GlobalStreakBadge from "@/components/GlobalStreakBadge";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
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

  // Register service worker + fire beacon on mount
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

  const sectionCount = 10;
  const { containerRef, isRevealed } = useScrollReveal(sectionCount);

  // ── Memoized computations ──────────────────────────────────────────
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
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* ── Header ── */}
        <header className="flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/80 to-violet-600/80 flex items-center justify-center shadow-lg shadow-blue-500/15 ring-1 ring-white/10">
              <Mountain className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-base leading-tight">
                IsTheMountainOut
              </h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                Mt. Rainier &middot; 14,411 ft
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlobalStreakBadge />
            <span className="text-[11px] text-slate-500 font-medium tracking-wide hidden sm:inline">
              {timeStr} PT
            </span>
            <button
              onClick={() => mutate()}
              disabled={isValidating}
              className="p-2.5 rounded-xl glass hover:bg-white/[0.06] transition-all disabled:opacity-50"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={`w-4 h-4 text-white/40 ${isValidating ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </header>

        {/* ── Compact Neighborhood Selector ── */}
        <section className="animate-fade-up">
          <NeighborhoodSelector
            selected={neighborhood}
            onSelect={setNeighborhood}
            scores={allNeighborhoodScores}
          />
        </section>

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

        {/* ── Best viewpoint + Notify + Share ── */}
        <section className="animate-fade-up space-y-4">
          {adjustedIsVisible && topViewpoint && (
            <p className="text-center text-sm text-slate-400">
              <MapPin className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-emerald-400/60" />
              Best view right now:{" "}
              <span className="text-white font-semibold">{topViewpoint.name}</span>
              <span className="text-slate-600"> ({topViewpoint.distanceMiles}mi)</span>
            </p>
          )}

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <NotifyButton />
            <MountainMoment
              isVisible={adjustedIsVisible}
              score={neighborhoodAdjustedScore}
              neighborhoodLabel={neighborhoodLabel}
              durationMessage={data.visibility.durationMessage}
            />
          </div>
        </section>

        {/* ── Alpenglow Alert ── */}
        {data.alpenglow &&
          data.alpenglow.probability >= 40 &&
          data.alpenglow.minutesToSunset > 0 &&
          data.alpenglow.minutesToSunset <= 60 && (
            <section className="animate-fade-up">
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-orange-400/20 bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-violet-500/10 px-6 py-5">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-orange-400/5 via-pink-400/5 to-transparent animate-shimmer pointer-events-none"
                  aria-hidden="true"
                />
                <div className="relative flex items-center gap-4">
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-orange-500/15 ring-1 ring-orange-400/20">
                    <Sunset className="w-5 h-5 text-orange-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-orange-300 text-sm">
                        Alpenglow Alert
                      </h3>
                      <span className="font-display font-bold text-orange-400/80 text-xs tabular-nums">
                        {data.alpenglow.probability}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {data.alpenglow.isLikely
                        ? `High probability of Alpenglow in ~${data.alpenglow.minutesToSunset}min. Clear sightline + high cirrus = the mountain could turn pink.`
                        : `Moderate chance (~${data.alpenglow.minutesToSunset}min to sunset). Conditions are favorable \u2014 keep watching.`}
                    </p>
                  </div>
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

        {/* ── 24-Hour Forecast ── */}
        {data.hourlyTimeline?.length > 0 && (
          <section
            data-reveal-index="2"
            className={`transition-all duration-700 delay-200 ${
              isRevealed(2) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <ForecastTimeline
              hourlyTimeline={data.hourlyTimeline}
              currentScore={data.visibility.score}
            />
          </section>
        )}

        {/* ── 7-Day Prediction ── */}
        <section
          data-reveal-index="3"
          className={`transition-all duration-700 ${
            isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <VisibilityHistory
            isVisible={adjustedIsVisible}
            weeklyForecast={data.weeklyForecast}
          />
        </section>

        {/* ── Mountain Calendar ── */}
        <section
          data-reveal-index="4"
          className={`transition-all duration-700 ${
            isRevealed(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <MountainCalendar />
        </section>

        {/* ── Golden Hour + Trails (when visible) ── */}
        <section
          data-reveal-index="5"
          className={`transition-all duration-700 ${
            isRevealed(5) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <OutdoorWidget
            isVisible={adjustedIsVisible}
            sunset={data.weather.sunset}
          />
        </section>

        {/* ── Mountain Scene ── */}
        <section
          data-reveal-index="6"
          className={`transition-all duration-700 ${
            isRevealed(6) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <MountainScene
            skyTheme={data.skyTheme}
            isVisible={adjustedIsVisible}
            viewpointName={topViewpoint?.name}
            viewpointDistance={topViewpoint?.distanceMiles}
          />
        </section>

        {/* ── Live Cameras ── */}
        <section
          data-reveal-index="7"
          className={`transition-all duration-700 ${
            isRevealed(7) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <LiveWebcams feeds={WEBCAM_FEEDS} />
        </section>

        {/* ── Night Sky (only at night) ── */}
        {isNight && (
          <section
            data-reveal-index="8"
            className={`transition-all duration-700 ${
              isRevealed(8) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <NightSky
              sunrise={data.weather.sunrise || ""}
              isDay={data.weather.isDay}
            />
          </section>
        )}

        {/* ── Hood Wars ── */}
        <section
          data-reveal-index="8"
          className={`transition-all duration-700 ${
            isRevealed(8) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <HoodWars
            selected={neighborhood}
            onSelect={setNeighborhood}
            fallbackScores={allNeighborhoodScores}
            fallbackLabels={NEIGHBORHOOD_LABELS}
          />
        </section>

        {/* ── Mountain Pool ── */}
        <section
          data-reveal-index="9"
          className={`transition-all duration-700 ${
            isRevealed(9) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <MountainPool />
        </section>

        {/* ── Top Viewpoints ── */}
        <section
          data-reveal-index="9"
          className={`transition-all duration-700 ${
            isRevealed(9) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-lg font-bold text-white mb-4">
            {adjustedIsVisible ? "Best Viewpoints" : "Viewpoints"}
          </h2>
          <div className="divide-y divide-white/[0.04]" role="list">
            {data.viewpoints.slice(0, 8).map((vp, i) => (
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
        </section>

        {/* ── Conditions ── */}
        <section
          data-reveal-index="9"
          className={`transition-all duration-700 ${
            isRevealed(9) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <WeatherDetails
            weather={data.weather}
            reasons={data.visibility.reasons}
          />
        </section>

        {/* ── About ── */}
        <section className="space-y-4 pt-4 border-t border-white/[0.06]">
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            If you live in the Pacific Northwest, you know the question:{" "}
            <span className="text-slate-400">
              &quot;Is the mountain out?&quot;
            </span>{" "}
            This app scores Mt. Rainier visibility using real-time cloud layers,
            atmospheric visibility, and PM2.5 data. Everything runs on free
            public data from Open-Meteo and government webcam feeds.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-600 tracking-wide uppercase font-medium">
            <span>No cookies</span>
            <span className="text-white/[0.08]" aria-hidden="true">
              &middot;
            </span>
            <span>Privacy-first analytics</span>
            <span className="text-white/[0.08]" aria-hidden="true">
              &middot;
            </span>
            <span>No login required</span>
            <span className="text-white/[0.08]" aria-hidden="true">
              &middot;
            </span>
            <span>100% free</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400/50 to-violet-500/50 flex items-center justify-center text-[9px] font-bold text-white/70 ring-1 ring-white/[0.06]">
              JB
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">
                Jatin Batra
              </span>
              <span className="text-slate-700 mx-2" aria-hidden="true">
                &middot;
              </span>
              <a
                href="https://x.com/jatin_batra1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400/40 hover:text-blue-300 transition-colors"
              >
                @jatin_batra1
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="text-center text-[11px] text-slate-600 py-10 border-t border-white/[0.06] space-y-1.5 font-medium tracking-wide">
          <p>
            Weather data from{" "}
            <a
              href="https://open-meteo.com/"
              className="underline hover:text-white/40 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open-Meteo
            </a>{" "}
            &middot; Air quality from Open-Meteo AQ API
          </p>
          <p>
            Refreshes every 15 minutes &middot; Built with Next.js &amp;
            Tailwind
          </p>
          <p className="mt-3">
            <a
              href="/embed"
              className="text-blue-400/30 hover:text-blue-300 transition-colors"
            >
              Embed widget
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
