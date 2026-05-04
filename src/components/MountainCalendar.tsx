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
      <div className="alpine-card text-center py-8">
        <p className="text-sm font-medium text-[color:var(--type-1)] mb-1">Mountain Calendar</p>
        <p className="text-xs text-[color:var(--type-3)]">
          No historical data yet. The calendar fills in as the cron job runs daily.
        </p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const firstDate = new Date(days[0].date + "T12:00:00");
  const startDow = firstDate.getDay();

  return (
    <div className="alpine-card space-y-4">
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

        {days.map((day) => {
          const date = new Date(day.date + "T12:00:00");
          const isToday = day.date === todayStr;
          const hasData = day.score >= 0;

          return (
            <div
              key={day.date}
              className={`aspect-square flex items-center justify-center font-mono text-[10px] rounded-lg transition-colors ${
                isToday ? "ring-2 ring-[color:var(--accent)]" : ""
              } ${
                !hasData
                  ? "bg-gray-50 text-[color:var(--type-4)]"
                  : day.isVisible
                    ? "bg-[#2d8a4e]/15 text-[#2d8a4e] font-medium"
                    : "bg-gray-100 text-[color:var(--type-4)]"
              }`}
              title={hasData ? `${day.date}: ${day.score}/100` : day.date}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-[10px] text-[color:var(--type-4)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#2d8a4e]/15" /> Mountain out
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-gray-100" /> Hidden
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-gray-50 ring-1 ring-gray-200" /> No data
        </span>
      </div>
    </div>
  );
}
