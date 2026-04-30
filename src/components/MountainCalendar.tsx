"use client";

import { useState, useEffect } from "react";

interface CalendarDay {
  date: string;
  score: number;
  isVisible: boolean;
}

export default function MountainCalendar() {
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

  const validDays = days.filter((d) => d.score >= 0);
  const mountainDays = validDays.filter((d) => d.isVisible).length;

  if (validDays.length === 0) {
    return (
      <div className="border-t border-[var(--rule)] pt-5">
        <p className="ticker mb-2">Mountain Calendar</p>
        <p className="text-sm text-[color:var(--type-3)] font-display font-light italic">
          No historical data yet. The calendar fills in as the cron job runs daily.
        </p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const firstDate = new Date(days[0].date + "T12:00:00");
  const startDow = firstDate.getDay();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-[color:var(--type-1)]">
          Mountain Calendar
        </h2>
        <span className="ticker">
          {mountainDays} of {validDays.length} days visible
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center font-mono text-[10px] text-[color:var(--type-4)] pb-1"
          >
            {d}
          </div>
        ))}

        {Array.from({ length: startDow }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const date = new Date(day.date + "T12:00:00");
          const isToday = day.date === todayStr;
          const hasData = day.score >= 0;

          return (
            <div
              key={day.date}
              className={`aspect-square flex items-center justify-center font-mono text-[10px] transition-colors ${
                isToday ? "ring-1 ring-[var(--rule-strong)]" : ""
              } ${
                !hasData
                  ? "bg-[color:var(--type-1)]/[0.02] text-[color:var(--type-4)]"
                  : day.isVisible
                    ? "bg-[color:var(--accent-clear)]/20 text-[color:var(--accent-clear)]"
                    : "bg-[color:var(--accent-fog)]/15 text-[color:var(--accent-fog)]/60"
              }`}
              title={hasData ? `${day.date}: ${day.score}/100` : day.date}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 ticker">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[color:var(--accent-clear)]/20" /> Mountain out
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[color:var(--accent-fog)]/15" /> Hidden
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[color:var(--type-1)]/[0.02] ring-1 ring-[var(--rule)]" />{" "}
          No data
        </span>
      </div>
    </div>
  );
}
