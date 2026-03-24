"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Mountain } from "lucide-react";
import HeroStatus from "@/components/HeroStatus";
import MountainScene from "@/components/MountainScene";
import WeatherDetails from "@/components/WeatherDetails";
import ViewpointCard from "@/components/ViewpointCard";
import LiveWebcams from "@/components/LiveWebcams";
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

  async function fetchData() {
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
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
            Checking the skies over the Pacific Northwest...
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

  return (
    <main className="flex-1 relative">
      {/* Ambient background effects */}
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
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/20 font-medium">{timeStr} PT</span>
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

        {/* Hero Status */}
        <HeroStatus
          isVisible={data.visibility.isVisible}
          score={data.visibility.score}
          confidence={data.visibility.confidence}
          durationMessage={data.visibility.durationMessage}
        />

        {/* Mountain Scene */}
        <section className="animate-fade-up delay-200" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <MountainScene
            skyTheme={data.skyTheme}
            isVisible={data.visibility.isVisible}
            viewpointName={selectedVp?.name}
            viewpointDistance={selectedVp?.distanceMiles}
          />
        </section>

        {/* Live Webcams */}
        <section className="animate-fade-up delay-300" style={{ opacity: 0, animationFillMode: "forwards" }}>
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
              <span className="text-xs text-white/20 font-medium">
                {filteredViewpoints.length} locations
              </span>
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

          {/* Weather details */}
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
              <strong className="text-white/55">&quot;Is the mountain out?&quot;</strong> — the quintessential
              Seattle question. On clear days, Mt. Rainier towering at 14,411 feet above the horizon is one of
              the most magical sights in the Pacific Northwest. This app uses real-time weather data including
              cloud layers, atmospheric visibility, air quality (PM2.5), and weather conditions to calculate
              visibility scores for each viewpoint.
            </p>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400/70 to-violet-500/70 flex items-center justify-center text-xs font-bold text-white ring-1 ring-white/10">
                JB
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">Jatin Batra</p>
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
