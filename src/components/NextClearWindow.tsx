"use client";

import { CalendarClock, CloudOff, Sparkles } from "lucide-react";
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
      <div className="rounded-2xl ring-1 ring-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-500/10 ring-1 ring-slate-400/15">
          <CloudOff className="w-4 h-4 text-slate-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">
            Next clear window
          </p>
          <p className="text-sm font-medium text-white/70 mt-0.5">
            No clear stretches in the 7-day forecast.
          </p>
        </div>
      </div>
    );
  }

  const isNow = window.kind === "now";
  const Icon = isNow ? Sparkles : CalendarClock;

  return (
    <div
      className={`rounded-2xl px-4 py-3 flex items-center gap-3 ring-1 ${
        isNow
          ? "bg-emerald-500/8 ring-emerald-400/20"
          : "bg-white/[0.02] ring-white/[0.06]"
      }`}
    >
      <div
        className={`p-2 rounded-xl ring-1 ${
          isNow ? "bg-emerald-500/15 ring-emerald-400/25" : "bg-blue-500/10 ring-blue-400/15"
        }`}
      >
        <Icon
          className={`w-4 h-4 ${isNow ? "text-emerald-300" : "text-blue-300"}`}
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">
          {isNow ? "Clear right now" : "Next clear window"}
        </p>
        <p className="text-sm font-display font-bold text-white mt-0.5 truncate">
          {describeWindow(window)}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-display text-lg font-bold text-white tabular-nums leading-none">
          {window.peakScore}
        </div>
        <div className="text-[9px] uppercase tracking-wide text-slate-500 font-semibold">peak</div>
      </div>
    </div>
  );
}
