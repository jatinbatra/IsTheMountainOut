"use client";

import { useState } from "react";
import type { WeeklyForecastDay } from "@/components/Dashboard";

interface Props {
  isVisible: boolean;
  weeklyForecast?: WeeklyForecastDay[];
}

// WMO weather code to short description
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
        <h2 className="font-display text-xl font-bold text-white">
          7-Day Prediction
        </h2>
        <span className="text-[10px] text-white/15 font-medium uppercase tracking-wider">
          Based on forecast data
        </span>
      </div>

      {/* Day bars — no cards, clean horizontal layout */}
      <div className="space-y-0">
        {weeklyForecast.map((day, i) => {
          const isToday = day.date === today;
          const hovered = hoveredDay === i;
          const barColor = day.isVisible
            ? isVisible ? "bg-emerald-400/60" : "bg-emerald-400/30"
            : "bg-red-400/35";

          return (
            <div
              key={day.date}
              className={`py-3 border-b border-white/[0.04] last:border-0 cursor-default transition-colors ${
                hovered ? "bg-white/[0.02]" : ""
              }`}
              onMouseEnter={() => setHoveredDay(i)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className="flex items-center gap-4">
                {/* Day label */}
                <div className="w-12 shrink-0">
                  <span className={`text-xs font-medium ${isToday ? "text-white/70" : "text-white/30"}`}>
                    {isToday ? "Today" : day.dayLabel}
                  </span>
                </div>

                {/* Score bar */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-[3px] rounded-full bg-white/[0.04]">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-700`}
                      style={{ width: `${day.score}%` }}
                    />
                  </div>

                  {/* Score number */}
                  <span className={`text-xs font-display font-bold w-8 text-right ${
                    day.isVisible ? "text-emerald-400/70" : "text-red-400/60"
                  }`}>
                    {day.score}
                  </span>
                </div>

                {/* Visibility indicator */}
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  day.isVisible ? "bg-emerald-400/50" : "bg-red-400/40"
                }`} />
              </div>

              {/* Expanded detail on hover */}
              <div className={`overflow-hidden transition-all duration-300 ${
                hovered ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0"
              }`}>
                <div className="flex items-center gap-4 ml-12 text-[10px] text-white/25">
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

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-white/20">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
          <span>Likely visible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400/40" />
          <span>Likely hidden</span>
        </div>
      </div>
    </div>
  );
}
