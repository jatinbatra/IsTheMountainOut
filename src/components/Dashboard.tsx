"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  RefreshCw, Home, MapPin, Map, BarChart3, Clock, Star, Info,
  Mountain, Compass, Eye, Sun, Wind, Droplets, ChevronLeft, ChevronRight,
  TrendingUp, TreePine, Gauge,
} from "lucide-react";
import MountainSilhouetteScore from "@/components/MountainSilhouetteScore";
import MountainMoment from "@/components/MountainMoment";
import WeatherDetails from "@/components/WeatherDetails";
import ViewpointMap from "@/components/ViewpointMap";
import LiveWebcams from "@/components/LiveWebcams";
import NightSky from "@/components/NightSky";
import FeaturedWebcam from "@/components/FeaturedWebcam";
import NotifyCard from "@/components/NotifyCard";
import ForecastHub from "@/components/ForecastHub";
import CommunityGames from "@/components/CommunityGames";
import PhotoDrop from "@/components/PhotoDrop";
import GlobalStreakBadge from "@/components/GlobalStreakBadge";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NextClearWindow from "@/components/NextClearWindow";
import SpotterButton from "@/components/SpotterButton";
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
  { icon: Eye, label: "Views", id: "viewpoints" },
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

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function Dashboard({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const carouselRef = useRef<HTMLDivElement>(null);

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

  const gaugeRadius = 65;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeDashoffset = gaugeCircumference - (neighborhoodAdjustedScore / 100) * gaugeCircumference;

  const cloudScore = Math.round(100 - data.weather.cloudLow);
  const aqScore = data.weather.pm25 !== undefined ? Math.round(Math.max(0, 100 - (data.weather.pm25 / 50) * 100)) : 85;
  const humidityScore = Math.round(Math.max(0, 100 - (data.weather.humidity - 40)));
  const lightingScore = data.weather.isDay ? 85 : 40;

  const factors = [
    {
      label: "Cloud Cover",
      desc: `Low clouds below the peak`,
      value: cloudScore,
      suffix: `${data.weather.cloudLow}%`,
      status: cloudScore >= 70 ? "GOOD" : cloudScore >= 40 ? "FAIR" : "POOR",
    },
    {
      label: "Air Quality (PM2.5)",
      desc: "Clean and clear air",
      value: aqScore,
      suffix: data.weather.pm25 !== undefined ? `${data.weather.pm25.toFixed(0)} µg/m³` : "Good",
      status: aqScore >= 70 ? "GOOD" : aqScore >= 40 ? "FAIR" : "POOR",
    },
    {
      label: "Humidity",
      desc: "Low moisture in the air",
      value: humidityScore,
      suffix: `${data.weather.humidity}%`,
      status: humidityScore >= 70 ? "GOOD" : humidityScore >= 40 ? "FAIR" : "POOR",
    },
    {
      label: "Lighting",
      desc: data.weather.isDay ? "Golden hour boost" : "Reduced at night",
      value: lightingScore,
      suffix: data.weather.isDay ? "+18%" : "-20%",
      status: lightingScore >= 70 ? "EXCELLENT" : lightingScore >= 40 ? "FAIR" : "POOR",
    },
  ];

  const selectedVpName = VIEWPOINT_NAMES[selectedViewpoint] ?? VIEWPOINT_NAMES[0];

  const scrollCarousel = (dir: number) => {
    carouselRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen" style={seasonVars as React.CSSProperties}>
      <PWAInstallPrompt />

      {/* ═══ SIDEBAR ═══ */}
      <nav className="sidebar" aria-label="Main navigation">
        <div className="sidebar-logo">
          <svg viewBox="0 0 40 40" className="w-9 h-9" aria-hidden="true">
            <path d="M20 4 L8 30 L14 30 L17 22 L20 14 L23 22 L26 30 L32 30 Z" fill="var(--season-accent, #3ecf8e)" opacity="0.8" />
            <path d="M17 22 L20 14 L23 22 L21 18 L19 18 Z" fill="var(--season-mountain-snow, #b8c8be)" opacity="0.6" />
            <line x1="6" y1="31" x2="34" y2="31" stroke="var(--season-accent, #3ecf8e)" strokeWidth="1" opacity="0.3" />
            <polygon points="10,31 12,26 14,31" fill="var(--season-accent, #3ecf8e)" opacity="0.2" />
            <polygon points="28,31 30,27 32,31" fill="var(--season-accent, #3ecf8e)" opacity="0.2" />
          </svg>
        </div>

        <div className="sidebar-brand">
          <div className="sidebar-brand-title">Is The Mountain Out?</div>
          <div className="sidebar-brand-sub">Mt. Rainier Tracker</div>
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

        <div className="sidebar-bottom">
          <span className="sidebar-calling">THE MOUNTAIN IS</span>
          <span className="sidebar-calling-accent">Calling</span>
        </div>
      </nav>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="main-with-sidebar flex-1 ml-[82px] min-h-screen" role="main">

        {/* ═══ HERO ═══ */}
        <section
          id="section-home"
          className="hero-section relative"
          style={{ height: "60vh", minHeight: "480px" }}
        >
          <div className="absolute inset-0 z-0">
            <FeaturedWebcam />
          </div>
          <div className="hero-gradient-bottom" />
          <div className="hero-gradient-top" />
          <div className="hero-vignette" />
          <div className="hero-warm-glow" />
          <div className="hero-grain" />

          {/* Top bar */}
          <div className="relative z-10 flex items-start justify-between px-8 pt-6">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <Mountain className="w-5 h-5 text-white/60" />
              <div>
                <span className="text-white/80 text-sm font-semibold tracking-wide">IS THE MOUNTAIN OUT?</span>
                <span className="text-white/30 text-[9px] block tracking-[0.12em] uppercase mt-0.5">Mt. Rainier Visibility Tracker</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hero-location-pill"
            >
              <MapPin className="w-3 h-3 text-[var(--season-accent)]" />
              <span>{selectedVpName.name}, {selectedVpName.sub}</span>
              <span className="text-white/30">·</span>
              <span>{timeStr} PDT</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hero-weather-chip"
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-400/80" />
                <div>
                  <span className="text-lg font-semibold tabular">{tempF}°F</span>
                  <span className="text-[10px] text-white/50 block uppercase tracking-wider">
                    {data.weather.isDay ? "Sunny" : "Clear"}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 mt-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                  <Wind className="w-3 h-3" />
                  <span className="tabular">{Math.round(data.weather.windSpeed)} mph</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                  <Droplets className="w-3 h-3" />
                  <span className="tabular">{data.weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                  <Eye className="w-3 h-3" />
                  <span className="tabular">{visMiles} mi</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hero center text */}
          <div className="relative z-10 flex flex-col items-center justify-center" style={{ marginTop: "6vh" }}>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="hero-location-label"
            >
              SEATTLE, WA
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="hero-headline"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            >
              {adjustedIsVisible ? "YES." : "NOT TODAY."}{" "}
              <span className="hero-headline-accent">{seasonalStatus}.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="hero-subtitle"
            >
              <MapPin className="w-3 h-3" />
              {adjustedIsVisible
                ? `Beautiful visibility right now from ${selectedVpName.name}`
                : data.visibility.durationMessage}
            </motion.p>
          </div>
        </section>

        {/* ═══ VIEWPOINT CAROUSEL ═══ */}
        <div id="section-viewpoints" className="viewpoint-strip">
          <div className="viewpoint-strip-inner">
            <button className="carousel-arrow" onClick={() => scrollCarousel(-1)} aria-label="Scroll left">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div ref={carouselRef} className="viewpoint-carousel">
              {VIEWPOINT_NAMES.map((vp, i) => (
                <motion.button
                  key={vp.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className={`viewpoint-item ${selectedViewpoint === i ? "active" : ""}`}
                  onClick={() => setSelectedViewpoint(i)}
                >
                  <div className={`viewpoint-thumb ${selectedViewpoint === i ? "active" : ""}`}>
                    <MapPin className={`w-5 h-5 ${selectedViewpoint === i ? "text-[var(--season-accent)]" : "text-[var(--text-tertiary)]"}`} />
                  </div>
                  <span className="viewpoint-name">
                    {vp.name.length > 10 ? vp.name.split(" ")[0] : vp.name}
                  </span>
                  <span className="viewpoint-sub">{vp.sub}</span>
                </motion.button>
              ))}
            </div>

            <button className="carousel-arrow" onClick={() => scrollCarousel(1)} aria-label="Scroll right">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ═══ DASHBOARD GRID ═══ */}
        <div className="dashboard-content">
          <motion.div
            className="dashboard-grid"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            {/* ─── Card 1: Mountain Visibility Score ─── */}
            <motion.div variants={fadeUp} className="dash-card flex flex-col items-center">
              <div className="dash-card-header w-full">Mountain Visibility Score</div>

              <div className="relative my-3">
                <div className="score-gauge">
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
                    <span className="font-display tabular" style={{ fontSize: "2.8rem", color: "var(--season-accent)" }}>
                      {neighborhoodAdjustedScore}
                      <span style={{ fontSize: "1.2rem", opacity: 0.7 }}>%</span>
                    </span>
                    <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-[0.12em] font-semibold mt-0.5">
                      {neighborhoodAdjustedScore >= 76 ? "Great Visibility" : neighborhoodAdjustedScore >= 50 ? "Moderate" : "Poor Visibility"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mountain silhouette */}
              <div className="w-full px-2 mt-1">
                <MountainSilhouetteScore
                  score={neighborhoodAdjustedScore}
                  isVisible={adjustedIsVisible}
                  isNight={isNight}
                  seasonLabel=""
                />
              </div>

              <div className="flex items-center gap-3 mt-4 text-[9px] text-[var(--text-tertiary)] w-full justify-center">
                <div className="flex items-center gap-1.5">
                  <RefreshCw className={`w-3 h-3 ${isValidating ? "animate-spin" : ""}`} />
                  <span>Updated {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min ago</span>
                </div>
                <span className="text-[var(--border-medium)]">·</span>
                <div className="flex items-center gap-1">
                  <span>Trend</span>
                  <TrendingUp className="w-3 h-3" />
                  <span className={adjustedIsVisible ? "text-[var(--season-accent)]" : "text-[var(--status-warning)]"}>
                    {adjustedIsVisible ? "Improving" : "Declining"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ─── Card 2: Why the Mountain is Out ─── */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">Why the Mountain is {adjustedIsVisible ? "Out" : "Hidden"}</div>
              <div className="space-y-0">
                {factors.map((f) => (
                  <div key={f.label} className="factor-row">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] text-[var(--text-primary)] font-medium">{f.label}</span>
                        <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5">{f.desc}</p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <span className={`text-[10px] font-bold tracking-wider ${
                          f.status === "EXCELLENT" ? "text-[var(--season-accent)]" :
                          f.status === "GOOD" ? "text-[var(--season-accent)]" :
                          f.status === "FAIR" ? "text-[var(--status-warning)]" :
                          "text-[var(--status-critical)]"
                        }`}>
                          {f.status}
                        </span>
                        <span className="text-[9px] text-[var(--text-tertiary)] font-mono tabular block mt-0.5">
                          {f.suffix}
                        </span>
                      </div>
                    </div>
                    <div className="factor-bar mt-1.5">
                      <div
                        className={`factor-bar-fill ${f.value >= 70 ? "good" : f.value >= 40 ? "warning" : "critical"}`}
                        style={{ width: `${f.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-[10px] text-[var(--season-accent)] font-mono uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
                How it works
                <span className="text-xs">→</span>
              </button>
            </motion.div>

            {/* ─── Card 3: Visibility by Neighborhood ─── */}
            <motion.div variants={fadeUp} id="section-map" className="dash-card">
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
              <div className="mt-3 space-y-1.5">
                {allNeighborhoodScores.slice(0, 6).map((ns) => (
                  <div key={ns.id} className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text-secondary)] uppercase tracking-wider font-medium">{NEIGHBORHOOD_LABELS[ns.id] ?? ns.id}</span>
                    <span className={`font-mono tabular font-semibold ${
                      ns.score >= 70 ? "text-[var(--season-accent)]" :
                      ns.score >= 50 ? "text-[var(--status-warning)]" :
                      "text-[var(--status-critical)]"
                    }`}>
                      {ns.score}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/[0.03]">
                {[
                  { label: "90-100%", color: "bg-emerald-500" },
                  { label: "70-89%", color: "bg-emerald-700" },
                  { label: "50-69%", color: "bg-amber-500" },
                  { label: "30-49%", color: "bg-amber-700" },
                  { label: "0-29%", color: "bg-red-500/60" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1 text-[8px] text-[var(--text-tertiary)]">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    {l.label}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ─── Card 4: Forecast Column ─── */}
            <motion.div variants={fadeUp} id="section-forecast" className="space-y-5">
              <div className="dash-card">
                <div className="dash-card-header">Forecast for {selectedVpName.name}</div>
                <ForecastHub
                  hourlyTimeline={data.hourlyTimeline}
                  currentScore={data.visibility.score}
                  isVisible={adjustedIsVisible}
                  weeklyForecast={data.weeklyForecast}
                  sunset={data.weather.sunset}
                />
                <div className="mt-4 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.03]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400/70" />
                    <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Best Viewing Window</span>
                  </div>
                  <NextClearWindow
                    hourlyTimeline={data.hourlyTimeline}
                    weeklyForecast={data.weeklyForecast}
                    currentScore={neighborhoodAdjustedScore}
                  />
                </div>
              </div>

              {/* Local Tip */}
              <div className="dash-card">
                <div className="dash-card-header">Local Tip</div>
                <div className="flex items-start gap-3">
                  <TreePine className="w-4 h-4 text-[var(--season-accent)] mt-0.5 flex-shrink-0 opacity-60" />
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed italic">
                    {topViewpoint
                      ? `After a front moves through, the mountain often pops out the next morning. ${topViewpoint.name} offers stunning views from ${topViewpoint.distanceMiles} miles ${topViewpoint.direction}.`
                      : "After storms pass, the mountain often appears clearest the next morning."}
                  </p>
                </div>
                {adjustedIsVisible && topViewpoint && (
                  <a
                    href={topViewpoint.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-[10px] text-[var(--season-accent)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider font-medium"
                  >
                    <Compass className="w-3 h-3" />
                    Get directions →
                  </a>
                )}
              </div>

              {/* Last Confirmed Sighting */}
              <div className="dash-card">
                <div className="dash-card-header">Last Confirmed Sighting</div>
                <p className="text-[10px] text-[var(--text-tertiary)] mb-3">
                  {topViewpoint ? `3 min ago from ${topViewpoint.name}` : "Recent community spotters"}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-[var(--bg-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <span className="text-[8px] text-[var(--text-tertiary)]">👤</span>
                      </div>
                    ))}
                  </div>
                  <SpotterButton isVisible={adjustedIsVisible} score={neighborhoodAdjustedScore} />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ═══ BOTTOM INSIGHT STRIP ═══ */}
          <motion.div
            id="section-history"
            className="bottom-strip"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            {/* Streak */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">Streak</div>
              <div className="flex items-center gap-4">
                <GlobalStreakBadge />
                <div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    in a row the mountain has been visible from here!
                  </p>
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold ${
                      i < 3
                        ? "bg-[var(--accent-dim)] text-[var(--season-accent)]"
                        : "bg-white/[0.03] text-[var(--text-tertiary)]"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Elevation Advantage */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">Elevation Advantage</div>
              <div className="flex items-end gap-3">
                <svg viewBox="0 0 80 50" className="w-20 h-12 flex-shrink-0" aria-hidden="true">
                  <path d="M5 48 L30 15 L40 8 L50 15 L75 48 Z" fill="var(--season-mountain-base)" opacity="0.4" />
                  <path d="M30 15 L40 8 L50 15 L45 12 L35 12 Z" fill="var(--season-mountain-snow)" opacity="0.5" />
                  <line x1="75" y1="48" x2="75" y2="8" stroke="var(--text-tertiary)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
                  <text x="77" y="10" fill="var(--text-tertiary)" fontSize="4" opacity="0.5">14,411 ft</text>
                  <text x="77" y="47" fill="var(--text-tertiary)" fontSize="4" opacity="0.5">275 ft</text>
                </svg>
                <div>
                  <p className="text-[11px] text-[var(--text-secondary)]">You&apos;re at 275 ft</p>
                  <p className="text-[9px] text-[var(--text-tertiary)] mt-1">Every 1,000ft of elevation improves your odds</p>
                </div>
              </div>
            </motion.div>

            {/* Direction to Rainier */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">Direction to Rainier</div>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Compass className="w-10 h-10 text-[var(--season-accent)] opacity-60" />
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-[7px] text-[var(--text-tertiary)] font-bold">N</span>
                </div>
                <div>
                  <p className="text-lg font-display text-[var(--text-primary)] tabular">SSE (158°)</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">Distance: <span className="text-[var(--season-accent)]">54 miles</span></p>
                </div>
              </div>
            </motion.div>

            {/* PNW Trivia */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">PNW Trivia</div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Mt. Rainier was used as inspiration for the original Starbucks logo.
              </p>
              <button className="mt-3 text-[9px] text-[var(--season-accent)] font-mono uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors">
                See the story →
              </button>
            </motion.div>
          </motion.div>

          {/* ═══ SECONDARY SECTIONS ═══ */}
          <div id="section-favorites" className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Weather Details</div>
              <WeatherDetails weather={data.weather} reasons={data.visibility.reasons} />
            </motion.div>
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Get Notified</div>
              <NotifyCard />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Live Webcams</div>
              <LiveWebcams feeds={WEBCAM_FEEDS} />
            </motion.div>
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Community Photos</div>
              <PhotoDrop neighborhood={neighborhood} />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Neighborhood Spotters</div>
              <CommunityGames selectedHood={neighborhood} onSelectHood={setNeighborhood} fallbackScores={allNeighborhoodScores} fallbackLabels={NEIGHBORHOOD_LABELS} />
            </motion.div>
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Share the View</div>
              <div className="flex items-center gap-3">
                <SmsShareButton score={neighborhoodAdjustedScore} neighborhoodLabel={neighborhoodLabel} />
                <MountainMoment isVisible={adjustedIsVisible} score={neighborhoodAdjustedScore} neighborhoodLabel={neighborhoodLabel} durationMessage={data.visibility.durationMessage} />
              </div>
              <span className="text-[10px] text-[var(--season-accent)] font-mono mt-3 block">#IsTheMountainOut</span>
            </motion.div>
          </div>

          {isNight && (
            <motion.div {...fadeUp} className="dash-card mt-5">
              <NightSky sunrise={data.weather.sunrise || ""} isDay={data.weather.isDay} />
            </motion.div>
          )}

          {data.alpenglow && data.alpenglow.probability >= 40 && data.alpenglow.minutesToSunset > 0 && data.alpenglow.minutesToSunset <= 60 && (
            <motion.div {...fadeUp} className="dash-card mt-5 !border-l-2 !border-l-[var(--status-warning)]">
              <p className="text-[9px] text-[var(--status-warning)] uppercase tracking-wider font-bold">Alpenglow Alert</p>
              <p className="font-display text-lg text-[var(--text-primary)] mt-1">Mountain could turn pink in ~{data.alpenglow.minutesToSunset}min</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{data.alpenglow.probability}% probability</p>
            </motion.div>
          )}

          {/* ═══ FOOTER ═══ */}
          <footer id="section-about" className="divider-cedar mt-10 pt-8 pb-10">
            <PrivacyCommitment />
            <p className="text-[11px] text-[var(--text-tertiary)] mt-4 leading-relaxed max-w-xl">
              A Pacific Northwest field report. Mt. Rainier visibility scored from real-time cloud layers,
              atmospheric clarity, and particulate matter across the Puget Sound region.
            </p>
            <div className="flex items-center gap-3 mt-4 text-[11px]">
              <span className="text-[var(--text-tertiary)]">By</span>
              <span className="text-[var(--text-primary)] font-medium">Jatin Batra</span>
              <a href="https://x.com/jatin_batra1" target="_blank" rel="noopener noreferrer" className="text-[var(--season-accent)] hover:text-[var(--text-primary)] transition-colors">
                @jatin_batra1
              </a>
            </div>
            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-white/[0.03]">
              <a href="/almanac" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Almanac</a>
              <a href="/embed" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Embed</a>
              <a href="/api/stats.json" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">API</a>
              <span className="font-mono text-[8px] text-[var(--text-tertiary)] ml-auto tracking-wider">Open-Meteo · 15min · {palette.label}</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
