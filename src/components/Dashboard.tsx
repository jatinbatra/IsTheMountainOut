"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Compass } from "lucide-react";

import FeaturedWebcam from "@/components/FeaturedWebcam";
import GlobalStreakBadge from "@/components/GlobalStreakBadge";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PrivacyCommitment from "@/components/PrivacyCommitment";
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

import Sidebar from "@/components/dashboard/Sidebar";
import HeroSection from "@/components/dashboard/HeroSection";
import ViewpointCarousel from "@/components/dashboard/ViewpointCarousel";
import VisibilityCard from "@/components/dashboard/VisibilityCard";
import FactorsCard from "@/components/dashboard/FactorsCard";
import NeighborhoodCard from "@/components/dashboard/NeighborhoodCard";
import ForecastCard from "@/components/dashboard/ForecastCard";

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

const VIEWPOINTS = [
  { id: "kerry-park",      name: "Kerry Park",      sub: "Queen Anne",        image: "https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=1600&q=80" },
  { id: "space-needle",    name: "Space Needle",    sub: "Downtown",          image: "https://images.unsplash.com/photo-1466388480397-6a4a4086d4e2?auto=format&fit=crop&w=1600&q=80" },
  { id: "uw-campus",       name: "UW Campus",       sub: "University District", image: "https://images.unsplash.com/photo-1541339907198-e0875638114a?auto=format&fit=crop&w=1600&q=80" },
  { id: "i90-bridge",      name: "I-90 Bridge",     sub: "Lake Washington",   image: "https://images.unsplash.com/photo-1621213032540-02552834f3b7?auto=format&fit=crop&w=1600&q=80" },
  { id: "sculpture-park",  name: "Sculpture Park",  sub: "Waterfront",        image: "https://images.unsplash.com/photo-1498429089284-41f8cf3ffd39?auto=format&fit=crop&w=1600&q=80" },
  { id: "harbor-view",     name: "Harbor View",     sub: "Port of Seattle",   image: "https://images.unsplash.com/photo-1518330756237-7a87d656091e?auto=format&fit=crop&w=1600&q=80" },
  { id: "alki-beach",      name: "Alki Beach",      sub: "West Seattle",      image: "https://images.unsplash.com/photo-1518330756237-7a87d656091e?auto=format&fit=crop&w=1600&q=80" },
  { id: "sodo",            name: "SODO",            sub: "South Seattle",     image: "https://images.unsplash.com/photo-1552554529-679901777d54?auto=format&fit=crop&w=1600&q=80" },
];

const FUN_FACTS = [
  { text: "Mt. Rainier has been featured as inspiration for the original Starbucks logo — the mountain's silhouette framed the siren.", cta: "See the story →", url: "https://en.wikipedia.org/wiki/Starbucks#History" },
  { text: "Seattle averages 226 cloudy days per year, making a clear Rainier sighting genuinely special — locals celebrate it.", cta: "Weather stats →", url: "https://en.wikipedia.org/wiki/Climate_of_Seattle" },
  { text: "At 14,411 ft, Rainier is the most glaciated peak in the contiguous US with 25 major glaciers containing over 1 cubic mile of ice.", cta: "Glacier facts →", url: "https://www.nps.gov/mora/learn/nature/glaciers.htm" },
  { text: "On exceptionally clear days, Mt. Rainier can be seen from as far as Portland, Oregon — 150 miles to the south.", cta: "Viewing range →", url: "https://en.wikipedia.org/wiki/Mount_Rainier" },
  { text: "The mountain's Indigenous name is Tahoma (or Tacoma), meaning 'mother of waters' — it feeds six major rivers.", cta: "Learn more →", url: "https://www.nps.gov/mora/learn/historyculture/index.htm" },
  { text: "Rainier has the world's largest volcanic glacier cave system, carved by geothermal heat beneath the ice.", cta: "Explore caves →", url: "https://en.wikipedia.org/wiki/Mount_Rainier#Geology" },
  { text: "The 93-mile Wonderland Trail circumnavigates the mountain and takes most hikers 7-10 days to complete.", cta: "Trail guide →", url: "https://www.nps.gov/mora/planyourvisit/the-wonderland-trail.htm" },
  { text: "Mt. Rainier produces its own weather — lenticular clouds form at the summit and are often mistaken for UFOs.", cta: "Cloud types →", url: "https://en.wikipedia.org/wiki/Lenticular_cloud" },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
};

