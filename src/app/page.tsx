"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import HeroStatus from "@/components/HeroStatus";
import MountainScene from "@/components/MountainScene";
import WeatherDetails from "@/components/WeatherDetails";
import ViewpointCard from "@/components/ViewpointCard";

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
  viewpoints: {
    id: string;
    name: string;
    description: string;
    distanceMiles: number;
    direction: string;
    elevation: number;
    bestFor: string;
    lat: number;
    lon: number;
  }[];
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

export default function Home() {
  const [data, setData] = useState<MountainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedViewpoint, setSelectedViewpoint] = useState(0);

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
    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto" />
          <p className="text-white/50">Checking the skies over Seattle...</p>
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

  return (
    <main className="flex-1">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
              R
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">
                IsTheMountainOut
              </h2>
              <p className="text-xs text-white/40">
                Mt. Rainier visibility from Seattle
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

        {/* Mountain Visual Simulation */}
        <section>
          <MountainScene
            skyTheme={data.skyTheme}
            isVisible={data.visibility.isVisible}
            viewpointName={data.viewpoints[selectedViewpoint]?.name}
          />
        </section>

        {/* Two column layout: viewpoints + weather */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Viewpoints */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              {data.visibility.isVisible
                ? "Best Viewpoints Right Now"
                : "Viewpoints to Check When It Clears"}
            </h2>
            <div className="space-y-3">
              {data.viewpoints.map((vp, i) => (
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
        </footer>
      </div>
    </main>
  );
}
