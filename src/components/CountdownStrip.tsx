"use client";

import { useEffect, useMemo, useState } from "react";
import { Sunrise, Sunset, Sparkles, Palette } from "lucide-react";

interface Props {
  sunrise?: string;
  sunset?: string;
  alpenglow?: {
    probability: number;
    minutesToSunset: number;
    isLikely: boolean;
  } | null;
}

type Event = {
  key: string;
  label: string;
  time: Date;
  icon: typeof Sunrise;
  color: string;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

export default function CountdownStrip({ sunrise, sunset, alpenglow }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  const events = useMemo<Event[]>(() => {
    const out: Event[] = [];
    const sunriseDate = sunrise ? new Date(sunrise) : null;
    const sunsetDate = sunset ? new Date(sunset) : null;

    if (sunriseDate && sunriseDate.getTime() > now) {
      out.push({
        key: "sunrise",
        label: "Sunrise",
        time: sunriseDate,
        icon: Sunrise,
        color: "text-amber-300",
      });
    }
    if (sunsetDate) {
      const goldenStart = new Date(sunsetDate.getTime() - 90 * 60_000);
      if (goldenStart.getTime() > now) {
        out.push({
          key: "golden",
          label: "Golden hour",
          time: goldenStart,
          icon: Sparkles,
          color: "text-yellow-300",
        });
      }
    }
    if (
      alpenglow &&
      alpenglow.isLikely &&
      alpenglow.probability >= 40 &&
      sunsetDate
    ) {
      const alpenStart = new Date(sunsetDate.getTime() - 30 * 60_000);
      if (alpenStart.getTime() > now) {
        out.push({
          key: "alpenglow",
          label: "Alpenglow window",
          time: alpenStart,
          icon: Palette,
          color: "text-pink-300",
        });
      }
    }
    if (sunsetDate && sunsetDate.getTime() > now) {
      out.push({
        key: "sunset",
        label: "Sunset",
        time: sunsetDate,
        icon: Sunset,
        color: "text-orange-300",
      });
    }
    return out.sort((a, b) => a.time.getTime() - b.time.getTime()).slice(0, 3);
  }, [sunrise, sunset, alpenglow, now]);

  if (events.length === 0) return null;

  return (
    <div className="rounded-2xl ring-1 ring-white/[0.06] bg-white/[0.02] px-3 py-2.5 overflow-x-auto">
      <div className="flex items-center gap-2 sm:gap-3 min-w-fit">
        {events.map((e, i) => {
          const Icon = e.icon;
          const delta = e.time.getTime() - now;
          const isImminent = delta < 15 * 60_000;
          return (
            <div key={e.key} className="flex items-center gap-2 sm:gap-3">
              {i > 0 && <span className="text-white/15">·</span>}
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Icon className={`w-3.5 h-3.5 ${e.color}`} aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
                  {e.label}
                </span>
                <span
                  className={`text-xs font-display font-bold tabular-nums ${
                    isImminent ? "text-white" : "text-white/80"
                  }`}
                >
                  {formatCountdown(delta)}
                </span>
                <span className="text-[10px] text-slate-500 tabular-nums">
                  {formatTime(e.time)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
