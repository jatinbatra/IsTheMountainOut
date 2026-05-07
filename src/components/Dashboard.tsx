"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { RefreshCw, Home, MapPin, Map, BarChart3, Clock, Star, Info, Mountain, Compass, Share2, Eye } from "lucide-react";
import MountainSilhouetteScore from "@/components/MountainSilhouetteScore";
import MountainMoment from "@/components/MountainMoment";
import WeatherDetails from "@/components/WeatherDetails";
import ViewpointMap from "@/components/ViewpointMap";
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
import { useAutoLocation } from "@/hooks/useAutoLocation";
import { getCurrentSeason, getSeasonalPalette, getSeasonalStatusWord, getCSSVariables } from "@/lib/seasonal";

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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SIDEBAR_ITEMS = [
  { icon: Home, label: "Home", id: "home" },
  { icon: MapPin, label: "Views", id: "viewpoints" },
  { icon: Map, label: "Map", id: "map" },
  { icon: BarChart3, label: "Forecast", id: "forecast" },
  { icon: Clock, label: "History", id: "history" },
  { icon: Star, label: "Favorites", id: "favorites" },
  { icon: Info, label: "About", id: "about" },
] as const;

const VIEWPOINT_NAMES = [
  { id: "kerry-park", name: "Kerry Park", sub: "Queen Anne" },
  { id: "space-needle", name: "Space Needle", sub: "Downtown" },
  { id: "gas-works", name: "Gas Works", sub: "Wallingford" },
  { id: "bellevue", name: "Bellevue", sub: "Eastside" },
  { id: "green-lake", name: "Green Lake", sub: "North Seattle" },
  { id: "snoqualmie", name: "Snoqualmie Pass", sub: "Cascades" },
];

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
  const [activeNav, setActiveNav] = useState("home");

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

  const neighborhoodLabel = neighborhood ? NEIGHBORHOOD_LABELS[neighborhood] ?? null : null;
  const topViewpoint = data.viewpoints[0];

  const lastUpdate = new Date(data.lastUpdated);
  const timeStr = lastUpdate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });

  const isNight = !data.weather.isDay;
  const visMiles = Math.round(data.weather.visibilityMeters / 1609.34);
  const tempF = Math.round((data.weather.temperature * 9) / 5 + 32);

  const season = getCurrentSeason();
  const palette = getSeasonalPalette(season);
  const seasonalStatus = getSeasonalStatusWord(season, adjustedIsVisible, isNight);
  const seasonVars = getCSSVariables(palette);

  // Score gauge calculations
  const gaugeRadius = 70;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeDashoffset = gaugeCircumference - (neighborhoodAdjustedScore / 100) * gaugeCircumference;

  // Factor scores for "Why the Mountain is Out" breakdown
  const cloudScore = Math.round(100 - data.weather.cloudLow);
  const aqScore = data.weather.pm25 !== undefined ? Math.round(Math.max(0, 100 - (data.weather.pm25 / 50) * 100)) : 85;
  const humidityScore = Math.round(Math.max(0, 100 - (data.weather.humidity - 40)));
  const lightingScore = data.weather.isDay ? 85 : 40;

  const factors = [
    { label: "Cloud Cover", desc: "Low clouds directly block the peak", value: cloudScore, suffix: `${data.weather.cloudLow}% coverage` },
    { label: "Air Quality (PM2.5)", desc: "Particulates in the air", value: aqScore, suffix: data.weather.pm25 !== undefined ? `${data.weather.pm25.toFixed(1)} µg/m³` : "Good" },
    { label: "Humidity", desc: "Moisture in the atmosphere", value: humidityScore, suffix: `${data.weather.humidity}%` },
    { label: "Lighting", desc: "Sun angle and daylight", value: lightingScore, suffix: data.weather.isDay ? "Daylight" : "Night" },
  ];

  const selectedVpName = VIEWPOINT_NAMES[selectedViewpoint] ?? VIEWPOINT_NAMES[0];

  return (
    <div className="flex min-h-screen" style={seasonVars as React.CSSProperties}>
      <PWAInstallPrompt />

      {/* ── SIDEBAR NAV ── */}
      <nav className="sidebar" aria-label="Main navigation">
        <div className="mb-4 mt-2">
          <Mountain className="w-6 h-6 text-[var(--season-accent)]" />
        </div>
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeNav === item.id ? "active" : ""}`}
            onClick={() => {
              setActiveNav(item.id);
              const el = document.getElementById(`section-${item.id}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
        <div className="mt-auto mb-4 flex flex-col items-center gap-1">
          <span className="text-[var(--season-accent)] text-[8px] font-mono uppercase tracking-wider" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
            THE MOUNTAIN IS
          </span>
          <span className="font-display text-[var(--season-accent)] text-xs italic">Calling</span>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main
        className="main-with-sidebar flex-1 ml-[80px] min-h-screen"
        role="main"
        aria-label="Mountain visibility dashboard"
      >
        {/* ── HERO: Seattle skyline + YES. CLEAR PEAK. ── */}
        <section id="section-home" className="hero-section relative w-full h-[280px]">
          <div className="absolute inset-0">
            <FeaturedWebcam />
          </div>
          <div className="hero-overlay absolute inset-0" />

          {/* Location bar */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-4">
            <div className="flex items-center gap-3">
              <span className="font-display text-white/90 text-sm tracking-tight flex items-center gap-2">
                <Mountain className="w-4 h-4" />
                IS THE MOUNTAIN OUT?
              </span>
              <span className="text-white/40 text-xs">MT. RAINIER VISIBILITY TRACKER</span>
            </div>
            <div className="dash-card !py-1.5 !px-3 flex items-center gap-3 text-xs">
              <MapPin className="w-3 h-3 text-[var(--season-accent)]" />
              <span className="text-[var(--text-primary)] font-medium">{selectedVpName.name}, {selectedVpName.sub}</span>
              <span className="text-[var(--text-tertiary)]">·</span>
              <span className="text-[var(--text-tertiary)]">{timeStr} PT</span>
            </div>
            <div className="dash-card !py-1.5 !px-3 flex items-center gap-4 text-xs">
              <span className="text-[var(--text-primary)] font-mono tabular">{tempF}°F</span>
              <span className="text-[var(--text-tertiary)]">Wind {Math.round(data.weather.windSpeed)} mph</span>
              <span className="text-[var(--text-tertiary)]">{data.weather.humidity}%</span>
              <span className="text-[var(--text-tertiary)]">{visMiles} mi</span>
            </div>
          </div>

          {/* Hero text */}
          <div className="relative z-10 flex flex-col items-center justify-center mt-6">
            <p className="font-mono text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2">
              SEATTLE, WA
            </p>
            <h1 className="font-display text-white text-center leading-none" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
              {adjustedIsVisible ? "YES." : "NOT TODAY."}
              {" "}
              <span className="text-[var(--season-accent)]">{seasonalStatus}.</span>
            </h1>
            <p className="text-white/50 text-sm mt-2">
              {adjustedIsVisible
                ? `Beautiful visibility right now from ${selectedVpName.name}`
                : data.visibility.durationMessage
              }
            </p>
          </div>
        </section>

        {/* ── VIEWPOINT CAROUSEL ── */}
        <div id="section-viewpoints" className="px-6 py-4 border-b border-[var(--border-light)]">
          <div className="viewpoint-carousel">
            {VIEWPOINT_NAMES.map((vp, i) => (
              <button
                key={vp.id}
                className={`viewpoint-thumb ${selectedViewpoint === i ? "active" : ""}`}
                onClick={() => setSelectedViewpoint(i)}
              >
                <div
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg ${
                    selectedViewpoint === i
                      ? "border-[var(--season-accent)] bg-[var(--season-accent)]/10 shadow-[0_0_12px_rgba(74,222,128,0.3)]"
                      : "border-[var(--border-light)] bg-[var(--bg-tertiary)]"
                  }`}
                >
                  <MapPin className={`w-5 h-5 ${selectedViewpoint === i ? "text-[var(--season-accent)]" : "text-[var(--text-tertiary)]"}`} />
                </div>
                <span className={`text-[10px] font-medium ${selectedViewpoint === i ? "text-[var(--season-accent)]" : "text-[var(--text-tertiary)]"}`}>
                  {vp.name.length > 10 ? vp.name.split(" ")[0] : vp.name}
                </span>
                <span className="text-[8px] text-[var(--text-tertiary)]">{vp.sub}</span>
              </button>
            ))}
            <button className="viewpoint-thumb opacity-50">
              <div className="w-14 h-14 rounded-full border-2 border-[var(--border-light)] bg-[var(--bg-tertiary)] flex items-center justify-center">
                <span className="text-[var(--text-tertiary)] text-xl">→</span>
              </div>
            </button>
          </div>
        </div>

        {/* ── MAIN DASHBOARD GRID ── */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1.2fr] gap-4">

            {/* Card 1: Mountain Visibility Score */}
            <div className="dash-card flex flex-col items-center">
              <div className="dash-card-header w-full">Mountain Visibility Score</div>
              <div className="score-gauge my-2">
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r={gaugeRadius} className="gauge-track" />
                  <circle
                    cx="80" cy="80" r={gaugeRadius}
                    className="gauge-fill"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeDashoffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-4xl text-[var(--season-accent)] tabular">{neighborhoodAdjustedScore}%</span>
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">
                    {neighborhoodAdjustedScore >= 76 ? "Great Visibility" : neighborhoodAdjustedScore >= 50 ? "Moderate" : "Poor Visibility"}
                  </span>
                </div>
              </div>
              {/* Mountain illustration */}
              <div className="w-full mt-2">
                <MountainSilhouetteScore
                  score={neighborhoodAdjustedScore}
                  isVisible={adjustedIsVisible}
                  isNight={isNight}
                  seasonLabel=""
                />
              </div>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-[var(--text-tertiary)]">
                <RefreshCw className={`w-3 h-3 ${isValidating ? "animate-spin" : ""}`} />
                <span>Updated {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min ago</span>
                <span className="text-[var(--text-tertiary)]">·</span>
                <span className={adjustedIsVisible ? "text-[var(--season-accent)]" : "text-[var(--status-warning)]"}>
                  {adjustedIsVisible ? "Improving" : "Declining"}
                </span>
              </div>
            </div>

            {/* Card 2: Why the Mountain is Out */}
            <div className="dash-card">
              <div className="dash-card-header">Why the Mountain is {adjustedIsVisible ? "Out" : "Hidden"}</div>
              <div className="space-y-4">
                {factors.map((f) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--text-primary)] font-medium">{f.label}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono tabular">{f.suffix}</span>
                    </div>
                    <div className="factor-bar">
                      <div
                        className={`factor-bar-fill ${f.value >= 70 ? "good" : f.value >= 40 ? "warning" : "critical"}`}
                        style={{ width: `${f.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-[10px] text-[var(--season-accent)] font-mono uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors">
                How it works →
              </button>
            </div>

            {/* Card 3: Visibility by Neighborhood */}
            <div id="section-map" className="dash-card">
              <div className="dash-card-header">Visibility by Neighborhood</div>
              <ViewpointMap
                viewpoints={data.viewpoints.slice(0, 8).map((vp) => ({
                  id: vp.id,
                  name: vp.name,
                  lat: vp.lat,
                  lon: vp.lon,
                  score: vp.locationScore,
                  region: vp.region,
                }))}
                selectedId={data.viewpoints[selectedViewpoint]?.id}
                onSelectViewpoint={(id) => {
                  const index = data.viewpoints.findIndex((vp) => vp.id === id);
                  if (index >= 0) setSelectedViewpoint(index);
                }}
                baseScore={neighborhoodAdjustedScore}
              />
              {/* Top neighborhood scores list */}
              <div className="mt-3 space-y-1">
                {allNeighborhoodScores.slice(0, 5).map((ns) => (
                  <div key={ns.id} className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text-secondary)]">{NEIGHBORHOOD_LABELS[ns.id] ?? ns.id}</span>
                    <span className={`font-mono tabular ${ns.score >= 70 ? "text-[var(--season-accent)]" : ns.score >= 50 ? "text-[var(--status-warning)]" : "text-[var(--status-critical)]"}`}>
                      {ns.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4: Forecast */}
            <div id="section-forecast" className="dash-card">
              <div className="dash-card-header">Forecast for {selectedVpName.name}</div>
              <ForecastHub
                hourlyTimeline={data.hourlyTimeline}
                currentScore={data.visibility.score}
                isVisible={adjustedIsVisible}
                weeklyForecast={data.weeklyForecast}
                sunset={data.weather.sunset}
              />
              <div className="mt-3 dash-card !bg-[var(--bg-tertiary)] !p-3">
                <p className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium mb-1">Best Viewing Window</p>
                <NextClearWindow
                  hourlyTimeline={data.hourlyTimeline}
                  weeklyForecast={data.weeklyForecast}
                  currentScore={neighborhoodAdjustedScore}
                />
              </div>
            </div>
          </div>

          {/* ── ROW 2: Secondary cards ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-4 mt-4">
            {/* Webcams */}
            <div className="dash-card">
              <div className="dash-card-header">Live Webcams</div>
              <LiveWebcams feeds={WEBCAM_FEEDS} />
            </div>

            {/* Local Tip */}
            <div className="dash-card">
              <div className="dash-card-header">Local Tip</div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {topViewpoint
                  ? `${topViewpoint.name} offers one of the best views. ${topViewpoint.distanceMiles} miles ${topViewpoint.direction} with the mountain often peeking above the city skyline.`
                  : "Check different viewpoints for the best angle on Rainier today."
                }
              </p>
              {adjustedIsVisible && topViewpoint && (
                <a
                  href={topViewpoint.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-[var(--season-accent)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Compass className="w-3 h-3" />
                  Get directions
                </a>
              )}
            </div>

            {/* Last Confirmed Sighting */}
            <div className="dash-card flex flex-col">
              <div className="dash-card-header">Last Confirmed Sighting</div>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                {topViewpoint ? `From ${topViewpoint.name}` : "Community spotters"}
              </p>
              <div className="mt-auto">
                <SpotterButton isVisible={adjustedIsVisible} score={neighborhoodAdjustedScore} />
              </div>
            </div>
          </div>

          {/* ── BOTTOM INFO STRIP ── */}
          <div id="section-history" className="info-strip mt-4">
            {/* Did You Know */}
            <div className="info-strip-item">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Did You Know</span>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Mt. Rainier has been featured in the original Starbucks logo.
              </p>
              <button className="text-[10px] text-[var(--season-accent)] mt-1">SEE THE STORY →</button>
            </div>

            {/* Streak */}
            <div className="info-strip-item text-center">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Streak</span>
              <GlobalStreakBadge />
              <span className="text-[9px] text-[var(--text-tertiary)]">consecutive mountain-out hours</span>
            </div>

            {/* Elevation Advantage */}
            <div className="info-strip-item">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Elevation Advantage</span>
              <p className="text-sm text-[var(--text-primary)] font-mono tabular mt-1">14,411 ft</p>
              <p className="text-[9px] text-[var(--text-tertiary)]">Every 1,000ft above sea level improves visibility by ~3%</p>
            </div>

            {/* Direction to Rainier */}
            <div className="info-strip-item">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Direction to Rainier</span>
              <div className="flex items-center gap-2 mt-1">
                <Compass className="w-5 h-5 text-[var(--season-accent)]" />
                <span className="text-sm text-[var(--text-primary)] font-mono">SSE (158°)</span>
              </div>
              <p className="text-[9px] text-[var(--text-tertiary)]">~59 miles from Seattle</p>
            </div>

            {/* Share */}
            <div className="info-strip-item">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Share the View</span>
              <div className="flex items-center gap-2 mt-2">
                <SmsShareButton score={neighborhoodAdjustedScore} neighborhoodLabel={neighborhoodLabel} />
                <MountainMoment isVisible={adjustedIsVisible} score={neighborhoodAdjustedScore} neighborhoodLabel={neighborhoodLabel} durationMessage={data.visibility.durationMessage} />
              </div>
              <span className="text-[9px] text-[var(--season-accent)] font-mono mt-1">#IsTheMountainOut</span>
            </div>
          </div>

          {/* ── EXPANDABLE SECTIONS ── */}
          <div id="section-favorites" className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            {/* Weather Details */}
            <div className="dash-card">
              <div className="dash-card-header">Weather Details</div>
              <WeatherDetails weather={data.weather} reasons={data.visibility.reasons} />
            </div>

            {/* Notifications */}
            <div className="dash-card">
              <div className="dash-card-header">Get Notified</div>
              <NotifyCard />
            </div>
          </div>

          {/* Community + Photos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="dash-card">
              <div className="dash-card-header">Neighborhood Spotters</div>
              <CommunityGames selectedHood={neighborhood} onSelectHood={setNeighborhood} fallbackScores={allNeighborhoodScores} fallbackLabels={NEIGHBORHOOD_LABELS} />
            </div>
            <div className="dash-card">
              <div className="dash-card-header">Community Photos</div>
              <PhotoDrop neighborhood={neighborhood} />
            </div>
          </div>

          {isNight && (
            <div className="dash-card mt-4">
              <NightSky sunrise={data.weather.sunrise || ""} isDay={data.weather.isDay} />
            </div>
          )}

          {data.alpenglow && data.alpenglow.probability >= 40 && data.alpenglow.minutesToSunset > 0 && data.alpenglow.minutesToSunset <= 60 && (
            <div className="dash-card mt-4 !border-l-[var(--status-warning)]" style={{ borderLeftWidth: 3 }}>
              <p className="text-[10px] text-[var(--status-warning)] uppercase tracking-wider font-medium">Alpenglow Alert</p>
              <p className="font-display text-lg text-[var(--text-primary)] mt-1">Mountain could turn pink in ~{data.alpenglow.minutesToSunset}min</p>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">{data.alpenglow.probability}% probability</p>
            </div>
          )}

          {/* ── FOOTER ── */}
          <footer id="section-about" className="divider-cedar mt-8 pt-6 pb-8">
            <PrivacyCommitment />
            <p className="text-xs text-[var(--text-tertiary)] mt-3 leading-relaxed">
              A Pacific Northwest field report. Mt. Rainier visibility scored from real-time cloud layers, atmospheric clarity, and particulate matter across the Puget Sound region.
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs">
              <span className="text-[var(--text-tertiary)]">By</span>
              <span className="text-[var(--text-primary)] font-medium">Jatin Batra</span>
              <a href="https://x.com/jatin_batra1" target="_blank" rel="noopener noreferrer" className="text-[var(--season-accent)] hover:text-[var(--text-primary)] transition-colors">@jatin_batra1</a>
            </div>
            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-[var(--border-light)]">
              <a href="/almanac" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Almanac</a>
              <a href="/embed" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Embed</a>
              <a href="/api/stats.json" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">API</a>
              <span className="font-mono text-[9px] text-[var(--text-tertiary)] ml-auto">Open-Meteo · 15min · {palette.label}</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
