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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[color:var(--type-1)]">7-Day Prediction</h3>
        <span className="text-[10px] text-[color:var(--type-4)]">Based on forecast data</span>
      </div>

      <div className="space-y-0">
        {weeklyForecast.map((day, i) => {
          const isToday = day.date === today;
          const hovered = hoveredDay === i;
          const barColor = day.isVisible
            ? "bg-[#2d8a4e]"
            : "bg-gray-200";

          return (
            <div
              key={day.date}
              className={`py-2 border-b border-gray-100 last:border-0 cursor-default transition-colors ${
                hovered ? "bg-[var(--ink-deep)]" : ""
              }`}
              onMouseEnter={() => setHoveredDay(i)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className="flex items-center gap-2">
                <div className="w-12 shrink-0">
                  <span className={`text-xs ${isToday ? "font-medium text-[color:var(--type-1)]" : "text-[color:var(--type-3)]"}`}>
                    {isToday ? "Today" : day.dayLabel}
                  </span>
                </div>

                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--ink-deep)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-700`}
                      style={{ width: `${day.score}%` }}
                    />
                  </div>

                  <span className={`font-mono text-xs tabular w-8 text-right font-medium ${
                    day.isVisible ? "text-[#2d8a4e]" : "text-[color:var(--type-4)]"
                  }`}>
                    {day.score}
                  </span>
                </div>

                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  day.isVisible ? "bg-[#2d8a4e]" : "bg-gray-200"
                }`} />
              </div>

              <div className={`overflow-hidden transition-all duration-300 ${
                hovered ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0"
              }`}>
                <div className="flex items-center gap-3 ml-12 text-[10px] text-[color:var(--type-4)] flex-wrap">
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

      <div className="flex items-center gap-2 text-[10px] text-[color:var(--type-4)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2d8a4e]" /> Likely visible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-200" /> Likely hidden
        </span>
      </div>
    </div>
  );
}
