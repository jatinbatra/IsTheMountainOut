"use client";

import { motion, Variants } from "framer-motion";
import { Sparkles, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import MountainSilhouetteScore from "@/components/MountainSilhouetteScore";

interface VisibilityCardProps {
  score: number;
  isVisible: boolean;
  isNight: boolean;
  isValidating: boolean;
  lastUpdate: Date;
  now: number;
  accentColor: string;
  accentGlow: string;
  fadeUp: Variants;
}

export default function VisibilityCard({
  score,
  isVisible,
  isNight,
  isValidating,
  lastUpdate,
  now,
  accentColor,
  accentGlow,
  fadeUp,
}: VisibilityCardProps) {
  const gaugeR = 72;
  const gaugeC = 2 * Math.PI * gaugeR;
  const gaugeOff = gaugeC - (score / 100) * gaugeC;

  return (
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
          <span>Updated {Math.round((now - lastUpdate.getTime()) / 60000)} min ago</span>
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
  );
}
