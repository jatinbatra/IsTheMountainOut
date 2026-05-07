"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  RefreshCw, Home, MapPin, Map, BarChart3, Clock, Star, Info,
  Mountain, Compass, Eye, Sun, Wind, Droplets, ChevronLeft,
  ChevronRight, TrendingUp, TrendingDown, TreePine, Gauge,
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
import {
  getCurrentSeason,
  getSeasonalPalette,
  getSeasonalStatusWord,
  getCSSVariables,
} from "@/lib/seasonal";

// ── Types ────────────────────────────────────────────────────────────

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

// ── Constants ────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SIDEBAR_ITEMS = [
  { icon: Home,     label: "Home",     id: "home"      },
  { icon: Eye,      label: "Views",    id: "viewpoints"},
  { icon: Map,      label: "Map",      id: "map"       },
  { icon: BarChart3,label: "Forecast", id: "forecast"  },
  { icon: Clock,    label: "History",  id: "history"   },
  { icon: Star,     label: "Favs",     id: "favorites" },
  { icon: Info,     label: "About",    id: "about"     },
] as const;

const VIEWPOINTS = [
  {
    id: "kerry-park",
    name: "Kerry Park",
    sub: "Queen Anne",
    gradient: "linear-gradient(155deg, #1c3018 0%, #3a5020 30%, #7a6828 65%, #b88820 100%)",
  },
  {
    id: "space-needle",
    name: "Space Needle",
    sub: "Downtown",
    gradient: "linear-gradient(155deg, #0c1825 0%, #1a3050 35%, #2a507a 70%, #4880a8 100%)",
  },
  {
    id: "gas-works",
    name: "Gas Works",
    sub: "Wallingford",
    gradient: "linear-gradient(155deg, #28200c 0%, #4a3818 35%, #6a5028 65%, #906a30 100%)",
  },
  {
    id: "bellevue",
    name: "Bellevue",
    sub: "Eastside",
    gradient: "linear-gradient(155deg, #0c1830 0%, #1a3868 35%, #2a5898 70%, #4888c0 100%)",
  },
  {
    id: "green-lake",
    name: "Green Lake",
    sub: "North Seattle",
    gradient: "linear-gradient(155deg, #0c1c0c 0%, #183818 35%, #286028 65%, #388038 100%)",
  },
  {
    id: "snoqualmie",
    name: "Snoqualmie",
    sub: "Cascades",
    gradient: "linear-gradient(155deg, #181c28 0%, #384868 35%, #6880a0 65%, #b8c8d8 100%)",
  },
];

// ── Motion variants ──────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
};

const staggerParent = {
  animate: { transition: { staggerChildren: 0.09 } },
};

// ── Component ────────────────────────────────────────────────────────

