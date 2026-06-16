"use client";

import { motion, Variants } from "framer-motion";
import { Sparkles, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { VISIBLE_THRESHOLD } from "@/lib/visibility";

interface VisibilityCardProps {
  score: number;
  isVisible: boolean;
  isNight: boolean;
  isValidating: boolean;
  lastUpdate: Date;
  now: number;
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
  fadeUp,
  className = "",
  confidence,
  durationMessage,
}: VisibilityCardProps) {
  const gaugeR = 54;
  const gaugeC = 2 * Math.PI * gaugeR;
  const gaugeOff = gaugeC - (score / 100) * gaugeC;

  const gaugeColor = isNight
    ? "var(--text-tertiary)"
    : score >= 70
      ? "var(--accent)"
      : score >= VISIBLE_THRESHOLD
        ? "var(--accent-gold)"
        : "var(--accent-pink)";

  const statusLabel = isNight
    ? "Nighttime"
    : score >= 76
      ? "Great Visibility"
      : score >= VISIBLE_THRESHOLD
        ? "Moderate"
        : score >= 30
          ? "Poor"
          : "Very Poor";

  return (
    <motion.div variants={fadeUp} className={`dash-card flex flex-col items-center gap-0 ${className}`}>
      <div className="dash-card-header w-full flex items-center justify-between">
        <span>Visibility Score</span>
        <span className="ai-badge"><Sparkles className="w-2.5 h-2.5" /><span className="ai-badge-dot" /> AI Prediction</span>
      </div>

      <div className="relative mt-2 mb-1">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle
            cx="65" cy="65" r={gaugeR}
            fill="none"
            strokeWidth="7"
            stroke="var(--border-primary)"
          />
          <circle
            cx="65" cy="65" r={gaugeR}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            stroke={gaugeColor}
            strokeDasharray={gaugeC}
            strokeDashoffset={gaugeOff}
            style={{
              transition: "stroke-dashoffset 1.2s ease, stroke 0.4s ease",
              transform: "rotate(-90deg)",
              transformOrigin: "65px 65px",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            data-testid="visibility-score"
            className="font-display tabular-nums leading-none"
            style={{ fontSize: "2.8rem", color: "var(--text-hero)" }}
          >
            {score}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.15em] font-semibold mt-1.5"
            style={{ color: gaugeColor }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {(confidence || durationMessage) && (
        <div className="w-full flex flex-col items-center gap-1.5 mt-1">
          {confidence && (
            <span
              className="text-[8px] uppercase tracking-[0.12em] font-bold px-2.5 py-0.5 rounded-full"
              style={{ color: "var(--accent-gold)", background: "rgba(224,169,109,0.08)", border: "1px solid rgba(224,169,109,0.2)" }}
            >
              {confidence} confidence
            </span>
          )}
          {durationMessage && (
            <p className="text-[10px] text-center leading-snug px-2" style={{ color: "var(--text-secondary)" }}>
              {durationMessage}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 text-[9px] w-full justify-center" style={{ color: "var(--text-tertiary)" }}>
        <div className="flex items-center gap-1.5">
          <RefreshCw className={`w-[10px] h-[10px] ${isValidating ? "animate-spin" : ""}`} />
          <span>Updated {Math.round((now - lastUpdate.getTime()) / 60000)} min ago</span>
        </div>
        <span style={{ color: "rgba(90,79,62,0.3)" }}>·</span>
        <div className="flex items-center gap-1">
          {isNight ? (
            <span style={{ color: "var(--text-tertiary)" }}>Night — check at sunrise</span>
          ) : isVisible ? (
            <>
              <TrendingUp className="w-[10px] h-[10px]" style={{ color: "var(--accent)" }} />
              <span style={{ color: "var(--accent)" }}>
                {score >= 76 ? "Clear skies" : "Partly visible"}
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="w-[10px] h-[10px]" style={{ color: "var(--accent-pink)" }} />
              <span style={{ color: "var(--accent-pink)" }}>
                {score >= 40 ? "Marginal" : "Obscured"}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
