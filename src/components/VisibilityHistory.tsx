"use client";

import { useState } from "react";
import type { WeeklyForecastDay } from "@/components/Dashboard";

interface Props {
  isVisible: boolean;
  weeklyForecast?: WeeklyForecastDay[];
}

function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code >= 45 && code <= 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Storms";
  return "Mixed";
}

export default function VisibilityHistory({ isVisible, weeklyForecast }: Props) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  if (!weeklyForecast || weeklyForecast.length === 0) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium text-[color:var(--type-1)]">
          7-Day Prediction
        </h2>
        <span className="ticker">
          Based on forecast data
        </span>
      </div>

      <div className="space-y-0">
        {weeklyForecast.map((day, i) => {
          const isToday = day.date === today;
          const hovered = hoveredDay === i;
          const barColor = day.isVisible
            ? isVisible ? "bg-[color:var(--accent-clear)]/60" : "bg-[color:var(--accent-clear)]/30"
            : "bg-[color:var(--accent-fog)]/35";

          return (
            <div
              key={day.date}
              className={`py-3 border-b border-[var(--rule)] last:border-0 cursor-default transition-colors ${
                hovered ? "bg-[color:var(--type-1)]/[0.02]" : ""
              }`}
              onMouseEnter={() => setHoveredDay(i)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 shrink-0">
                  <span className={`text-xs font-mono ${isToday ? "text-[color:var(--type-1)]" : "text-[color:var(--type-4)]"}`}>
                    {isToday ? "Today" : day.dayLabel}
                  </span>
                </div>

                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--rule)] relative overflow-hidden">
                    <div
                      className={`absolute left-0 top-[-1px] h-[3px] ${barColor} transition-all duration-700`}
                      style={{ width: `${day.score}%` }}
                    />
                  </div>

                  <span className={`font-mono text-xs tabular w-8 text-right ${
                    day.isVisible ? "text-[color:var(--accent-clear)]" : "text-[color:var(--accent-fog)]"
                  }`}>
                    {day.score}
                  </span>
                </div>

                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  day.isVisible ? "bg-[color:var(--accent-clear)]/50" : "bg-[color:var(--accent-fog)]/40"
                }`} />
              </div>

              <div className={`overflow-hidden transition-all duration-300 ${
                hovered ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0"
              }`}>
                <div className="flex items-center gap-4 ml-12 font-mono text-[10px] text-[color:var(--type-4)]">
                  <span>{weatherLabel(day.weatherCode)}</span>
                  <span>&middot;</span>
                  <span>{Math.round(day.tempHigh * 9/5 + 32)}° / {Math.round(day.tempLow * 9/5 + 32)}°F</span>
                  <span>&middot;</span>
                  <span>Clouds {day.cloudLow}%</span>
                  <span>&middot;</span>
                  <span>Humidity {day.humidity}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 ticker">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[color:var(--accent-clear)]/50" />
          <span>Likely visible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[color:var(--accent-fog)]/40" />
          <span>Likely hidden</span>
        </div>
      </div>
    </div>
  );
}
