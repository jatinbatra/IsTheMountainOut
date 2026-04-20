"use client";

import { useMemo } from "react";
import {
  MapPin,
  Navigation,
  Calendar,
  Ticket,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  DESTINATIONS,
  ROADS,
  isRoadOpen,
  passInfoForDate,
  type Destination,
} from "@/lib/rainierTrips";
import type { WeeklyForecastDay } from "@/components/Dashboard";

interface Props {
  weeklyForecast?: WeeklyForecastDay[];
}

function parseDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function nextWeekend(forecast?: WeeklyForecastDay[]): {
  saturday?: WeeklyForecastDay;
  sunday?: WeeklyForecastDay;
  weekendDate: Date;
} {
  const out: { saturday?: WeeklyForecastDay; sunday?: WeeklyForecastDay } = {};
  if (forecast) {
    for (const day of forecast) {
      const d = parseDay(day.date);
      const dow = d.getDay();
      if (dow === 6 && !out.saturday) out.saturday = day;
      if (dow === 0 && !out.sunday) out.sunday = day;
      if (out.saturday && out.sunday) break;
    }
  }
  const anchor = out.saturday
    ? parseDay(out.saturday.date)
    : out.sunday
      ? parseDay(out.sunday.date)
      : (() => {
          const n = new Date();
          n.setDate(n.getDate() + ((6 - n.getDay() + 7) % 7 || 7));
          return n;
        })();
  return { ...out, weekendDate: anchor };
}

function scoreBadge(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Clear", color: "text-emerald-300" };
  if (score >= 50) return { label: "Peeking", color: "text-amber-300" };
  if (score >= 30) return { label: "Hiding", color: "text-orange-300" };
  return { label: "Gloomy", color: "text-slate-400" };
}

function recommendation(
  sat?: WeeklyForecastDay,
  sun?: WeeklyForecastDay
): string {
  if (!sat && !sun) return "Forecast loading — check back soon.";
  if (sat && sun) {
    if (Math.abs(sat.score - sun.score) < 8) return "Both days look similar — pick whichever fits your schedule.";
    return sat.score > sun.score
      ? `Saturday wins (${sat.score} vs ${sun.score}). Go early.`
      : `Sunday wins (${sun.score} vs ${sat.score}). Sleep in Saturday.`;
  }
  const only = sat ?? sun!;
  return `${sat ? "Saturday" : "Sunday"} scores ${only.score}.`;
}

function DayChip({ day, label }: { day?: WeeklyForecastDay; label: string }) {
  if (!day) {
    return (
      <div className="flex-1 rounded-xl bg-white/[0.02] ring-1 ring-white/[0.04] px-3 py-2.5 text-center">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
          {label}
        </p>
        <p className="text-xs text-slate-500 mt-1">No forecast</p>
      </div>
    );
  }
  const badge = scoreBadge(day.score);
  return (
    <div className="flex-1 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] px-3 py-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
        {label}
      </p>
      <p className="text-xl font-display font-bold text-white tabular-nums mt-0.5">
        {day.score}
      </p>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${badge.color}`}>
        {badge.label}
      </p>
      <p className="text-[10px] text-slate-500 tabular-nums mt-0.5">
        {Math.round(day.tempHigh)}° / {Math.round(day.tempLow)}°
      </p>
    </div>
  );
}

function DestinationRow({
  dest,
  open,
  score,
}: {
  dest: Destination;
  open: boolean;
  score?: number;
}) {
  const road = ROADS[dest.road];
  return (
    <a
      href={dest.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
    >
      <div
        className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg ring-1 ${
          open
            ? "bg-emerald-500/10 ring-emerald-400/20"
            : "bg-slate-500/10 ring-slate-400/15"
        }`}
      >
        <MapPin
          className={`w-3.5 h-3.5 ${open ? "text-emerald-300" : "text-slate-500"}`}
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-display font-bold text-white text-sm truncate">
            {dest.name}
          </h4>
          {typeof score === "number" && (
            <span className="text-[10px] font-semibold text-white/70 tabular-nums">
              · {score}
            </span>
          )}
          {open ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
              <XCircle className="w-3 h-3" aria-hidden="true" /> Closed
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
          {dest.highlight}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Navigation className="w-3 h-3" aria-hidden="true" />
            {dest.driveFromSeattle} from Seattle
          </span>
          <span>·</span>
          <span className="tabular-nums">{dest.elevation}</span>
          <span>·</span>
          <span className="truncate">{road.label}</span>
        </div>
        {!open && (
          <p className="text-[10px] text-orange-300/70 mt-1">{road.note}</p>
        )}
      </div>
      <ChevronRight
        className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 mt-2"
        aria-hidden="true"
      />
    </a>
  );
}

export default function WeekendAtRainier({ weeklyForecast }: Props) {
  const { saturday, sunday, weekendDate } = useMemo(
    () => nextWeekend(weeklyForecast),
    [weeklyForecast]
  );
  const pass = useMemo(() => passInfoForDate(weekendDate), [weekendDate]);
  const destinations = useMemo(() => {
    return DESTINATIONS.map((d) => {
      const road = ROADS[d.road];
      const open = isRoadOpen(road, weekendDate);
      const satScore = saturday?.score;
      const sunScore = sunday?.score;
      const bestScore =
        satScore !== undefined && sunScore !== undefined
          ? Math.max(satScore, sunScore)
          : satScore ?? sunScore;
      return { dest: d, open, score: bestScore };
    }).sort((a, b) => {
      if (a.open !== b.open) return a.open ? -1 : 1;
      return 0;
    });
  }, [saturday, sunday, weekendDate]);

  const weekendLabel = weekendDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl ring-1 ring-white/[0.06] bg-gradient-to-br from-emerald-500/[0.04] via-white/[0.02] to-blue-500/[0.04] p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 p-2 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/25">
          <Calendar className="w-4 h-4 text-emerald-300" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-emerald-300/80">
            Weekend at Rainier
          </p>
          <h3 className="font-display font-bold text-white text-sm mt-0.5">
            Planning a visit? Here&apos;s the weekend of {weekendLabel}.
          </h3>
        </div>
      </div>

      <div className="flex items-stretch gap-2">
        <DayChip day={saturday} label="Saturday" />
        <DayChip day={sunday} label="Sunday" />
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        {recommendation(saturday, sunday)}
      </p>

      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mb-2 px-1">
          Popular stops
        </p>
        <div className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.04] divide-y divide-white/[0.04]">
          {destinations.map(({ dest, open, score }) => (
            <DestinationRow
              key={dest.id}
              dest={dest}
              open={open}
              score={score}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.04] p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-amber-300" aria-hidden="true" />
          <p className="text-xs font-display font-bold text-white">
            Do you need a pass?
          </p>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Yes — every vehicle needs a park pass at the entrance.
        </p>
        <ul className="space-y-1 text-xs text-slate-400">
          {pass.options.map((opt) => (
            <li key={opt.label} className="flex items-start gap-2">
              <span className="text-slate-600 mt-0.5">·</span>
              <span>
                <span className="text-white font-semibold tabular-nums">
                  {opt.price}
                </span>{" "}
                — {opt.label}
                {opt.note && (
                  <span className="text-slate-500"> ({opt.note})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div
          className={`flex items-start gap-2 pt-2 border-t border-white/[0.04] ${
            pass.timedEntry.active ? "text-amber-300" : "text-slate-400"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[11px] leading-relaxed">{pass.timedEntry.note}</p>
        </div>
        <a
          href={pass.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-300 hover:text-blue-200 transition-colors"
        >
          Official NPS fees page
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
