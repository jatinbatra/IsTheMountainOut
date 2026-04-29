"use client";

import { CloudOff } from "lucide-react";
import { findNextClearWindow, describeWindow } from "@/lib/forecast";

interface HourlyPoint {
  time: string;
  score: number;
}

interface DailyPoint {
  date: string;
  dayLabel: string;
  score: number;
}

interface Props {
  hourlyTimeline?: HourlyPoint[];
  weeklyForecast?: DailyPoint[];
  currentScore: number;
}

export default function NextClearWindow({ hourlyTimeline, weeklyForecast, currentScore }: Props) {
  const window = findNextClearWindow(hourlyTimeline, weeklyForecast, currentScore);

  if (!window) {
    return (
      <div className="flex items-center gap-3 py-3">
        <CloudOff className="w-4 h-4 text-white/15 flex-shrink-0" aria-hidden="true" />
        <p className="text-sm text-white/30">
          No clear stretches in the 7-day forecast.
        </p>
      </div>
    );
  }

  const isNow = window.kind === "now";

  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0">
        <p className="text-xs text-white/25 mb-0.5">
          {isNow ? "Clear right now" : "Next clear window"}
        </p>
        <p className={`text-sm font-semibold truncate ${isNow ? "text-emerald-400" : "text-white"}`}>
          {describeWindow(window)}
        </p>
      </div>
      <div className="text-right flex-shrink-0 pl-4">
        <span className="font-display text-lg font-bold text-white tabular-nums">
          {window.peakScore}
        </span>
        <span className="text-white/15 text-xs ml-0.5">/100</span>
      </div>
    </div>
  );
}
