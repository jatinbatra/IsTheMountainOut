"use client";

import useSWR from "swr";
import { Sun, CloudRain } from "lucide-react";

interface GlobalStreak {
  type: "out" | "gloom";
  days: number;
  since: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function GlobalStreakBadge() {
  const { data } = useSWR<{ streak: GlobalStreak | null }>(
    "/api/global-streak",
    fetcher,
    { refreshInterval: 15 * 60 * 1000, revalidateOnFocus: false },
  );

  const streak = data?.streak;
  if (!streak || streak.days < 2) return null;

  const isGloom = streak.type === "gloom";
  const label = isGloom
    ? `Gloom · day ${streak.days}`
    : `Out · day ${streak.days}`;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase tabular-nums border ${
        isGloom
          ? "border-[color:var(--accent-fog)]/20 text-[color:var(--accent-fog)]"
          : "border-[color:var(--accent-clear)]/25 text-[color:var(--accent-clear)]"
      }`}
      title={`Since ${streak.since}`}
    >
      {isGloom ? <CloudRain className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
      {label}
    </div>
  );
}
