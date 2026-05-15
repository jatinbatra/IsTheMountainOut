"use client";

import { useState, useEffect } from "react";

interface CalendarDay {
  date: string;
  score: number;
  isVisible: boolean;
}

interface ForecastDay {
  date: string;
  score: number;
  isVisible: boolean;
}

interface Props {
  weeklyForecast?: ForecastDay[];
}

export default function MountainCalendar({ weeklyForecast }: Props) {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((data) => {
        setDays(data.days || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  const forecastMap = new Map(
    (weeklyForecast ?? []).map((d) => [d.date, d])
  );
  
  // If KV data is empty, use the current week from forecast to ensure UI is never empty
  let displayDays = days.length > 0 ? days : [];
  if (displayDays.length === 0 && weeklyForecast && weeklyForecast.length > 0) {
    displayDays = weeklyForecast.map(f => ({
      date: f.date,
      score: f.score,
      isVisible: f.isVisible
    }));
  }

  const merged = displayDays.map((d) => {
    if (d.score >= 0) return d;
    const fc = forecastMap.get(d.date);
    if (fc) return { date: d.date, score: fc.score, isVisible: fc.isVisible };
    return d;
  });
  (weeklyForecast ?? []).forEach((fc) => {
    if (!merged.find((d) => d.date === fc.date)) {
      merged.push({ date: fc.date, score: fc.score, isVisible: fc.isVisible });
    }
  });
  merged.sort((a, b) => a.date.localeCompare(b.date));

  const validDays = merged.filter((d) => d.score >= 0);
  const mountainDays = validDays.filter((d) => d.isVisible).length;

  if (validDays.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Mountain Calendar</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          No data yet. Calendar populates as conditions are tracked.
        </p>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const firstDate = new Date(merged[0].date + "T12:00:00");
  const startDow = firstDate.getDay();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[color:var(--type-1)]">Mountain Calendar</h3>
        <span className="text-[10px] text-[color:var(--type-4)]">
          {mountainDays} of {validDays.length} days visible
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center font-mono text-[10px] text-[color:var(--type-4)] pb-1">
            {d}
          </div>
        ))}

        {Array.from({ length: startDow }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {merged.map((day) => {
          const date = new Date(day.date + "T12:00:00");
          const isToday = day.date === todayStr;
          const hasData = day.score >= 0;

          return (
            <div
              key={day.date}
              className={`aspect-square flex items-center justify-center font-mono text-[10px] transition-colors ${
                isToday ? "ring-1 ring-[color:var(--accent)]" : ""
              } ${
                !hasData
                  ? "text-[color:var(--type-4)]"
                  : day.isVisible
                    ? "bg-[#2d8a4e]/12 text-[#2d8a4e] font-medium"
                    : "text-[color:var(--type-4)]"
              }`}
              title={hasData ? `${day.date}: ${day.score}/100` : day.date}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-[color:var(--type-4)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#2d8a4e]/15" /> Mountain out
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[var(--ink-deep)]" /> Hidden
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[var(--ink-deep)] ring-1 ring-gray-200" /> No data
        </span>
      </div>
    </div>
  );
}
