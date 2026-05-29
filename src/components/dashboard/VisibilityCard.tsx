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
  className?: string;
  confidence?: string;
  durationMessage?: string;
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
  className = "",
  confidence,
  durationMessage,
}: VisibilityCardProps) {
  const gaugeR = 64; // Adjusted for smaller bento layout
  const gaugeC = 2 * Math.PI * gaugeR;
  const gaugeOff = gaugeC - (score / 100) * gaugeC;

  return (
    <motion.div variants={fadeUp} className={`dash-card flex flex-col items-center ${className}`}>
      <div className="dash-card-header w-full flex items-center justify-between">
        <span>Visibility Score</span>
        <span className="ai-badge"><Sparkles className="w-2.5 h-2.5" /><span className="ai-badge-dot" /> AI Prediction</span>
      </div>

      <div className="relative my-1">
        <div className="score-gauge-wrap">
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r={gaugeR} className="gauge-track" />
            <circle
              cx="75" cy="75" r={gaugeR}
              className="gauge-fill-pink"
              strokeDasharray={gaugeC}
              strokeDashoffset={gaugeOff}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-display tabular"
              style={{ fontSize: "3.5rem", color: "var(--text-hero)", filter: `drop-shadow(0 4px 10px rgba(0,0,0,0.5))` }}
            >
              {score}<span style={{ fontSize: "1.5rem", color: "var(--text-secondary)" }}>%</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold mt-1" style={{ color: "var(--text-secondary)" }}>
              {score >= 76 ? "Great Visibility" : score >= 50 ? "Moderate" : "Poor"}
            </span>
          </div>
        </div>
      </div>

      {(confidence || durationMessage) && (
        <div className="w-full mt-2 flex flex-col items-center gap-1.5">
          {confidence && (
            <span
              className="text-[8.5px] uppercase tracking-[0.12em] font-bold px-2.5 py-0.5 rounded-full"
              style={{ color: "var(--accent-gold)", background: "rgba(224,169,109,0.1)", border: "1px solid rgba(224,169,109,0.25)" }}
            >
              {confidence} confidence
            </span>
          )}
          {durationMessage && (
            <p className="text-[10px] text-center leading-snug px-3" style={{ color: "var(--text-secondary)" }}>
              {durationMessage}
            </p>
          )}
        </div>
      )}

      <div className="w-full px-2 mt-3">
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
