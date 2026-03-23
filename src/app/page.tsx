"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
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
  { key: "all", label: "All Locations" },
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
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto" />
          <p className="text-white/50 animate-pulse">Checking the skies over the Pacific Northwest...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm"
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
    <main className="flex-1">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-blue-500/20">
              R
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">
                IsTheMountainOut
              </h2>
              <p className="text-xs text-white/40">
                Real-time Mt. Rainier visibility tracker
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30">Updated {timeStr} PT</span>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 text-white/50 ${loading ? "animate-spin" : ""}`}
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

        {/* Mountain Visual Scene */}
        <section>
          <MountainScene
            skyTheme={data.skyTheme}
            isVisible={data.visibility.isVisible}
            viewpointName={selectedVp?.name}
            viewpointDistance={selectedVp?.distanceMiles}
          />
        </section>

        {/* Live Webcam Feeds */}
        <LiveWebcams feeds={WEBCAM_FEEDS} />

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Viewpoints */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {data.visibility.isVisible
                  ? "Best Viewpoints Right Now"
                  : "Viewpoints to Check When It Clears"}
              </h2>
              <span className="text-xs text-white/30">
                {filteredViewpoints.length} locations
              </span>
            </div>

            {/* Region filter tabs */}
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => {
                    setRegionFilter(r.key);
                    setSelectedViewpoint(0);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    regionFilter === r.key
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                      : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
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

        {/* About + Credits */}
        <section className="bg-white/[0.03] rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">About This Project</h2>
          <div className="text-sm text-white/50 space-y-3 leading-relaxed">
            <p>
              <strong className="text-white/70">Why I built this:</strong> As a Pacific Northwest
              resident, &quot;Is the mountain out?&quot; is the quintessential Seattle question. On
              clear days, seeing Mt. Rainier towering at 14,411 feet above the horizon is one of
              the most magical sights in the region. But with Seattle&apos;s famously cloudy weather,
              catching the mountain out is never guaranteed. I wanted a simple, beautiful way to
              check — and to know exactly <em>where</em> to go for the best views.
            </p>
            <p>
              This app uses real-time weather data including cloud layers at different altitudes,
              atmospheric visibility, air quality (PM2.5), and weather conditions to calculate
              visibility scores — not just for Seattle overall, but for each individual viewpoint
              based on its elevation, distance, and obstructions.
            </p>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                JB
              </div>
              <div>
                <p className="text-sm font-medium text-white/70">Built by Jatin Batra</p>
                <a
                  href="https://x.com/jatin_batra1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400/70 hover:text-blue-300 transition-colors"
                >
                  @jatin_batra1 on X
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-white/20 py-8 border-t border-white/5 space-y-1">
          <p>
            Weather data from{" "}
            <a
              href="https://open-meteo.com/"
              className="underline hover:text-white/40"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open-Meteo
            </a>{" "}
            &middot; Air quality from Open-Meteo AQ API
          </p>
          <p>
            Data refreshes every 15 minutes &middot; Visibility is estimated
            using cloud cover, atmospheric visibility, and air quality
            heuristics
          </p>
          <p className="mt-2 text-white/15">
            Built with Next.js, Tailwind CSS, and a love for the PNW &middot;{" "}
            <a
              href="https://x.com/jatin_batra1"
              className="underline hover:text-white/30"
              target="_blank"
              rel="noopener noreferrer"
            >
              @jatin_batra1
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
