"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown, AlertTriangle } from "lucide-react";

interface Props {
  isVisible: boolean;
  score: number;
  confidence: string;
  durationMessage: string;
  isNight?: boolean;
  sunrise?: string;
  scoreBreakdown?: {
    cloudLow: number;
    cloudMid: number;
    cloudHigh: number;
    visibilityMeters: number;
    pm25?: number;
    weatherCode: number;
  };
}

function getScoreComponents(breakdown: NonNullable<Props["scoreBreakdown"]>) {
  const lowScore = Math.round(40 * (1 - breakdown.cloudLow / 100));
  const midScore = Math.round(20 * (1 - breakdown.cloudMid / 100));
  const highScore = Math.round(10 * (1 - breakdown.cloudHigh / 100));
  const visNorm = Math.min(breakdown.visibilityMeters / 90000, 1);
  const visScore = Math.round(20 * visNorm);
  const aqScore =
    breakdown.pm25 !== undefined
      ? Math.round(10 * Math.max(0, 1 - breakdown.pm25 / 50))
      : 5;

  let weatherPenalty = 0;
  if (breakdown.weatherCode >= 45 && breakdown.weatherCode <= 48) weatherPenalty = -25;
  else if (breakdown.weatherCode >= 51 && breakdown.weatherCode <= 67) weatherPenalty = -15;
  else if (breakdown.weatherCode >= 71 && breakdown.weatherCode <= 77) weatherPenalty = -15;
  else if (breakdown.weatherCode >= 80) weatherPenalty = -20;

  return [
    { label: "Low Clouds", score: lowScore, max: 40, detail: `${breakdown.cloudLow}%`, color: "emerald" as const },
    { label: "Mid Clouds", score: midScore, max: 20, detail: `${breakdown.cloudMid}%`, color: "blue" as const },
    { label: "High Clouds", score: highScore, max: 10, detail: `${breakdown.cloudHigh}%`, color: "violet" as const },
    { label: "Visibility", score: visScore, max: 20, detail: `${(breakdown.visibilityMeters / 1609.34).toFixed(0)}mi`, color: "cyan" as const },
    { label: "Air Quality", score: aqScore, max: 10, detail: breakdown.pm25 !== undefined ? `${breakdown.pm25.toFixed(0)}` : "N/A", color: "amber" as const },
    ...(weatherPenalty !== 0
      ? [{ label: "Precip", score: weatherPenalty, max: 0, detail: "Active", color: "red" as const }]
      : []),
  ];
}