export default function Dashboard({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const carouselRef = useRef<HTMLDivElement>(null);

  const { data: swrData, isValidating } = useSWR<MountainData>(
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
  const [selectedVp, setSelectedVp] = useState(0);
  const [activeNav, setActiveNav] = useState("home");

  const setNeighborhood = useCallback(
    (hood: string | null) => {
      setNeighborhoodState(hood);
      router.push(hood ? `?hood=${encodeURIComponent(hood)}` : "/", { scroll: false });
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

  const score = useMemo(
    () =>
      neighborhood
        ? getNeighborhoodAdjustedScore(data.visibility.score, neighborhood, data.weather.humidity)
        : data.visibility.score,
    [data.visibility.score, neighborhood, data.weather.humidity]
  );

  const isVisible      = score >= 50;
  const isNight        = !data.weather.isDay;
  const neighborhoodLabel = neighborhood ? NEIGHBORHOOD_LABELS[neighborhood] ?? null : null;
  const topViewpoint   = data.viewpoints[0];
  const visMiles       = Math.round(data.weather.visibilityMeters / 1609.34);
  const tempF          = Math.round((data.weather.temperature * 9) / 5 + 32);

  const allScores = useMemo(
    () => getAllNeighborhoodScores(data.visibility.score, data.weather.humidity),
    [data.visibility.score, data.weather.humidity]
  );

  const lastUpdate = new Date(data.lastUpdated);
  const timeStr = lastUpdate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });

  const season        = getCurrentSeason();
  const palette       = getSeasonalPalette(season);
  const statusWord    = getSeasonalStatusWord(season, isVisible, isNight);
  const seasonVars    = getCSSVariables(palette);

  // Gauge
  const gaugeR    = 72;
  const gaugeC    = 2 * Math.PI * gaugeR;
  const gaugeOff  = gaugeC - (score / 100) * gaugeC;

  // Factors
  const cloudScore    = Math.round(100 - data.weather.cloudLow);
  const aqScore       = data.weather.pm25 != null ? Math.round(Math.max(0, 100 - (data.weather.pm25 / 50) * 100)) : 85;
  const humidityScore = Math.round(Math.max(0, 100 - (data.weather.humidity - 40)));
  const lightScore    = isNight ? 38 : 82;

  const factors = [
    { label: "Cloud Cover",       desc: `${data.weather.cloudLow}% cloud coverage`,       value: cloudScore,    status: cloudScore >= 70 ? "GOOD" : cloudScore >= 40 ? "FAIR" : "POOR" },
    { label: "Air Quality (PM2.5)", desc: data.weather.pm25 != null ? `${data.weather.pm25.toFixed(1)} µg/m³` : "Good", value: aqScore,    status: aqScore >= 70 ? "GOOD" : aqScore >= 40 ? "FAIR" : "POOR" },
    { label: "Humidity",          desc: `${data.weather.humidity}% relative humidity`,    value: humidityScore, status: humidityScore >= 70 ? "GOOD" : humidityScore >= 40 ? "FAIR" : "POOR" },
    { label: "Lighting",          desc: isNight ? "Night — reduced visibility" : "Golden hour boost", value: lightScore, status: lightScore >= 70 ? "EXCELLENT" : lightScore >= 40 ? "FAIR" : "POOR" },
  ];

  const accentColor = isVisible ? "var(--season-accent, #2db87a)" : "var(--accent-pink, #ff5cad)";
  const accentGlow  = isVisible
    ? "0 0 12px rgba(45,184,122,0.25)"
    : "0 0 12px rgba(255,92,173,0.25)";

  const navTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex min-h-screen" style={seasonVars as React.CSSProperties}>
      <PWAInstallPrompt />

      {/* ═══════════════════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════════════════ */}
      <nav className="sidebar" aria-label="Main navigation">
        {/* Mountain logo */}
        <div className="sidebar-logo">
          <svg viewBox="0 0 36 36" className="w-8 h-8" aria-hidden="true">
            <polygon points="18,4 6,30 12,30 18,17 24,30 30,30" fill={accentColor} opacity="0.75" />
            <polygon points="14,19 18,10 22,19 20,15 16,15" fill="white" opacity="0.4" />
            <line x1="4" y1="31" x2="32" y2="31" stroke={accentColor} strokeWidth="0.8" opacity="0.25" />
            <polygon points="8,31 10,26 12,31" fill={accentColor} opacity="0.18" />
            <polygon points="26,31 28,27 30,31" fill={accentColor} opacity="0.18" />
          </svg>
        </div>

        {/* Brand text */}
        <div className="sidebar-title">
          <div className="sidebar-title-main">
            IS THE<br />MOUNTAIN<br />OUT?
          </div>
          <span className="sidebar-title-sub">MT. RAINIER · TRACKER</span>
        </div>

        <div className="sidebar-divider" />

        {/* Nav items */}
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeNav === item.id ? "active" : ""}`}
            onClick={() => navTo(item.id)}
          >
            <item.icon className="w-[15px] h-[15px]" strokeWidth={1.6} />
            <span>{item.label}</span>
          </button>
        ))}

        {/* Bottom calling text */}
        <div className="sidebar-bottom">
          <span className="sidebar-calling">THE MOUNTAIN IS CALLING</span>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          MAIN
      ═══════════════════════════════════════════════════ */}
      <main className="main-with-sidebar flex-1 ml-[78px] min-h-screen">

        {/* ═══ HERO ═══ */}
        <section
          id="section-home"
          className="hero-section"
          style={{ height: "62vh", minHeight: "500px" }}
        >
          {/* Cinematic background */}
          <div className="hero-bg-fallback" />
          <div className="absolute inset-0 z-[1]">
            <FeaturedWebcam />
          </div>

          {/* Atmospheric overlays — intentionally light to keep image visible */}
          <div className="hero-top" />
          <div className="hero-bottom" />
          <div className="hero-sides" />
          <div className="hero-fog" />

          {/* ── Floating header bar ── */}
          <div className="hero-header">
            <div className="hero-header-pill">
              {/* Left: LIVE */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="hero-live-dot" />
                <span className="text-[10px] text-white/50 font-mono uppercase tracking-wider whitespace-nowrap">
                  LIVE Longmire · Mt. Rainier
                </span>
              </div>

              {/* Center: location */}
              <div className="flex items-center gap-1.5 flex-1 justify-center">
                <MapPin className="w-3 h-3 text-white/35 flex-shrink-0" />
                <span className="text-[11.5px] text-white/55 tracking-wide whitespace-nowrap">
                  {VIEWPOINTS[selectedVp]?.name}, {VIEWPOINTS[selectedVp]?.sub} · {timeStr} PDT
                </span>
              </div>

              {/* Right: weather cluster */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1 text-[10.5px] text-white/40">
                  <Sun className="w-3 h-3 text-amber-400/50" />
                  <span className="font-mono tabular">{tempF}°F</span>
                </div>
                <div className="h-3 w-px bg-white/[0.06]" />
                <div className="flex items-center gap-1 text-[10px] text-white/35 font-mono">
                  <Wind className="w-3 h-3" />
                  <span>{Math.round(data.weather.windSpeed)} mph</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/35 font-mono">
                  <Droplets className="w-3 h-3" />
                  <span>{data.weather.humidity}%</span>
                </div>
                <div className="hidden lg:flex items-center gap-1 text-[10px] text-white/35 font-mono">
                  <Eye className="w-3 h-3" />
                  <span>{visMiles} mi</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Hero headline ── */}
          <div className="hero-text">
            {/* Subtle glow behind text only */}
            <div
              className="absolute pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6,17,13,0.22) 0%, transparent 75%)`,
                inset: "-10% -20%",
              }}
            />

            <motion.p
              className="hero-location-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.7 }}
            >
              SEATTLE, WA
            </motion.p>

            <motion.h1
              className="hero-headline"
              style={{ fontSize: "clamp(3.2rem, 8.5vw, 7.5rem)" }}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {isVisible ? "YES." : "NOT TODAY."}{" "}
              <span className={isVisible ? "hero-headline-positive" : "hero-headline-negative"}>
                {statusWord}.
              </span>
            </motion.h1>

            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.7 }}
            >
              {isVisible
                ? `Beautiful visibility right now from ${VIEWPOINTS[selectedVp]?.name}`
                : data.visibility.durationMessage}
            </motion.p>
          </div>
        </section>

        {/* ═══ VIEWPOINT CAROUSEL ═══ */}
        <div id="section-viewpoints" className="viewpoint-section">
          <div className="viewpoint-glass">
            <button
              className="carousel-btn"
              onClick={() => carouselRef.current?.scrollBy({ left: -220, behavior: "smooth" })}
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div ref={carouselRef} className="viewpoint-carousel">
              {VIEWPOINTS.map((vp, i) => (
                <motion.button
                  key={vp.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className={`viewpoint-item ${selectedVp === i ? "selected" : ""}`}
                  onClick={() => setSelectedVp(i)}
                >
                  <div
                    className={`viewpoint-circle ${selectedVp === i ? "selected" : ""}`}
                    style={{ background: vp.gradient }}
                  >
                    {/* Atmospheric overlay on thumbnail */}
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)",
                      }}
                    />
                    {/* Location icon */}
                    <MapPin
                      className="w-5 h-5 relative z-10"
                      style={{
                        color: selectedVp === i ? accentColor : "rgba(200,210,204,0.35)",
                        filter: selectedVp === i ? `drop-shadow(${accentGlow})` : "none",
                      }}
                    />
                  </div>
                  <span className="viewpoint-name">{vp.name.split(" ")[0]}</span>
                  <span className="viewpoint-sub">{vp.sub}</span>
                </motion.button>
              ))}
            </div>

            <button
              className="carousel-btn"
              onClick={() => carouselRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
              aria-label="Next"
            >
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
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerParent}
          >

            {/* ── Card 1: Visibility Score ── */}
            <motion.div variants={fadeUp} className="dash-card flex flex-col items-center">
              <div className="dash-card-header w-full">Mountain Visibility Score</div>

              {/* Score ring */}
              <div className="relative my-2">
                <div className="score-gauge-wrap">
                  <svg width="168" height="168" viewBox="0 0 168 168">
                    <circle cx="84" cy="84" r={gaugeR} className="gauge-track" />
                    <circle
                      cx="84" cy="84" r={gaugeR}
                      className={isVisible ? "gauge-fill-positive" : "gauge-fill-negative"}
                      strokeDasharray={gaugeC}
                      strokeDashoffset={gaugeOff}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="font-display tabular"
                      style={{
                        fontSize: "2.9rem",
                        color: accentColor,
                        filter: `drop-shadow(${accentGlow})`,
                      }}
                    >
                      {score}
                      <span style={{ fontSize: "1.1rem", opacity: 0.6 }}>%</span>
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.12em] font-semibold mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {score >= 76 ? "Great Visibility" : score >= 50 ? "Moderate" : "Poor Visibility"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mountain silhouette */}
              <div className="w-full px-2 mt-1">
                <MountainSilhouetteScore
                  score={score}
                  isVisible={isVisible}
                  isNight={isNight}
                  seasonLabel=""
                />
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 mt-4 text-[9px] w-full justify-center" style={{ color: "var(--text-tertiary)" }}>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className={`w-[11px] h-[11px] ${isValidating ? "animate-spin" : ""}`} />
                  <span>Updated {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min ago</span>
                </div>
                <span style={{ color: "rgba(61,85,72,0.4)" }}>·</span>
                <div className="flex items-center gap-1">
                  <span>Trend</span>
                  {isVisible
                    ? <TrendingUp className="w-[11px] h-[11px]" style={{ color: "var(--accent)" }} />
                    : <TrendingDown className="w-[11px] h-[11px]" style={{ color: "var(--accent-pink)" }} />
                  }
                  <span style={{ color: isVisible ? "var(--accent)" : "var(--accent-pink)" }}>
                    {isVisible ? "Improving" : "Declining"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Card 2: Why the Mountain is Hidden / Out ── */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">
                Why the Mountain is {isVisible ? "Out" : "Hidden"}
              </div>

              <div>
                {factors.map((f) => (
                  <div key={f.label} className="factor-row">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                          {f.label}
                        </p>
                        <p className="text-[9.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                          {f.desc}
                        </p>
                      </div>
                      <span
                        className="text-[9.5px] font-bold tracking-wider flex-shrink-0"
                        style={{
                          color: f.status === "EXCELLENT" || f.status === "GOOD"
                            ? "var(--accent)"
                            : f.status === "FAIR"
                            ? "var(--accent-gold)"
                            : "var(--accent-pink)",
                        }}
                      >
                        {f.status}
                      </span>
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

              <button
                className="mt-4 text-[9.5px] uppercase tracking-wider font-mono flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: "var(--accent)" }}
              >
                How it works →
              </button>
            </motion.div>

            {/* ── Card 3: Visibility Map ── */}
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
                selectedId={data.viewpoints[selectedVp]?.id}
                onSelectViewpoint={(id) => {
                  const idx = data.viewpoints.findIndex((v) => v.id === id);
                  if (idx >= 0) setSelectedVp(idx);
                }}
                baseScore={score}
              />

              <div className="mt-4 space-y-2">
                {allScores.slice(0, 6).map((ns) => (
                  <div key={ns.id} className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-secondary)" }}>
                      {NEIGHBORHOOD_LABELS[ns.id] ?? ns.id}
                    </span>
                    <span
                      className="text-[10px] font-mono tabular font-semibold"
                      style={{
                        color: ns.score >= 70
                          ? "var(--accent)"
                          : ns.score >= 50
                          ? "var(--accent-gold)"
                          : "var(--accent-pink)",
                      }}
                    >
                      {ns.score}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3" style={{ borderTop: "1px solid rgba(200,210,204,0.04)" }}>
                {[
                  { label: "90–100%", c: "#2db87a" },
                  { label: "70–89%", c: "#4a9060" },
                  { label: "50–69%", c: "#d4a373" },
                  { label: "30–49%", c: "#c06828" },
                  { label: "0–29%",  c: "#ff5cad" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5 text-[8px]" style={{ color: "var(--text-tertiary)" }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.c }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Column 4: Forecast + Local Tip + Sighting ── */}
            <motion.div variants={fadeUp} id="section-forecast" className="space-y-4">
              {/* Forecast card */}
              <div className="dash-card">
                <div className="dash-card-header">Forecast for {VIEWPOINTS[selectedVp]?.name}</div>
                <ForecastHub
                  hourlyTimeline={data.hourlyTimeline}
                  currentScore={data.visibility.score}
                  isVisible={isVisible}
                  weeklyForecast={data.weeklyForecast}
                  sunset={data.weather.sunset}
                />
                {/* Best window */}
                <div
                  className="mt-4 p-3 rounded-2xl"
                  style={{ background: "rgba(212,163,115,0.05)", border: "1px solid rgba(212,163,115,0.08)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sun className="w-3.5 h-3.5" style={{ color: "var(--accent-gold)" }} />
                    <span className="text-[8.5px] uppercase tracking-wider font-bold" style={{ color: "var(--accent-gold)" }}>
                      Best Viewing Window
                    </span>
                  </div>
                  <NextClearWindow
                    hourlyTimeline={data.hourlyTimeline}
                    weeklyForecast={data.weeklyForecast}
                    currentScore={score}
                  />
                </div>
              </div>

              {/* Local tip */}
              <div className="dash-card">
                <div className="dash-card-header">Local Tip</div>
                <div className="flex items-start gap-3">
                  <TreePine
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: accentColor, opacity: 0.5, filter: `drop-shadow(${accentGlow})` }}
                  />
                  <p className="text-[12px] italic leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {topViewpoint
                      ? `After a front moves through, the mountain often pops out the next morning. ${topViewpoint.name} is ${topViewpoint.distanceMiles} miles ${topViewpoint.direction} — PNW Photographers`
                      : "After storms pass, the mountain often appears clearest the next morning, with fresh alpenglow on the snowcap."}
                  </p>
                </div>
                {isVisible && topViewpoint && (
                  <a
                    href={topViewpoint.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-[9.5px] uppercase tracking-wider font-mono transition-opacity hover:opacity-70"
                    style={{ color: "var(--accent)" }}
                  >
                    <Compass className="w-3 h-3" />
                    Get directions →
                  </a>
                )}
              </div>

              {/* Last confirmed sighting */}
              <div className="dash-card">
                <div className="dash-card-header">Last Confirmed Sighting</div>
                <p className="text-[10px] mb-3" style={{ color: "var(--text-tertiary)" }}>
                  {topViewpoint ? `3 min ago from ${topViewpoint.name}` : "Recent community report"}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["#2db87a","#d4a373","#60a5fa","#f59e0b"].map((c, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          background: `${c}20`,
                          border: `1.5px solid ${c}40`,
                          color: c,
                        }}
                      >
                        {["J","M","S","K"][i]}
                      </div>
                    ))}
                  </div>
                  <SpotterButton isVisible={isVisible} score={score} />
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
            viewport={{ once: true, margin: "-30px" }}
            variants={staggerParent}
          >
            {/* Streak */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">Streak</div>
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="font-display"
                  style={{ fontSize: "2.2rem", color: accentColor, lineHeight: 1, filter: `drop-shadow(${accentGlow})` }}
                >
                  3
                </span>
                <div className="mt-1">
                  <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>DAYS</p>
                  <p className="text-[9.5px] leading-snug mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    in a row the mountain<br />has been visible
                  </p>
                </div>
              </div>
              <GlobalStreakBadge />
              <div className="flex gap-1 mt-3">
                {["M","T","W","T","F","S","S"].map((d, i) => (
                  <div
                    key={i}
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[7px] font-bold"
                    style={{
                      background: i < 3 ? `${accentColor}18` : "rgba(200,210,204,0.04)",
                      border: `1px solid ${i < 3 ? `${accentColor}30` : "rgba(200,210,204,0.06)"}`,
                      color: i < 3 ? accentColor : "var(--text-tertiary)",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Elevation Advantage */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">Elevation Advantage</div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    You&apos;re at 275 ft
                  </p>
                  <p className="text-[9.5px] mt-1 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                    Rainier summit is 14,411 ft<br />
                    Every 1,000ft of elevation<br />improves your odds.
                  </p>
                </div>
                <svg viewBox="0 0 56 80" className="w-12 h-16 flex-shrink-0" aria-hidden="true">
                  <line x1="52" y1="4" x2="52" y2="76" stroke="rgba(200,210,204,0.06)" strokeWidth="1" />
                  <path d="M8 76 L24 38 L32 22 L40 38 L56 76 Z" fill="var(--season-mountain-base)" opacity="0.3" />
                  <path d="M24 38 L32 22 L40 38 L36 30 L28 30 Z" fill="var(--season-mountain-snow)" opacity="0.4" />
                  <text x="54" y="7"  fill="var(--text-tertiary)" fontSize="4.5" opacity="0.5">14,411</text>
                  <text x="54" y="75" fill="var(--text-tertiary)" fontSize="4.5" opacity="0.5">275 ft</text>
                  <line x1="50" y1="73" x2="52" y2="73" stroke="rgba(200,210,204,0.2)" strokeWidth="0.8" />
                  <line x1="50" y1="5"  x2="52" y2="5"  stroke="rgba(200,210,204,0.2)" strokeWidth="0.8" />
                </svg>
              </div>
            </motion.div>

            {/* Direction */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">Direction to Rainier</div>
              <div className="flex items-center gap-4 mt-1">
                <div className="relative flex-shrink-0">
                  <Compass
                    className="w-12 h-12"
                    style={{ color: accentColor, opacity: 0.55, filter: `drop-shadow(${accentGlow})` }}
                  />
                  {["N","S","E","W"].map((d, i) => {
                    const pos = [
                      { top: "-2px", left: "50%", transform: "translateX(-50%)" },
                      { bottom: "-2px", left: "50%", transform: "translateX(-50%)" },
                      { top: "50%", right: "-2px", transform: "translateY(-50%)" },
                      { top: "50%", left: "-2px", transform: "translateY(-50%)" },
                    ][i];
                    return (
                      <span key={d} className="absolute text-[6.5px] font-bold" style={{ color: "var(--text-tertiary)", ...pos }}>{d}</span>
                    );
                  })}
                </div>
                <div>
                  <p className="font-display" style={{ fontSize: "1.4rem", color: "var(--text-primary)", lineHeight: 1.1 }}>
                    SSE (158°)
                  </p>
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                    Distance: <span style={{ color: accentColor }}>54 miles</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* PNW Trivia */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">PNW Trivia</div>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(212,163,115,0.08)", border: "1px solid rgba(212,163,115,0.1)" }}
                >
                  <TreePine className="w-4 h-4" style={{ color: "var(--accent-gold)", opacity: 0.7 }} />
                </div>
                <div>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Mt. Rainier was used as inspiration for the original Starbucks logo.
                  </p>
                  <button
                    className="text-[9px] uppercase tracking-wider font-mono mt-2 transition-opacity hover:opacity-70"
                    style={{ color: "var(--accent)" }}
                  >
                    See the story →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ═══ SECONDARY SECTIONS ═══ */}
          <div id="section-favorites" className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
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
              <CommunityGames
                selectedHood={neighborhood}
                onSelectHood={setNeighborhood}
                fallbackScores={allScores}
                fallbackLabels={NEIGHBORHOOD_LABELS}
              />
            </motion.div>
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Share the View</div>
              <div className="flex items-center gap-3">
                <SmsShareButton score={score} neighborhoodLabel={neighborhoodLabel} />
                <MountainMoment
                  isVisible={isVisible}
                  score={score}
                  neighborhoodLabel={neighborhoodLabel}
                  durationMessage={data.visibility.durationMessage}
                />
              </div>
              <span
                className="text-[9.5px] font-mono mt-3 block uppercase tracking-wider"
                style={{ color: "var(--accent)" }}
              >
                #IsTheMountainOut
              </span>
            </motion.div>
          </div>

          {isNight && (
            <motion.div {...fadeUp} className="dash-card mt-5">
              <NightSky sunrise={data.weather.sunrise || ""} isDay={data.weather.isDay} />
            </motion.div>
          )}

          {data.alpenglow && data.alpenglow.probability >= 40 && data.alpenglow.minutesToSunset > 0 && data.alpenglow.minutesToSunset <= 60 && (
            <motion.div
              {...fadeUp}
              className="dash-card mt-5"
              style={{ borderLeft: "2px solid var(--accent-gold)" }}
            >
              <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "var(--accent-gold)" }}>
                Alpenglow Alert
              </p>
              <p className="font-display text-xl mt-1.5" style={{ color: "var(--text-primary)" }}>
                Mountain could turn pink in ~{data.alpenglow.minutesToSunset}min
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {data.alpenglow.probability}% probability
              </p>
            </motion.div>
          )}

          {/* ═══ FOOTER ═══ */}
          <footer id="section-about" className="divider-cedar mt-12 pt-8 pb-10">
            <PrivacyCommitment />
            <p className="text-[11px] mt-4 leading-relaxed max-w-2xl" style={{ color: "var(--text-tertiary)" }}>
              A Pacific Northwest field report. Mt. Rainier visibility scored from real-time cloud layers,
              atmospheric clarity, and particulate matter across the Puget Sound region.
            </p>
            <div className="flex items-center gap-3 mt-4 text-[11px]">
              <span style={{ color: "var(--text-tertiary)" }}>By</span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Jatin Batra</span>
              <a
                href="https://x.com/jatin_batra1"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                @jatin_batra1
              </a>
            </div>
            <div className="flex items-center gap-6 mt-5 pt-5" style={{ borderTop: "1px solid rgba(200,210,204,0.04)" }}>
              <a href="/almanac"       className="text-[10px] transition-opacity hover:opacity-70" style={{ color: "var(--text-tertiary)" }}>Almanac</a>
              <a href="/embed"         className="text-[10px] transition-opacity hover:opacity-70" style={{ color: "var(--text-tertiary)" }}>Embed</a>
              <a href="/api/stats.json" className="text-[10px] transition-opacity hover:opacity-70" style={{ color: "var(--text-tertiary)" }}>API</a>
              <span className="font-mono text-[8px] ml-auto tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Open-Meteo · 15min · {palette.label}
              </span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
