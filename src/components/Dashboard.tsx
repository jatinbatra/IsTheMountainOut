"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Home, MapPin, Map, BarChart3, Clock, Star, Info,
  Mountain, Compass, Eye, Sun, Wind, Droplets, ChevronLeft,
  ChevronRight, TrendingUp, TrendingDown, TreePine, Gauge,
  Thermometer, CloudRain, Camera, Sparkles,
} from "lucide-react";
import MountainSilhouetteScore from "@/components/MountainSilhouetteScore";
import MountainMoment from "@/components/MountainMoment";
import WeatherDetails from "@/components/WeatherDetails";
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

import SeattleVisibilityMap from "@/components/SeattleVisibilityMap";

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
  { icon: Home,      label: "Home",      id: "home" },
  { icon: Eye,       label: "Views",     id: "viewpoints" },
  { icon: Map,       label: "Map",       id: "map" },
  { icon: BarChart3, label: "Forecast",  id: "forecast" },
  { icon: Clock,     label: "History",   id: "history" },
  { icon: Star,      label: "Favorites", id: "favorites" },
  { icon: Info,      label: "About",     id: "about" },
] as const;

const VIEWPOINTS = [
  { id: "kerry-park",      name: "Kerry Park",      sub: "Queen Anne",        image: "/images/viewpoints/kerry-park.jpg" },
  { id: "space-needle",    name: "Space Needle",    sub: "Downtown",          image: "/images/viewpoints/space-needle.jpg" },
  { id: "uw-campus",       name: "UW Campus",       sub: "University District", image: "/images/viewpoints/uw-campus.jpg" },
  { id: "i90-bridge",      name: "I-90 Bridge",     sub: "Lake Washington",   image: "/images/viewpoints/i90-bridge.jpg" },
  { id: "sculpture-park",  name: "Sculpture Park",  sub: "Waterfront",        image: "/images/viewpoints/sculpture-park.jpg" },
  { id: "harbor-view",     name: "Harbor View",     sub: "Port of Seattle",   image: "/images/viewpoints/harbor-view.jpg" },
  { id: "alki-beach",      name: "Alki Beach",      sub: "West Seattle",      image: "/images/viewpoints/alki-beach.jpg" },
  { id: "sodo",            name: "SODO",            sub: "South Seattle",     image: "/images/viewpoints/sodo.jpg" },
];

const FUN_FACTS = [
  { text: "Mt. Rainier has been featured as inspiration for the original Starbucks logo — the mountain's silhouette framed the siren.", cta: "See the story →" },
  { text: "Seattle averages 226 cloudy days per year, making a clear Rainier sighting genuinely special — locals celebrate it.", cta: "Weather stats →" },
  { text: "At 14,411 ft, Rainier is the most glaciated peak in the contiguous US with 25 major glaciers containing over 1 cubic mile of ice.", cta: "Glacier facts →" },
  { text: "On exceptionally clear days, Mt. Rainier can be seen from as far as Portland, Oregon — 150 miles to the south.", cta: "Viewing range →" },
  { text: "The mountain's Indigenous name is Tahoma (or Tacoma), meaning 'mother of waters' — it feeds six major rivers.", cta: "Learn more →" },
  { text: "Rainier has the world's largest volcanic glacier cave system, carved by geothermal heat beneath the ice.", cta: "Explore caves →" },
  { text: "The 93-mile Wonderland Trail circumnavigates the mountain and takes most hikers 7-10 days to complete.", cta: "Trail guide →" },
  { text: "Mt. Rainier produces its own weather — lenticular clouds form at the summit and are often mistaken for UFOs.", cta: "Cloud types →" },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
};

