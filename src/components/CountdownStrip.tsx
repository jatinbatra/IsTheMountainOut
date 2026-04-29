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
      out.push({ key: "sunrise", label: "Sunrise", time: sunriseDate, icon: Sunrise });
    }
    if (sunsetDate) {
      const goldenStart = new Date(sunsetDate.getTime() - 90 * 60_000);
      if (goldenStart.getTime() > now) {
        out.push({ key: "golden", label: "Golden hour", time: goldenStart, icon: Sparkles });
      }
    }
    if (alpenglow && alpenglow.isLikely && alpenglow.probability >= 40 && sunsetDate) {
      const alpenStart = new Date(sunsetDate.getTime() - 30 * 60_000);
      if (alpenStart.getTime() > now) {
        out.push({ key: "alpenglow", label: "Alpenglow", time: alpenStart, icon: Palette });
      }
    }
    if (sunsetDate && sunsetDate.getTime() > now) {
      out.push({ key: "sunset", label: "Sunset", time: sunsetDate, icon: Sunset });
    }
    return out.sort((a, b) => a.time.getTime() - b.time.getTime()).slice(0, 3);
  }, [sunrise, sunset, alpenglow, now]);

  if (events.length === 0) return null;

  return (
    <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-2 text-sm">
      {events.map((e) => {
        const Icon = e.icon;
        const delta = e.time.getTime() - now;
        return (
          <div key={e.key} className="flex items-center gap-2 whitespace-nowrap">
            <Icon className="w-3.5 h-3.5 text-white/20" aria-hidden="true" />
            <span className="text-white/30">{e.label}</span>
            <span className="font-display font-bold text-white tabular-nums">
              {formatCountdown(delta)}
            </span>
            <span className="text-white/15 text-xs tabular-nums">
              {formatTime(e.time)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
