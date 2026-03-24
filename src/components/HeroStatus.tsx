"use client";

import { useState } from "react";
import { Eye, EyeOff, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  isVisible: boolean;
  score: number;
  confidence: string;
  durationMessage: string;
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
    { label: "Low Clouds", score: lowScore, max: 40, detail: `${breakdown.cloudLow}% coverage` },
    { label: "Mid Clouds", score: midScore, max: 20, detail: `${breakdown.cloudMid}% coverage` },
    { label: "High Clouds", score: highScore, max: 10, detail: `${breakdown.cloudHigh}% coverage` },
    { label: "Visibility", score: visScore, max: 20, detail: `${(breakdown.visibilityMeters / 1609.34).toFixed(0)} miles` },
    { label: "Air Quality", score: aqScore, max: 10, detail: breakdown.pm25 !== undefined ? `PM2.5: ${breakdown.pm25.toFixed(1)}` : "No data" },
    ...(weatherPenalty !== 0
      ? [{ label: "Weather Penalty", score: weatherPenalty, max: 0, detail: "Active precipitation" }]
      : []),
  ];
}

export default function HeroStatus({
  isVisible,
  score,
  confidence,
  durationMessage,
  scoreBreakdown,
}: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="relative text-center animate-fade-up">
      {/* Radial glow behind the hero text */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl animate-hero-glow pointer-events-none ${
          isVisible
            ? "bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-transparent"
            : "bg-gradient-to-br from-red-500/15 via-orange-500/8 to-transparent"
        }`}
      />

      <div className="relative space-y-8">
        {/* Question */}
        <p className="font-display text-sm font-medium tracking-[0.3em] uppercase text-white/40">
          Is the Mountain Out?
        </p>

        {/* Giant YES/NO */}
        <div className="relative">
          <h1
            className={`font-display text-[8rem] sm:text-[12rem] lg:text-[14rem] font-black leading-[0.85] tracking-tighter ${
              isVisible ? "gradient-text" : "gradient-text-red"
            }`}
          >
            {isVisible ? "YES" : "NO"}
          </h1>
        </div>

        {/* Score pill - now clickable */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => scoreBreakdown && setShowBreakdown(!showBreakdown)}
            className={`flex items-center justify-center gap-6 transition-all duration-300 ${
              scoreBreakdown
                ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                : ""
            }`}
            title={scoreBreakdown ? "Click to see score breakdown" : undefined}
          >
            <div
              className={`p-3.5 rounded-2xl ${
                isVisible
                  ? "bg-emerald-500/10 ring-1 ring-emerald-400/20 animate-pulse-glow"
                  : "bg-red-500/10 ring-1 ring-red-400/20 animate-pulse-glow-red"
              }`}
            >
              {isVisible ? (
                <Eye className="w-7 h-7 text-emerald-400" />
              ) : (
                <EyeOff className="w-7 h-7 text-red-400" />
              )}
            </div>

            <div className="text-left space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-4xl font-bold text-white">{score}</span>
                <span className="text-white/25 text-lg font-light">/100</span>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full tracking-wide uppercase ${
                    confidence === "high"
                      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20"
                      : confidence === "moderate"
                        ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20"
                        : "bg-red-500/15 text-red-300 ring-1 ring-red-400/20"
                  }`}
                >
                  {confidence}
                </span>
              </div>

              {/* Score bar */}
              <div className="w-56 h-2.5 rounded-full bg-white/[0.06] overflow-hidden ring-1 ring-white/[0.04]">
                <div
                  className={`h-full rounded-full animate-score-fill transition-colors ${
                    score >= 70
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                      : score >= 50
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                        : "bg-gradient-to-r from-red-500 to-orange-400"
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {scoreBreakdown && (
              <div className="ml-2 p-1.5 rounded-lg bg-white/[0.04]">
                {showBreakdown ? (
                  <ChevronUp className="w-4 h-4 text-white/30" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/30" />
                )}
              </div>
            )}
          </button>

          {/* Score breakdown panel */}
          <div
            className={`w-full max-w-md overflow-hidden transition-all duration-400 ease-in-out ${
              showBreakdown && scoreBreakdown
                ? "max-h-[500px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {scoreBreakdown && (
              <div className="glass rounded-2xl p-5 space-y-3 text-left">
                <h3 className="font-display text-xs font-semibold text-white/40 tracking-wide uppercase">
                  Score Breakdown
                </h3>
                {getScoreComponents(scoreBreakdown).map((comp) => (
                  <div key={comp.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50 font-medium">{comp.label}</span>
                      <span className="text-white/30">
                        {comp.detail}
                        <span className="ml-2 font-display font-bold text-white/70">
                          {comp.score > 0 ? "+" : ""}{comp.score}
                          {comp.max > 0 && <span className="text-white/20">/{comp.max}</span>}
                        </span>
                      </span>
                    </div>
                    {comp.max > 0 && (
                      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            comp.score / comp.max >= 0.7
                              ? "bg-emerald-400/70"
                              : comp.score / comp.max >= 0.4
                                ? "bg-amber-400/70"
                                : "bg-red-400/70"
                          }`}
                          style={{ width: `${(comp.score / comp.max) * 100}%` }}
                        />
                      </div>
                    )}
                    {comp.max === 0 && (
                      <div className="w-full h-1.5 rounded-full bg-red-500/20" />
                    )}
                  </div>
                ))}
                <p className="text-[10px] text-white/15 pt-2">
                  Low clouds matter most because they sit between you and the mountain.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Duration message */}
        <div className="flex items-center justify-center gap-3 max-w-lg mx-auto">
          <div
            className={`p-1.5 rounded-lg ${
              isVisible ? "bg-emerald-500/10" : "bg-red-500/10"
            }`}
          >
            {isVisible ? (
              <TrendingUp className="w-4 h-4 text-emerald-400/70" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400/70" />
            )}
          </div>
          <p className="text-white/50 text-base leading-relaxed">
            {durationMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