const staggerParent = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export default function Dashboard({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [neighborhood, setNeighborhoodState] = useState<string | null>(
    searchParams.get("hood") || null
  );

  const { data: swrData, isValidating } = useSWR<MountainData>(
    neighborhood ? `/api/mountain-status?hood=${neighborhood}` : "/api/mountain-status",
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 15 * 60 * 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const data = swrData!;
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

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const season     = getCurrentSeason();
  const palette    = getSeasonalPalette(season);
  const statusWord = getSeasonalStatusWord(season, isVisible, isNight);
  const seasonVars = getCSSVariables(palette);

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
  const accentGlow  = isVisible ? "0 0 16px rgba(45, 212, 191, 0.25)" : "0 0 16px rgba(244, 114, 182, 0.25)";

  const weatherLabel = data.weather.cloudLow < 20 ? "Sunny" : data.weather.cloudLow < 50 ? "Partly Cloudy" : data.weather.cloudLow < 80 ? "Mostly Cloudy" : "Overcast";

  const navTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex min-h-screen" style={seasonVars as React.CSSProperties}>
      <PWAInstallPrompt />

      <Sidebar activeNav={activeNav} onNavClick={navTo} />

      <main className="main-with-sidebar flex-1 ml-[78px] min-h-screen">
        <HeroSection 
          backgroundImage={VIEWPOINTS[selectedVp]?.image ?? "/images/hero/rainier-waterfront.jpg"}
          viewpointName={VIEWPOINTS[selectedVp]?.name}
          viewpointSub={VIEWPOINTS[selectedVp]?.sub}
          timeStr={timeStr}
          tempF={tempF}
          weatherLabel={weatherLabel}
          windSpeed={data.weather.windSpeed}
          humidity={data.weather.humidity}
          visMiles={visMiles}
          isVisible={isVisible}
          statusWord={statusWord}
          durationMessage={data.visibility.durationMessage}
          sunrise={data.weather.sunrise}
          sunset={data.weather.sunset}
          alpenglow={data.alpenglow}
        />

        <ViewpointCarousel 
          viewpoints={VIEWPOINTS}
          selectedVp={selectedVp}
          onSelectVp={setSelectedVp}
          dataViewpoints={data.viewpoints}
          baseScore={score}
        />

        <div className="dashboard-content">
          <motion.div
            className="dashboard-grid"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerParent}
          >
            <VisibilityCard 
              score={score}
              isVisible={isVisible}
              isNight={isNight}
              isValidating={isValidating}
              lastUpdate={lastUpdate}
              now={now}
              accentColor={accentColor}
              accentGlow={accentGlow}
              fadeUp={fadeUp}
              className="card-score"
            />

            <FactorsCard 
              isVisible={isVisible}
              factors={factors}
              fadeUp={fadeUp}
              className="card-factors"
            />

            <FeaturedWebcam className="card-webcam" />

            <NeighborhoodCard 
              allScores={allScores}
              neighborhoodLabels={NEIGHBORHOOD_LABELS}
              baseScore={score}
              onSelectNeighborhood={setNeighborhood}
              fadeUp={fadeUp}
              className="card-map"
            />

            <ForecastCard 
              viewpointName={VIEWPOINTS[selectedVp]?.name}
              hourlyTimeline={data.hourlyTimeline}
              weeklyForecast={data.weeklyForecast}
              currentScore={score}
              fadeUp={fadeUp}
              className="card-forecast"
            />

            <motion.div variants={fadeUp} className="dash-card dash-card-warm card-fact">
              <div className="dash-card-header" style={{ color: "var(--accent-gold)" }}>Did You Know?</div>
              <div className="flex items-start gap-4">
                <div className="fun-fact-badge">
                  <svg viewBox="0 0 48 48" className="w-10 h-10 flex-shrink-0">
                    <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(251, 191, 36, 0.2)" strokeWidth="1.5" />
                    <polygon points="24,8 16,28 20,28 24,18 28,28 32,28" fill="var(--accent-gold)" opacity="0.6" />
                    <text x="24" y="38" textAnchor="middle" fill="var(--accent-gold)" fontSize="5" opacity="0.6" fontWeight="700">RAINIER</text>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={factIdx}
                      className="text-[11px] leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                    >
                      {FUN_FACTS[factIdx].text}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="dash-card card-streak">
              <div className="dash-card-header">Streak</div>
              <div className="flex items-baseline gap-2">
                <span className="font-display" style={{ fontSize: "2rem", color: accentColor, filter: `drop-shadow(${accentGlow})` }}>3</span>
                <span className="text-[10px] font-semibold" style={{ color: "var(--text-primary)" }}>DAYS</span>
              </div>
              <GlobalStreakBadge />
            </motion.div>

            <motion.div variants={fadeUp} className="dash-card card-elevation">
              <div className="dash-card-header">Elevation</div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>You&apos;re at 275 ft</p>
                  <p className="text-[9px] mt-0.5 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                    Every 1k ft helps.
                  </p>
                </div>
                <svg viewBox="0 0 56 60" className="w-10 h-10 flex-shrink-0" aria-hidden="true">
                  <path d="M8 56 L24 22 L32 6 L40 22 L56 56 Z" fill="var(--accent-gold)" opacity="0.15" />
                  <path d="M24 22 L32 6 L40 22 L36 14 L28 14 Z" fill="var(--accent-gold)" opacity="0.3" />
                </svg>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="dash-card card-direction">
              <div className="dash-card-header">Direction</div>
              <div className="flex items-center gap-3">
                <Compass className="w-8 h-8" style={{ color: "var(--accent-gold)", opacity: 0.55 }} />
                <div>
                  <p className="font-display" style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>SSE</p>
                  <p className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>54 mi away</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

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
