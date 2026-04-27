"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  Target,
  Clock,
  Trophy,
  Loader2,
  Check,
  RotateCcw,
  ChevronRight,
  AtSign,
  AlertCircle,
} from "lucide-react";
import { getUserId, getHandle, setHandle } from "@/lib/identity";
import { getLocalPoolPicks, setLocalPoolPicks } from "@/lib/localPersist";

interface Pick {
  userId: string;
  handle: string;
  picks: number[];
  submittedAt: string;
}

interface Standing {
  userId: string;
  handle: string;
  error: number;
  picks: number[];
}

interface Week {
  id: string;
  startDate: string;
  endDate: string;
  locksAt: string;
  isLocked: boolean;
}

interface LeaderboardResponse {
  week: Week;
  standings: Standing[];
  totalEntries: number;
  myPick: Pick | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function dayLabel(startDate: string, offset: number): string {
  const d = new Date(`${startDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Los_Angeles" });
}

function tierColor(score: number): string {
  if (score >= 75) return "from-emerald-400/80 to-emerald-500/40";
  if (score >= 50) return "from-amber-400/80 to-amber-500/40";
  if (score >= 25) return "from-orange-400/80 to-orange-500/40";
  return "from-rose-400/80 to-rose-500/40";
}

function formatCountdown(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const ms = target - now;
  if (ms <= 0) return "locked";
  const hrs = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hrs > 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
  return `${hrs}h ${mins}m`;
}

export default function MountainPool() {
  const [userId, setUid] = useState("ssr");
  const [handleInput, setHandleInput] = useState("");
  const [slate, setSlate] = useState<number[]>(() => [60, 55, 50, 55, 60, 65, 70]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedSlate, setSavedSlate] = useState<number[] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedLocally, setSavedLocally] = useState(false);

  useEffect(() => {
    setUid(getUserId());
    setHandleInput(getHandle());
  }, []);

  const swrKey = userId !== "ssr" ? `/api/pool/leaderboard?userId=${encodeURIComponent(userId)}` : null;
  const { data, mutate } = useSWR<LeaderboardResponse>(swrKey, fetcher, {
    refreshInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data?.myPick) {
      setSlate(data.myPick.picks);
      setSavedSlate(data.myPick.picks);
      setSubmitted(true);
      setSavedLocally(false);
    } else if (data?.week && !data.myPick) {
      const local = getLocalPoolPicks(data.week.id);
      if (local) {
        setSlate(local.picks);
        setSavedSlate(local.picks);
        setSubmitted(true);
        setSavedLocally(true);
      }
    }
  }, [data?.myPick, data?.week]);

  const isDirty = useMemo(() => {
    if (!savedSlate) return true;
    return slate.some((v, i) => v !== savedSlate[i]);
  }, [slate, savedSlate]);

  const week = data?.week;
  const isLocked = week?.isLocked ?? false;
  const countdown = useMemo(() => (week ? formatCountdown(week.locksAt) : ""), [week]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(i);
  }, []);

  const updatePick = useCallback((idx: number, value: number) => {
    setSlate((prev) => {
      const next = [...prev];
      next[idx] = Math.max(0, Math.min(100, Math.round(value)));
      return next;
    });
    setSubmitError(null);
  }, []);

  const submit = async () => {
    if (!userId || userId === "ssr") return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (handleInput) setHandle(handleInput);
      const res = await fetch("/api/pool/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, handle: handleInput || "anon", picks: slate }),
      });
      if (week?.id) setLocalPoolPicks(week.id, slate);
      setSavedSlate([...slate]);
      setSubmitted(true);

      if (res.ok) {
        setSavedLocally(false);
        mutate();
      } else {
        const body = await res.json().catch(() => ({}));
        const code = typeof body?.error === "string" ? body.error : null;
        if (code === "week_locked") {
          setSubmitError("Picks are locked for this week — try next Monday.");
        } else {
          setSavedLocally(true);
        }
      }
    } catch {
      if (week?.id) setLocalPoolPicks(week.id, slate);
      setSavedSlate([...slate]);
      setSubmitted(true);
      setSavedLocally(true);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSlate(savedSlate ?? [60, 55, 50, 55, 60, 65, 70]);
    setSubmitError(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 ring-1 ring-blue-400/20">
            <Target className="w-4 h-4 text-blue-400" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-white">The Mountain Pool</h2>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">
              Predict this week&apos;s daily visibility · free to play
            </p>
          </div>
        </div>
        {!isLocked && week && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06] text-[10px] font-mono tabular-nums text-amber-300">
            <Clock className="w-3 h-3" />
            {countdown}
          </div>
        )}
        {isLocked && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 ring-1 ring-rose-400/20 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
            Locked
          </div>
        )}
      </div>

      <div className="rounded-2xl ring-1 ring-white/[0.06] bg-white/[0.02] p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {slate.map((score, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                {week ? dayLabel(week.startDate, i) : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}
              </div>
              <div className="relative w-full h-24 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.05] overflow-hidden">
                <div
                  className={`absolute inset-x-0 bottom-0 bg-gradient-to-t ${tierColor(score)} transition-all duration-300`}
                  style={{ height: `${score}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-display font-bold text-white text-sm tabular-nums drop-shadow">
                    {score}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                disabled={isLocked}
                value={score}
                onChange={(e) => updatePick(i, Number(e.target.value))}
                className="w-full accent-blue-400 cursor-pointer disabled:cursor-not-allowed"
                aria-label={`Day ${i + 1} prediction`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pt-3 border-t border-white/[0.05]">
          <div className="relative flex-1">
            <AtSign className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="handle (optional)"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value.slice(0, 24))}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.03] ring-1 ring-white/[0.06] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-blue-400/30"
              maxLength={24}
              disabled={isLocked}
            />
          </div>
          <button
            onClick={reset}
            disabled={isLocked || submitting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/60 bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.06] transition-all disabled:opacity-40"
            aria-label="Reset picks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={submit}
            disabled={isLocked || submitting || (submitted && !isDirty && !submitError)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-bold transition-all disabled:opacity-40 ${
              submitError
                ? "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/40"
                : submitted && !isDirty
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                  : "bg-gradient-to-r from-blue-500/30 to-violet-500/30 text-white ring-1 ring-blue-400/40 shadow-lg shadow-blue-500/10"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Locking in…
              </>
            ) : submitError ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                Retry
              </>
            ) : submitted && !isDirty ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Picks saved
              </>
            ) : submitted && isDirty ? (
              <>
                <Target className="w-3.5 h-3.5" />
                Update picks
              </>
            ) : (
              <>
                <Target className="w-3.5 h-3.5" />
                Submit picks
              </>
            )}
          </button>
        </div>

        {submitError && (
          <p className="flex items-center gap-1.5 text-[11px] text-rose-300/90 font-medium -mt-1">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {submitError}
          </p>
        )}

        {savedLocally && submitted && !isDirty && !submitError && (
          <p className="text-[11px] text-amber-300/80 font-medium -mt-1">
            Saved on this device. Leaderboard is offline right now. Your picks will sync when it&apos;s back.
          </p>
        )}
      </div>

      {data && data.standings.length > 0 && (
        <div className="mt-4 rounded-2xl ring-1 ring-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-display font-bold text-white">Live standings</span>
            <span className="text-[10px] text-slate-500 ml-auto tabular-nums">
              {data.totalEntries} entries
            </span>
          </div>
          <ul className="divide-y divide-white/[0.04]">
            {data.standings.slice(0, 5).map((s, i) => {
              const isMe = s.userId === userId;
              return (
                <li
                  key={s.userId}
                  className={`flex items-center gap-3 px-4 py-2 ${isMe ? "bg-blue-500/8" : ""}`}
                >
                  <span className={`font-mono text-[10px] font-bold w-6 ${i === 0 ? "text-amber-300" : "text-slate-600"}`}>
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-sm text-white/80 truncate">
                    {s.handle || "anon"}
                    {isMe && <span className="ml-1.5 text-[10px] text-blue-300 font-bold">YOU</span>}
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">err {s.error}</span>
                  <ChevronRight className="w-3 h-3 text-slate-700" />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
