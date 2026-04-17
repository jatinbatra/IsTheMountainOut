"use client";

import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";

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

  if (validDays.length === 0) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const firstDate = new Date(days[0].date + "T12:00:00");
  const startDow = firstDate.getDay();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="font-display text-lg font-bold text-white">
            Mountain Calendar
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          {mountainDays} of {validDays.length} days visible
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] text-slate-600 font-medium pb-1"
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
              className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium transition-colors ${
                isToday ? "ring-1 ring-white/20" : ""
              } ${
                !hasData
                  ? "bg-white/[0.02] text-slate-700"
                  : day.isVisible
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-red-500/15 text-red-400/60"
              }`}
              title={hasData ? `${day.date}: ${day.score}/100` : day.date}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-[10px] text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/20" /> Mountain out
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-red-500/15" /> Hidden
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-white/[0.02] ring-1 ring-white/[0.06]" />{" "}
          No data
        </span>
      </div>
    </div>
  );
}
