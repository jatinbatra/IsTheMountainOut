"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Mountain, Share2, Check } from "lucide-react";
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
import { WEBCAM_FEEDS } from "@/lib/webcams";
import { registerSW, getNotificationPermission } from "@/lib/notifications";

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

const REGIONS = [
  { key: "all", label: "All" },
  { key: "seattle", label: "Seattle" },
  { key: "eastside", label: "Eastside" },
  { key: "tacoma", label: "Tacoma" },
  { key: "south", label: "South" },
  { key: "north", label: "North" },
];

export default function Dashboard({ initialData }: Props) {
  const [data, setData] = useState<MountainData>(initialData);
  const [loading, setLoading] = useState(false);
  const [selectedViewpoint, setSelectedViewpoint] = useState(0);
  const [regionFilter, setRegionFilter] = useState("all");
  const [shared, setShared] = useState(false);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);

  // Register service worker on mount
  useEffect(() => {
    registerSW();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mountain-status");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      // Keep showing existing data on refresh failure
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleShare = async () => {
    const text = `Mt. Rainier is ${data.visibility.isVisible ? "OUT" : "hiding"}! Score: ${data.visibility.score}/100. ${data.visibility.durationMessage}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Is The Mountain Out?", text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // User cancelled share
    }
  };

  // Keyboard navigation for viewpoints
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const filtered =
        regionFilter === "all"
          ? data.viewpoints
          : data.viewpoints.filter((vp) => vp.region === regionFilter);

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setSelectedViewpoint((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setSelectedViewpoint((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [data, regionFilter]);

  // Scroll-triggered reveal
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mainRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    const els = mainRef.current.querySelectorAll(".scroll-reveal");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data]);

  const lastUpdate = new Date(data.lastUpdated);
  const timeStr = lastUpdate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });

  const filteredViewpoints =
    regionFilter === "all"
      ? data.viewpoints
      : data.viewpoints.filter((vp) => vp.region === regionFilter);

  const selectedVp = filteredViewpoints[selectedViewpoint] ?? data.viewpoints[0];
  const isNight = !data.weather.isDay;

  // Compute neighborhood-adjusted score
  const neighborhoodAdjustedScore = neighborhood
    ? getNeighborhoodAdjustedScore(data.visibility.score, neighborhood, data.weather)
    : data.visibility.score;
  const adjustedIsVisible = neighborhoodAdjustedScore >= 50;

  return (
    <main
      className={`flex-1 relative transition-colors duration-1000 ${
        adjustedIsVisible ? "theme-clear" : "theme-overcast"
      }`}
      ref={mainRef}
    >
      <div className="ambient-bg" />
      <div className="noise-overlay" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-14">
        {/* Header */}
        <header className="flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/80 to-violet-600/80 flex items-center justify-center shadow-lg shadow-blue-500/15 ring-1 ring-white/10">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-base leading-tight">
                IsTheMountainOut
              </h2>
              <p className="text-[11px] text-white/25 font-medium">
                Mt. Rainier &middot; 14,411 ft
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/20 font-medium hidden sm:inline">{timeStr} PT</span>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl glass hover:bg-white/[0.06] transition-all"
              title="Share status"
            >
              {shared ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4 text-white/40" />
              )}
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl glass hover:bg-white/[0.06] transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 text-white/40 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </header>

        {/* Neighborhood Selector */}
        <section className="animate-fade-up">
          <NeighborhoodSelector
            selected={neighborhood}
            onSelect={setNeighborhood}
          />
        </section>

        {/* Hero Status */}
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

        {/* AI Vision badge if available */}
        {data.aiVision && (
          <div className="flex justify-center animate-fade-up">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium ${
              data.aiVision.isVisible
                ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20"
                : "bg-red-500/10 text-red-300 ring-1 ring-red-400/20"
            }`}>
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              AI Vision says: {data.aiVision.raw}
            </div>
          </div>
        )}

        {/* Community Vote */}
        <section className="scroll-reveal">
          <CommunityVote
            currentScore={neighborhoodAdjustedScore}
            isVisible={adjustedIsVisible}
          />
        </section>

        {/* Featured Webcam */}
        <section className="scroll-reveal">
          <FeaturedWebcam />
        </section>

        {/* Mountain Scene */}
        <section className="scroll-reveal">
          <MountainScene
            skyTheme={data.skyTheme}
            isVisible={adjustedIsVisible}
            viewpointName={selectedVp?.name}
            viewpointDistance={selectedVp?.distanceMiles}
          />
        </section>

        {/* 24-Hour Forecast Timeline */}
        {data.hourlyTimeline && data.hourlyTimeline.length > 0 && (
          <section className="scroll-reveal scroll-reveal-delay-1">
            <ForecastTimeline
              hourlyTimeline={data.hourlyTimeline}
              currentScore={data.visibility.score}
            />
          </section>
        )}

        {/* Night Sky */}
        {isNight && (
          <section className="scroll-reveal scroll-reveal-delay-2">
            <NightSky
              sunrise={data.weather.sunrise || ""}
              isDay={data.weather.isDay}
            />
          </section>
        )}

        {/* 7-Day Visibility Predictions */}
        <section className="scroll-reveal scroll-reveal-delay-1">
          <VisibilityHistory
            isVisible={adjustedIsVisible}
            weeklyForecast={data.weeklyForecast}
          />
        </section>

        {/* Outdoor Widget */}
        <section className="scroll-reveal scroll-reveal-delay-2">
          <OutdoorWidget
            isVisible={adjustedIsVisible}
            sunset={data.weather.sunset}
          />
        </section>

        {/* Alert Signup — Email + Push */}
        <section className="scroll-reveal scroll-reveal-delay-1">
          <AlertSignup />
        </section>

        {/* Live Webcams */}
        <section className="scroll-reveal scroll-reveal-delay-2">
          <LiveWebcams feeds={WEBCAM_FEEDS} />
        </section>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Viewpoints */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-white">
                {adjustedIsVisible ? "Best Viewpoints" : "Viewpoints"}
              </h2>
              <span className="text-[10px] text-white/15 font-medium">
                {filteredViewpoints.length} locations
              </span>
            </div>

            {/* Region filter — pill style, no boxes */}
            <div className="flex items-center gap-1">
              {REGIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => {
                    setRegionFilter(r.key);
                    setSelectedViewpoint(0);
                  }}
                  className={`text-[11px] font-medium px-3 py-1 rounded-full transition-all ${
                    regionFilter === r.key
                      ? "bg-white/[0.08] text-white/60"
                      : "text-white/20 hover:text-white/35"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Viewpoint list — no gaps between items, dividers instead */}
            <div className="divide-y divide-white/[0.04] max-h-[700px] overflow-y-auto scrollbar-thin">
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
          </section>

          {/* Weather details */}
          <section>
            <WeatherDetails
              weather={data.weather}
              reasons={data.visibility.reasons}
            />
          </section>
        </div>

        {/* About — no glass card, just text */}
        <section className="space-y-4 pt-4 border-t border-white/[0.04]">
          <p className="text-xs text-white/20 leading-relaxed max-w-2xl">
            If you live in the Pacific Northwest, you know the question: <span className="text-white/35">&quot;Is the mountain out?&quot;</span> This
            app scores Mt. Rainier visibility using real-time cloud layers, atmospheric visibility, and PM2.5 data.
            Everything runs on free public data from Open-Meteo and government webcam feeds.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-white/15">
            <span>No cookies</span>
            <span className="text-white/[0.06]">&middot;</span>
            <span>No analytics</span>
            <span className="text-white/[0.06]">&middot;</span>
            <span>No tracking</span>
            <span className="text-white/[0.06]">&middot;</span>
            <span>No login required</span>
            <span className="text-white/[0.06]">&middot;</span>
            <span>100% free</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400/50 to-violet-500/50 flex items-center justify-center text-[9px] font-bold text-white/70 ring-1 ring-white/[0.06]">
              JB
            </div>
            <div>
              <span className="text-xs text-white/30 font-medium">Jatin Batra</span>
              <span className="text-white/10 mx-2">&middot;</span>
              <a
                href="https://x.com/jatin_batra1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400/30 hover:text-blue-300 transition-colors"
              >
                @jatin_batra1
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-[11px] text-white/15 py-10 border-t border-white/[0.04] space-y-1.5 font-medium">
          <p>
            Weather data from{" "}
            <a
              href="https://open-meteo.com/"
              className="underline hover:text-white/30 transition-colors"
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

/**
 * Adjusts the base visibility score based on the user's selected neighborhood.
 * Different areas have different microclimates and elevations that affect views.
 */
function getNeighborhoodAdjustedScore(
  baseScore: number,
  neighborhood: string,
  weather: MountainData["weather"]
): number {
  // Neighborhood modifiers based on elevation, fog exposure, and typical obstructions
  const modifiers: Record<string, { elevationBonus: number; fogPenalty: number; obstructionPenalty: number }> = {
    "capitol-hill": { elevationBonus: 3, fogPenalty: -5, obstructionPenalty: -8 },
    "queen-anne": { elevationBonus: 8, fogPenalty: -2, obstructionPenalty: -3 },
    "ballard": { elevationBonus: 0, fogPenalty: -8, obstructionPenalty: -5 },
    "fremont": { elevationBonus: 1, fogPenalty: -6, obstructionPenalty: -6 },
    "downtown": { elevationBonus: 2, fogPenalty: -4, obstructionPenalty: -10 },
    "beacon-hill": { elevationBonus: 6, fogPenalty: -3, obstructionPenalty: -2 },
    "west-seattle": { elevationBonus: 5, fogPenalty: -4, obstructionPenalty: -1 },
    "columbia-city": { elevationBonus: 4, fogPenalty: -5, obstructionPenalty: -4 },
    "greenwood": { elevationBonus: 2, fogPenalty: -7, obstructionPenalty: -5 },
    "u-district": { elevationBonus: 1, fogPenalty: -6, obstructionPenalty: -7 },
    "bellevue": { elevationBonus: 4, fogPenalty: -3, obstructionPenalty: -5 },
    "kirkland": { elevationBonus: 2, fogPenalty: -5, obstructionPenalty: -6 },
    "tacoma": { elevationBonus: 1, fogPenalty: -4, obstructionPenalty: 0 },
    "renton": { elevationBonus: 3, fogPenalty: -5, obstructionPenalty: -3 },
  };

  const mod = modifiers[neighborhood];
  if (!mod) return baseScore;

  let adjusted = baseScore + mod.elevationBonus + mod.obstructionPenalty;

  // Apply fog penalty only when humidity is high (foggy conditions)
  if (weather.humidity > 85) {
    adjusted += mod.fogPenalty;
  }

  return Math.max(0, Math.min(100, Math.round(adjusted)));
}
