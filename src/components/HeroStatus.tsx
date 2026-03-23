"use client";

import { Mountain, Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";

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
    <div className="text-center space-y-6 animate-fade-up">
      {/* Big YES/NO */}
      <div className="space-y-2">
        <h1 className="text-lg font-medium tracking-wider uppercase text-white/60">
          Is the Mountain Out?
        </h1>
        <div
          className={`text-8xl sm:text-9xl font-black tracking-tight ${
            isVisible ? "gradient-text" : "gradient-text-red"
          }`}
        >
          {isVisible ? "YES" : "NO"}
        </div>
      </div>

      {/* Icon + score */}
      <div className="flex items-center justify-center gap-4">
        <div
          className={`p-3 rounded-full ${
            isVisible ? "bg-green-500/20 animate-pulse-glow" : "bg-red-500/20 animate-pulse-glow-red"
          }`}
        >
          {isVisible ? (
            <Eye className="w-8 h-8 text-green-400" />
          ) : (
            <EyeOff className="w-8 h-8 text-red-400" />
          )}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-white/50" />
            <span className="text-white/50 text-sm">Visibility Score</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{score}</span>
            <span className="text-white/40">/100</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                confidence === "high"
                  ? "bg-green-500/20 text-green-300"
                  : confidence === "moderate"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-red-500/20 text-red-300"
              }`}
            >
              {confidence} confidence
            </span>
          </div>
          {/* Score bar */}
          <div className="mt-2 w-48 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full animate-score-fill ${
                score >= 70 ? "bg-green-400" : score >= 50 ? "bg-yellow-400" : "bg-red-400"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Duration message */}
      <div className="flex items-center justify-center gap-2 max-w-xl mx-auto">
        {isVisible ? (
          <TrendingUp className="w-5 h-5 text-green-400/50 shrink-0" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-400/50 shrink-0" />
        )}
        <p className="text-white/70 text-lg leading-relaxed">
          {durationMessage}
        </p>
      </div>
    </div>
  );
}
