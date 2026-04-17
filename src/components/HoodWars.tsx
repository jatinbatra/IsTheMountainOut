"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Trophy, Flame, Medal, ChevronRight, ExternalLink } from "lucide-react";

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
  if (rank === 1) return "text-amber-300";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-orange-300";
  return "text-slate-500";
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
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/15">
            <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-white">Hood Wars</h2>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">
              Mountain-out days · last {windowDays}
            </p>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold hidden sm:block">
          Live · updates hourly
        </div>
      </div>

      <div className={`grid grid-cols-3 gap-2.5 mb-3 ${leaderboardKick ? "animate-fade-up" : ""}`}>
        {topThree.map((s, i) => {
          const isSel = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`relative text-left p-3.5 rounded-2xl transition-all overflow-hidden group ${
                i === 0
                  ? "bg-gradient-to-br from-amber-500/15 via-amber-400/8 to-orange-500/10 ring-1 ring-amber-400/30"
                  : i === 1
                    ? "bg-gradient-to-br from-slate-400/10 to-slate-500/5 ring-1 ring-slate-400/15"
                    : "bg-gradient-to-br from-orange-500/10 to-red-500/5 ring-1 ring-orange-400/15"
              } ${isSel ? "ring-2 ring-white/30" : ""}`}
            >
              <Medal className={`absolute top-2 right-2 w-3.5 h-3.5 ${rankColor(i + 1)}`} />
              <div className={`font-mono text-[10px] font-bold ${rankColor(i + 1)} mb-1`}>#{i + 1}</div>
              <div className="font-display font-bold text-sm text-white truncate">{s.label}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display font-bold text-2xl text-white tabular-nums">{s.outDays}</span>
                <span className="text-[10px] text-slate-500">/ {windowDays}d</span>
              </div>
              {s.currentStreak > 1 && (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-orange-300">
                  <Flame className="w-3 h-3" />
                  {s.currentStreak}-day streak
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="divide-y divide-white/[0.04] rounded-2xl ring-1 ring-white/[0.05] bg-white/[0.02] overflow-hidden">
        {rest.map((s, i) => {
          const rank = i + 4;
          const isSel = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                isSel ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
              }`}
            >
              <span className={`font-mono text-[10px] font-bold w-6 text-slate-600`}>#{rank}</span>
              <span className="flex-1 text-sm font-medium text-white/80 truncate">{s.label}</span>
              {s.currentStreak > 1 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-orange-300/80 font-bold tabular-nums">
                  <Flame className="w-3 h-3" />
                  {s.currentStreak}
                </span>
              )}
              <span className="font-display font-bold text-sm text-white tabular-nums w-10 text-right">
                {s.outDays}
              </span>
              <a
                href={`/hoods/${s.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-slate-600 hover:text-white/60 transition-colors"
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
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-white/70 py-2 transition-colors"
        >
          Show all {standings.length} hoods
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
