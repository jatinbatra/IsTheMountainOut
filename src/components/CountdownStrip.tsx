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
  const isPast = ms < 0;
  const absMs = Math.abs(ms);
  const totalMinutes = Math.floor(absMs / 60_000);
  
  let timeStr = "";
  if (totalMinutes < 60) {
    timeStr = `${totalMinutes}m`;
  } else {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    timeStr = m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  
  return isPast ? `${timeStr} ago` : timeStr;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

export default function CountdownStrip({ sunrise, sunset, alpenglow }: Props) {
  // Countdown values are inherently "now"-relative, so they can't match between
  // server and client. Render nothing until mounted to avoid hydration errors.
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  const events = useMemo<Event[]>(() => {
    const out: Event[] = [];
    const sunriseDate = sunrise ? new Date(sunrise) : null;
    const sunsetDate = sunset ? new Date(sunset) : null;

    if (sunriseDate) {
      out.push({ key: "sunrise", label: "Sunrise", time: sunriseDate, icon: Sunrise });
    }
    if (sunsetDate) {
      const goldenStart = new Date(sunsetDate.getTime() - 90 * 60_000);
      out.push({ key: "golden", label: "Golden hour", time: goldenStart, icon: Sparkles });
    }
    if (alpenglow && alpenglow.isLikely && alpenglow.probability >= 40 && sunsetDate) {
      const alpenStart = new Date(sunsetDate.getTime() - 30 * 60_000);
      out.push({ key: "alpenglow", label: "Alpenglow", time: alpenStart, icon: Palette });
    }
    if (sunsetDate) {
      out.push({ key: "sunset", label: "Sunset", time: sunsetDate, icon: Sunset });
    }

    // Prefer future events, but show past ones if they just happened
    return out
      .sort((a, b) => {
        const aDiff = a.time.getTime() - now;
        const bDiff = b.time.getTime() - now;
        
        // If one is future and one is past, prefer future
        if (aDiff > 0 && bDiff < 0) return -1;
        if (aDiff < 0 && bDiff > 0) return 1;
        
        // Otherwise, closest to now first
        return Math.abs(aDiff) - Math.abs(bDiff);
      })
      .slice(0, 3)
      .sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [sunrise, sunset, alpenglow, now]);

  if (!mounted || events.length === 0) return null;

  return (
    <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-2 text-sm">
      {events.map((e) => {
        const Icon = e.icon;
        const delta = e.time.getTime() - now;
        return (
          <div key={e.key} className="flex items-center gap-2 whitespace-nowrap">
            <Icon className="w-3.5 h-3.5 text-[color:var(--type-4)]" aria-hidden="true" />
            <span className="text-[color:var(--type-3)]">{e.label}</span>
            <span className="font-display font-bold text-[color:var(--type-1)] tabular-nums">
              {formatCountdown(delta)}
            </span>
            <span className="text-[color:var(--type-4)] text-xs tabular-nums">
              {formatTime(e.time)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
