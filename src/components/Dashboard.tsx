"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Mountain, Share2, Check, BarChart3, Camera, MapPin, Trophy, Sparkles, Sunset } from "lucide-react";
import HeroStatus from "@/components/HeroStatus";
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
import CommunityVote from "@/components/CommunityVote";
import AlertSignup from "@/components/AlertSignup";
import PhotoDrop from "@/components/PhotoDrop";
import { WEBCAM_FEEDS } from "@/lib/webcams";
import { registerSW } from "@/lib/notifications";
import {
  getNeighborhoodAdjustedScore,
  getAllNeighborhoodScores,
  NEIGHBORHOOD_LABELS,
} from "@/lib/visibility";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

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
  aiVision?: {
    isVisible: boolean;
    raw: string;
    timestamp: string;
  };
}

interface Props {
  initialData: MountainData;
}

// ── Constants ───────────────────────────────────────────────────────

const REGIONS = [
  { key: "all", label: "All" },
  { key: "seattle", label: "Seattle" },
  { key: "eastside", label: "Eastside" },
  { key: "tacoma", label: "Tacoma" },
  { key: "south", label: "South" },
  { key: "north", label: "North" },
] as const;

const TABS = [
  { key: "data", label: "The Data", icon: BarChart3 },
  { key: "webcams", label: "Webcams", icon: Camera },
  { key: "viewpoints", label: "Viewpoints", icon: MapPin },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ── SWR Fetcher ─────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Component ───────────────────────────────────────────────────────

export default function Dashboard({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // SWR replaces manual setInterval polling
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

  // AI Vision — async client-side fetch, doesn't block page load
  const { data: aiVision } = useSWR<MountainData["aiVision"]>(
    "/api/ai-vision",
    fetcher,
    { revalidateOnFocus: false, errorRetryCount: 1 }
  );

  // Read neighborhood from URL on mount
  const [neighborhood, setNeighborhoodState] = useState<string | null>(
    searchParams.get("hood") || null
  );
  const [selectedViewpoint, setSelectedViewpoint] = useState(0);
  const [regionFilter, setRegionFilter] = useState("all");
  const [shared, setShared] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("data");

  // Sync neighborhood selection to URL
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

  // Register service worker on mount
  useEffect(() => { registerSW(); }, []);

  // Scroll reveal (React state driven, not classList)
  const sectionCount = 8;
  const { containerRef, isRevealed } = useScrollReveal(sectionCount);

  // ── Memoized expensive computations ──────────────────────────────
  const filteredViewpoints = useMemo(
    () =>
      regionFilter === "all"
        ? data.viewpoints
        : data.viewpoints.filter((vp) => vp.region === regionFilter),
    [data.viewpoints, regionFilter]
  );

  const neighborhoodAdjustedScore = useMemo(
    () =>
      neighborhood
        ? getNeighborhoodAdjustedScore(data.visibility.score, neighborhood, data.weather.humidity)
        : data.visibility.score,
    [data.visibility.score, neighborhood, data.weather.humidity]
  );

  const adjustedIsVisible = neighborhoodAdjustedScore >= 50;

  const leaderboard = useMemo(
    () => getAllNeighborhoodScores(data.visibility.score, data.weather.humidity).slice(0, 5),
    [data.visibility.score, data.weather.humidity]
  );

  // Keyboard navigation for viewpoints
  useKeyboardNavigation(
    filteredViewpoints.length,
    selectedViewpoint,
    setSelectedViewpoint
  );

  const handleShare = useCallback(async () => {
    const hoodLabel = neighborhood ? NEIGHBORHOOD_LABELS[neighborhood] : null;
    const location = hoodLabel ? ` from ${hoodLabel}` : "";
    const text = `Mt. Rainier is ${data.visibility.isVisible ? "OUT" : "hiding"}${location}! Score: ${neighborhoodAdjustedScore}/100. ${data.visibility.durationMessage}`;
    const shareUrl = neighborhood
      ? `${window.location.origin}?hood=${encodeURIComponent(neighborhood)}`
      : window.location.origin;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Is The Mountain Out?", text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // User cancelled
    }
  }, [data, neighborhood, neighborhoodAdjustedScore]);

  const lastUpdate = new Date(data.lastUpdated);
  const timeStr = lastUpdate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });

  const selectedVp = filteredViewpoints[selectedViewpoint] ?? data.viewpoints[0];
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
      <div className="ambient-bg" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
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
            <span className="text-[11px] text-slate-500 font-medium tracking-wide hidden sm:inline">{timeStr} PT</span>
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

        {/* ── Above the fold: Hero + Alert + Share ── */}
        <section className="animate-fade-up">
          <NeighborhoodSelector
            selected={neighborhood}
            onSelect={setNeighborhood}
          />
        </section>

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

        {/* Alpenglow Alert Banner */}
        {data.alpenglow && data.alpenglow.probability >= 40 && data.alpenglow.minutesToSunset > 0 && data.alpenglow.minutesToSunset <= 60 && (
          <section className="animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-orange-400/20 bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-violet-500/10 px-6 py-5">
              {/* Animated glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 via-pink-400/5 to-transparent animate-shimmer pointer-events-none" aria-hidden="true" />
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
                      ? `High probability of Alpenglow in ~${data.alpenglow.minutesToSunset}min. Clear sightline + high cirrus = the mountain could turn pink. Get a camera.`
                      : `Moderate Alpenglow chance (~${data.alpenglow.minutesToSunset}min to sunset). Conditions are favorable — keep watching.`
                    }
                  </p>
                </div>
                {/* Probability ring */}
                <div className="flex-shrink-0 hidden sm:block">
                  <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90" aria-label={`${data.alpenglow.probability}% probability`}>
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                    <circle
                      cx="24" cy="24" r="20"
                      fill="none"
                      stroke={data.alpenglow.isLikely ? "#fb923c" : "#a78bfa"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - data.alpenglow.probability / 100)}`}
                      opacity="0.7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Photo Drop — always visible, not gated on mountain visibility */}
        <section className="animate-fade-up">
          <PhotoDrop neighborhood={neighborhood} />
        </section>

        {/* Contextual share CTA — replaces the tiny header Share2 icon */}
        <section className="animate-fade-up flex justify-center">
          <button
            onClick={handleShare}
            className={`group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-display font-bold text-base transition-all ${
              adjustedIsVisible
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25 hover:bg-emerald-500/25 hover:ring-emerald-400/40"
                : "bg-white/[0.06] text-white/60 ring-1 ring-white/[0.08] hover:bg-white/[0.10] hover:ring-white/15"
            }`}
            aria-label="Share mountain status"
          >
            {shared ? (
              <>
                <Check className="w-5 h-5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                {adjustedIsVisible ? (
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
                <span>
                  {neighborhood && NEIGHBORHOOD_LABELS[neighborhood]
                    ? `Flex the ${NEIGHBORHOOD_LABELS[neighborhood]} View`
                    : adjustedIsVisible
                      ? "Flex the View"
                      : "Share Status"
                  }
                </span>
              </>
            )}
            {/* Glow ring on hover when mountain is out */}
            {adjustedIsVisible && (
              <div className="absolute inset-0 rounded-2xl bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true" />
            )}
          </button>
        </section>

        {/* AI Vision — async-loaded, positioned below fold */}
        {aiVision && aiVision.raw && (
          <div className="flex justify-center animate-fade-up">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium ${
              aiVision.isVisible
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/20"
                : "bg-red-500/10 text-red-400 ring-1 ring-red-400/20"
            }`} role="status">
              <span className="w-2 h-2 rounded-full bg-violet-400" aria-hidden="true" />
              AI Vision says: {aiVision.raw}
            </div>
          </div>
        )}

        {/* Alert signup — immediately under hero for maximum visibility */}
        <section
          data-reveal-index="0"
          className={`transition-all duration-700 ${isRevealed(0) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <AlertSignup />
        </section>

        {/* Neighborhood Leaderboard */}
        <section
          data-reveal-index="1"
          className={`transition-all duration-700 delay-100 ${isRevealed(1) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/15">
              <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Neighborhood Leaderboard
              </h2>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">
                Best visibility right now
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Neighborhood visibility rankings">
            {leaderboard.map((entry, i) => (
              <button
                key={entry.id}
                onClick={() => setNeighborhood(entry.id)}
                role="listitem"
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  neighborhood === entry.id
                    ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25"
                    : "bg-white/[0.03] text-white/50 ring-1 ring-white/[0.06] hover:bg-white/[0.06]"
                }`}
              >
                <span className={`font-mono text-[10px] font-bold ${i === 0 ? "text-amber-400" : "text-slate-600"}`}>
                  #{i + 1}
                </span>
                <span>{NEIGHBORHOOD_LABELS[entry.id] || entry.id}</span>
                <span className="font-display font-bold">{entry.score}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Community Vote */}
        <section
          data-reveal-index="2"
          className={`transition-all duration-700 delay-200 ${isRevealed(2) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <CommunityVote
            currentScore={neighborhoodAdjustedScore}
            isVisible={adjustedIsVisible}
          />
        </section>

        {/* Featured Webcam */}
        <section
          data-reveal-index="3"
          className={`transition-all duration-700 ${isRevealed(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <FeaturedWebcam />
        </section>

        {/* ── Tabbed Interface: Data / Webcams / Viewpoints ── */}
        <section
          data-reveal-index="4"
          className={`transition-all duration-700 ${isRevealed(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Tab bar */}
          <div className="flex items-center gap-1 mb-8 border-b border-white/[0.06] pb-0" role="tablist" aria-label="Dashboard sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  aria-controls={`panel-${tab.key}`}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
                    activeTab === tab.key
                      ? "border-blue-400 text-slate-200"
                      : "border-transparent text-slate-500 hover:text-slate-400"
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab panels with AnimatePresence */}
          <AnimatePresence mode="wait">
            {activeTab === "data" && (
              <motion.div
                key="panel-data"
                id="panel-data"
                role="tabpanel"
                aria-labelledby="tab-data"
                className="space-y-14"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <MountainScene
                  skyTheme={data.skyTheme}
                  isVisible={adjustedIsVisible}
                  viewpointName={selectedVp?.name}
                  viewpointDistance={selectedVp?.distanceMiles}
                />

                {data.hourlyTimeline?.length > 0 && (
                  <ForecastTimeline
                    hourlyTimeline={data.hourlyTimeline}
                    currentScore={data.visibility.score}
                  />
                )}

                {isNight && (
                  <NightSky
                    sunrise={data.weather.sunrise || ""}
                    isDay={data.weather.isDay}
                  />
                )}

                <VisibilityHistory
                  isVisible={adjustedIsVisible}
                  weeklyForecast={data.weeklyForecast}
                />

                <OutdoorWidget
                  isVisible={adjustedIsVisible}
                  sunset={data.weather.sunset}
                />

                <WeatherDetails
                  weather={data.weather}
                  reasons={data.visibility.reasons}
                />
              </motion.div>
            )}

            {activeTab === "webcams" && (
              <motion.div
                key="panel-webcams"
                id="panel-webcams"
                role="tabpanel"
                aria-labelledby="tab-webcams"
                className="space-y-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <LiveWebcams feeds={WEBCAM_FEEDS} />
              </motion.div>
            )}

            {activeTab === "viewpoints" && (
              <motion.div
                key="panel-viewpoints"
                id="panel-viewpoints"
                role="tabpanel"
                aria-labelledby="tab-viewpoints"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-white">
                    {adjustedIsVisible ? "Best Viewpoints" : "Viewpoints"}
                  </h2>
                  <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                    {filteredViewpoints.length} locations
                  </span>
                </div>

                <div className="flex items-center gap-1" role="radiogroup" aria-label="Filter by region">
                  {REGIONS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => {
                        setRegionFilter(r.key);
                        setSelectedViewpoint(0);
                      }}
                      role="radio"
                      aria-checked={regionFilter === r.key}
                      className={`text-[11px] font-medium px-3 py-1 rounded-full transition-all ${
                        regionFilter === r.key
                          ? "bg-white/[0.08] text-slate-300"
                          : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="divide-y divide-white/[0.04] max-h-[700px] overflow-y-auto scrollbar-thin" role="list">
                  {filteredViewpoints.map((vp, i) => (
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
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── About ── */}
        <section className="space-y-4 pt-4 border-t border-white/[0.06]">
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            If you live in the Pacific Northwest, you know the question: <span className="text-slate-400">&quot;Is the mountain out?&quot;</span> This
            app scores Mt. Rainier visibility using real-time cloud layers, atmospheric visibility, and PM2.5 data.
            Everything runs on free public data from Open-Meteo and government webcam feeds.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-600 tracking-wide uppercase font-medium">
            <span>No cookies</span>
            <span className="text-white/[0.08]" aria-hidden="true">&middot;</span>
            <span>No analytics</span>
            <span className="text-white/[0.08]" aria-hidden="true">&middot;</span>
            <span>No tracking</span>
            <span className="text-white/[0.08]" aria-hidden="true">&middot;</span>
            <span>No login required</span>
            <span className="text-white/[0.08]" aria-hidden="true">&middot;</span>
            <span>100% free</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400/50 to-violet-500/50 flex items-center justify-center text-[9px] font-bold text-white/70 ring-1 ring-white/[0.06]">
              JB
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Jatin Batra</span>
              <span className="text-slate-700 mx-2" aria-hidden="true">&middot;</span>
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
            Refreshes every 15 minutes &middot; Built with Next.js &amp; Tailwind
          </p>
        </footer>
      </div>
    </main>
  );
}
