"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown, AlertTriangle } from "lucide-react";
import { WMO, WEIGHTS } from "@/lib/visibility";

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
  const lowScore = Math.round(WEIGHTS.LOW_CLOUDS * (1 - breakdown.cloudLow / 100));
  const midScore = Math.round(WEIGHTS.MID_CLOUDS * (1 - breakdown.cloudMid / 100));
  const highScore = Math.round(WEIGHTS.HIGH_CLOUDS * (1 - breakdown.cloudHigh / 100));
  const visNorm = Math.min(breakdown.visibilityMeters / 90000, 1);
  const visScore = Math.round(WEIGHTS.VISIBILITY * visNorm);
  const aqScore =
    breakdown.pm25 !== undefined
      ? Math.round(WEIGHTS.AIR_QUALITY * Math.max(0, 1 - breakdown.pm25 / 50))
      : 5;

  let weatherPenalty = 0;
  const wc = breakdown.weatherCode;
  if (wc >= WMO.FOG_MIN && wc <= WMO.FOG_MAX) weatherPenalty = -25;
  else if (wc >= WMO.DRIZZLE_MIN && wc <= WMO.RAIN_MAX) weatherPenalty = -15;
  else if (wc >= WMO.SNOW_MIN && wc <= WMO.SNOW_MAX) weatherPenalty = -15;
  else if (wc >= WMO.SHOWERS_MIN) weatherPenalty = -20;

  return [
    { label: "Low Clouds", score: lowScore, max: WEIGHTS.LOW_CLOUDS, detail: `${breakdown.cloudLow}%`, color: "emerald" as const },
    { label: "Mid Clouds", score: midScore, max: WEIGHTS.MID_CLOUDS, detail: `${breakdown.cloudMid}%`, color: "blue" as const },
    { label: "High Clouds", score: highScore, max: WEIGHTS.HIGH_CLOUDS, detail: `${breakdown.cloudHigh}%`, color: "violet" as const },
    { label: "Visibility", score: visScore, max: WEIGHTS.VISIBILITY, detail: `${(breakdown.visibilityMeters / 1609.34).toFixed(0)}mi`, color: "cyan" as const },
    { label: "Air Quality", score: aqScore, max: WEIGHTS.AIR_QUALITY, detail: breakdown.pm25 !== undefined ? `${breakdown.pm25.toFixed(0)}` : "N/A", color: "amber" as const },
    ...(weatherPenalty !== 0
      ? [{ label: "Precip", score: weatherPenalty, max: 0, detail: "Active", color: "red" as const }]
      : []),
  ];
}

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
    return (
      <div className="flex flex-col items-center gap-1.5" role="group" aria-label={`${label}: ${score}`}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: c.bg }}>
          <span className="font-display text-lg font-bold" style={{ color: c.stroke }}>{score}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5" role="group" aria-label={`${label}: ${score} of ${max}`}>
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90" aria-hidden="true">
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
          <span className="text-[8px] text-slate-600">/{max}</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-[10px] text-slate-400 font-medium block">{label}</span>
        <span className="text-[9px] text-slate-600">{detail}</span>
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
    <div className="relative animate-fade-up" role="region" aria-label="Mountain visibility status">
      {/* Prediction notice — compact */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] ring-1 ring-white/[0.06]">
          <AlertTriangle className="w-3 h-3 text-amber-400/60" aria-hidden="true" />
          <span className="text-[10px] text-white/35 font-medium">
            Weather-based prediction
          </span>
        </div>
      </div>

      {/* Atmospheric glow — lightweight radial gradient with breathing animation */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none animate-hero-glow"
        style={{
          background: isVisible
            ? `radial-gradient(ellipse, rgba(52,211,153,${0.15 + score / 400}) 0%, rgba(59,130,246,0.03) 40%, transparent 65%)`
            : `radial-gradient(ellipse, rgba(248,113,113,0.10) 0%, rgba(251,146,60,0.03) 40%, transparent 65%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative text-center space-y-6">
        {/* The question */}
        <p className="font-display text-[11px] font-semibold tracking-[0.35em] uppercase text-slate-500">
          Is the Mountain Out?
        </p>

        {/* THE ANSWER */}
        <div className="relative py-4">
          {nightWithClearSkies ? (
            <>
              <h1
                className="font-display font-black leading-[0.8] tracking-[-0.06em] gradient-text"
                style={{ fontSize: "clamp(4rem, 14vw, 10rem)" }}
                aria-label="Clear skies tonight"
              >
                CLEAR
              </h1>
              <p className="text-white/40 text-sm mt-4 font-medium">
                Clear skies tonight — check at {sunriseStr}
              </p>
            </>
          ) : (
            <h1
              className={`font-display font-black leading-[0.8] tracking-[-0.06em] ${
                isVisible ? "gradient-text" : "gradient-text-red"
              }`}
              style={{ fontSize: "clamp(7rem, 22vw, 16rem)" }}
              aria-label={`Mountain is ${isVisible ? "visible" : "not visible"}`}
            >
              {isVisible ? "YES" : "NO"}
            </h1>
          )}
        </div>

        {/* Score */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <span className="font-display text-5xl font-black text-white tracking-tight" aria-label={`Score: ${score} out of 100`}>{score}</span>
            <div className="text-left">
              <span className="text-slate-600 text-lg font-light block leading-none">/100</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  confidence === "high"
                    ? "text-emerald-400/70"
                    : confidence === "moderate"
                      ? "text-amber-400/70"
                      : "text-red-400/70"
                }`}
              >
                {confidence}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div className="max-w-xs mx-auto" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Visibility score">
            <div className="w-full h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
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

        {/* Score breakdown */}
        {scoreBreakdown && (
          <div>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
              aria-expanded={showBreakdown}
              aria-controls="score-breakdown"
            >
              <span>Score breakdown</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showBreakdown ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>

            <div
              id="score-breakdown"
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                showBreakdown ? "max-h-[300px] opacity-100 mt-6" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex items-start justify-center gap-6 flex-wrap">
                {getScoreComponents(scoreBreakdown).map((comp) => (
                  <ScoreGauge key={comp.label} {...comp} />
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-5 tracking-wide">
                Low clouds matter most — they sit directly between you and the mountain
              </p>
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="flex items-center justify-center gap-2.5 pt-2">
          {nightWithClearSkies ? (
            <>
              <TrendingUp className="w-4 h-4 text-emerald-400/50" aria-hidden="true" />
              <p className="text-white/45 text-sm leading-relaxed">
                Conditions are clear. If this holds, the mountain should be visible at {sunriseStr}.
              </p>
            </>
          ) : isVisible ? (
            <>
              <TrendingUp className="w-4 h-4 text-emerald-400/50" aria-hidden="true" />
              <p className="text-white/45 text-sm leading-relaxed">{durationMessage}</p>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-red-400/50" aria-hidden="true" />
              <p className="text-white/45 text-sm leading-relaxed">{durationMessage}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
