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
    <section id="section-home" className="hero-section" style={{ height: "62vh", minHeight: "500px" }}>
      <div
        className="absolute inset-0 z-[0]"
        style={{
          backgroundImage: `url(${backgroundImage})`,
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
        <div className="flex flex-col items-start gap-3">
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
                {viewpointName}, {viewpointSub} · {timeStr} PDT
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
            ? `Beautiful visibility right now from ${viewpointName}`
            : durationMessage}
        </motion.p>
      </div>
    </section>
  );
}
