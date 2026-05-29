"use client";

import { motion } from "framer-motion";
import { MapPin, Sun, Wind, Droplets, Eye } from "lucide-react";

import CountdownStrip from "@/components/CountdownStrip";

interface HeroSectionProps {
  backgroundImage: string;
  viewpointName: string;
  viewpointSub: string;
  timeStr: string;
  tempF: number;
  weatherLabel: string;
  windSpeed: number;
  humidity: number;
  visMiles: number;
  isVisible: boolean;
  statusWord: string;
  durationMessage: string;
  sunrise?: string;
  sunset?: string;
  alpenglow?: {
    probability: number;
    isLikely: boolean;
    minutesToSunset: number;
  };
}

export default function HeroSection({
  backgroundImage,
  viewpointName,
  viewpointSub,
  timeStr,
  tempF,
  weatherLabel,
  windSpeed,
  humidity,
  visMiles,
  isVisible,
  statusWord,
  durationMessage,
  sunrise,
  sunset,
  alpenglow,
}: HeroSectionProps) {
  return (
    <section id="section-home" className="hero-section" style={{ height: "72vh", minHeight: "560px" }}>
      <div
        className="absolute inset-0 z-[0] ken-burns"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      />

      <div className="hero-top" />
      <div className="hero-bottom" />
      <div className="hero-sides" />
      <div className="hero-fog" />

      {/* ── Floating header ── */}
      <div className="hero-header" style={{ padding: "16px 32px" }}>
        <div className="flex flex-col items-start gap-3">
          <div className="hero-header-pill" style={{ padding: "10px 20px" }}>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="hero-live-dot" />
              <span className="text-[10px] text-white/60 font-mono uppercase tracking-widest whitespace-nowrap">
                LIVE STATUS
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-center px-6 border-x border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[color:var(--accent)] flex-shrink-0" />
              <span className="text-[11.5px] text-white/80 font-medium tracking-wide whitespace-nowrap">
                {viewpointName} · {timeStr}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0" />
          </div>

          <div className="ml-1">
            <CountdownStrip sunrise={sunrise} sunset={sunset} alpenglow={alpenglow} />
          </div>
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
              <span>{Math.round(windSpeed)} mph</span>
            </div>
            <div className="weather-widget-detail">
              <Droplets className="w-3 h-3" />
              <span>{humidity}%</span>
            </div>
            <div className="weather-widget-detail">
              <Eye className="w-3 h-3" />
              <span>{visMiles} mi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero headline — THE ANSWER ── */}
      <div className="hero-text">
        <div
          className="absolute pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,0.35) 0%, transparent 75%)",
            inset: "-10% -20%",
          }}
        />

        {/* Seattle skyline silhouette */}
        <div className="hero-skyline-silhouette" aria-hidden="true">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
            <rect x="280" y="20" width="3" height="100" fill="currentColor" />
            <ellipse cx="281" cy="40" rx="14" ry="4" fill="currentColor" />
            <rect x="275" y="36" width="12" height="3" fill="currentColor" />
            <line x1="281" y1="20" x2="281" y2="0" stroke="currentColor" strokeWidth="1" />
            <rect x="340" y="30" width="18" height="90" fill="currentColor" />
            <rect x="344" y="25" width="10" height="5" fill="currentColor" />
            <rect x="310" y="50" width="10" height="70" fill="currentColor" />
            <polygon points="310,50 315,38 320,50" fill="currentColor" />
            <rect x="370" y="55" width="14" height="65" fill="currentColor" />
            <rect x="390" y="65" width="10" height="55" fill="currentColor" />
            <rect x="240" y="60" width="12" height="60" fill="currentColor" />
            <rect x="220" y="70" width="8" height="50" fill="currentColor" />
            <rect x="410" y="72" width="9" height="48" fill="currentColor" />
            <rect x="180" y="75" width="15" height="45" fill="currentColor" />
            <rect x="430" y="68" width="11" height="52" fill="currentColor" />
            <rect x="450" y="78" width="7" height="42" fill="currentColor" />
            <line x1="0" y1="120" x2="1200" y2="120" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
          </svg>
        </div>

        <motion.p
          className="hero-location-label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.7 }}
        >
          MT. RAINIER FROM SEATTLE
        </motion.p>

        <motion.h1
          className="hero-answer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="hero-answer-primary">{isVisible ? "YES." : "NOT TODAY."}</span>{" "}
          <span className={isVisible ? "hero-answer-accent-yes" : "hero-answer-accent-no"}>
            {statusWord}.
          </span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.7 }}
        >
          {isVisible
            ? `The mountain is out. Enjoy the view from ${viewpointName}.`
            : durationMessage}
        </motion.p>
      </div>
    </section>
  );
}