/** Circular SVG gauge for a single score component */
function ScoreGauge({ label, score, max, detail, color }: {
  label: string;
  score: number;
  max: number;
  detail: string;
  color: "emerald" | "blue" | "violet" | "cyan" | "amber" | "red";
}) {
  const pct = max > 0 ? Math.max(0, score / max) : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  const colorMap = {
    emerald: { stroke: "#34d399", bg: "rgba(52,211,153,0.08)" },
    blue: { stroke: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
    violet: { stroke: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
    cyan: { stroke: "#22d3ee", bg: "rgba(34,211,238,0.08)" },
    amber: { stroke: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
    red: { stroke: "#f87171", bg: "rgba(248,113,113,0.08)" },
  };

  const c = colorMap[color];

  if (max === 0) {
    // Weather penalty — show as negative badge
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: c.bg }}>
          <span className="font-display text-lg font-bold" style={{ color: c.stroke }}>{score}</span>
        </div>
        <span className="text-[10px] text-white/30 font-medium">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3.5" />
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={c.stroke}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
            opacity="0.8"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-sm font-bold text-white">{score}</span>
          <span className="text-[8px] text-white/20">/{max}</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-[10px] text-white/30 font-medium block">{label}</span>
        <span className="text-[9px] text-white/15">{detail}</span>
      </div>
    </div>
  );
}

export default function HeroStatus({
  isVisible,
  score,
  confidence,
  durationMessage,
  isNight,
  sunrise,
  scoreBreakdown,
}: Props) {
  // At night, even clear skies don't mean you can see the mountain
  const nightWithClearSkies = isNight && isVisible;

  const sunriseStr = sunrise
    ? new Date(sunrise).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Los_Angeles",
      })
    : "sunrise";
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="relative animate-fade-up">
      {/* Prediction notice — subtle, not screaming */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] ring-1 ring-white/[0.06]">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />
          <span className="text-[11px] text-white/30 font-medium">
            Weather-based prediction, not a live camera
          </span>
        </div>
      </div>

      {/* Atmospheric glow — tied to score intensity */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[100px] pointer-events-none"
        style={{
          opacity: 0.15 + (score / 100) * 0.25,
          background: isVisible
            ? `radial-gradient(circle, rgba(52,211,153,${0.15 + score / 400}) 0%, rgba(59,130,246,0.05) 50%, transparent 70%)`
            : `radial-gradient(circle, rgba(248,113,113,0.12) 0%, rgba(251,146,60,0.04) 50%, transparent 70%)`,
        }}
      />

      <div className="relative text-center space-y-10">
        {/* The question — editorial, understated */}
        <p className="font-display text-xs font-medium tracking-[0.4em] uppercase text-white/25">
          Is the Mountain Out?
        </p>

        {/* THE ANSWER — massive editorial typography */}
        <div className="relative py-4">
          {nightWithClearSkies ? (
            <>
              <h1
                className="font-display font-black leading-[0.8] tracking-[-0.06em] gradient-text"
                style={{ fontSize: "clamp(4rem, 14vw, 10rem)" }}
              >
                CLEAR
              </h1>
              <p className="text-white/25 text-sm mt-4 font-medium">
                Clear skies tonight — check at {sunriseStr}
              </p>
            </>
          ) : (
            <h1
              className={`font-display font-black leading-[0.8] tracking-[-0.06em] ${
                isVisible ? "gradient-text" : "gradient-text-red"
              }`}
              style={{ fontSize: "clamp(7rem, 22vw, 16rem)" }}
            >
              {isVisible ? "YES" : "NO"}
            </h1>
          )}
        </div>

        {/* Score — clean, no boxy containers */}
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            <span className="font-display text-5xl font-black text-white tracking-tight">{score}</span>
            <div className="text-left">
              <span className="text-white/15 text-lg font-light block leading-none">/100</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  confidence === "high"
                    ? "text-emerald-400/60"
                    : confidence === "moderate"
                      ? "text-amber-400/60"
                      : "text-red-400/60"
                }`}
              >
                {confidence}
              </span>
            </div>
          </div>

          {/* Thin score line — no box, just a line */}
          <div className="max-w-xs mx-auto">
            <div className="w-full h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className={`h-full rounded-full animate-score-fill ${
                  score >= 70
                    ? "bg-emerald-400/70"
                    : score >= 50
                      ? "bg-amber-400/70"
                      : "bg-red-400/60"
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Score breakdown — circular gauges, no card */}
        {scoreBreakdown && (
          <div>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="inline-flex items-center gap-2 text-xs text-white/20 hover:text-white/35 transition-colors font-medium"
            >
              <span>Score breakdown</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showBreakdown ? "rotate-180" : ""}`} />
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showBreakdown ? "max-h-[300px] opacity-100 mt-6" : "max-h-0 opacity-0"
            }`}>
              <div className="flex items-start justify-center gap-6 flex-wrap">
                {getScoreComponents(scoreBreakdown).map((comp) => (
                  <ScoreGauge key={comp.label} {...comp} />
                ))}
              </div>
              <p className="text-[10px] text-white/10 mt-5">
                Low clouds matter most — they sit directly between you and the mountain
              </p>
            </div>
          </div>
        )}

        {/* Duration — clean text, no container */}
        <div className="flex items-center justify-center gap-2.5 pt-2">
          {nightWithClearSkies ? (
            <>
              <TrendingUp className="w-4 h-4 text-emerald-400/40" />
              <p className="text-white/35 text-sm leading-relaxed">
                Conditions are clear. If this holds, the mountain should be visible at {sunriseStr}.
              </p>
            </>
          ) : isVisible ? (
            <>
              <TrendingUp className="w-4 h-4 text-emerald-400/40" />
              <p className="text-white/35 text-sm leading-relaxed">{durationMessage}</p>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-red-400/40" />
              <p className="text-white/35 text-sm leading-relaxed">{durationMessage}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
