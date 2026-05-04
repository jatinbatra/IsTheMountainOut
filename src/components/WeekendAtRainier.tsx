"use client";

import { useMemo } from "react";
import useSWR from "swr";
import {
  MapPin,
  Navigation,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Cloud,
  Wind,
} from "lucide-react";
import {
  DESTINATIONS,
  ROADS,
  isRoadOpen,
  passInfoForDate,
  type Destination,
} from "@/lib/rainierTrips";
import type { WeeklyForecastDay } from "@/components/Dashboard";
import type { RealtimeBundle, DestinationWeather, ParkAlert } from "@/lib/rainierRealtime";

interface Props {
  weeklyForecast?: WeeklyForecastDay[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

function scoreBadge(score: number): { label: string; color: string; bg: string } {
  if (score >= 70) return { label: "Clear", color: "text-[#2d8a4e]", bg: "bg-[#2d8a4e]/10" };
  if (score >= 50) return { label: "Peeking", color: "text-[#d4a843]", bg: "bg-[#d4a843]/10" };
  if (score >= 30) return { label: "Hiding", color: "text-[color:var(--type-4)]", bg: "bg-gray-100" };
  return { label: "Gloomy", color: "text-[color:var(--type-4)]", bg: "bg-gray-100" };
}

function recommendation(
  sat?: WeeklyForecastDay,
  sun?: WeeklyForecastDay
): string {
  if (!sat && !sun) return "Forecast loading. Check back soon.";
  if (sat && sun) {
    if (Math.abs(sat.score - sun.score) < 8) return "Both days look similar. Pick whichever fits your schedule.";
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
      <div className="flex-1 rounded-xl bg-gray-50 px-3 py-3 text-center">
        <p className="text-[10px] text-[color:var(--type-4)] uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xs text-[color:var(--type-4)]">No forecast</p>
      </div>
    );
  }
  const badge = scoreBadge(day.score);
  return (
    <div className="flex-1 rounded-xl bg-gray-50 px-3 py-3 text-center">
      <p className="text-[10px] text-[color:var(--type-4)] uppercase tracking-wider mb-1">{label}</p>
      <p className="font-display text-xl font-light text-[color:var(--type-1)] tabular mt-0.5">
        {day.score}
      </p>
      <p className={`text-[10px] font-medium ${badge.color} ${badge.bg} inline-block px-2 py-0.5 rounded-full mt-1`}>
        {badge.label}
      </p>
      <p className="font-mono text-[10px] text-[color:var(--type-4)] tabular mt-1">
        {Math.round(day.tempHigh)}° / {Math.round(day.tempLow)}°
      </p>
    </div>
  );
}

function DestinationRow({
  dest,
  open,
  score,
  weather,
}: {
  dest: Destination;
  open: boolean;
  score?: number;
  weather?: DestinationWeather;
}) {
  const road = ROADS[dest.road];
  const hasLiveWeather =
    weather && (weather.temperature !== null || weather.cloudCover !== null);
  return (
    <a
      href={dest.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors rounded-xl"
    >
      <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-xl ring-1 ring-gray-100 bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dest.photoUrl}
          alt={`${dest.name} at Mount Rainier`}
          loading="lazy"
          className={`w-full h-full object-cover transition-opacity ${
            open ? "opacity-100" : "opacity-50 grayscale"
          }`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const sib = (e.currentTarget as HTMLImageElement)
              .nextElementSibling as HTMLElement | null;
            if (sib) sib.style.display = "flex";
          }}
        />
        <div
          className={`absolute inset-0 items-center justify-center hidden ${
            open ? "bg-[#2d8a4e]/10" : "bg-gray-100"
          }`}
        >
          <MapPin
            className={`w-5 h-5 ${open ? "text-[#2d8a4e]" : "text-[color:var(--type-4)]"}`}
            aria-hidden="true"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-[color:var(--type-1)] text-sm truncate">
            {dest.name}
          </h4>
          {typeof score === "number" && (
            <span className="font-mono text-[10px] text-[color:var(--type-3)] tabular">
              &middot; {score}
            </span>
          )}
          {open ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#2d8a4e] bg-[#2d8a4e]/10 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-[color:var(--type-4)] bg-gray-100 px-1.5 py-0.5 rounded-full">
              <XCircle className="w-3 h-3" aria-hidden="true" /> Closed
            </span>
          )}
        </div>
        <p className="text-xs text-[color:var(--type-3)] mt-0.5 leading-relaxed">
          {dest.highlight}
        </p>
        {hasLiveWeather && (
          <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-[#2d8a4e] flex-wrap">
            {weather!.temperature !== null && (
              <span className="tabular">
                {Math.round(weather!.temperature!)}°F now
              </span>
            )}
            {weather!.cloudCover !== null && (
              <span className="inline-flex items-center gap-1 tabular">
                <Cloud className="w-3 h-3" aria-hidden="true" />
                {Math.round(weather!.cloudCover!)}% cloud
              </span>
            )}
            {weather!.windSpeed !== null && weather!.windSpeed! >= 5 && (
              <span className="inline-flex items-center gap-1 tabular">
                <Wind className="w-3 h-3" aria-hidden="true" />
                {Math.round(weather!.windSpeed!)} mph
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-[color:var(--type-4)] flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Navigation className="w-3 h-3" aria-hidden="true" />
            {dest.driveFromSeattle} from Seattle
          </span>
          <span>&middot;</span>
          <span className="tabular">{dest.elevation}</span>
          <span>&middot;</span>
          <span className="truncate">{road.label}</span>
        </div>
        {!open && (
          <p className="text-[10px] text-orange-500 mt-1">{road.note}</p>
        )}
      </div>
      <ChevronRight
        className="w-4 h-4 text-[color:var(--type-4)] group-hover:text-[color:var(--type-2)] transition-colors flex-shrink-0 mt-2"
        aria-hidden="true"
      />
    </a>
  );
}

function AlertsBlock({ alerts }: { alerts: ParkAlert[] }) {
  if (alerts.length === 0) return null;
  const top = alerts.slice(0, 3);
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-500" aria-hidden="true" />
        <p className="text-[10px] font-medium text-orange-600 uppercase tracking-wider">
          Live park alerts ({alerts.length})
        </p>
      </div>
      <ul className="space-y-1.5">
        {top.map((a) => (
          <li key={a.id} className="text-xs text-[color:var(--type-2)] leading-snug">
            <span className="text-[10px] font-medium text-orange-500 mr-1.5 uppercase tracking-wider">
              {a.category}
            </span>
            {a.url ? (
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {a.title}
              </a>
            ) : (
              <span>{a.title}</span>
            )}
          </li>
        ))}
      </ul>
      {alerts.length > top.length && (
        <p className="text-[10px] text-orange-500">
          + {alerts.length - top.length} more. Check NPS site
        </p>
      )}
    </div>
  );
}

export default function WeekendAtRainier({ weeklyForecast }: Props) {
  const { saturday, sunday, weekendDate } = useMemo(
    () => nextWeekend(weeklyForecast),
    [weeklyForecast]
  );
  const pass = useMemo(() => passInfoForDate(weekendDate), [weekendDate]);

  const { data: realtime } = useSWR<RealtimeBundle>(
    "/api/weekend-realtime",
    fetcher,
    {
      refreshInterval: 10 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

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
      const weather = realtime?.destinations?.[d.id];
      return { dest: d, open, score: bestScore, weather };
    }).sort((a, b) => {
      if (a.open !== b.open) return a.open ? -1 : 1;
      return 0;
    });
  }, [saturday, sunday, weekendDate, realtime]);

  const weekendLabel = weekendDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="alpine-card space-y-5">
      <div>
        <p className="text-[10px] text-[color:var(--accent)] uppercase tracking-wider font-medium mb-1">Weekend at Rainier</p>
        <h3 className="font-display font-medium text-[color:var(--type-1)] text-base">
          Planning a visit? Here&apos;s the weekend of {weekendLabel}.
        </h3>
      </div>

      <div className="flex items-stretch gap-2">
        <DayChip day={saturday} label="Saturday" />
        <DayChip day={sunday} label="Sunday" />
      </div>

      <p className="text-xs text-[color:var(--type-3)] leading-relaxed italic">
        {recommendation(saturday, sunday)}
      </p>

      {realtime?.alerts && realtime.alerts.length > 0 && (
        <AlertsBlock alerts={realtime.alerts} />
      )}

      <div>
        <div className="flex items-end justify-between mb-2">
          <p className="text-[10px] text-[color:var(--type-4)] uppercase tracking-wider">Popular stops</p>
          {realtime && (
            <p className="text-[10px] font-medium text-[#2d8a4e]">Live weather</p>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {destinations.map(({ dest, open, score, weather }) => (
            <DestinationRow
              key={dest.id}
              dest={dest}
              open={open}
              score={score}
              weather={weather}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 p-4 space-y-2">
        <p className="text-[10px] text-[color:var(--accent)] uppercase tracking-wider font-medium">
          Do you need a pass?
        </p>
        <p className="text-xs text-[color:var(--type-2)] leading-relaxed">
          Yes, every vehicle needs a park pass at the entrance.
        </p>
        <ul className="space-y-1 text-xs text-[color:var(--type-3)]">
          {pass.options.map((opt) => (
            <li key={opt.label} className="flex items-start gap-2">
              <span className="text-[color:var(--type-4)] mt-0.5">&middot;</span>
              <span>
                <span className="text-[color:var(--type-1)] font-mono tabular font-medium">
                  {opt.price}
                </span>{" "}
                , {opt.label}
                {opt.note && (
                  <span className="text-[color:var(--type-4)]"> ({opt.note})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div
          className={`flex items-start gap-2 pt-2 border-t border-gray-200 ${
            pass.timedEntry.active ? "text-orange-500" : "text-[color:var(--type-4)]"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[11px] leading-relaxed">{pass.timedEntry.note}</p>
        </div>
        <a
          href={pass.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[color:var(--accent)] font-medium hover:text-[color:var(--type-1)] transition-colors"
        >
          Official NPS fees page
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
