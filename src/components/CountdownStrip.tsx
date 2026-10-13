"use client";

import { useEffect, useMemo, useState } from "react";
import { Sunrise, Sunset, Sparkles, Palette } from "lucide-react";
import { TZ } from "@/lib/time";

interface Props {
  sunrise?: string;
  sunset?: string;
  sunriseNext?: string;
  sunsetNext?: string;
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
  end?: Date; // for windows (golden hour)
  icon: typeof Sunrise;
};

// Golden hour ≈ the last hour of direct sun before sunset.
const GOLDEN_MINUTES = 60;
const ALPENGLOW_LEAD_MINUTES = 30;

function formatIn(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
}

export default function CountdownStrip({ sunrise, sunset, sunriseNext, sunsetNext, alpenglow }: Props) {
  // Countdowns are "now"-relative, so they can't match between server and
  // client. Render nothing until mounted to avoid hydration errors.
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  /* eslint-disable react-hooks/set-state-in-effect -- hydration gate: must sync client time after mount */
  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { active, upcoming } = useMemo(() => {
    const all: Event[] = [];
    for (const [rise, set, isToday] of [
      [sunrise, sunset, true],
      [sunriseNext, sunsetNext, false],
    ] as const) {
      if (rise) all.push({ key: `sunrise-${rise}`, label: "Sunrise", time: new Date(rise), icon: Sunrise });
      if (set) {
        const setDate = new Date(set);
        all.push({
          key: `golden-${set}`,
          label: "Golden hour",
          time: new Date(setDate.getTime() - GOLDEN_MINUTES * 60_000),
          end: setDate,
          icon: Sparkles,
        });
        // Alpenglow prediction only applies to today's sunset.
        if (isToday && alpenglow?.isLikely && alpenglow.probability >= 40) {
          all.push({
            key: `alpenglow-${set}`,
            label: "Alpenglow",
            time: new Date(setDate.getTime() - ALPENGLOW_LEAD_MINUTES * 60_000),
            icon: Palette,
          });
        }
        all.push({ key: `sunset-${set}`, label: "Sunset", time: setDate, icon: Sunset });
      }
    }
    const valid = all.filter((e) => !Number.isNaN(e.time.getTime()));
    const active = valid.find((e) => e.end && e.time.getTime() <= now && now < e.end.getTime()) ?? null;
    const upcoming = valid
      .filter((e) => e.time.getTime() > now)
      .sort((a, b) => a.time.getTime() - b.time.getTime())
      .slice(0, active ? 2 : 3);
    return { active, upcoming };
  }, [sunrise, sunset, sunriseNext, sunsetNext, alpenglow, now]);

  if (!mounted || (!active && upcoming.length === 0)) return null;

  return (
    <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden py-2 text-sm">
      {active && (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <active.icon className="w-3.5 h-3.5 text-[color:var(--accent-gold)]" aria-hidden="true" />
          <span className="text-[color:var(--accent-gold)]">{active.label} · now</span>
          <span className="text-[color:var(--type-4)] text-xs tabular-nums">
            ends in {formatIn(active.end!.getTime() - now)}
          </span>
        </div>
      )}
      {upcoming.map((e) => {
        const Icon = e.icon;
        return (
          <div key={e.key} className="flex items-center gap-2 whitespace-nowrap">
            <Icon className="w-3.5 h-3.5 text-[color:var(--type-4)]" aria-hidden="true" />
            <span className="text-[color:var(--type-3)]">{e.label}</span>
            <span className="font-display font-bold text-[color:var(--type-1)] tabular-nums">
              in {formatIn(e.time.getTime() - now)}
            </span>
            <span className="text-[color:var(--type-4)] text-xs tabular-nums">{formatTime(e.time)}</span>
          </div>
        );
      })}
    </div>
  );
}
