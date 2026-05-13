"use client";

import { motion, Variants } from "framer-motion";
import { Sun } from "lucide-react";
import ForecastHub from "@/components/ForecastHub";
import NextClearWindow from "@/components/NextClearWindow";
import type { WeeklyForecastDay } from "@/components/Dashboard";

interface ForecastCardProps {
  viewpointName: string;
  hourlyTimeline: {
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
  }[];
  visibilityScore: number;
  isVisible: boolean;
  weeklyForecast?: WeeklyForecastDay[];
  currentScore: number;
  fadeUp: Variants;
}

export default function ForecastCard({
  viewpointName,
  hourlyTimeline,
  visibilityScore,
  isVisible,
  weeklyForecast,
  currentScore,
  fadeUp,
}: ForecastCardProps) {
  return (
    <motion.div variants={fadeUp} id="section-forecast" className="dash-card col-span-2">
      <div className="dash-card-header">Forecast for {viewpointName}</div>
      <ForecastHub
        hourlyTimeline={hourlyTimeline}
        weeklyForecast={weeklyForecast}
      />
      <div className="mt-4 p-3 rounded-2xl" style={{ background: "rgba(212,163,115,0.06)", border: "1px solid rgba(212,163,115,0.1)" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Sun className="w-3.5 h-3.5" style={{ color: "var(--accent-gold)" }} />
          <span className="text-[8.5px] uppercase tracking-wider font-bold" style={{ color: "var(--accent-gold)" }}>
            Best Viewing Window
          </span>
        </div>
        <NextClearWindow hourlyTimeline={hourlyTimeline} weeklyForecast={weeklyForecast} currentScore={currentScore} />
      </div>
    </motion.div>
  );
}
