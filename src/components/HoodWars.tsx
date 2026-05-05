"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Flame, ChevronRight, ExternalLink } from "lucide-react";

interface Standing {
  id: string;
  label: string;
  outDays: number;
  currentStreak: number;
  longestStreak: number;
  todayScore: number;
  avgScore: number;
}

interface Props {
  selected: string | null;
  onSelect: (id: string | null) => void;
  fallbackScores: { id: string; score: number }[];
  fallbackLabels: Record<string, string>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function rankColor(rank: number): string {
  if (rank === 1) return "text-[#2d8a4e]";
  if (rank === 2) return "text-[color:var(--type-2)]";
  if (rank === 3) return "text-gray-400";
  return "text-[color:var(--type-4)]";
}

export default function HoodWars({
  selected,
  onSelect,
  fallbackScores,
  fallbackLabels,
}: Props) {
  const { data } = useSWR<{ standings: Standing[]; windowDays: number }>(
    "/api/hoods/leaderboard",
    fetcher,
    { refreshInterval: 10 * 60 * 1000, revalidateOnFocus: false },
  );

  const [showAll, setShowAll] = useState(false);

  const standings = useMemo<Standing[]>(() => {
    if (data?.standings?.length) return data.standings;
    return fallbackScores.map((f) => ({
      id: f.id,
      label: fallbackLabels[f.id] ?? f.id,
      outDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      todayScore: f.score,
      avgScore: f.score,
    }));
  }, [data, fallbackScores, fallbackLabels]);

  const windowDays = data?.windowDays ?? 30;
  const topThree = standings.slice(0, 3);
  const rest = standings.slice(3, showAll ? standings.length : 8);

  const [leaderboardKick, setLeaderboardKick] = useState(false);
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      setLeaderboardKick(true);
    });
    const t = setTimeout(() => {
      if (!cancelled) setLeaderboardKick(false);
    }, 600);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="font-display text-base font-medium text-[color:var(--type-1)]">Hood Wars</h2>
          <p className="ticker mt-0.5">
            Mountain-out days · last {windowDays}
          </p>
        </div>
        <span className="ticker hidden sm:block">
          Live · updates hourly
        </span>
      </div>

      <div className={`grid grid-cols-3 gap-2.5 mb-3 ${leaderboardKick ? "animate-fade-up" : ""}`}>
        {topThree.map((s, i) => {
          const isSel = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`relative text-left p-3.5 transition-all overflow-hidden group border ${
                i === 0
                  ? "border-[#2d8a4e]/30 bg-[#2d8a4e]/[0.04]"
                  : "border-[var(--rule)]"
              } ${isSel ? "border-[color:var(--type-1)]/30" : ""}`}
            >
              <div className={`font-mono text-[10px] tracking-wider ${rankColor(i + 1)} mb-1`}>#{i + 1}</div>
              <div className="font-display font-medium text-sm text-[color:var(--type-1)] truncate">{s.label}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-2xl font-light text-[color:var(--type-1)] tabular">{s.outDays}</span>
                <span className="font-mono text-[10px] text-[color:var(--type-4)]">/ {windowDays}d</span>
              </div>
              {s.currentStreak > 1 && (
                <div className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] text-[#2d8a4e]">
                  <Flame className="w-3 h-3" />
                  {s.currentStreak}-day streak
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="divide-y divide-[var(--rule)] border-y border-[var(--rule)] overflow-hidden">
        {rest.map((s, i) => {
          const rank = i + 4;
          const isSel = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                isSel ? "bg-[var(--ink-deep)]" : "hover:bg-gray-50/60"
              }`}
            >
              <span className="font-mono text-[10px] text-[color:var(--type-4)] w-6 tabular">#{rank}</span>
              <span className="flex-1 text-sm text-[color:var(--type-2)] truncate">{s.label}</span>
              {s.currentStreak > 1 && (
                <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-[#2d8a4e] tabular">
                  <Flame className="w-3 h-3" />
                  {s.currentStreak}
                </span>
              )}
              <span className="font-mono text-sm text-[color:var(--type-1)] tabular w-10 text-right">
                {s.outDays}
              </span>
              <a
                href={`/hoods/${s.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[color:var(--type-4)] hover:text-[color:var(--type-2)] transition-colors"
                aria-label={`View ${s.label} page`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </button>
          );
        })}
      </div>

      {!showAll && standings.length > 8 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 ticker hover:text-[color:var(--type-1)] py-2 transition-colors"
        >
          Show all {standings.length} hoods
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
