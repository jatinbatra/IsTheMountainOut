"use client";

import { Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  isVisible: boolean;
  score: number;
  confidence: string;
  durationMessage: string;
}

export default function HeroStatus({
  isVisible,
  score,
  confidence,
  durationMessage,
}: Props) {
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

        {/* Score pill */}
        <div className="flex items-center justify-center gap-6">
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
