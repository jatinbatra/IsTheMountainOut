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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-display font-bold tabular-nums ring-1 ${
        isGloom
          ? "bg-slate-500/10 text-slate-300 ring-slate-400/20"
          : "bg-emerald-500/10 text-emerald-300 ring-emerald-400/25"
      }`}
      title={`Since ${streak.since}`}
    >
      {isGloom ? <CloudRain className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
      {label}
    </div>
  );
}
