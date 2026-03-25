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
import { WEBCAM_FEEDS } from "@/lib/webcams";

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

interface MountainData {
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
  lastUpdated: string;
}

const REGIONS = [
  { key: "all", label: "All" },
  { key: "seattle", label: "Seattle" },
  { key: "eastside", label: "Eastside" },
  { key: "tacoma", label: "Tacoma" },
  { key: "south", label: "South" },
  { key: "north", label: "North" },
];

export default function Home() {
  const [data, setData] = useState<MountainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedViewpoint, setSelectedViewpoint] = useState(0);
  const [regionFilter, setRegionFilter] = useState("all");
  const [shared, setShared] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mountain-status");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Unable to fetch mountain status. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleShare = async () => {
    if (!data) return;
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
      if (!data) return;
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

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="ambient-bg" />
        <div className="noise-overlay" />
        <div className="relative text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-white/[0.06] border-t-blue-400/50 rounded-full animate-spin mx-auto" />
            <Mountain className="w-6 h-6 text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-white/30 animate-pulse text-sm font-medium tracking-wide">
            Checking the skies...
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="ambient-bg" />
        <div className="noise-overlay" />
        <div className="relative text-center space-y-4">
          <p className="text-red-400/80 font-medium">{error}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 glass rounded-xl hover:bg-white/[0.08] transition-colors text-sm font-medium text-white/60"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

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

  return (
    <main className="flex-1 relative" ref={mainRef}>
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

        {/* Hero Status - now with score breakdown */}
        <HeroStatus
          isVisible={data.visibility.isVisible}
          score={data.visibility.score}
          confidence={data.visibility.confidence}
          durationMessage={data.visibility.durationMessage}
          scoreBreakdown={{
            cloudLow: data.weather.cloudLow,
            cloudMid: data.weather.cloudMid,
            cloudHigh: data.weather.cloudHigh,
            visibilityMeters: data.weather.visibilityMeters,
            pm25: data.weather.pm25,
            weatherCode: data.weather.weatherCode,
          }}
        />

        {/* Mountain Scene - interactive */}
        <section className="scroll-reveal">
          <MountainScene
            skyTheme={data.skyTheme}
            isVisible={data.visibility.isVisible}
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

        {/* Interactive Night Sky (only at night) */}
        {isNight && (
          <section className="scroll-reveal scroll-reveal-delay-2">
            <NightSky
              sunrise={data.weather.sunrise || ""}
              isDay={data.weather.isDay}
            />
          </section>
        )}

        {/* Live Webcams */}
        <section className="scroll-reveal scroll-reveal-delay-2">
          <LiveWebcams feeds={WEBCAM_FEEDS} />
        </section>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Viewpoints */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-white">
                {data.visibility.isVisible ? "Best Viewpoints" : "Viewpoints"}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/15 font-medium hidden sm:inline">
                  Arrow keys to browse
                </span>
                <span className="text-xs text-white/20 font-medium">
                  {filteredViewpoints.length} locations
                </span>
              </div>
            </div>

            {/* Region filter */}
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => {
                    setRegionFilter(r.key);
                    setSelectedViewpoint(0);
                  }}
                  className={`text-xs font-medium px-3.5 py-1.5 rounded-xl transition-all ${
                    regionFilter === r.key
                      ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/25"
                      : "text-white/30 hover:text-white/45 hover:bg-white/[0.04]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredViewpoints.map((vp, i) => (
                <ViewpointCard
                  key={vp.id}
                  viewpoint={vp}
                  rank={i + 1}
                  isVisible={data.visibility.isVisible}
                  isSelected={selectedViewpoint === i}
                  onSelect={() => setSelectedViewpoint(i)}
                />
              ))}
            </div>
          </section>

          {/* Weather details - now with expandable cards */}
          <section>
            <WeatherDetails
              weather={data.weather}
              reasons={data.visibility.reasons}
            />
          </section>
        </div>

        {/* About */}
        <section className="glass rounded-3xl p-8 space-y-5">
          <h2 className="font-display text-lg font-bold text-white">About</h2>
          <div className="text-sm text-white/35 space-y-3 leading-relaxed">
            <p>
              If you live in the Pacific Northwest, you know the question. <strong className="text-white/55">&quot;Is the mountain out?&quot;</strong> On
              clear days, Rainier at 14,411 feet is hard to miss. But with Seattle weather, you never
              know when you&apos;ll actually get to see it. This app pulls real-time weather data
              (cloud layers, atmospheric visibility, PM2.5) and scores visibility for each
              viewpoint based on elevation, distance, and obstructions. No API keys, no cost.
              Everything runs on free public data from Open-Meteo and government webcam feeds.
            </p>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400/70 to-violet-500/70 flex items-center justify-center text-xs font-bold text-white ring-1 ring-white/10">
                JB
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">Built by Jatin Batra</p>
                <a
                  href="https://x.com/jatin_batra1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400/50 hover:text-blue-300 transition-colors font-medium"
                >
                  @jatin_batra1
                </a>
              </div>
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