const staggerParent = {
  animate: { transition: { staggerChildren: 0.09 } },
};

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
  const [factIdx, setFactIdx] = useState(0);

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

  // Rotate fun facts every 12 seconds
  useEffect(() => {
    const t = setInterval(() => setFactIdx((i) => (i + 1) % FUN_FACTS.length), 12000);
    return () => clearInterval(t);
  }, []);

  useAutoLocation(neighborhood, setNeighborhood);

  const score = useMemo(
    () =>
      neighborhood
        ? getNeighborhoodAdjustedScore(data.visibility.score, neighborhood, data.weather.humidity)
        : data.visibility.score,
    [data.visibility.score, neighborhood, data.weather.humidity]
  );

  const isVisible       = score >= 50;
  const isNight         = !data.weather.isDay;
  const neighborhoodLabel = neighborhood ? NEIGHBORHOOD_LABELS[neighborhood] ?? null : null;
  const topViewpoint    = data.viewpoints[0];
  const visMiles        = Math.round(data.weather.visibilityMeters / 1609.34);
  const tempF           = Math.round((data.weather.temperature * 9) / 5 + 32);

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

  const season     = getCurrentSeason();
  const palette    = getSeasonalPalette(season);
  const statusWord = getSeasonalStatusWord(season, isVisible, isNight);
  const seasonVars = getCSSVariables(palette);

  const gaugeR   = 72;
  const gaugeC   = 2 * Math.PI * gaugeR;
  const gaugeOff = gaugeC - (score / 100) * gaugeC;

  const cloudScore    = Math.round(100 - data.weather.cloudLow);
  const aqScore       = data.weather.pm25 != null ? Math.round(Math.max(0, 100 - (data.weather.pm25 / 50) * 100)) : 85;
  const humidityScore = Math.round(Math.max(0, 100 - (data.weather.humidity - 40)));
  const lightScore    = isNight ? 38 : 82;

  const factors = [
    { label: "Cloud Cover",        desc: `${data.weather.cloudLow}% cloud coverage`,         value: cloudScore,    status: cloudScore >= 70 ? "GOOD" : cloudScore >= 40 ? "FAIR" : "POOR" },
    { label: "Air Quality (PM2.5)", desc: data.weather.pm25 != null ? `${data.weather.pm25.toFixed(1)} µg/m³` : "Good", value: aqScore, status: aqScore >= 70 ? "GOOD" : aqScore >= 40 ? "FAIR" : "POOR" },
    { label: "Humidity",           desc: `${data.weather.humidity}% relative humidity`,       value: humidityScore, status: humidityScore >= 70 ? "GOOD" : humidityScore >= 40 ? "FAIR" : "POOR" },
    { label: "Lighting",           desc: isNight ? "Night — reduced visibility" : "Golden hour boost", value: lightScore, status: lightScore >= 70 ? "EXCELLENT" : lightScore >= 40 ? "FAIR" : "POOR" },
  ];

  const accentColor = isVisible ? "var(--accent)" : "var(--accent-pink)";
  const accentGlow  = isVisible ? "0 0 14px rgba(90,158,106,0.3)" : "0 0 14px rgba(196,125,138,0.3)";

  const weatherLabel = data.weather.cloudLow < 20 ? "Sunny" : data.weather.cloudLow < 50 ? "Partly Cloudy" : data.weather.cloudLow < 80 ? "Mostly Cloudy" : "Overcast";

  const navTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex min-h-screen" style={seasonVars as React.CSSProperties}>
      <PWAInstallPrompt />

      {/* ═══ SIDEBAR ═══ */}
      <nav className="sidebar" aria-label="Main navigation">
        <div className="sidebar-logo">
          <svg viewBox="0 0 36 36" className="w-8 h-8" aria-hidden="true">
            <polygon points="18,4 6,30 12,30 18,17 24,30 30,30" fill="#d4a373" opacity="0.75" />
            <polygon points="14,19 18,10 22,19 20,15 16,15" fill="white" opacity="0.4" />
            <line x1="4" y1="31" x2="32" y2="31" stroke="#d4a373" strokeWidth="0.8" opacity="0.25" />
            <polygon points="8,31 10,26 12,31" fill="#5a9e6a" opacity="0.18" />
            <polygon points="26,31 28,27 30,31" fill="#5a9e6a" opacity="0.18" />
          </svg>
        </div>

        <div className="sidebar-title">
          <div className="sidebar-title-main">IS THE<br />MOUNTAIN<br />OUT?</div>
          <span className="sidebar-title-sub">MT. RAINIER · TRACKER</span>
        </div>

        <div className="sidebar-divider" />

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

        <div className="sidebar-bottom">
          <span className="sidebar-calling">THE MOUNTAIN IS CALLING</span>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main className="main-with-sidebar flex-1 ml-[78px] min-h-screen">

        {/* ═══ HERO — Real PNW Photography ═══ */}
        <section id="section-home" className="hero-section" style={{ height: "62vh", minHeight: "500px" }}>
          <div
            className="absolute inset-0 z-[0]"
            style={{
              backgroundImage: "url(/images/hero/rainier-waterfront.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
            }}
          />

          <div className="hero-top" />
          <div className="hero-bottom" />
          <div className="hero-sides" />
          <div className="hero-fog" />

          {/* ── Floating header ── */}
          <div className="hero-header">
            <div className="hero-header-pill">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="hero-live-dot" />
                <span className="text-[10px] text-white/50 font-mono uppercase tracking-wider whitespace-nowrap">
                  IS THE MOUNTAIN OUT?
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-1 justify-center">
                <MapPin className="w-3 h-3 text-white/35 flex-shrink-0" />
                <span className="text-[11.5px] text-white/55 tracking-wide whitespace-nowrap">
                  {VIEWPOINTS[selectedVp]?.name}, {VIEWPOINTS[selectedVp]?.sub} · {timeStr} PDT
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0" />
            </div>

            {/* ── Weather Widget (warm card, top-right) ── */}
            <div className="weather-widget">
              <div className="weather-widget-main">
                <Sun className="w-5 h-5" style={{ color: "#f59e0b" }} />
                <span className="weather-widget-temp">{tempF}°F</span>
              </div>
              <span className="weather-widget-label">{weatherLabel}</span>
              <div className="weather-widget-details">
                <div className="weather-widget-detail">
                  <Wind className="w-3 h-3" />
                  <span>{Math.round(data.weather.windSpeed)} mph</span>
                </div>
                <div className="weather-widget-detail">
                  <Droplets className="w-3 h-3" />
                  <span>{data.weather.humidity}%</span>
                </div>
                <div className="weather-widget-detail">
                  <Eye className="w-3 h-3" />
                  <span>{visMiles} mi</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Hero headline ── */}
          <div className="hero-text">
            <div
              className="absolute pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(12,10,7,0.22) 0%, transparent 75%)",
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
            <button className="carousel-btn" onClick={() => carouselRef.current?.scrollBy({ left: -220, behavior: "smooth" })} aria-label="Previous">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div ref={carouselRef} className="viewpoint-carousel">
              {VIEWPOINTS.map((vp, i) => {
                const vpScore = data.viewpoints.find(v => v.id === vp.id)?.locationScore ?? score;
                const vpColor = vpScore >= 70 ? "#5a9e6a" : vpScore >= 50 ? "#d4a373" : "#c47d8a";
                return (
                  <motion.button
                    key={vp.id}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    className={`viewpoint-item ${selectedVp === i ? "selected" : ""}`}
                    onClick={() => setSelectedVp(i)}
                  >
                    <div className={`viewpoint-circle ${selectedVp === i ? "selected" : ""}`}>
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: selectedVp === i
                            ? `radial-gradient(circle at 35% 35%, ${vpColor}30, ${vpColor}10 60%, rgba(21,18,16,0.8))`
                            : `radial-gradient(circle at 35% 35%, ${vpColor}18, rgba(21,18,16,0.7) 70%)`,
                        }}
                      />
                      <div className="absolute inset-0 rounded-full flex items-center justify-center z-10">
                        <MapPin className="w-5 h-5" style={{ color: selectedVp === i ? vpColor : "var(--text-tertiary)", opacity: selectedVp === i ? 0.9 : 0.5 }} />
                      </div>
                    </div>
                    <span className="viewpoint-name">{vp.name}</span>
                    <span className="viewpoint-sub">{vp.sub}</span>
                  </motion.button>
                );
              })}
            </div>

            <button className="carousel-btn" onClick={() => carouselRef.current?.scrollBy({ left: 220, behavior: "smooth" })} aria-label="Next">
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
              <div className="dash-card-header w-full flex items-center justify-between">
                <span>Mountain Visibility Score</span>
                <span className="ai-badge"><Sparkles className="w-3 h-3" /><span className="ai-badge-dot" /> AI Prediction</span>
              </div>

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
                      style={{ fontSize: "2.9rem", color: accentColor, filter: `drop-shadow(${accentGlow})` }}
                    >
                      {score}<span style={{ fontSize: "1.1rem", opacity: 0.6 }}>%</span>
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.12em] font-semibold mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {score >= 76 ? "Great Visibility" : score >= 50 ? "Moderate" : "Poor Visibility"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full px-2 mt-1">
                <MountainSilhouetteScore score={score} isVisible={isVisible} isNight={isNight} seasonLabel="" />
              </div>

              <div className="flex items-center gap-3 mt-4 text-[9px] w-full justify-center" style={{ color: "var(--text-tertiary)" }}>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className={`w-[11px] h-[11px] ${isValidating ? "animate-spin" : ""}`} />
                  <span>Updated {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min ago</span>
                </div>
                <span style={{ color: "rgba(90,79,62,0.4)" }}>·</span>
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

            {/* ── Card 2: Why the Mountain is Out / Hidden ── */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">
                Why the Mountain is {isVisible ? "Out" : "Hidden"}
              </div>

              <div>
                {factors.map((f) => (
                  <div key={f.label} className="factor-row">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{f.label}</p>
                        <p className="text-[9.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{f.desc}</p>
                      </div>
                      <span
                        className="text-[9.5px] font-bold tracking-wider flex-shrink-0"
                        style={{
                          color: f.status === "EXCELLENT" || f.status === "GOOD" ? "var(--accent)"
                            : f.status === "FAIR" ? "var(--accent-gold)"
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
                style={{ color: "var(--accent-gold)" }}
              >
                How it works →
              </button>
            </motion.div>

            {/* ── Card 3: Visibility by Neighborhood (REAL MAP) ── */}
            <motion.div variants={fadeUp} id="section-map" className="dash-card">
              <div className="dash-card-header">Visibility by Neighborhood</div>

              <SeattleVisibilityMap scores={allScores} labels={NEIGHBORHOOD_LABELS} baseScore={score} onSelectNeighborhood={setNeighborhood} />

              <div className="mt-4 space-y-2">
                {allScores.slice(0, 6).map((ns) => (
                  <div key={ns.id} className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-secondary)" }}>
                      {NEIGHBORHOOD_LABELS[ns.id] ?? ns.id}
                    </span>
                    <span
                      className="text-[10px] font-mono tabular font-semibold"
                      style={{
                        color: ns.score >= 70 ? "var(--accent)" : ns.score >= 50 ? "var(--accent-gold)" : "var(--accent-pink)",
                      }}
                    >
                      {ns.score}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-4 pt-3" style={{ borderTop: "1px solid rgba(180,165,130,0.04)" }}>
                {[
                  { label: "90–100%", c: "#5a9e6a" },
                  { label: "70–89%",  c: "#4a8858" },
                  { label: "50–69%",  c: "#d4a373" },
                  { label: "30–49%",  c: "#b07848" },
                  { label: "0–29%",   c: "#c47d8a" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5 text-[8px]" style={{ color: "var(--text-tertiary)" }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.c }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Card 4: Forecast ── */}
            <motion.div variants={fadeUp} id="section-forecast" className="dash-card">
              <div className="dash-card-header">Forecast for {VIEWPOINTS[selectedVp]?.name}</div>
              <ForecastHub
                hourlyTimeline={data.hourlyTimeline}
                currentScore={data.visibility.score}
                isVisible={isVisible}
                weeklyForecast={data.weeklyForecast}
                sunset={data.weather.sunset}
              />
              <div className="mt-4 p-3 rounded-2xl" style={{ background: "rgba(212,163,115,0.06)", border: "1px solid rgba(212,163,115,0.1)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Sun className="w-3.5 h-3.5" style={{ color: "var(--accent-gold)" }} />
                  <span className="text-[8.5px] uppercase tracking-wider font-bold" style={{ color: "var(--accent-gold)" }}>
                    Best Viewing Window
                  </span>
                </div>
                <NextClearWindow hourlyTimeline={data.hourlyTimeline} weeklyForecast={data.weeklyForecast} currentScore={score} />
              </div>
            </motion.div>
          </motion.div>

          {/* ═══ LOCAL TIP + SIGHTING (moved out of grid to avoid height mismatch) ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Local Tip</div>
              <div className="flex items-start gap-3">
                <TreePine className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--accent-gold)", opacity: 0.7 }} />
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
                  style={{ color: "var(--accent-gold)" }}
                >
                  <Compass className="w-3 h-3" /> Get directions →
                </a>
              )}
            </motion.div>

            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Last Confirmed Sighting</div>
              <p className="text-[10px] mb-3" style={{ color: "var(--text-tertiary)" }}>
                {topViewpoint ? `3 min ago from ${topViewpoint.name}` : "Recent community report"}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["#5a9e6a","#d4a373","#60a5fa","#f59e0b"].map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: `${c}20`, border: `1.5px solid ${c}40`, color: c }}
                    >
                      {["J","M","S","K"][i]}
                    </div>
                  ))}
                </div>
                <SpotterButton isVisible={isVisible} score={score} />
              </div>
            </motion.div>
          </div>

          {/* ═══ BOTTOM STRIP ═══ */}
          <motion.div
            id="section-history"
            className="bottom-strip"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-30px" }}
            variants={staggerParent}
          >
            {/* Did You Know? — rotating fun facts */}
            <motion.div variants={fadeUp} className="dash-card dash-card-warm">
              <div className="dash-card-header" style={{ color: "var(--accent-gold)" }}>Did You Know?</div>
              <div className="flex items-start gap-4">
                <div className="fun-fact-badge">
                  <svg viewBox="0 0 48 48" className="w-12 h-12 flex-shrink-0">
                    <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(212,163,115,0.25)" strokeWidth="1.5" />
                    <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(212,163,115,0.15)" strokeWidth="1" />
                    <polygon points="24,8 16,28 20,28 24,18 28,28 32,28" fill="#d4a373" opacity="0.6" />
                    <polygon points="20,28 24,18 28,28 26,23 22,23" fill="white" opacity="0.3" />
                    <text x="24" y="38" textAnchor="middle" fill="#d4a373" fontSize="5" opacity="0.6" fontWeight="700">RAINIER</text>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={factIdx}
                      className="text-[11.5px] leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                    >
                      {FUN_FACTS[factIdx].text}
                    </motion.p>
                  </AnimatePresence>
                  <button
                    className="text-[9px] uppercase tracking-wider font-mono mt-2 transition-opacity hover:opacity-70"
                    style={{ color: "var(--accent-gold)" }}
                  >
                    {FUN_FACTS[factIdx].cta}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Streak */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">Streak</div>
              <div className="flex items-start gap-3 mb-3">
                <span className="font-display" style={{ fontSize: "2.2rem", color: accentColor, lineHeight: 1, filter: `drop-shadow(${accentGlow})` }}>3</span>
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
                      background: i < 3 ? `${accentColor}18` : "rgba(180,165,130,0.04)",
                      border: `1px solid ${i < 3 ? `${accentColor}30` : "rgba(180,165,130,0.06)"}`,
                      color: i < 3 ? accentColor : "var(--text-tertiary)",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Elevation */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">Elevation Advantage</div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>You&apos;re at 275 ft</p>
                  <p className="text-[9.5px] mt-1 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                    Rainier summit is 14,411 ft<br />Every 1,000ft of elevation<br />improves your odds.
                  </p>
                </div>
                <svg viewBox="0 0 56 80" className="w-12 h-16 flex-shrink-0" aria-hidden="true">
                  <line x1="52" y1="4" x2="52" y2="76" stroke="rgba(180,165,130,0.06)" strokeWidth="1" />
                  <path d="M8 76 L24 38 L32 22 L40 38 L56 76 Z" fill="var(--season-mountain-base)" opacity="0.3" />
                  <path d="M24 38 L32 22 L40 38 L36 30 L28 30 Z" fill="var(--season-mountain-snow)" opacity="0.4" />
                  <text x="54" y="7" fill="var(--text-tertiary)" fontSize="4.5" opacity="0.5">14,411</text>
                  <text x="54" y="75" fill="var(--text-tertiary)" fontSize="4.5" opacity="0.5">275 ft</text>
                  <line x1="50" y1="73" x2="52" y2="73" stroke="rgba(180,165,130,0.2)" strokeWidth="0.8" />
                  <line x1="50" y1="5" x2="52" y2="5" stroke="rgba(180,165,130,0.2)" strokeWidth="0.8" />
                </svg>
              </div>
            </motion.div>

            {/* Direction */}
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">Direction to Rainier</div>
              <div className="flex items-center gap-4 mt-1">
                <div className="relative flex-shrink-0">
                  <Compass className="w-12 h-12" style={{ color: "var(--accent-gold)", opacity: 0.55 }} />
                  {["N","S","E","W"].map((d, i) => {
                    const pos = [
                      { top: "-2px", left: "50%", transform: "translateX(-50%)" },
                      { bottom: "-2px", left: "50%", transform: "translateX(-50%)" },
                      { top: "50%", right: "-2px", transform: "translateY(-50%)" },
                      { top: "50%", left: "-2px", transform: "translateY(-50%)" },
                    ][i];
                    return <span key={d} className="absolute text-[6.5px] font-bold" style={{ color: "var(--text-tertiary)", ...pos }}>{d}</span>;
                  })}
                </div>
                <div>
                  <p className="font-display" style={{ fontSize: "1.4rem", color: "var(--text-primary)", lineHeight: 1.1 }}>SSE (158°)</p>
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                    Distance: <span style={{ color: "var(--accent-gold)" }}>54 miles</span>
                  </p>
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
              <div className="dash-card-header flex items-center gap-2">
                <Camera className="w-3.5 h-3.5" style={{ color: "var(--accent-gold)" }} />
                <span>Live Webcam — Mt. Rainier</span>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(212,163,115,0.08)" }}>
                <FeaturedWebcam />
              </div>
            </motion.div>
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Live Webcams</div>
              <LiveWebcams feeds={WEBCAM_FEEDS} />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Community Photos</div>
              <PhotoDrop neighborhood={neighborhood} />
            </motion.div>
            <motion.div {...fadeUp} className="dash-card">
              <div className="dash-card-header">Neighborhood Spotters</div>
              <CommunityGames
                selectedHood={neighborhood}
                onSelectHood={setNeighborhood}
                fallbackScores={allScores}
                fallbackLabels={NEIGHBORHOOD_LABELS}
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
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
              <span className="text-[9.5px] font-mono mt-3 block uppercase tracking-wider" style={{ color: "var(--accent-gold)" }}>
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
            <motion.div {...fadeUp} className="dash-card mt-5" style={{ borderLeft: "2px solid var(--accent-gold)" }}>
              <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "var(--accent-gold)" }}>Alpenglow Alert</p>
              <p className="font-display text-xl mt-1.5" style={{ color: "var(--text-primary)" }}>
                Mountain could turn pink in ~{data.alpenglow.minutesToSunset}min
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{data.alpenglow.probability}% probability</p>
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
              <a href="https://x.com/jatin_batra1" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70" style={{ color: "var(--accent-gold)" }}>
                @jatin_batra1
              </a>
            </div>
            <div className="flex items-center gap-6 mt-5 pt-5" style={{ borderTop: "1px solid rgba(180,165,130,0.04)" }}>
              <a href="/almanac" className="text-[10px] transition-opacity hover:opacity-70" style={{ color: "var(--text-tertiary)" }}>Almanac</a>
              <a href="/embed" className="text-[10px] transition-opacity hover:opacity-70" style={{ color: "var(--text-tertiary)" }}>Embed</a>
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
